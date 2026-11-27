"use client";

import React, { useEffect, useState } from "react";
import { CalendarPlus, CheckSquare, Map, Mic, Plus, Sparkles, Square } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import type { LaunchpadPitch, LaunchpadRoadmap, LaunchpadStartupIdea } from "@/types/domain";

export default function LaunchpadRoadmapsPage() {
  const { locale, notify } = useApp();
  const [roadmaps, setRoadmaps] = useState<LaunchpadRoadmap[]>([]);
  const [pitches, setPitches] = useState<LaunchpadPitch[]>([]);
  const [ideas, setIdeas] = useState<LaunchpadStartupIdea[]>([]);
  const [horizon, setHorizon] = useState<LaunchpadRoadmap["horizon"]>("30d");
  const [newTitle, setNewTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [pitchTitle, setPitchTitle] = useState("");
  const [pitchProblem, setPitchProblem] = useState("");
  const [pitchSolution, setPitchSolution] = useState("");
  const [generatingPitch, setGeneratingPitch] = useState(false);

  async function load() {
    const res = await fetch("/api/launchpad");
    if (!res.ok) return;
    const data = await res.json();
    setRoadmaps(data.roadmaps || []);
    setPitches(data.pitches || []);
    setIdeas(data.startupIdeas || []);
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function createRoadmap(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/ai/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_roadmap",
        title: newTitle || `Roadmap ${horizon}`,
        horizon,
        startupIdeaId: ideas[0]?.id,
        locale,
      }),
    });
    if (res.ok) {
      setNewTitle("");
      notify("Roadmap générée.", "success");
      await load();
    }
  }

  async function toggleTask(roadmapId: string, taskId: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "roadmap", action: "toggle_task", id: roadmapId, taskId }),
    });
    if (res.ok) await load();
  }

  async function addTask(roadmapId: string) {
    if (!newTaskTitle.trim()) return;
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "roadmap", action: "add_task", id: roadmapId, title: newTaskTitle }),
    });
    if (res.ok) {
      setNewTaskTitle("");
      await load();
    }
  }

  async function syncToPlanner(roadmapId: string, taskId: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "roadmap", action: "sync_to_planner", id: roadmapId, taskId }),
    });
    if (res.ok) {
      notify("Tâche ajoutée au Planificateur d'Étude !", "success");
      await load();
    }
  }

  async function generatePitch(e: React.FormEvent) {
    e.preventDefault();
    setGeneratingPitch(true);
    try {
      const res = await fetch("/api/ai/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_pitch",
          title: pitchTitle || ideas[0]?.name,
          problem: pitchProblem || ideas[0]?.problemStatement,
          solution: pitchSolution || ideas[0]?.proposedSolution,
          startupIdeaId: ideas[0]?.id,
          locale,
        }),
      });
      if (res.ok) {
        notify("Pitch généré dans la langue active !", "success");
        await load();
      }
    } finally {
      setGeneratingPitch(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="primary">Roadmaps MVP & Pitch Jury</Badge>}
        title="Feuilles de Route & Générateur de Pitch"
        description="Planifiez votre MVP (7j, 14j, 30j, 90j), synchronisez avec le Planificateur d'Étude et préparez votre pitch FR/EN/AR."
      />

      <LaunchpadNav />

      {/* Roadmap Generator */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-600" /> Générer une feuille de route MVP
        </h2>
        <form onSubmit={createRoadmap} className="grid sm:grid-cols-3 gap-3">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Nom de la roadmap..." />
          <Select value={horizon} onChange={(e) => setHorizon(e.target.value as LaunchpadRoadmap["horizon"])}>
            <option value="7d">Prototype 7 jours</option>
            <option value="14d">Projet 14 jours</option>
            <option value="30d">MVP 30 jours</option>
            <option value="90d">Développement 90 jours</option>
            <option value="custom">Personnalisé</option>
          </Select>
          <Button type="submit">
            <Sparkles className="w-4 h-4 me-1.5" /> Générer Roadmap
          </Button>
        </form>
      </Card>

      {roadmaps.map((rm) => (
        <Card key={rm.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">{rm.title}</h3>
              <p className="text-xs text-slate-500">Horizon : {rm.horizon} • Périmètre : {rm.mvpScope}</p>
            </div>
            <Badge variant="indigo">
              {rm.tasks.filter((t) => t.completed).length}/{rm.tasks.length} tâches
            </Badge>
          </div>

          <div className="space-y-2">
            {rm.tasks.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2">
                <button type="button" onClick={() => toggleTask(rm.id, task.id)} className="flex items-center gap-2 text-start text-xs cursor-pointer">
                  {task.completed ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  <span className={task.completed ? "line-through text-slate-400" : "font-medium"}>{task.title}</span>
                </button>
                <div className="flex items-center gap-2">
                  <Badge>{task.phase}</Badge>
                  <span className="text-[11px] text-slate-400">{task.dueDate}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(task.syncedToPlanner)}
                    onClick={() => syncToPlanner(rm.id, task.id)}
                  >
                    <CalendarPlus className="w-3.5 h-3.5 me-1" />
                    {task.syncedToPlanner ? "Synchronisé" : "Study Planner"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Ajouter une tâche..." />
            <Button type="button" variant="outline" onClick={() => addTask(rm.id)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}

      {/* AI Pitch Generator */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Mic className="w-4 h-4 text-indigo-600" /> Générateur de Pitch Jury IA (FR / EN / AR)
        </h2>
        <form onSubmit={generatePitch} className="grid sm:grid-cols-3 gap-3">
          <Input value={pitchTitle} onChange={(e) => setPitchTitle(e.target.value)} placeholder="Nom du projet / startup..." />
          <Input value={pitchProblem} onChange={(e) => setPitchProblem(e.target.value)} placeholder="Problème observé..." />
          <Input value={pitchSolution} onChange={(e) => setPitchSolution(e.target.value)} placeholder="Solution proposée..." />
          <div className="sm:col-span-3">
            <Button type="submit" disabled={generatingPitch}>
              <Sparkles className="w-4 h-4 me-1.5" />
              {generatingPitch ? "Rédaction..." : `Générer le Pitch (${locale.toUpperCase()})`}
            </Button>
          </div>
        </form>

        {pitches.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{p.startupOrProjectTitle}</h3>
              <Badge variant="primary">{p.locale.toUpperCase()}</Badge>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400">{p.completedVsPlannedNote}</p>
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold mb-1">Elevator Pitch</p>
                <Textarea rows={3} readOnly value={p.elevatorPitch} />
              </div>
              <div>
                <p className="font-semibold mb-1">Pitch 30 secondes</p>
                <Textarea rows={3} readOnly value={p.pitch30s} />
              </div>
              <div>
                <p className="font-semibold mb-1">Pitch Compétition (3 minutes)</p>
                <Textarea rows={5} readOnly value={p.pitch3m} />
              </div>
              <div className="space-y-2">
                <p className="font-semibold">Plan de présentation & Questions Jury</p>
                <ul className="list-disc ps-4 space-y-0.5 text-slate-600 dark:text-slate-300">
                  {p.deckOutline.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                {p.juryQuestions.map((jq) => (
                  <div key={jq.question} className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-2">
                    <p className="font-semibold">{jq.question}</p>
                    <p className="text-slate-500">{jq.suggestedAnswer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
