"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, CalendarClock, CheckSquare, Clock, Edit3, Plus, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Tabs,
} from "@/components/ui/primitives";
import type { ExamItem, StudyPlan, StudySession, Subject, TimetableEntry } from "@/types/domain";

const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function StudyPlannerPage() {
  const { locale, notify } = useApp();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; dueDate: string; isCompleted: boolean }>>([]);

  const [viewMode, setViewMode] = useState<"daily" | "weekly" | "calendar">("weekly");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [planTitle, setPlanTitle] = useState("Plan Révision Examens S1");
  const [dailyHours, setDailyHours] = useState(2.5);
  const [preferredPeriod, setPreferredPeriod] = useState("evening");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [generating, setGenerating] = useState(false);

  const [newTask, setNewTask] = useState("");
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editMinutes, setEditMinutes] = useState(45);
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");

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
        notify("Planning d'étude généré et enregistré !", "success");
        await load();
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
    await load();
  }

  async function saveSessionEdit() {
    if (!editingSession) return;
    const res = await fetch("/api/ai/study-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "session",
        id: editingSession.id,
        sessionDate: editDate,
        durationMinutes: Number(editMinutes),
        priority: editPriority,
      }),
    });
    if (res.ok) {
      setEditingSession(null);
      notify("Session replanifiée.", "success");
      await load();
    }
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
    await load();
  }

  async function toggleTask(id: string, isCompleted: boolean) {
    await fetch("/api/ai/study-plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "task", id, isCompleted: !isCompleted }),
    });
    await load();
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const allSessions = useMemo(
    () =>
      plans
        .flatMap((p) => p.sessions)
        .filter((s) => !subjectFilter || s.subjectName === subjectFilter)
        .filter((s) => (viewMode === "daily" ? s.sessionDate === todayIso : true))
        .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate)),
    [plans, subjectFilter, viewMode, todayIso]
  );

  const doneCount = allSessions.filter((s) => s.isCompleted).length;
  const pct = allSessions.length ? Math.round((doneCount / allSessions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <>
            <Badge variant="primary">Planning Adaptatif</Badge>
            <Badge variant="success">{doneCount}/{allSessions.length} sessions ({pct}%)</Badge>
          </>
        }
        title="Planificateur d'Étude & Examens"
        description="Organisez vos révisions par jour, semaine ou calendrier d'examens avec suivi de progression persistant."
        actions={
          <Tabs
            value={viewMode}
            onChange={setViewMode}
            items={[
              { id: "daily", label: "Aujourd'hui" },
              { id: "weekly", label: "Semaine" },
              { id: "calendar", label: "Calendrier" },
            ]}
          />
        }
      />

      {/* AI Plan Generator */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Générer un planning personnalisé avec pauses
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
          <div className="sm:col-span-4 flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={generating}>
              {generating ? "Création en cours..." : "Générer mon planning IA"}
            </Button>
            <Select className="w-56" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="">Toutes les matières</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </Select>
          </div>
        </form>
      </Card>

      {/* Sessions View */}
      {allSessions.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="w-6 h-6" />}
          title="Aucune session dans cette vue"
          description={viewMode === "daily" ? "Aucune session planifiée pour aujourd'hui — passez en vue Semaine ou générez un planning." : "Générez un planning ci-dessus."}
        />
      ) : (
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            {viewMode === "daily" ? "Programme du jour" : viewMode === "calendar" ? "Vue chronologique mensuelle" : "Sessions de révision"}
          </h2>
          <div className={viewMode === "calendar" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-3" : "grid md:grid-cols-2 gap-2.5"}>
            {allSessions.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border p-3 text-xs flex items-start justify-between gap-2 ${
                  s.isCompleted
                    ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 opacity-75"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSession(s.id, s.isCompleted)}
                  className="text-start flex-1 cursor-pointer"
                >
                  <p className={`font-semibold ${s.isCompleted ? "line-through" : ""}`}>{s.topic}</p>
                  <p className="text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {s.subjectName} • {s.sessionDate} • {s.durationMinutes} min ({s.sessionKind})
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={s.priority === "high" ? "danger" : "default"}>{s.priority}</Badge>
                  <button
                    type="button"
                    aria-label="Replanifier"
                    onClick={() => {
                      setEditingSession(s);
                      setEditDate(s.sessionDate);
                      setEditMinutes(s.durationMinutes);
                      setEditPriority(s.priority);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timetable & Exam Countdowns */}
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">Emploi du temps & Compte à rebours Examens</h2>
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
            {exams.map((e) => {
              const daysLeft = Math.ceil(
                (new Date(e.examDate).getTime() - new Date(todayIso).getTime()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={e.id} className="text-xs flex items-center justify-between gap-2">
                  <span>{e.title} ({e.roomName})</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={daysLeft <= 7 ? "warning" : "primary"}>
                      {daysLeft >= 0 ? `J-${daysLeft}` : "Passé"}
                    </Badge>
                    <span className="font-mono text-slate-500">{e.examDate}</span>
                  </div>
                </div>
              );
            })}
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

      <Dialog
        open={Boolean(editingSession)}
        onClose={() => setEditingSession(null)}
        title="Modifier la session d'étude"
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Date</label>
            <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Durée (minutes)</label>
            <Input
              type="number"
              min={15}
              max={180}
              value={editMinutes}
              onChange={(e) => setEditMinutes(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Priorité</label>
            <Select value={editPriority} onChange={(e) => setEditPriority(e.target.value as "high" | "medium" | "low")}>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditingSession(null)}>Annuler</Button>
            <Button type="button" onClick={saveSessionEdit}>Enregistrer</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
