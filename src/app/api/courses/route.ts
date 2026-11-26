import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ALLOWED_DOC_MIME_TYPES,
  MAX_DOC_SIZE_BYTES,
  chunkPages,
  extractDocumentContent,
  neutralizePromptInjection,
} from "@/lib/ai/document-processor";
import {
  addAuditLog,
  addNotification,
  getStore,
  getVisibleCourseDocuments,
  persistToDisk,
  requireUser,
} from "@/lib/data/store";
import type { CourseDocument } from "@/types/domain";

export async function GET() {
  try {
    const user = await requireUser();
    const store = getStore();
    const documents = getVisibleCourseDocuments(user);
    const courses = store.courses.filter(
      (c) => user.role === "super_admin" || c.institutionId === user.institutionId
    );
    const subjects = store.subjects.filter(
      (s) => user.role === "super_admin" || s.institutionId === user.institutionId
    );
    const sections = store.sections.filter(
      (s) => user.role === "super_admin" || s.institutionId === user.institutionId
    );
    const personalDocs = store.personalDocuments.filter((p) => p.ownerId === user.id);

    return NextResponse.json({ courses, documents, subjects, sections, personalDocs });
  } catch (err) {
    const status = err instanceof Error && err.message === "UNAUTHORIZED" ? 401 : 403;
    return NextResponse.json({ error: "Accès non autorisé." }, { status });
  }
}

const PatchDocSchema = z.object({
  documentId: z.string().min(1),
  action: z.enum(["publish", "unpublish", "delete", "retry"]),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(["teacher", "university_admin", "student"]);
    if (!user.institutionId) {
      return NextResponse.json({ error: "Institution requise." }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "";
    const store = getStore();

    let title = "";
    let description = "";
    let subjectId = "";
    let sectionId = user.sectionId || "";
    let docKind: "lecture" | "exercise" | "correction" | "exam_sample" | "syllabus" = "lecture";
    let isPublished = true;
    let isTeacherOnly = false;
    let scope: "course" | "personal" = user.role === "student" ? "personal" : "course";
    let fileName = "document.txt";
    let mimeType = "text/plain";
    let fileSize = 0;
    let buffer: Buffer | null = null;
    let inlineText = "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      title = String(form.get("title") || "").trim();
      description = String(form.get("description") || "").trim();
      subjectId = String(form.get("subjectId") || "").trim();
      sectionId = String(form.get("sectionId") || user.sectionId || "").trim();
      const rawKind = String(form.get("docKind") || "lecture");
      if (["lecture", "exercise", "correction", "exam_sample", "syllabus"].includes(rawKind)) {
        docKind = rawKind as typeof docKind;
      }
      isPublished = form.get("isPublished") !== "false";
      isTeacherOnly = form.get("isTeacherOnly") === "true";
      scope = user.role === "student" ? "personal" : "course";
      inlineText = String(form.get("inlineText") || "").trim();

      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        if (file.size > MAX_DOC_SIZE_BYTES) {
          return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 400 });
        }
        const extAllowed = /\.(pdf|docx|pptx|txt|md)$/i.test(file.name);
        if (!ALLOWED_DOC_MIME_TYPES.has(file.type) && !extAllowed) {
          return NextResponse.json(
            { error: "Format non supporté. Formats autorisés : PDF, DOCX, PPTX, TXT." },
            { status: 400 }
          );
        }
        fileName = file.name;
        mimeType = file.type || "application/octet-stream";
        fileSize = file.size;
        buffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      const body = await request.json();
      title = String(body.title || "").trim();
      description = String(body.description || "").trim();
      subjectId = String(body.subjectId || "").trim();
      sectionId = String(body.sectionId || user.sectionId || "").trim();
      docKind = body.docKind || "lecture";
      isPublished = body.isPublished !== false;
      isTeacherOnly = Boolean(body.isTeacherOnly);
      scope = user.role === "student" ? "personal" : "course";
      inlineText = String(body.inlineText || "").trim();
      fileName = String(body.fileName || "support-cours.txt");
    }

    if (!title || title.length < 3) {
      return NextResponse.json({ error: "Titre du document requis (min 3 caractères)." }, { status: 400 });
    }

    let extractedText = "";
    let pageCount = 1;
    let pages: Array<{ pageNumber: number; text: string }> = [];

    if (buffer) {
      const extracted = await extractDocumentContent(buffer, fileName, mimeType);
      if (extracted.isScannedLikely) {
        return NextResponse.json(
          {
            error:
              "Le document semble être un PDF scanné sans texte extractible. Activez un service OCR ou importez un PDF textuel.",
          },
          { status: 422 }
        );
      }
      extractedText = extracted.text;
      pageCount = extracted.pageCount;
      pages = extracted.pages;
    } else if (inlineText.length >= 20) {
      extractedText = neutralizePromptInjection(inlineText);
      fileSize = Buffer.byteLength(extractedText, "utf8");
      pages = [{ pageNumber: 1, text: extractedText }];
    } else {
      return NextResponse.json(
        { error: "Veuillez joindre un fichier (PDF/DOCX/PPTX/TXT) ou saisir un contenu textuel." },
        { status: 400 }
      );
    }

    if (scope === "personal") {
      const personalId = `pdoc-${crypto.randomUUID()}`;
      store.personalDocuments.unshift({
        id: personalId,
        institutionId: user.institutionId,
        ownerId: user.id,
        subjectId: subjectId || undefined,
        title,
        fileName,
        extractedText,
        createdAt: new Date().toISOString(),
      });

      const chunks = chunkPages(pages);
      for (const ch of chunks) {
        store.documentChunks.push({
          id: `chk-${crypto.randomUUID()}`,
          institutionId: user.institutionId,
          sourceScope: "personal",
          documentId: personalId,
          documentTitle: title,
          ownerId: user.id,
          subjectId: subjectId || undefined,
          chunkIndex: ch.chunkIndex,
          pageNumber: ch.pageNumber,
          content: ch.content,
        });
      }
      persistToDisk(store);
      return NextResponse.json({ ok: true, id: personalId, scope: "personal" }, { status: 201 });
    }

    // Teacher / Admin course upload
    const subject =
      store.subjects.find((s) => s.id === subjectId && s.institutionId === user.institutionId) ||
      store.subjects.find((s) => s.institutionId === user.institutionId);
    if (!subject) {
      return NextResponse.json({ error: "Matière introuvable dans votre institution." }, { status: 400 });
    }

    const section =
      store.sections.find((s) => s.id === sectionId && s.institutionId === user.institutionId) ||
      store.sections.find((s) => s.institutionId === user.institutionId);

    let course = store.courses.find(
      (c) => c.subjectId === subject.id && c.institutionId === user.institutionId
    );
    if (!course) {
      course = {
        id: `course-${crypto.randomUUID()}`,
        institutionId: user.institutionId,
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        sectionId: section?.id || "",
        sectionName: section?.name || "Toutes sections",
        teacherId: user.id,
        teacherName: user.fullName,
        title: subject.name,
        description: subject.description || "",
        semester: subject.semester,
        isPublished: true,
        createdAt: new Date().toISOString(),
      };
      store.courses.push(course);
    }

    const docId = `doc-${crypto.randomUUID()}`;
    const newDoc: CourseDocument = {
      id: docId,
      institutionId: user.institutionId,
      courseId: course.id,
      subjectId: subject.id,
      subjectName: subject.name,
      sectionId: section?.id || "",
      sectionName: section?.name || "Toutes sections",
      uploadedBy: user.id,
      uploaderName: user.fullName,
      title,
      description: description || `Support de cours (${docKind})`,
      docKind,
      fileName,
      fileType: mimeType,
      fileSizeBytes: fileSize,
      isPublished,
      isTeacherOnly,
      processingStatus: "ready",
      pageCount,
      extractedText,
      createdAt: new Date().toISOString(),
    };

    store.courseDocuments.unshift(newDoc);

    const chunks = chunkPages(pages);
    for (const ch of chunks) {
      store.documentChunks.push({
        id: `chk-${crypto.randomUUID()}`,
        institutionId: user.institutionId,
        sourceScope: "course",
        documentId: docId,
        documentTitle: title,
        subjectId: subject.id,
        sectionId: section?.id,
        chunkIndex: ch.chunkIndex,
        pageNumber: ch.pageNumber,
        content: ch.content,
      });
    }

    // Notify enrolled students in matching institution & section when published
    if (isPublished && !isTeacherOnly) {
      const students = store.users.filter(
        (u) =>
          u.role === "student" &&
          u.institutionId === user.institutionId &&
          (!section || !u.sectionId || u.sectionId === section.id)
      );
      for (const st of students) {
        addNotification({
          institutionId: user.institutionId,
          userId: st.id,
          category: "course",
          title: `Nouveau support : ${title}`,
          body: `${user.fullName} a publié un document dans ${subject.name}.`,
          actionUrl: `/student/courses/${docId}`,
        });
      }
    }

    addAuditLog({
      institutionId: user.institutionId,
      actorId: user.id,
      actorName: user.fullName,
      action: "COURSE_DOCUMENT_UPLOADED",
      resourceType: "course_document",
      resourceId: docId,
      details: `${title} (${chunks.length} chunks indexés, publié=${isPublished}).`,
    });

    persistToDisk(store);
    return NextResponse.json({ ok: true, document: newDoc, chunksCount: chunks.length }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Permissions insuffisantes." }, { status: 403 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur lors du traitement du document." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(["teacher", "university_admin"]);
    const body = await request.json();
    const parsed = PatchDocSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const store = getStore();
    const idx = store.courseDocuments.findIndex(
      (d) => d.id === parsed.data.documentId && d.institutionId === user.institutionId
    );
    if (idx === -1) {
      return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
    }

    const doc = store.courseDocuments[idx];
    if (user.role === "teacher" && doc.uploadedBy !== user.id) {
      return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres documents." }, { status: 403 });
    }

    if (parsed.data.action === "delete") {
      store.courseDocuments.splice(idx, 1);
      store.documentChunks = store.documentChunks.filter((c) => c.documentId !== doc.id);
      persistToDisk(store);
      return NextResponse.json({ ok: true, deleted: doc.id });
    }

    if (parsed.data.action === "publish") {
      doc.isPublished = true;
      doc.isTeacherOnly = false;
      const students = store.users.filter(
        (u) => u.role === "student" && u.institutionId === user.institutionId
      );
      for (const st of students) {
        addNotification({
          institutionId: user.institutionId,
          userId: st.id,
          category: "course",
          title: `Cours publié : ${doc.title}`,
          body: `${user.fullName} vient de publier « ${doc.title} » (${doc.subjectName}).`,
          actionUrl: `/student/courses/${doc.id}`,
        });
      }
    } else if (parsed.data.action === "unpublish") {
      doc.isPublished = false;
    } else if (parsed.data.action === "retry") {
      doc.processingStatus = "ready";
      doc.processingError = undefined;
    }

    persistToDisk(store);
    return NextResponse.json({ ok: true, document: doc });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
}
