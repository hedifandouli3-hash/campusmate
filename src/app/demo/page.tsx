"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Bot, Lock, Rocket, ShieldAlert, Sparkles } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Button, Card } from "@/components/ui/primitives";

type DemoTab = "student" | "teacher" | "launchpad";

const DEMO_QA = [
  {
    q: "Comment obtenir une attestation d'inscription ?",
    a: "Dans la plateforme réelle, accédez à Services Universitaires → Documents Administratifs → Attestation d'inscription (délai indicatif 24h–48h ouvrables).",
  },
  {
    q: "Comment transformer un cours en startup ?",
    a: "Dans CampusMate Launchpad, sélectionnez « Transformer ce cours en opportunités » pour extraire compétences, projets pratiques, pistes freelance et idées startup.",
  },
];

export default function IsolatedDemoPage() {
  const [tab, setTab] = useState<DemoTab>("student");
  const [selectedQa, setSelectedQa] = useState(0);
  const [demoCourseFlipped, setDemoCourseFlipped] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6">
        {/* Strict Isolation Banner */}
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-900 dark:text-amber-200">
              Mode Démo Anonyme Isolé (Sandbox Navigateur)
            </p>
            <p className="text-amber-800 dark:text-amber-300">
              Cet espace fonctionne 100% en local dans votre navigateur sans session, sans cookie de production, sans appel aux API réelles et sans accès aux données ou messages des utilisateurs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="primary">Aperçu Public • 3 Expériences</Badge>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Découvrir CampusMate sans compte
            </h1>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Lock className="w-3.5 h-3.5" /> Accéder aux portails réels
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={tab === "student" ? "primary" : "outline"} onClick={() => setTab("student")}>
            <Bot className="w-4 h-4 me-1.5" /> 1. Expérience Étudiant
          </Button>
          <Button type="button" variant={tab === "teacher" ? "primary" : "outline"} onClick={() => setTab("teacher")}>
            <BookOpen className="w-4 h-4 me-1.5" /> 2. Expérience Enseignant
          </Button>
          <Button type="button" variant={tab === "launchpad" ? "primary" : "outline"} onClick={() => setTab("launchpad")}>
            <Rocket className="w-4 h-4 me-1.5" /> 3. Expérience Launchpad
          </Button>
        </div>

        {tab === "student" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Simulation Assistant RAG Étudiant</h2>
              <Badge variant="warning">Données simulées</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEMO_QA.map((item, idx) => (
                <Button key={item.q} type="button" size="sm" variant={selectedQa === idx ? "primary" : "outline"} onClick={() => setSelectedQa(idx)}>
                  {item.q}
                </Button>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 text-sm">
              {DEMO_QA[selectedQa].a}
            </div>
          </Card>
        )}

        {tab === "teacher" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Simulation Espace Enseignant & Isolation Corrigés</h2>
              <Badge variant="warning">Données simulées</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Les supports marqués « Publié » sont indexés pour les sections autorisées. Les corrigés marqués « Enseignant uniquement » ne sont jamais exposés aux requêtes étudiantes ni à l&apos;assistant RAG.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 p-3">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">Support Publié (Visible étudiants)</p>
                <p className="text-slate-500 mt-1">Chapitre 1 : Normalisation 3NF & PostgreSQL</p>
              </div>
              <div className="rounded-lg border border-rose-200 dark:border-rose-800 p-3">
                <p className="font-semibold text-rose-700 dark:text-rose-400">Corrigé Examen (Bloqué pour étudiants)</p>
                <p className="text-slate-500 mt-1">Exclu strictement du moteur RAG et des téléchargements</p>
              </div>
            </div>
          </Card>
        )}

        {tab === "launchpad" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Simulation Launchpad : Cours → Opportunités</h2>
              <Badge variant="indigo">Module 15</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Exemple : à partir du cours <strong>Bases de Données & PostgreSQL</strong>, CampusMate Launchpad propose des projets pratiques, services freelance et hypothèses startup.
            </p>
            <Button type="button" onClick={() => setDemoCourseFlipped((v) => !v)}>
              <Sparkles className="w-4 h-4 me-1.5" />
              {demoCourseFlipped ? "Masquer la simulation" : "Simuler : Transformer ce cours en opportunités"}
            </Button>
            {demoCourseFlipped && (
              <div className="grid md:grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="font-bold text-emerald-600">Projet Pratique</p>
                  <p className="font-semibold mt-1">Gestion de stock 3NF</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="font-bold text-blue-600">Service Freelance</p>
                  <p className="font-semibold mt-1">Migration Excel → PostgreSQL</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                  <p className="font-bold text-amber-600">Hypothèse Startup</p>
                  <p className="font-semibold mt-1">StockPulse TN (PME locales)</p>
                </div>
              </div>
            )}
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
