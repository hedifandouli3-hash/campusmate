"use client";

import React, { useEffect, useState } from "react";
import { CalendarClock, CheckSquare, Plus, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import type { ExamItem, StudyPlan, Subject, TimetableEntry } from "@/types/domain";

const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function StudyPlannerPage() {
  const { locale, notify } = useApp();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; dueDate: string; isCompleted: boolean }>>([]);

  const [planTitle, setPlanTitle] = useState("Plan Révision Examens S1");
  const [dailyHours, setDailyHours] = useState(2.5);
  const [preferredPeriod, setPreferredPeriod] = useState("evening");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generating, setGenerating] = useState(false);

  const [newTask, setNewTask] = useState("");

  async function load() {
    const res = await fetch("/api/ai/study-plan");
    if (res.ok) {
      const data = await res.json();
      setTimetable(data.timetable || []);
      setExams(data.exams || []);
      setPlans(data.plans || []);
      setSubjects(data.subjects || []);
      setTasks(data.tasks || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleGeneratePlan(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const payloadSubjects = (subjects.length ? subjects : [{ name: "Développement Web", id: "1" }]).map((s) => ({
        name: s.name,
        difficulty,
        examDate: exams.find((ex) => ex.subjectId === s.id)?.examDate || "2027-01-15",
      }));

      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_plan",
          title: planTitle,
          dailyHours: Number(dailyHours),
          preferredPeriod,
          locale,
          subjects: payloadSubjects,
        }),
      });
      if (res.ok) {
        notify("Planning d'étude IA généré !", "success");
        load();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function toggleSession(id: string, isCompleted: boolean) {
    await fetch("/api/ai/study-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "session", id, isCompleted: !isCompleted }),
    });
    load();
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim()) return;
    await fetch("/api/ai/study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_task", title: newTask }),
    });
    setNewTask("");
    load();
  }

  async function toggleTask(id: string, isCompleted: boolean) {
    await fetch("/api/ai/study-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "task", id, isCompleted: !isCompleted }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarClock className="w-6 h-6 text-emerald-600" /> Smart Study & Exam Planner
        </h1>
        <p className="text-sm text-slate-500">
          Emploi du temps, calendrier d&apos;examens et générateur de planning personnalisé par IA.
        </p>
      </div>

      {/* AI Plan Generator */}
      <Card className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Générer un planning de révision réaliste
        </h2>
        <form onSubmit={handleGeneratePlan} className="grid sm:grid-cols-4 gap-3">
          <Input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder="Titre du planning" />
          <Input
            type="number"
            step="0.5"
            min="1"
            max="6"
            value={dailyHours}
            onChange={(e) => setDailyHours(Number(e.target.value))}
          />
          <Select value={preferredPeriod} onChange={(e) => setPreferredPeriod(e.target.value)}>
            <option value="morning">Matin</option>
            <option value="afternoon">Après-midi</option>
            <option value="evening">Soirée</option>
          </Select>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}>
            <option value="easy">Charge modérée</option>
            <option value="medium">Priorité équilibrée</option>
            <option value="hard">Préparation intensive</option>
          </Select>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={generating}>
              {generating ? "Création en cours..." : "Générer mon planning IA"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Generated Plans */}
      {plans.map((plan) => (
        <Card key={plan.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{plan.title}</h3>
            <Badge variant={plan.isDemoFallback ? "warning" : "success"}>
              {plan.isDemoFallback ? "Plan Démo" : "Gemini AI"}
            </Badge>
          </div>
          <div className="grid md:grid-cols-2 gap-2.5">
            {plan.sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleSession(s.id, s.isCompleted)}
                className={`text-start rounded-lg border p-3 text-xs flex items-start justify-between gap-2 cursor-pointer ${
                  s.isCompleted
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 line-through opacity-75"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <div>
                  <p className="font-semibold">{s.topic}</p>
                  <p className="text-slate-500">
                    {s.subjectName} • {s.sessionDate} • {s.durationMinutes} min ({s.sessionKind})
                  </p>
                </div>
                <Badge variant={s.priority === "high" ? "danger" : "default"}>{s.priority}</Badge>
              </button>
            ))}
          </div>
        </Card>
      ))}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timetable & Exams */}
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">Emploi du temps & Examens</h2>
          {timetable.map((t) => (
            <div key={t.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs flex justify-between">
              <div>
                <p className="font-semibold">{DAYS[t.dayOfWeek]} — {t.subjectName}</p>
                <p className="text-slate-500">{t.teacherName} • {t.roomName} ({t.sessionType})</p>
              </div>
              <span className="font-mono">{t.startTime} - {t.endTime}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className="text-xs font-semibold text-indigo-600">Examens programmés :</p>
            {exams.map((e) => (
              <div key={e.id} className="text-xs flex justify-between">
                <span>{e.title} ({e.roomName})</span>
                <span className="font-mono">{e.examDate} {e.startTime}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Personal Tasks */}
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" /> Tâches personnelles
          </h2>
          <form onSubmit={handleAddTask} className="flex gap-2">
            <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Nouvelle tâche de révision..." />
            <Button type="submit" size="sm"><Plus className="w-4 h-4" /></Button>
          </form>
          <div className="space-y-2">
            {tasks.map((tk) => (
              <button
                key={tk.id}
                onClick={() => toggleTask(tk.id, tk.isCompleted)}
                className={`w-full text-start rounded-lg border p-2.5 text-xs flex justify-between cursor-pointer ${
                  tk.isCompleted ? "line-through opacity-60 bg-slate-50 dark:bg-slate-900" : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <span>{tk.title}</span>
                <span className="text-slate-400">{tk.dueDate}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
