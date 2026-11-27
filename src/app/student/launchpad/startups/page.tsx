"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, LayoutGrid, Lightbulb, Map, Sparkles, Trash2 } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import type { LaunchpadStartupIdea } from "@/types/domain";

interface AuthorizedDocSummary {
  id: string;
  title: string;
  subjectName: string;
}

export default function LaunchpadStartupsPage() {
  const router = useRouter();
  const { locale, notify } = useApp();
  const [ideas, setIdeas] = useState<LaunchpadStartupIdea[]>([]);
  const [docs, setDocs] = useState<AuthorizedDocSummary[]>([]);
  const [mode, setMode] = useState<"knowledge" | "course" | "custom">("knowledge");
  const [courseDocumentId, setCourseDocumentId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [industry, setIndustry] = useState("");
  const [generating, setGenerating] = useState(false);

  async function load() {
    const res = await fetch("/api/launchpad");
    if (res.ok) {
      const data = await res.json();
      setIdeas(data.startupIdeas || []);
      setDocs(data.authorizedDocs || []);
      if (data.authorizedDocs?.[0]?.id) setCourseDocumentId(data.authorizedDocs[0].id);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_startup",
          mode,
          courseDocumentId: mode === "course" ? courseDocumentId : undefined,
          customPrompt: mode === "custom" ? customPrompt : undefined,
          industry: industry || undefined,
          locale,
        }),
      });
      if (res.ok) {
        notify("Hypothèses startup générées et évaluées.", "success");
        setCustomPrompt("");
        await load();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function toggleSave(id: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "startup", action: "toggle_save", id }),
    });
    if (res.ok) await load();
  }

  async function deleteIdea(id: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "startup", action: "delete", id }),
    });
    if (res.ok) await load();
  }

  async function createCanvas(startupIdeaId: string) {
    const res = await fetch("/api/ai/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_canvas", startupIdeaId, locale }),
    });
    if (res.ok) {
      notify("Business Model Canvas créé !", "success");
      router.push("/student/launchpad/business-canvas");
    }
  }

  async function createRoadmap(startupIdeaId: string) {
    const res = await fetch("/api/ai/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_roadmap", startupIdeaId, horizon: "30d", locale }),
    });
    if (res.ok) {
      notify("Roadmap MVP 30 jours générée !", "success");
      router.push("/student/launchpad/roadmaps");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="warning">Idéation & Analyse de Faisabilité</Badge>}
        title="Générateur d'Idées Startup"
        description="Générez des concepts réalistes à faibles ressources à partir de vos cours et analysez leur faisabilité explicable."
      />

      <LaunchpadNav />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "knowledge", label: "1. Depuis mes connaissances" },
              { key: "course", label: "2. Depuis un cours précis" },
              { key: "custom", label: "3. Développer ma propre idée" },
            ] as const
          ).map((m) => (
            <Button
              key={m.key}
              type="button"
              size="sm"
              variant={mode === m.key ? "primary" : "outline"}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {mode === "course" && (
              <Select value={courseDocumentId} onChange={(e) => setCourseDocumentId(e.target.value)}>
                {docs.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.subjectName}] {d.title}
                  </option>
                ))}
              </Select>
            )}
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Secteur souhaité (optionnel : EdTech, Énergie, PME...)" />
          </div>
          {mode === "custom" && (
            <Textarea
              required
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Décrivez le problème observé ou votre idée brute..."
            />
          )}
          <Button type="submit" disabled={generating}>
            <Sparkles className="w-4 h-4 me-1.5" />
            {generating ? "Génération en cours..." : "Générer & Analyser la faisabilité"}
          </Button>
        </form>
      </Card>

      {ideas.length === 0 ? (
        <EmptyState icon={<Lightbulb className="w-6 h-6" />} title="Aucune idée startup" description="Utilisez l'un des 3 modes ci-dessus pour démarrer." />
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{idea.mode}</Badge>
                    {idea.sourceCourseTitle && <Badge variant="indigo">{idea.sourceCourseTitle}</Badge>}
                    {idea.feasibility && (
                      <Badge variant="success">Faisabilité heuristique : {idea.feasibility.overallScore}/100</Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mt-1">{idea.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{idea.shortPitch}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSave(idea.id)}
                    className={`p-1.5 rounded-lg cursor-pointer ${idea.saved ? "text-rose-600" : "text-slate-400 hover:text-rose-600"}`}
                    aria-label="Sauvegarder"
                  >
                    <Heart className={`w-4 h-4 ${idea.saved ? "fill-rose-600" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteIdea(idea.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 space-y-1">
                  <p><strong>Problème :</strong> {idea.problemStatement}</p>
                  <p><strong>Solution :</strong> {idea.proposedSolution}</p>
                  <p><strong>Cibles :</strong> {idea.targetCustomers.join(", ")}</p>
                  <p><strong>Modèle économique :</strong> {idea.businessModel}</p>
                </div>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 space-y-1">
                  <p><strong>Acquis académiques :</strong> {idea.academicKnowledgeUsed.join(", ")}</p>
                  <p><strong>MVP :</strong> {idea.mvpFeatures.join(" • ")}</p>
                  <p><strong>Effort :</strong> {idea.effortEstimate}</p>
                  <p><strong>Plan de validation :</strong> {idea.validationPlan.join(" → ")}</p>
                </div>
              </div>

              {idea.feasibility && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3 space-y-2">
                  <p className="text-xs font-semibold">Analyse de faisabilité explicable</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {idea.feasibility.factors.map((f) => (
                      <div key={f.name} className="rounded-lg bg-[var(--bg-surface)] p-2 border border-slate-200 dark:border-slate-800 text-[11px]">
                        <p className="font-semibold">{f.name} ({f.score}/100)</p>
                        <p className="text-slate-500 mt-0.5">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500">{idea.feasibility.methodologyNote}</p>
                </div>
              )}

              <p className="text-[11px] text-amber-700 dark:text-amber-400">{idea.hypothesisDisclaimer}</p>

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => createCanvas(idea.id)}>
                  <LayoutGrid className="w-3.5 h-3.5 me-1.5" /> Créer le Business Model Canvas
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => createRoadmap(idea.id)}>
                  <Map className="w-3.5 h-3.5 me-1.5" /> Générer Roadmap MVP 30j
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
