import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { chunkPages, neutralizePromptInjection } from "@/lib/ai/document-processor";
import { fetchOfficialIsetBejaPages } from "@/lib/ai/isetb-sync";
import {
  addAuditLog,
  getStore,
  persistToDisk,
  requireUser,
  toSafeDirectoryProfile,
} from "@/lib/data/store";

export async function GET() {
  try {
    const user = await requireUser(["university_admin", "super_admin"]);
    const store = getStore();
    const isSuper = user.role === "super_admin";

    const institutions = store.institutions;
    const departments = store.departments.filter(
      (d) => isSuper || d.institutionId === user.institutionId
    );
    const sections = store.sections.filter(
      (s) => isSuper || s.institutionId === user.institutionId
    );
    const subjects = store.subjects.filter(
      (s) => isSuper || s.institutionId === user.institutionId
    );
    const users = store.users
      .filter((u) => isSuper || u.institutionId === user.institutionId)
      .map(toSafeDirectoryProfile);
    const knowledgeDocs = store.knowledgeDocuments.filter(
      (k) => isSuper || k.institutionId === user.institutionId
    );
    const organizations = isSuper ? store.organizations : [];
    const reports = store.contentReports.filter(
      (r) => isSuper || r.institutionId === user.institutionId
    );
    const auditLogs = isSuper
      ? store.auditLogs
      : store.auditLogs.filter((l) => l.institutionId === user.institutionId);

    return NextResponse.json({
      institutions,
      departments,
      sections,
      subjects,
      users,
      knowledgeDocs,
      organizations,
      reports,
      auditLogs,
      platformSettings: store.platformSettings,
    });
  } catch {
    return NextResponse.json({ error: "Accès administrateur requis." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["university_admin", "super_admin"]);
    const body = await request.json();
    const store = getStore();
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";

    if (body.action === "add_knowledge") {
      const title = String(body.title || "").trim();
      const contentText = neutralizePromptInjection(String(body.contentText || "").trim());
      if (!title || contentText.length < 20) {
        return NextResponse.json({ error: "Titre et contenu requis (min 20 caractères)." }, { status: 400 });
      }
      const id = `kb-${crypto.randomUUID()}`;
      const doc = {
        id,
        institutionId: instId,
        uploadedBy: user.id,
        title,
        category: String(body.category || "procedure"),
        fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`,
        contentText,
        isPublished: true,
        isDemoSample: true,
        processingStatus: "ready" as const,
        createdAt: new Date().toISOString(),
      };
      store.knowledgeDocuments.unshift(doc);
      const chunks = chunkPages([{ pageNumber: 1, text: contentText }]);
      for (const ch of chunks) {
        store.documentChunks.push({
          id: `chk-${crypto.randomUUID()}`,
          institutionId: instId,
          sourceScope: "knowledge",
          documentId: id,
          documentTitle: title,
          chunkIndex: ch.chunkIndex,
          pageNumber: ch.pageNumber,
          content: ch.content,
        });
      }
      addAuditLog({
        institutionId: instId,
        actorId: user.id,
        actorName: user.fullName,
        action: "KNOWLEDGE_DOC_ADDED",
        resourceType: "knowledge_document",
        resourceId: id,
        details: title,
      });
      persistToDisk(store);
      return NextResponse.json({ knowledgeDoc: doc }, { status: 201 });
    }

    if (body.action === "sync_isetb_website") {
      const synced = await fetchOfficialIsetBejaPages({
        institutionId: instId,
        actorId: user.id,
      });
      if (synced.documents.length === 0) {
        return NextResponse.json(
          { error: "Impossible de joindre isetb.rnu.tn pour le moment." },
          { status: 502 }
        );
      }
      const syncedIds = new Set(synced.documents.map((d) => d.id));
      store.knowledgeDocuments = [
        ...synced.documents,
        ...store.knowledgeDocuments.filter((k) => !syncedIds.has(k.id)),
      ];
      store.documentChunks = [
        ...store.documentChunks.filter((c) => !syncedIds.has(c.documentId)),
        ...synced.chunks,
      ];
      addAuditLog({
        institutionId: instId,
        actorId: user.id,
        actorName: user.fullName,
        action: "ISETB_WEBSITE_RAG_SYNCED",
        resourceType: "knowledge_document",
        details: `${synced.documents.length} pages officielles indexées (${synced.chunks.length} chunks).`,
      });
      persistToDisk(store);
      return NextResponse.json({
        syncedCount: synced.documents.length,
        chunksCount: synced.chunks.length,
        skipped: synced.skipped,
      });
    }

    if (body.action === "add_institution" && user.role === "super_admin") {
      const inst = {
        id: `inst-${crypto.randomUUID()}`,
        code: String(body.code || "").toUpperCase(),
        name: String(body.name || ""),
        city: String(body.city || "Tunis"),
        country: "Tunisia",
        isDemo: true,
        isActive: true,
      };
      store.institutions.push(inst);
      persistToDisk(store);
      return NextResponse.json({ institution: inst }, { status: 201 });
    }

    if (body.action === "add_department") {
      const dept = {
        id: `dept-${crypto.randomUUID()}`,
        institutionId: instId,
        code: String(body.code || "DEPT").toUpperCase(),
        name: String(body.name || ""),
        description: String(body.description || ""),
      };
      store.departments.push(dept);
      persistToDisk(store);
      return NextResponse.json({ department: dept }, { status: 201 });
    }

    if (body.action === "add_subject") {
      const subj = {
        id: `sub-${crypto.randomUUID()}`,
        institutionId: instId,
        departmentId: String(body.departmentId || store.departments[0]?.id || ""),
        code: String(body.code || "TI-300"),
        name: String(body.name || ""),
        semester: (Number(body.semester) === 2 ? 2 : 1) as 1 | 2,
        credits: Number(body.credits || 3),
      };
      store.subjects.push(subj);
      persistToDisk(store);
      return NextResponse.json({ subject: subj }, { status: 201 });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(["university_admin", "super_admin"]);
    const body = await request.json();
    const store = getStore();

    if (body.action === "verify_user") {
      const target = store.users.find(
        (u) =>
          u.id === body.userId &&
          (user.role === "super_admin" || u.institutionId === user.institutionId)
      );
      if (!target) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      target.isVerified = Boolean(body.isVerified);
      addAuditLog({
        institutionId: target.institutionId,
        actorId: user.id,
        actorName: user.fullName,
        action: "USER_VERIFICATION_UPDATED",
        resourceType: "profile",
        resourceId: target.id,
        details: `${target.email} verified=${target.isVerified}`,
      });
      persistToDisk(store);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "suspend_user" && user.role === "super_admin") {
      const target = store.users.find((u) => u.id === body.userId);
      if (!target || target.role === "super_admin") {
        return NextResponse.json({ error: "Action impossible." }, { status: 400 });
      }
      target.isSuspended = Boolean(body.isSuspended);
      addAuditLog({
        actorId: user.id,
        actorName: user.fullName,
        action: "USER_SUSPENSION_UPDATED",
        resourceType: "profile",
        resourceId: target.id,
        details: `${target.email} suspended=${target.isSuspended}`,
      });
      persistToDisk(store);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "verify_org" && user.role === "super_admin") {
      const org = store.organizations.find((o) => o.id === body.organizationId);
      if (!org) return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
      if (["verified", "rejected", "pending"].includes(body.status)) {
        org.verificationStatus = body.status;
        addAuditLog({
          actorId: user.id,
          actorName: user.fullName,
          action: "ORG_VERIFICATION_UPDATED",
          resourceType: "organization",
          resourceId: org.id,
          details: `${org.name} -> ${org.verificationStatus}`,
        });
        persistToDisk(store);
        return NextResponse.json({ organization: org });
      }
    }

    if (body.action === "resolve_report") {
      const rep = store.contentReports.find(
        (r) =>
          r.id === body.reportId &&
          (user.role === "super_admin" || r.institutionId === user.institutionId)
      );
      if (!rep) return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
      if (body.status && !["open", "reviewed", "dismissed", "action_taken"].includes(body.status)) {
        return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
      }
      rep.status = body.status || "action_taken";
      persistToDisk(store);
      return NextResponse.json({ report: rep });
    }

    if (body.action === "update_settings" && user.role === "super_admin") {
      const s = body.settings || {};
      store.platformSettings = {
        allowStudentRegistration:
          typeof s.allowStudentRegistration === "boolean"
            ? s.allowStudentRegistration
            : store.platformSettings.allowStudentRegistration,
        requireOrgVerification:
          typeof s.requireOrgVerification === "boolean"
            ? s.requireOrgVerification
            : store.platformSettings.requireOrgVerification,
        enableCommunityModules:
          typeof s.enableCommunityModules === "boolean"
            ? s.enableCommunityModules
            : store.platformSettings.enableCommunityModules,
        maintenanceBanner:
          typeof s.maintenanceBanner === "string"
            ? s.maintenanceBanner.slice(0, 240)
            : store.platformSettings.maintenanceBanner,
      };
      persistToDisk(store);
      return NextResponse.json({ settings: store.platformSettings });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
}
