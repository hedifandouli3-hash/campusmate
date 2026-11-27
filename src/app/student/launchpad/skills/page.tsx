"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Plus, Sparkles, Trash2 } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/primitives";
import type { LaunchpadSkill, LaunchpadSkillStatus } from "@/types/domain";

const STATUS_LABELS: Record<LaunchpadSkillStatus, string> = {
  studied: "Étudiée (cours)",
  practiced: "Pratiquée (TP/Quiz)",
  self_confirmed: "Confirmée par l'étudiant",
  demonstrated: "Démontrée (projet)",
};

export default function LaunchpadSkillsPage() {
  const { locale, notify } = useApp();
  const [skills, setSkills] = useState<LaunchpadSkill[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("technical");
  const [newSubject, setNewSubject] = useState("");

  async function load() {
    const res = await fetch("/api/launchpad");
    if (res.ok) {
      const data = await res.json();
      setSkills(data.skills || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract_skills", locale }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`${(data.skills || []).length} nouvelle(s) compétence(s) extraite(s) de vos cours.`, "success");
        await load();
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function updateStatus(id: string, status: LaunchpadSkillStatus) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "skill", action: "update_status", id, status }),
    });
    if (res.ok) {
      notify("Niveau de preuve mis à jour.", "success");
      await load();
    }
  }

  async function deleteSkill(id: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "skill", action: "delete", id }),
    });
    if (res.ok) await load();
  }

  async function addCustomSkill(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "skill",
        action: "create",
        name: newName,
        category: newCategory,
        subjectName: newSubject || "Ajout personnel",
      }),
    });
    if (res.ok) {
      setNewName("");
      setNewSubject("");
      notify("Compétence ajoutée.", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Analyseur Académique IA</Badge>}
        title="Cartographie des Compétences"
        description="Distinction claire entre compétence étudiée en cours, pratiquée en TP/quiz, confirmée et démontrée par un projet."
        actions={
          <Button type="button" onClick={handleAnalyze} disabled={analyzing}>
            <Sparkles className="w-4 h-4 me-1.5" />
            {analyzing ? "Analyse en cours..." : "Analyser mes cours autorisés"}
          </Button>
        }
      />

      <LaunchpadNav />

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Ajouter ou confirmer une compétence</h2>
        <form onSubmit={addCustomSkill} className="grid sm:grid-cols-4 gap-3">
          <Input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom de la compétence..." />
          <Select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            <option value="technical">Technique / Dev</option>
            <option value="data">Données / SQL</option>
            <option value="engineering">Ingénierie / Élec</option>
            <option value="business">Gestion / Business</option>
            <option value="design">Design / UI-UX</option>
            <option value="communication">Communication</option>
          </Select>
          <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Matière associée..." />
          <Button type="submit">
            <Plus className="w-4 h-4 me-1.5" /> Ajouter
          </Button>
        </form>
      </Card>

      {skills.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title="Aucune compétence analysée"
          description="Cliquez sur « Analyser mes cours autorisés » pour extraire vos compétences."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <Card key={skill.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="primary">{skill.category}</Badge>
                    <Badge variant={skill.status === "demonstrated" ? "success" : "warning"}>
                      {STATUS_LABELS[skill.status]}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mt-1.5">{skill.name}</h3>
                  <p className="text-xs text-slate-500">
                    Matière : {skill.subjectName} • Source : {skill.sourceDocumentTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSkill(skill.id)}
                  aria-label="Supprimer la compétence"
                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Progression estimée</span>
                  <span>{skill.proficiency}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${skill.proficiency}%` }} />
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">{skill.evidenceSummary}</p>

              <div className="text-xs space-y-1">
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  Applications pratiques : {skill.practicalApplications.join(", ")}
                </p>
                <p className="text-slate-500">Prochaines étapes : {skill.nextSkills.join(", ")}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-500">Statut :</span>
                {(["studied", "practiced", "self_confirmed", "demonstrated"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateStatus(skill.id, st)}
                    className={`rounded-md px-2 py-1 text-[11px] font-medium cursor-pointer transition ${
                      skill.status === st
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {st === "self_confirmed" && <CheckCircle2 className="w-3 h-3 inline me-1" />}
                    {STATUS_LABELS[st].split(" ")[0]}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
