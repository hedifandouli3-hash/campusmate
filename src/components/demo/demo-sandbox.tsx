"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Bot,
  Briefcase,
  CalendarClock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Moon,
  Rocket,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Sun,
  Ticket,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, StatCard } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { Locale } from "@/types/domain";

export type DemoRoleTab = "student" | "teacher" | "administration" | "commercial";
type DemoSubView = "overview" | "agent" | "courses" | "launchpad" | "marketplace" | "chats" | "cv" | "knowledge";

const DEMO_QA = [
  {
    q: "Comment obtenir une attestation d'inscription ?",
    a: "Source officielle (Guide Scolarité ISET Béja) : Connectez-vous sur CampusMate → Services Universitaires → Documents Administratifs → Attestation d'inscription. Délai indicatif : 24h à 48h ouvrables.",
  },
  {
    q: "Quels sont les parcours TI à l'ISET Béja ?",
    a: "Source officielle (isetb.rnu.tn/technologies-de-linformatique) : Développement des Systèmes d'Information (DSI) et Réseaux et Services Informatiques (RSI).",
  },
  {
    q: "Qui est la directrice de l'ISET Béja ?",
    a: "Source officielle (isetb.rnu.tn/mot-de-la-direction) : Informations institutionnelles disponibles dans la base officielle synchronisée.",
  },
];

export function DemoSandbox({ initialTab = "student" }: { initialTab?: DemoRoleTab }) {
  const { locale, setLocale, dark, toggleTheme } = useApp();
  const [role, setRole] = useState<DemoRoleTab>(initialTab);
  const [view, setView] = useState<DemoSubView>("overview");
  const [selectedQa, setSelectedQa] = useState(0);
  const [flippedCourseOpp, setFlippedCourseOpp] = useState(false);

  function switchRole(next: DemoRoleTab) {
    setRole(next);
    setView("overview");
  }

  const navItems: Array<{ id: DemoSubView; label: string; icon: React.ReactNode }> =
    role === "student"
      ? [
          { id: "overview", label: "Vue d'ensemble", icon: <LayoutDashboard className="w-4 h-4" /> },
          { id: "agent", label: "Agent & Studio IA", icon: <Sparkles className="w-4 h-4" /> },
          { id: "courses", label: "Mes Cours & IA", icon: <BookOpen className="w-4 h-4" /> },
          { id: "launchpad", label: "Launchpad Hub", icon: <Rocket className="w-4 h-4" /> },
          { id: "marketplace", label: "Marketplace", icon: <ShoppingBag className="w-4 h-4" /> },
          { id: "chats", label: "Groupes Chat", icon: <MessageSquare className="w-4 h-4" /> },
          { id: "cv", label: "Studio CV", icon: <Award className="w-4 h-4" /> },
        ]
      : role === "teacher"
        ? [
            { id: "overview", label: "Espace Enseignant", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "courses", label: "Supports & Corrigés", icon: <FileText className="w-4 h-4" /> },
            { id: "chats", label: "Groupes Académiques", icon: <MessageSquare className="w-4 h-4" /> },
          ]
        : role === "administration"
          ? [
              { id: "overview", label: "Administration", icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: "knowledge", label: "Base IA (isetb.rnu.tn)", icon: <Bot className="w-4 h-4" /> },
            ]
          : [
              { id: "overview", label: "Modèle SaaS & Tarifs (Démo)", icon: <Rocket className="w-4 h-4" /> },
            ];

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Sidebar identical in look to DashboardShell */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-e border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="h-16 px-4 flex items-center gap-2.5 border-b border-[var(--border-subtle)]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">CampusMate</p>
              <p className="text-[11px] text-slate-500">ISET Béja • Démo</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation Lecture Seule
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer",
                view === item.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--border-subtle)] space-y-2">
          <div className="rounded-xl border border-[var(--border-subtle)] p-2.5 text-xs">
            <p className="font-semibold">
              {role === "student" ? "Amira Ben Ali (Démo)" : role === "teacher" ? "Prof. Karim (Démo)" : "Administration (Démo)"}
            </p>
            <p className="text-[11px] text-slate-500">Mode lecture seule isolé</p>
          </div>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Lock className="w-3.5 h-3.5" /> Connexion réelle
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">Mode Démo Lecture Seule (Aucune écriture)</Badge>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
              {(
                [
                  { id: "student", label: "Étudiant" },
                  { id: "teacher", label: "Enseignant" },
                  { id: "administration", label: "Administration" },
                  { id: "commercial", label: "Modèle Commercial" },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => switchRole(r.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md font-medium cursor-pointer",
                    role === r.id ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
              {(["fr", "en", "ar"] as Locale[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocale(loc)}
                  className={cn(
                    "px-2 py-1 rounded-md font-medium uppercase cursor-pointer",
                    locale === loc ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 cursor-pointer"
              aria-label="Changer le thème"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setView("overview");
                setSelectedQa(0);
                setFlippedCourseOpp(false);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </header>

        {/* Mobile sub-nav */}
        <div className="flex md:hidden gap-1.5 overflow-x-auto px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium",
                view === item.id ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* COMMERCIAL DEMO VIEW */}
          {role === "commercial" && (
            <div className="space-y-4">
              <Card className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-xl font-bold">Modèle Commercial B2B2C — Démonstration Jury (Données Simulées)</h1>
                  <Badge variant="warning">Simulation Jury uniquement</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Les étudiants et enseignants ne paient jamais. Exemple simulé pour ISET Béja (University Pro) : 1 500 étudiants × 10 TND + 100 enseignants × 25 TND = <strong>17 500 TND / an</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <div className="font-semibold text-blue-600">1. Licences Universitaires</div>
                    <p className="text-slate-500 mt-1">Plus (5/15 TND), Pro (10/25 TND), Ultra (20/40 TND). Héritage serveur automatique.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <div className="font-semibold text-indigo-600">2. Entreprises &amp; Logement</div>
                    <p className="text-slate-500 mt-1">Company Pro (600 TND/an), Logement (20 TND / 30j ou 150 TND/an), gratuit pour les étudiants.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <div className="font-semibold text-emerald-600">3. Sponsoring Éducatif</div>
                    <p className="text-slate-500 mt-1">Placements contextuels modérés sans ciblage ni partage de données étudiantes.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href="/pricing">
                    <Button size="sm">Ouvrir le Simulateur /pricing</Button>
                  </Link>
                  <Link href="/housing">
                    <Button size="sm" variant="outline">Voir CampusMate Housing</Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* STUDENT VIEWS */}
          {role === "student" && view === "agent" && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Aperçu CampusMate Agent &amp; Studio (Lecture seule)
                </h2>
                <Badge variant="primary">V6 Agent OS</Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Exemple de workflow agentique : l&apos;étudiant demande un site vitrine et un plan MVP pour son projet PFE à l&apos;ISET Béja. L&apos;agent exécute les outils autorisés (sans accès aux cookies ni envoi externe non approuvé) et génère les livrables dans le Studio.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="text-xs font-semibold text-blue-600 mb-1">1. Outil Website Studio</div>
                  <p className="text-xs text-slate-500">Génération HTML/CSS isolée dans un iframe sandbox avec CSP strict.</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="text-xs font-semibold text-indigo-600 mb-1">2. Kanban &amp; Automatisations</div>
                  <p className="text-xs text-slate-500">Création automatique de tâches MVP et briefing quotidien (Africa/Tunis).</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                  <div className="text-xs font-semibold text-emerald-600 mb-1">3. Contrôle Humain</div>
                  <p className="text-xs text-slate-500">Tout brouillon d&apos;email ou action sensible requiert une approbation explicite.</p>
                </div>
              </div>
              <div className="pt-2">
                <Link href="/register">
                  <Button size="sm">Créer un compte pour utiliser l&apos;Agent complet</Button>
                </Link>
              </div>
            </Card>
          )}

          {role === "student" && view === "overview" && (
            <>
              <Card className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="primary">ISET Béja</Badge>
                    <Badge variant="indigo">2ème Année DSI — Groupe A</Badge>
                  </div>
                  <h1 className="text-2xl font-bold">Bonjour, Amira Ben Ali</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Technologies de l&apos;Informatique • Aperçu lecture seule (créez un compte pour enregistrer vos données)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={() => setView("courses")}>Mes cours (2)</Button>
                  <Button type="button" variant="outline" onClick={() => setView("launchpad")}>Launchpad Hub</Button>
                </div>
              </Card>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Supports disponibles" value={2} hint="Résumés & Quiz IA" icon={<BookOpen className="w-4 h-4" />} />
                <StatCard label="Demandes admin" value={1} hint="Suivi en ligne" icon={<FileText className="w-4 h-4" />} />
                <StatCard label="Offres de stage" value={2} hint="Organisations vérifiées" icon={<Briefcase className="w-4 h-4" />} />
                <StatCard label="Compétences Launchpad" value={2} hint="Cours + Projets" icon={<Rocket className="w-4 h-4" />} />
              </div>

              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" /> Assistant Universitaire Rapide (ISET Béja RAG — Démo)
                  </h2>
                  <Badge variant="warning">Exemples pré-chargés</Badge>
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
            </>
          )}

          {role === "student" && view === "courses" && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">Mes Cours & Transformation en Opportunités</h1>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="space-y-3">
                  <Badge variant="primary">Bases de Données Avancées</Badge>
                  <h2 className="font-semibold">Bases de Données Relationnelles et PostgreSQL</h2>
                  <p className="text-xs text-slate-500">Normalisation 3NF, Row Level Security (RLS) et indexation pgvector.</p>
                  <Button type="button" size="sm" onClick={() => setFlippedCourseOpp((v) => !v)}>
                    <Sparkles className="w-3.5 h-3.5 me-1.5" />
                    {flippedCourseOpp ? "Masquer les opportunités" : "Transformer ce cours en opportunités"}
                  </Button>
                </Card>
                <Card className="space-y-3">
                  <Badge variant="indigo">Développement Web Full-Stack</Badge>
                  <h2 className="font-semibold">Architectures Web Modernes avec React & Next.js</h2>
                  <p className="text-xs text-slate-500">SSR, Server Components, validation Zod et isolation multi-tenant.</p>
                  <Button type="button" size="sm" variant="outline" disabled>
                    Lecture seule en mode démo
                  </Button>
                </Card>
              </div>
              {flippedCourseOpp && (
                <Card className="grid md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="font-bold text-emerald-600">Projet Pratique</p>
                    <p className="font-semibold mt-1">Application de gestion de stock 3NF</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="font-bold text-blue-600">Service Freelance</p>
                    <p className="font-semibold mt-1">Migration Excel → PostgreSQL</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <p className="font-bold text-amber-600">Idée Startup</p>
                    <p className="font-semibold mt-1">StockPulse TN (PME locales)</p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {role === "student" && view === "launchpad" && (
            <div className="space-y-4">
              <Card className="p-5 space-y-2">
                <Badge variant="primary">CampusMate Launchpad • Module 15</Badge>
                <h1 className="text-2xl font-bold">Transformez vos connaissances en opportunités.</h1>
                <p className="text-xs text-slate-500">
                  Cours + Stages + Projets → Compétences IA, Freelance, Idées Startup, Business Model Canvas & Portfolio (lecture seule en démo).
                </p>
              </Card>
              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <Card className="space-y-1.5">
                  <Badge variant="success">Compétence Démontrée</Badge>
                  <h3 className="font-semibold text-sm">Modélisation SQL & PostgreSQL</h3>
                  <p className="text-slate-500">Source : Cours Bases de Données Avancées</p>
                </Card>
                <Card className="space-y-1.5">
                  <Badge variant="indigo">Startup (Hypothèse)</Badge>
                  <h3 className="font-semibold text-sm">StockPulse TN</h3>
                  <p className="text-slate-500">Faisabilité heuristique : 78/100</p>
                </Card>
                <Card className="space-y-1.5">
                  <Badge variant="warning">Service Freelance</Badge>
                  <h3 className="font-semibold text-sm">Tableaux de Bord & BDD PME</h3>
                  <p className="text-slate-500">Kit de préparation & simulateur de devis inclus</p>
                </Card>
              </div>
            </div>
          )}

          {role === "student" && view === "marketplace" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Marketplace Étudiant (Aperçu)</h1>
                <Badge variant="warning">Publication désactivée en démo</Badge>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { title: "Calculatrice de Bureau Rose", price: "28 TND", img: "/images/community/pink-calculator.png" },
                  { title: "PC Portable HP 15.6\" (Core i5)", price: "950 TND", img: "/images/community/hp-laptop.png" },
                  { title: "Coffret 12 Crayons Professionnels", price: "15 TND", img: "/images/community/colored-pencils.png" },
                ].map((item) => (
                  <Card key={item.title} className="space-y-2 overflow-hidden">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.img} alt={item.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>{item.title}</span>
                      <span className="text-blue-600">{item.price}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {role === "student" && view === "chats" && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">Groupes Académiques (Lecture seule)</h1>
                <Badge variant="success">AES-256-GCM en production</Badge>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-2">
                <p><strong>Prof. Karim Trabelsi :</strong> Le support du Chapitre 1 est disponible dans Mes Cours.</p>
                <p><strong>Amira Ben Ali :</strong> Merci ! Nous préparons le prototype StockPulse pour la séance de TP.</p>
              </div>
              <p className="text-xs text-slate-500">Connectez-vous avec un compte vérifié pour envoyer des messages.</p>
            </Card>
          )}

          {role === "student" && view === "cv" && (
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-bold">Studio CV PDF (Aperçu)</h1>
                <Badge variant="primary">6 Templates • Export A4</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Amira Ben Ali — Étudiante 2ème Année DSI, ISET Béja • Projets : CampusMate Prototype, StockPulse TN.
              </p>
              <Button type="button" size="sm" disabled>
                Édition & Export PDF disponibles après connexion
              </Button>
            </Card>
          )}

          {/* TEACHER VIEWS */}
          {role === "teacher" && (
            <div className="space-y-4">
              <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="indigo">Espace Enseignant • Département TI</Badge>
                  <h1 className="text-2xl font-bold mt-1">Prof. Karim Trabelsi (Démo)</h1>
                </div>
                <Button type="button" size="sm" disabled>Dépôt bloqué (Lecture seule)</Button>
              </Card>
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="space-y-1.5">
                  <Badge variant="success">Publié & Indexé RAG</Badge>
                  <h3 className="font-semibold text-sm">Architectures Web Modernes avec React & Next.js</h3>
                  <p className="text-xs text-slate-500">Accessible aux étudiants inscrits en TI 2ème année.</p>
                </Card>
                <Card className="space-y-1.5">
                  <Badge variant="danger">Corrigé Enseignant Uniquement</Badge>
                  <h3 className="font-semibold text-sm">Corrigé Examen — Web & Sécurité</h3>
                  <p className="text-xs text-slate-500">Exclu automatiquement des requêtes RAG étudiantes.</p>
                </Card>
              </div>
            </div>
          )}

          {/* ADMINISTRATION VIEWS */}
          {role === "administration" && (
            <div className="space-y-4">
              <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="primary">Administration Universitaire • ISET Béja</Badge>
                  <h1 className="text-2xl font-bold mt-1">Scolarité & Base IA (Démo)</h1>
                </div>
                <Badge variant="warning">Lecture seule</Badge>
              </Card>
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard label="File Digitale" value="SCO-014" hint="Guichet 1 Scolarité" icon={<Ticket className="w-4 h-4" />} />
                <StatCard label="Sources RAG officielles" value={8} hint="isetb.rnu.tn validées" icon={<Bot className="w-4 h-4" />} />
                <StatCard label="Emplois du temps" value={6} hint="Sections actives" icon={<CalendarClock className="w-4 h-4" />} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
