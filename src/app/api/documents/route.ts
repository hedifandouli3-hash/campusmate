import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addAuditLog,
  addNotification,
  getStore,
  getVisibleDocumentRequests,
  persistToDisk,
  requireUser,
} from "@/lib/data/store";

const DOC_TYPES = [
  { code: "ATTEST_INSCR", name: "Attestation d'inscription" },
  { code: "CERT_SCOL", name: "Certificat de scolarité" },
  { code: "ATTEST_PRES", name: "Attestation de présence" },
  { code: "RELEVE_NOTES", name: "Relevé de notes" },
  { code: "ATTEST_REUSS", name: "Attestation de réussite" },
];

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const downloadId = url.searchParams.get("download");

    const requests = getVisibleDocumentRequests(user);

    if (downloadId) {
      const target = requests.find((r) => r.id === downloadId);
      if (!target || !target.approvedDocumentContent) {
        return NextResponse.json({ error: "Document introuvable ou non approuvé." }, { status: 404 });
      }
      return new NextResponse(target.approvedDocumentContent, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${target.referenceNumber}-specimen-demo.txt"`,
        },
      });
    }

    return NextResponse.json({ requests, documentTypes: DOC_TYPES });
  } catch {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
}

const CreateRequestSchema = z.object({
  requestTypeCode: z.string().min(2),
  purpose: z.string().min(3).max(400),
  academicYearLabel: z.string().default("2026-2027"),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    if (!user.institutionId) {
      return NextResponse.json({ error: "Institution requise." }, { status: 400 });
    }
    const body = await request.json();
    const parsed = CreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Informations de demande invalides." }, { status: 400 });
    }

    const typeObj = DOC_TYPES.find((t) => t.code === parsed.data.requestTypeCode) || {
      code: parsed.data.requestTypeCode,
      name: parsed.data.requestTypeCode,
    };

    const store = getStore();
    const now = new Date().toISOString();
    const ref = `ISETB-DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq = {
      id: `req-${crypto.randomUUID()}`,
      institutionId: user.institutionId,
      studentId: user.id,
      studentName: user.fullName,
      requestTypeCode: typeObj.code,
      requestTypeName: typeObj.name,
      referenceNumber: ref,
      purpose: parsed.data.purpose,
      academicYearLabel: parsed.data.academicYearLabel,
      status: "submitted" as const,
      isDemoSample: true,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          status: "submitted" as const,
          comment: "Demande soumise par l'étudiant",
          actorName: user.fullName,
          createdAt: now,
        },
      ],
    };

    store.documentRequests.unshift(newReq);

    // Notify university admins of same institution
    const admins = store.users.filter(
      (u) => u.role === "university_admin" && u.institutionId === user.institutionId
    );
    for (const adm of admins) {
      addNotification({
        institutionId: user.institutionId,
        userId: adm.id,
        category: "admin_request",
        title: `Nouvelle demande : ${typeObj.name}`,
        body: `${user.fullName} a soumis la référence ${ref}.`,
        actionUrl: "/administration/document-requests",
      });
    }

    persistToDisk(store);
    return NextResponse.json({ request: newReq }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
}

const UpdateRequestSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum([
    "under_review",
    "additional_info_required",
    "approved",
    "rejected",
    "ready_for_collection",
    "available_for_download",
  ]),
  adminComment: z.string().max(600).optional(),
  approvedDocumentTitle: z.string().optional(),
  approvedDocumentContent: z.string().optional(),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(["university_admin", "super_admin"]);
    const body = await request.json();
    const parsed = UpdateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Mise à jour invalide." }, { status: 400 });
    }

    const store = getStore();
    const reqItem = store.documentRequests.find(
      (r) =>
        r.id === parsed.data.requestId &&
        (user.role === "super_admin" || r.institutionId === user.institutionId)
    );
    if (!reqItem) {
      return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
    }

    const now = new Date().toISOString();
    reqItem.status = parsed.data.status;
    reqItem.adminComment = parsed.data.adminComment || reqItem.adminComment;
    reqItem.updatedAt = now;

    if (
      parsed.data.status === "approved" ||
      parsed.data.status === "available_for_download"
    ) {
      reqItem.status = "available_for_download";
      reqItem.approvedDocumentTitle =
        parsed.data.approvedDocumentTitle ||
        `${reqItem.requestTypeName} — ${reqItem.referenceNumber}`;
      reqItem.approvedDocumentContent =
        parsed.data.approvedDocumentContent ||
        `==================================================\nINSTITUT SUPERIEUR DES ETUDES TECHNOLOGIQUES DE BEJA\n==================================================\nDocument : ${reqItem.requestTypeName}\nRéférence : ${reqItem.referenceNumber}\nÉtudiant(e) : ${reqItem.studentName}\nAnnée universitaire : ${reqItem.academicYearLabel}\nMotif : ${reqItem.purpose}\nValidé par : ${user.fullName}\nDate : ${now}\n`;
    }

    reqItem.history.push({
      status: reqItem.status,
      comment: parsed.data.adminComment || `Statut mis à jour : ${reqItem.status}`,
      actorName: user.fullName,
      createdAt: now,
    });

    addNotification({
      institutionId: reqItem.institutionId,
      userId: reqItem.studentId,
      category: "admin_request",
      title: `Demande ${reqItem.referenceNumber} : ${reqItem.status}`,
      body:
        reqItem.status === "available_for_download"
          ? `Votre document (${reqItem.requestTypeName} — spécimen démo) est prêt au téléchargement.`
          : parsed.data.adminComment || "Le statut de votre demande administrative a changé.",
      actionUrl: "/student/documents",
    });

    addAuditLog({
      institutionId: reqItem.institutionId,
      actorId: user.id,
      actorName: user.fullName,
      action: "DOCUMENT_REQUEST_UPDATED",
      resourceType: "document_request",
      resourceId: reqItem.id,
      details: `${reqItem.referenceNumber} -> ${reqItem.status}`,
    });

    persistToDisk(store);
    return NextResponse.json({ request: reqItem });
  } catch {
    return NextResponse.json({ error: "Permissions insuffisantes." }, { status: 403 });
  }
}
