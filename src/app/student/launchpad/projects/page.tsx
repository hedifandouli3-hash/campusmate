"use client";

import React, { useEffect, useState } from "react";
import { Award, CheckSquare, FolderKanban, Plus, Sparkles, Square } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import type { LaunchpadProject } from "@/types/domain";

export default function LaunchpadProjectsPage() {
  const { locale, notify } = useApp();
  const [projects, setProjects] = useState<LaunchpadProject[]>([]);
  const [subjectName, setSubjectName] = useState("Bases de Données Avancées");
  const [difficulty, setDifficulty] = useState<LaunchpadProject["difficulty"]>("intermediate");
  const [interests, setInterests] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customProblem, setCustomProblem] = useState("");
  const [customTech, setCustomTech] = useState("");
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/launchpad");
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function generateProject() {
    const res = await fetch("/api/ai/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_project", subjectName, difficulty, interests, locale }),
    });
    if (res.ok) {
      notify("Brief de projet pratique généré.", "success");
      await load();
    }
  }

  async function createCustom(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "project",
        action: "create",
        title: customTitle,
        problemSolved: customProblem,
        technologies: customTech,
        subjectName,
      }),
    });
    if (res.ok) {
      setCustomTitle("");
      setCustomProblem("");
      setCustomTech("");
      notify("Projet personnel créé (privé par défaut).", "success");
      await load();
    }
  }

  async function toggleTask(id: string, taskId: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "project", action: "toggle_task", id, taskId }),
    });
    if (res.ok) await load();
  }

  async function addTask(id: string) {
    const title = (taskInputs[id] || "").trim();
    if (!title) return;
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "project", action: "add_task", id, title }),
    });
    if (res.ok) {
      setTaskInputs((p) => ({ ...p, [id]: "" }));
      await load();
    }
  }

  async function updateLinks(project: LaunchpadProject, repoUrl: string, demoUrl: string, reflections: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "project", action: "update", id: project.id, repoUrl, demoUrl, reflections }),
    });
    if (res.ok) {
      notify("Projet mis à jour.", "success");
      await load();
    }
  }

  async function sendToPortfolio(id: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "project", action: "send_to_portfolio", id }),
    });
    if (res.ok) notify("Projet ajouté à votre Portfolio Launchpad !", "success");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="success">Laboratoire de Projets</Badge>}
        title="Labo de Projets Pratiques"
        description="Passez de la théorie à la pratique : gérez vos tâches, liens GitHub/démo, réflexions et envoyez vos projets au Portfolio."
      />

      <LaunchpadNav />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Générer un projet guidé depuis une matière</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Matière..." />
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as LaunchpadProject["difficulty"])}>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
            </Select>
          </div>
          <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Thème d'intérêt (ex: santé, énergie, campus...)" />
          <Button type="button" onClick={generateProject}>
            <Sparkles className="w-4 h-4 me-1.5" /> Générer un brief pratique
          </Button>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold">Créer mon propre projet</h2>
          <form onSubmit={createCustom} className="space-y-2">
            <Input required value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Titre du projet..." />
            <Input value={customTech} onChange={(e) => setCustomTech(e.target.value)} placeholder="Technologies (séparées par virgule)" />
            <Textarea rows={2} required value={customProblem} onChange={(e) => setCustomProblem(e.target.value)} placeholder="Problème résolu..." />
            <Button type="submit" variant="outline">
              <Plus className="w-4 h-4 me-1.5" /> Créer le projet
            </Button>
          </form>
        </Card>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="w-6 h-6" />} title="Aucun projet actif" description="Générez ou créez votre premier projet pratique." />
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{p.status}</Badge>
                    <Badge variant="indigo">{p.progress}%</Badge>
                    {p.subjectName && <Badge>{p.subjectName}</Badge>}
                  </div>
                  <h3 className="font-semibold text-base mt-1">{p.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{p.problemSolved}</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => sendToPortfolio(p.id)}>
                  <Award className="w-3.5 h-3.5 me-1.5" /> Ajouter au Portfolio
                </Button>
              </div>

              <div className="space-y-1.5">
                {p.tasks.map((t) => (
                  <button key={t.id} type="button" onClick={() => toggleTask(p.id, t.id)} className="flex items-center gap-2 text-xs cursor-pointer">
                    {t.completed ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                    <span className={t.completed ? "line-through text-slate-400" : ""}>{t.title}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={taskInputs[p.id] || ""}
                  onChange={(e) => setTaskInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder="Nouvelle tâche..."
                />
                <Button type="button" size="sm" variant="outline" onClick={() => addTask(p.id)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Input
                  defaultValue={p.repoUrl || ""}
                  placeholder="Lien dépôt GitHub (https://...)"
                  onBlur={(e) => void updateLinks(p, e.target.value, p.demoUrl || "", p.reflections || "")}
                />
                <Input
                  defaultValue={p.demoUrl || ""}
                  placeholder="Lien démo (https://...)"
                  onBlur={(e) => void updateLinks(p, p.repoUrl || "", e.target.value, p.reflections || "")}
                />
                <Input
                  defaultValue={p.reflections || ""}
                  placeholder="Note de réflexion personnelle..."
                  onBlur={(e) => void updateLinks(p, p.repoUrl || "", p.demoUrl || "", e.target.value)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
