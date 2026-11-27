"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarPlus, FolderKanban, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { getV6Copy } from "@/lib/i18n/v6";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from "@/components/ui/primitives";
import { downloadIcsReminder } from "@/lib/integrations/exports";
import type { KanbanProjectTask, StudentWorkspaceProject } from "@/types/domain";

const COLUMNS: Array<{ status: KanbanProjectTask["status"]; label: string }> = [
  { status: "todo", label: "À faire" },
  { status: "in_progress", label: "En cours" },
  { status: "under_review", label: "En révision" },
  { status: "completed", label: "Terminé" },
];

export default function StudentProjectsPage() {
  const { locale, notify } = useApp();
  const copy = getV6Copy(locale).projects;
  const [projects, setProjects] = useState<StudentWorkspaceProject[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newCategory, setNewCategory] = useState<StudentWorkspaceProject["category"]>("academic");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<KanbanProjectTask["priority"]>("medium");

  async function load() {
    const res = await fetch("/api/studio");
    if (res.ok) {
      const data = await res.json();
      const list: StudentWorkspaceProject[] = data.projects || [];
      setProjects(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].id);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const current = projects.find((p) => p.id === selectedId) || projects[0] || null;

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;
    const res = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "project",
        action: "create",
        title: newProjectTitle.trim(),
        category: newCategory,
        description: "Projet géré dans CampusMate Workspace",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewProjectTitle("");
      setSelectedId(data.project.id);
      notify("Projet créé", "success");
      await load();
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !newTaskTitle.trim()) return;
    const res = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "project",
        action: "add_task",
        id: current.id,
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
      }),
    });
    if (res.ok) {
      setNewTaskTitle("");
      notify("Tâche ajoutée au tableau Kanban", "success");
      await load();
    }
  }

  async function handleMoveTask(taskId: string, status: KanbanProjectTask["status"]) {
    if (!current) return;
    const res = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "project",
        action: "move_task",
        id: current.id,
        taskId,
        status,
      }),
    });
    if (res.ok) {
      await load();
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!current) return;
    const res = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "project",
        action: "delete_task",
        id: current.id,
        taskId,
      }),
    });
    if (res.ok) {
      notify(copy.deleteTask, "info");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        badge="Kanban Workspace"
      />

      {/* Create project */}
      <Card className="p-4">
        <form onSubmit={(e) => void handleCreateProject(e)} className="flex flex-col sm:flex-row gap-2.5">
          <Select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as StudentWorkspaceProject["category"])}
            className="sm:w-44"
          >
            <option value="academic">Académique</option>
            <option value="pfe">Projet PFE</option>
            <option value="startup">Startup</option>
            <option value="portfolio">Portfolio</option>
            <option value="personal">Personnel</option>
          </Select>
          <Input
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="Nouveau projet (ex: PFE Smart Irrigation ISET Béja)"
            className="flex-1"
          />
          <Button type="submit" disabled={!newProjectTitle.trim()}>
            <Plus className="w-4 h-4 me-1.5" /> Créer projet
          </Button>
        </form>
      </Card>

      {!current ? (
        <Card className="p-8">
          <EmptyState
            icon={<FolderKanban className="w-6 h-6" />}
            title="Aucun projet pour le moment"
            description="Créez votre premier projet ci-dessus pour organiser vos tâches en Kanban."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Project selector & progress */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Select
                value={current.id}
                onChange={(e) => setSelectedId(e.target.value)}
                className="min-w-[240px]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.progress}%)
                  </option>
                ))}
              </Select>
              <Badge>{current.category}</Badge>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  downloadIcsReminder({
                    title: `Jalon Projet : ${current.title}`,
                    description: `${current.description} — Progression actuelle : ${current.progress}%`,
                  })
                }
              >
                <CalendarPlus className="w-3.5 h-3.5 me-1" /> Calendrier (.ics)
              </Button>
            </div>
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="flex-1 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${current.progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {current.progress}%
              </span>
            </div>
          </Card>

          {/* Add task */}
          <Card className="p-4">
            <form onSubmit={(e) => void handleAddTask(e)} className="flex flex-col sm:flex-row gap-2.5">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ajouter une tâche au tableau Kanban..."
                className="flex-1"
              />
              <Select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as KanbanProjectTask["priority"])}
                className="sm:w-36"
              >
                <option value="low">Priorité basse</option>
                <option value="medium">Priorité moyenne</option>
                <option value="high">Priorité haute</option>
              </Select>
              <Button type="submit" disabled={!newTaskTitle.trim()}>
                <Plus className="w-4 h-4 me-1" /> Ajouter tâche
              </Button>
            </form>
          </Card>

          {/* 4-column Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col, colIdx) => {
              const colTasks = current.tasks.filter((t) => t.status === col.status);
              const prevStatus = COLUMNS[colIdx - 1]?.status;
              const nextStatus = COLUMNS[colIdx + 1]?.status;
              return (
                <Card key={col.status} className="p-3.5 space-y-3 bg-slate-50/70 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                      {copy.columns[col.status]}
                    </span>
                    <Badge>{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs font-medium text-slate-900 dark:text-white">
                            {task.title}
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDeleteTask(task.id)}
                            aria-label={copy.deleteTask}
                            className="text-slate-400 hover:text-rose-500 transition shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Badge
                            variant={
                              task.priority === "high"
                                ? "warning"
                                : "default"
                            }
                          >
                            {task.priority}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {prevStatus && (
                              <button
                                type="button"
                                onClick={() => void handleMoveTask(task.id, prevStatus)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:underline"
                              >
                                <ArrowLeft className="w-3 h-3" /> {copy.moveBack}
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                type="button"
                                onClick={() => void handleMoveTask(task.id, nextStatus)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {copy.moveForward} <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
