import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateStudyPlanWithAI } from "@/lib/ai/service";
import { getStore, persistToDisk, requireUser } from "@/lib/data/store";

export async function GET() {
  try {
    const user = await requireUser();
    const store = getStore();
    const timetable = store.timetableEntries.filter((t) => t.institutionId === user.institutionId);
    const exams = store.exams.filter((e) => e.institutionId === user.institutionId);
    const plans = store.studyPlans.filter((p) => p.studentId === user.id);
    const tasks = store.personalTasks.filter((t) => t.studentId === user.id);
    const subjects = store.subjects.filter((s) => s.institutionId === user.institutionId);

    return NextResponse.json({ timetable, exams, plans, tasks, subjects });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

const CreatePlanSchema = z.object({
  action: z.literal("generate_plan"),
  title: z.string().min(2).max(120),
  dailyHours: z.number().min(0.5).max(8),
  preferredPeriod: z.string().default("evening"),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
  subjects: z
    .array(
      z.object({
        name: z.string().min(1),
        difficulty: z.enum(["easy", "medium", "hard"]),
        examDate: z.string(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    if (!user.institutionId) {
      return NextResponse.json({ error: "Institution requise." }, { status: 400 });
    }
    const body = await request.json();
    const store = getStore();

    if (body?.action === "add_task") {
      const title = String(body.title || "").trim();
      const dueDate = String(body.dueDate || new Date().toISOString().slice(0, 10));
      if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
      const task = {
        id: `task-${crypto.randomUUID()}`,
        studentId: user.id,
        title,
        dueDate,
        isCompleted: false,
      };
      store.personalTasks.unshift(task);
      persistToDisk(store);
      return NextResponse.json({ task }, { status: 201 });
    }

    const parsed = CreatePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données de planification invalides." }, { status: 400 });
    }

    const generated = await generateStudyPlanWithAI({
      subjects: parsed.data.subjects,
      dailyHours: parsed.data.dailyHours,
      preferredPeriod: parsed.data.preferredPeriod,
      locale: parsed.data.locale,
    });

    const planId = `plan-${crypto.randomUUID()}`;
    const plan = {
      id: planId,
      institutionId: user.institutionId,
      studentId: user.id,
      title: parsed.data.title,
      dailyHours: parsed.data.dailyHours,
      preferredPeriod: parsed.data.preferredPeriod,
      isDemoFallback: generated.isDemoFallback,
      createdAt: new Date().toISOString(),
      sessions: generated.sessions.map((s) => ({
        id: `sess-${crypto.randomUUID()}`,
        planId,
        studentId: user.id,
        subjectName: s.subjectName,
        topic: s.topic,
        sessionDate: s.sessionDate,
        durationMinutes: s.durationMinutes,
        sessionKind: s.sessionKind,
        priority: s.priority,
        isCompleted: false,
      })),
    };

    store.studyPlans.unshift(plan);
    persistToDisk(store);
    return NextResponse.json({ plan }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur de planification." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const store = getStore();

    if (body.kind === "session") {
      for (const plan of store.studyPlans) {
        if (plan.studentId !== user.id) continue;
        const sess = plan.sessions.find((s) => s.id === body.id);
        if (sess) {
          if (typeof body.isCompleted === "boolean") sess.isCompleted = body.isCompleted;
          if (typeof body.sessionDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.sessionDate)) {
            sess.sessionDate = body.sessionDate;
          }
          if (typeof body.durationMinutes === "number" && body.durationMinutes >= 15 && body.durationMinutes <= 180) {
            sess.durationMinutes = Math.round(body.durationMinutes);
          }
          if (body.priority && ["high", "medium", "low"].includes(body.priority)) {
            sess.priority = body.priority;
          }
          persistToDisk(store);
          return NextResponse.json({ ok: true, session: sess });
        }
      }
    }

    if (body.kind === "task") {
      const task = store.personalTasks.find((t) => t.id === body.id && t.studentId === user.id);
      if (task) {
        task.isCompleted = Boolean(body.isCompleted);
        persistToDisk(store);
        return NextResponse.json({ ok: true, task });
      }
    }

    return NextResponse.json({ error: "Élément introuvable." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
