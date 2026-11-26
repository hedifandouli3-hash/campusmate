import { NextResponse } from "next/server";
import { z } from "zod";
import { answerWithRag } from "@/lib/ai/service";
import { getAuthorizedChunksForUser, requireUser } from "@/lib/data/store";
import { checkRateLimit } from "@/lib/security/rate-limit";

const RagSchema = z.object({
  question: z.string().min(2).max(1500),
  scope: z.enum(["learning", "university_assistant"]),
  subjectId: z.string().optional(),
  courseDocumentId: z.string().optional(),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const limit = checkRateLimit(`ai-rag:${user.id}`, 30, 60_000);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Limite de requêtes IA atteinte. Patientez 1 minute." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = RagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Question invalide." }, { status: 400 });
    }

    const authorizedChunks = getAuthorizedChunksForUser({
      user,
      scope: parsed.data.scope,
      subjectId: parsed.data.subjectId,
      courseDocumentId: parsed.data.courseDocumentId,
    });

    const result = await answerWithRag({
      question: parsed.data.question,
      locale: parsed.data.locale,
      scope: parsed.data.scope,
      authorizedChunks,
    });

    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof Error && err.message === "UNAUTHORIZED" ? 401 : 500;
    return NextResponse.json({ error: "Erreur assistant IA." }, { status });
  }
}
