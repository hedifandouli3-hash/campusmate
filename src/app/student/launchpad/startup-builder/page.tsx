"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Calculator, Globe, Lightbulb, Rocket } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { getV6Copy } from "@/lib/i18n/v6";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui/primitives";

export default function StartupBuilderPage() {
  const { locale, notify } = useApp();
  const copy = getV6Copy(locale).startupBuilder;
  const [startupName, setStartupName] = useState("AgriSmart Béja");
  const [courseOrigin, setCourseOrigin] = useState("Systèmes Embarqués & IoT");
  const [problem, setProblem] = useState("Optimiser l'irrigation agricole dans la région de Béja via capteurs IoT.");
  const [monthlyPriceTnd, setMonthlyPriceTnd] = useState(120);
  const [monthlyFixedCostTnd, setMonthlyFixedCostTnd] = useState(1800);
  const [variableCostTnd, setVariableCostTnd] = useState(30);
  const [building, setBuilding] = useState(false);
  const [createdIds, setCreatedIds] = useState<{ website?: boolean; project?: boolean }>({});

  const marginPerClient = Math.max(1, monthlyPriceTnd - variableCostTnd);
  const breakEvenClients = Math.ceil(monthlyFixedCostTnd / marginPerClient);

  async function handleGenerateBundle() {
    setBuilding(true);
    try {
      const [studioRes, projectRes] = await Promise.all([
        fetch("/api/studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_artifact",
            type: "website",
            title: `${startupName} — Landing Page`,
            description: `${problem} (Issu du cours : ${courseOrigin})`,
          }),
        }),
        fetch("/api/studio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "project",
            action: "create",
            title: `MVP ${startupName}`,
            category: "startup",
            description: problem,
          }),
        }),
      ]);
      if (studioRes.ok && projectRes.ok) {
        setCreatedIds({ website: true, project: true });
        notify("Site vitrine et tableau MVP créés dans le Studio et Projets", "success");
      }
    } finally {
      setBuilding(false);
    }
  }

  return (
    <div className="space-y-6">
      <LaunchpadNav />
      <PageHeader
        title={copy.title}
        description={copy.description}
        badge="V6 Startup OS"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            1. Définition Cours → Problème → Startup
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Nom de la startup</label>
              <Input value={startupName} onChange={(e) => setStartupName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium">Cours / compétence source</label>
              <Input value={courseOrigin} onChange={(e) => setCourseOrigin(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Problème résolu</label>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm mt-1"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => void handleGenerateBundle()} disabled={building}>
              <Rocket className="w-4 h-4 me-1.5" />
              {building ? "Génération..." : "Générer Site Web + Projet MVP"}
            </Button>
            <Link href="/student/launchpad/business-canvas">
              <Button variant="secondary">
                Business Model Canvas <ArrowRight className="w-3.5 h-3.5 ms-1" />
              </Button>
            </Link>
            <Link href="/student/launchpad/roadmaps">
              <Button variant="secondary">
                Pitch & Jury IA <ArrowRight className="w-3.5 h-3.5 ms-1" />
              </Button>
            </Link>
          </div>

          {createdIds.website && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Livrables créés avec succès !
              </span>
              <div className="flex gap-3">
                <Link href="/student/studio" className="underline inline-flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Voir le site dans Studio
                </Link>
                <Link href="/student/projects" className="underline">
                  Voir le Kanban MVP
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Break-Even Financial Calculator */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
            <Calculator className="w-4 h-4 text-blue-600" />
            2. Simulateur de Rentabilité (TND)
          </div>
          <div>
            <label className="text-xs font-medium">Abonnement mensuel (TND)</label>
            <Input
              type="number"
              min={1}
              value={monthlyPriceTnd}
              onChange={(e) => setMonthlyPriceTnd(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Coûts fixes mensuels (TND)</label>
            <Input
              type="number"
              min={0}
              value={monthlyFixedCostTnd}
              onChange={(e) => setMonthlyFixedCostTnd(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Coût variable / client (TND)</label>
            <Input
              type="number"
              min={0}
              value={variableCostTnd}
              onChange={(e) => setVariableCostTnd(Number(e.target.value) || 0)}
            />
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3.5 space-y-1">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Marge unitaire : <strong>{marginPerClient} TND / client</strong>
            </div>
            <div className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between">
              <span>Seuil de rentabilité :</span>
              <Badge variant="success">{breakEvenClients} clients</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
