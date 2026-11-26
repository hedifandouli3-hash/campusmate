import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
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

    const institutions = isSuper
      ? store.institutions
      : store.institutions.filter((i) => i.id === user.institutionId);
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
        isDemoSample: false,
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
      const schema = z.object({
        code: z.string().trim().min(2).max(20),
        name: z.string().trim().min(3).max(160),
        city: z.string().trim().min(2).max(80).default("Tunis"),
      });
      const parsedInst = schema.safeParse(body);
      if (!parsedInst.success) {
        return NextResponse.json({ error: "Informations institution invalides." }, { status: 400 });
      }
      const code = parsedInst.data.code.toUpperCase();
      if (store.institutions.some((i) => i.code.toUpperCase() === code)) {
        return NextResponse.json({ error: "Code institution déjà utilisé." }, { status: 409 });
      }
      const inst = {
        id: `inst-${crypto.randomUUID()}`,
        code,
        name: parsedInst.data.name,
        city: parsedInst.data.city,
        country: "Tunisia",
        isDemo: false,
        isActive: true,
      };
      store.institutions.push(inst);
      persistToDisk(store);
      return NextResponse.json({ institution: inst }, { status: 201 });
    }

    if (body.action === "add_department") {
      const schema = z.object({
        code: z.string().trim().min(2).max(16),
        name: z.string().trim().min(3).max(140),
        description: z.string().max(400).optional(),
      });
      const parsedDept = schema.safeParse(body);
      if (!parsedDept.success) {
        return NextResponse.json({ error: "Données département invalides." }, { status: 400 });
      }
      const code = parsedDept.data.code.toUpperCase();
      if (store.departments.some((d) => d.institutionId === instId && d.code.toUpperCase() === code)) {
        return NextResponse.json({ error: "Code département déjà existant." }, { status: 409 });
      }
      const dept = {
        id: `dept-${crypto.randomUUID()}`,
        institutionId: instId,
        code,
        name: parsedDept.data.name,
        description: parsedDept.data.description || "",
      };
      store.departments.push(dept);
      persistToDisk(store);
      return NextResponse.json({ department: dept }, { status: 201 });
    }

    if (body.action === "add_subject") {
      const schema = z.object({
        departmentId: z.string().min(1).optional(),
        code: z.string().trim().min(2).max(20),
        name: z.string().trim().min(3).max(140),
        semester: z.coerce.number().int().min(1).max(2).default(1),
        credits: z.coerce.number().min(0.5).max(30).default(3),
      });
      const parsedSub = schema.safeParse(body);
      if (!parsedSub.success) {
        return NextResponse.json({ error: "Données matière invalides." }, { status: 400 });
      }
      const subj = {
        id: `sub-${crypto.randomUUID()}`,
        institutionId: instId,
        departmentId: parsedSub.data.departmentId || store.departments.find((d) => d.institutionId === instId)?.id || "",
        code: parsedSub.data.code.toUpperCase(),
        name: parsedSub.data.name,
        semester: (parsedSub.data.semester === 2 ? 2 : 1) as 1 | 2,
        credits: parsedSub.data.credits,
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
      if (target.isSuspended) {
        target.sessionVersion = (target.sessionVersion ?? 1) + 1;
      }
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

    if (body.action === "revoke_sessions" && (user.role === "super_admin" || user.role === "university_admin")) {
      const target = store.users.find(
        (u) =>
          u.id === body.userId &&
          (user.role === "super_admin" || u.institutionId === user.institutionId)
      );
      if (!target) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      target.sessionVersion = (target.sessionVersion ?? 1) + 1;
      addAuditLog({
        institutionId: target.institutionId,
        actorId: user.id,
        actorName: user.fullName,
        action: "USER_SESSIONS_REVOKED",
        resourceType: "profile",
        resourceId: target.id,
        details: `Sessions révoquées (v${target.sessionVersion})`,
      });
      persistToDisk(store);
      return NextResponse.json({ ok: true, sessionVersion: target.sessionVersion });
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
