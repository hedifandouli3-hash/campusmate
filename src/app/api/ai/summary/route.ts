import { NextResponse } from "next/server";
import { z } from "zod";
import { generateDocumentSummary } from "@/lib/ai/service";
import {
  getStore,
  getVisibleCourseDocuments,
  persistToDisk,
  requireUser,
} from "@/lib/data/store";
import { checkRateLimit } from "@/lib/security/rate-limit";

const SummarySchema = z.object({
  documentId: z.string().min(1),
  mode: z.enum(["short", "detailed", "key_concepts", "exam_prep", "beginner"]),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!checkRateLimit(`ai-sum:${user.id}`, 20, 60_000).allowed) {
      return NextResponse.json({ error: "Trop de requêtes IA." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = SummarySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const visibleDocs = getVisibleCourseDocuments(user);
    const doc = visibleDocs.find((d) => d.id === parsed.data.documentId);
    if (!doc) {
      return NextResponse.json({ error: "Document introuvable ou non autorisé." }, { status: 404 });
    }

    const store = getStore();
    const cached = store.documentSummaries.find(
      (s) =>
        s.courseDocumentId === doc.id &&
        s.mode === parsed.data.mode &&
        s.locale === parsed.data.locale
    );
    if (cached) {
      return NextResponse.json({
        content: cached.content,
        isDemoFallback: cached.isDemoFallback,
        cached: true,
      });
    }

    const generated = await generateDocumentSummary({
      title: doc.title,
      text: doc.extractedText,
      mode: parsed.data.mode,
      locale: parsed.data.locale,
    });

    store.documentSummaries.push({
      courseDocumentId: doc.id,
      mode: parsed.data.mode,
      locale: parsed.data.locale,
      content: generated.content,
      isDemoFallback: generated.isDemoFallback,
    });
    persistToDisk(store);

    return NextResponse.json({ ...generated, cached: false });
  } catch (err) {
    const status = err instanceof Error && err.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: "Erreur de génération du résumé." }, { status });
  }
}
