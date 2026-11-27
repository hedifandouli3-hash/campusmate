"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Bot, Lock, Rocket, RotateCcw, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Button, Card } from "@/components/ui/primitives";

export type DemoRoleTab = "student" | "teacher" | "administration";

const DEMO_QA = [
  {
    q: "Comment obtenir une attestation d'inscription ?",
    a: "Exemple RAG (source : Guide Scolarité ISET Béja) : Connectez-vous sur CampusMate → Services Universitaires → Documents Administratifs → Attestation d'inscription (délai indicatif : 24h à 48h ouvrables).",
  },
  {
    q: "Quelles sont les licences de l'ISET Béja ?",
    a: "Exemple RAG (source : isetb.rnu.tn/licences) : Technologies de l'Informatique (DSI, RSI), Génie Électrique et Génie Mécanique.",
  },
];

export function DemoSandbox({ initialTab = "student" }: { initialTab?: DemoRoleTab }) {
  const [tab, setTab] = useState<DemoRoleTab>(initialTab);
  const [selectedQa, setSelectedQa] = useState(0);
  const [demoCourseFlipped, setDemoCourseFlipped] = useState(false);
  const [demoDocPublished, setDemoDocPublished] = useState(false);
  const [demoQueueNum, setDemoQueueNum] = useState(14);

  function resetDemo() {
    setSelectedQa(0);
    setDemoCourseFlipped(false);
    setDemoDocPublished(false);
    setDemoQueueNum(14);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-6">
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Mode Démo Anonyme Isolé (Sandbox Navigateur)
              </p>
              <p className="text-amber-800 dark:text-amber-300">
                Cet espace fonctionne 100% côté navigateur avec des données synthétiques : aucune session, aucun cookie, aucun appel aux API ou données de production.
              </p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={resetDemo}>
            <RotateCcw className="w-3.5 h-3.5 me-1" /> Réinitialiser
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="primary">Aperçu Public • 3 Expériences</Badge>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              Découvrir CampusMate sans compte
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/register" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">
              Créer un compte réel
            </Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              <Lock className="w-3.5 h-3.5" /> Portails réels
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={tab === "student" ? "primary" : "outline"} onClick={() => setTab("student")}>
            <Bot className="w-4 h-4 me-1.5" /> 1. Démo Étudiant & Launchpad
          </Button>
          <Button type="button" variant={tab === "teacher" ? "primary" : "outline"} onClick={() => setTab("teacher")}>
            <BookOpen className="w-4 h-4 me-1.5" /> 2. Démo Enseignant
          </Button>
          <Button type="button" variant={tab === "administration" ? "primary" : "outline"} onClick={() => setTab("administration")}>
            <UserCheck className="w-4 h-4 me-1.5" /> 3. Démo Administration
          </Button>
        </div>

        {tab === "student" && (
          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Simulation Assistant RAG Étudiant</h2>
                <Badge variant="warning">Exemple statique démo</Badge>
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

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-blue-600" /> Simulation Launchpad : Cours → Opportunités
                </h2>
                <Badge variant="indigo">Module 15</Badge>
              </div>
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
          </div>
        )}

        {tab === "teacher" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Simulation Espace Enseignant & Isolation Corrigés</h2>
              <Badge variant="warning">Données simulées</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Les supports publiés sont indexés pour les sections autorisées. Les corrigés marqués « Enseignant uniquement » restent strictement exclus des requêtes étudiantes.
            </p>
            <div className="flex items-center gap-3">
              <Button type="button" size="sm" onClick={() => setDemoDocPublished((v) => !v)}>
                {demoDocPublished ? "Dépublier le support démo" : "Simuler publication du support"}
              </Button>
              <Badge variant={demoDocPublished ? "success" : "default"}>
                {demoDocPublished ? "Publié & Indexé RAG" : "Brouillon privé"}
              </Badge>
            </div>
          </Card>
        )}

        {tab === "administration" && (
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Simulation Administration : File Digitale & Base de Connaissances</h2>
              <Badge variant="warning">Données simulées</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Aperçu interactif de la file d&apos;attente digitale et de la validation des sources officielles avant indexation RAG.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono font-bold">Ticket en cours : SCO-0{demoQueueNum}</span>
              <Button type="button" size="sm" onClick={() => setDemoQueueNum((n) => n + 1)}>
                Appeler le suivant (Démo)
              </Button>
            </div>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
