import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateQuizFromText } from "@/lib/ai/service";
import {
  getStore,
  getVisibleCourseDocuments,
  persistToDisk,
  requireUser,
} from "@/lib/data/store";

export async function GET() {
  try {
    const user = await requireUser();
    const store = getStore();
    const quizzes = store.quizzes.filter(
      (q) =>
        q.institutionId === user.institutionId &&
        (user.role !== "student" || q.isPublished)
    );
    const attempts = store.quizAttempts.filter((a) => a.studentId === user.id);
    return NextResponse.json({ quizzes, attempts });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

const GenerateQuizSchema = z.object({
  action: z.literal("generate"),
  documentId: z.string().min(1),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
});

const SubmitQuizSchema = z.object({
  action: z.literal("submit"),
  quizId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const store = getStore();

    if (body?.action === "generate") {
      const parsed = GenerateQuizSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
      }
      const doc = getVisibleCourseDocuments(user).find((d) => d.id === parsed.data.documentId);
      if (!doc) {
        return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
      }
      const generated = await generateQuizFromText({
        title: doc.title,
        text: doc.extractedText,
        count: 4,
        locale: parsed.data.locale,
      });

      const quiz = {
        id: `quiz-${crypto.randomUUID()}`,
        institutionId: doc.institutionId,
        subjectId: doc.subjectId,
        subjectName: doc.subjectName,
        courseDocumentId: doc.id,
        createdBy: user.id,
        title: `Quiz IA — ${doc.title}`,
        isPublished: true,
        questions: generated.questions,
        createdAt: new Date().toISOString(),
      };
      store.quizzes.unshift(quiz);
      persistToDisk(store);

      return NextResponse.json({ quiz, isDemoFallback: generated.isDemoFallback }, { status: 201 });
    }

    if (body?.action === "submit") {
      const parsed = SubmitQuizSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Réponses invalides." }, { status: 400 });
      }
      const quiz = store.quizzes.find(
        (q) => q.id === parsed.data.quizId && q.institutionId === user.institutionId
      );
      if (!quiz) {
        return NextResponse.json({ error: "Quiz introuvable." }, { status: 404 });
      }

      let score = 0;
      const weakTopics = new Set<string>();
      const feedback = quiz.questions.map((q) => {
        const given = (parsed.data.answers[q.id] || "").trim();
        const isCorrect =
          q.questionType === "short_answer"
            ? given.toLowerCase().includes(q.correctAnswer.toLowerCase().slice(0, 4))
            : given.toLowerCase() === q.correctAnswer.toLowerCase();
        if (isCorrect) {
          score += 1;
        } else {
          weakTopics.add(q.topic);
        }
        return {
          questionId: q.id,
          isCorrect,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          topic: q.topic,
        };
      });

      const attempt = {
        id: `att-${crypto.randomUUID()}`,
        quizId: quiz.id,
        studentId: user.id,
        score,
        maxScore: quiz.questions.length,
        weakTopics: [...weakTopics],
        createdAt: new Date().toISOString(),
      };
      store.quizAttempts.unshift(attempt);
      persistToDisk(store);

      return NextResponse.json({ attempt, feedback });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur quiz." }, { status: 500 });
  }
}
