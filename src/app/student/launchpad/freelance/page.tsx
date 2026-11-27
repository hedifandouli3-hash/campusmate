"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Calculator, CheckCircle2, Heart, MessageSquare, Sparkles } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Textarea } from "@/components/ui/primitives";
import type { LaunchpadFreelanceIdea } from "@/types/domain";

export default function LaunchpadFreelancePage() {
  const { locale, notify } = useApp();
  const [ideas, setIdeas] = useState<LaunchpadFreelanceIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [simHours, setSimHours] = useState(20);
  const [simRate, setSimRate] = useState(25);
  const [simBufferPct, setSimBufferPct] = useState(15);
  const [clientReply, setClientReply] = useState("");
  const [clientFeedback, setClientFeedback] = useState("");

  async function load() {
    const res = await fetch("/api/launchpad");
    if (res.ok) {
      const data = await res.json();
      setIdeas(data.freelanceIdeas || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_freelance", locale }),
      });
      if (res.ok) {
        notify("Pistes freelance générées selon votre parcours.", "success");
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
      body: JSON.stringify({ entity: "freelance", action: "toggle_save", id }),
    });
    if (res.ok) await load();
  }

  async function generatePrepKit(id: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "freelance", action: "generate_prep_kit", id }),
    });
    if (res.ok) {
      notify("Kit de préparation professionnelle généré.", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Conseiller Freelance IA</Badge>}
        title="Transformer vos compétences en services"
        description="Préparation méthodologique au freelance : positionnement, livrables, écarts de compétences et simulation d'entretien client (sans promesse de gains)."
        actions={
          <Button type="button" onClick={handleGenerate} disabled={generating}>
            <Sparkles className="w-4 h-4 me-1.5" />
            {generating ? "Génération..." : "Générer des pistes freelance"}
          </Button>
        }
      />

      <LaunchpadNav />

      {ideas.length === 0 ? (
        <EmptyState icon={<Briefcase className="w-6 h-6" />} title="Aucune piste freelance" description="Générez des idées adaptées à vos cours et compétences." />
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <Card key={idea.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{idea.difficulty}</Badge>
                    <span className="text-[11px] text-slate-500">{idea.relatedSubjects.join(" • ")}</span>
                  </div>
                  <h3 className="font-semibold text-base mt-1">{idea.serviceTitle}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSave(idea.id)}
                  className={`p-1.5 rounded-lg cursor-pointer ${idea.saved ? "text-rose-600" : "text-slate-400 hover:text-rose-600"}`}
                  aria-label="Sauvegarder"
                >
                  <Heart className={`w-4 h-4 ${idea.saved ? "fill-rose-600" : ""}`} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">{idea.description}</p>

              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Compétences acquises</p>
                  <p>{idea.possessedSkills.join(", ") || "En cours d'acquisition"}</p>
                </div>
                <div className="rounded-lg bg-amber-50/70 dark:bg-amber-950/30 p-2.5">
                  <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">À renforcer</p>
                  <p>{idea.missingSkills.join(", ")}</p>
                </div>
              </div>

              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Clients cibles :</strong> {idea.targetClients.join(", ")}</p>
                <p><strong>Livrables types :</strong> {idea.deliverables.join(", ")}</p>
                <p><strong>Projet portfolio recommandé :</strong> {idea.portfolioProjectIdea}</p>
                <p><strong>Outils :</strong> {idea.toolsToLearn.join(", ")}</p>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2.5 text-[11px] text-slate-500">
                {idea.illustrativeQuoteNote}
              </div>

              {idea.prepKit ? (
                <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2 text-xs">
                  <p className="font-semibold text-blue-700 dark:text-blue-300">Kit de Préparation Professionnelle</p>
                  <p><strong>Proposition type :</strong> {idea.prepKit.proposalTemplate}</p>
                  <div>
                    <p className="font-semibold">Checklist de livraison :</p>
                    <ul className="list-disc ps-4">
                      {(idea.prepKit.deliveryChecklist || []).map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Questions d&apos;entretien client simulé :</p>
                    <ul className="list-disc ps-4">
                      {(idea.prepKit.mockInterviewQuestions || []).map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Button type="button" size="sm" variant="outline" onClick={() => generatePrepKit(idea.id)}>
                  <CheckCircle2 className="w-3.5 h-3.5 me-1.5" /> Générer le kit de préparation (devis type, checklist, entretien)
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Deterministic Project Pricing Simulator & AI Client Simulator */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" /> Simulateur de Coût & Devis Pédagogique
            </h2>
            <Badge variant="warning">Calcul illustratif</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Heures estimées</label>
              <Input type="number" min={1} value={simHours} onChange={(e) => setSimHours(Math.max(1, Number(e.target.value)))} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Taux horaire (TND)</label>
              <Input type="number" min={1} value={simRate} onChange={(e) => setSimRate(Math.max(1, Number(e.target.value)))} />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Marge imprévus (%)</label>
              <Input type="number" min={0} max={50} value={simBufferPct} onChange={(e) => setSimBufferPct(Math.max(0, Number(e.target.value)))} />
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 text-xs space-y-1">
            <p>Coût de base : <strong>{simHours * simRate} TND</strong></p>
            <p>Estimation avec marge ({simBufferPct}%) : <strong>{Math.round(simHours * simRate * (1 + simBufferPct / 100))} TND</strong></p>
            <p className="text-[11px] text-slate-500">Estimation éducative déterministe uniquement — ne garantit ni demande ni revenu.</p>
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" /> Simulateur d&apos;Entretien Client (Fictif)
            </h2>
            <Badge variant="indigo">Entraînement</Badge>
          </div>
          <p className="text-xs rounded-lg bg-slate-50 dark:bg-slate-900/50 p-2.5">
            <strong>Client fictif :</strong> « Bonjour, j&apos;ai besoin d&apos;un site pour mon commerce avec gestion de stock, mais je n&apos;ai pas encore de cahier des charges. Combien de temps ça prend ? »
          </p>
          <Textarea
            rows={2}
            value={clientReply}
            onChange={(e) => setClientReply(e.target.value)}
            placeholder="Rédigez votre réponse professionnelle (cadrage, questions, livrables)..."
          />
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setClientFeedback(
                clientReply.trim().length > 25
                  ? "Bonne approche : veillez à bien confirmer par écrit la liste exacte des fonctionnalités MVP, les délais de révision et les prérequis fournis par le client avant de chiffrer."
                  : "Votre réponse est un peu courte : posez 2-3 questions précises sur le besoin et proposez un périmètre écrit avant d'annoncer un délai."
              )
            }
          >
            Évaluer ma réponse
          </Button>
          {clientFeedback && <p className="text-xs text-emerald-700 dark:text-emerald-400">{clientFeedback}</p>}
        </Card>
      </div>
    </div>
  );
}
