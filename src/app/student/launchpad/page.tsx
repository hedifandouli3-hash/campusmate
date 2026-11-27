"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Briefcase,
  Calendar,
  FolderKanban,
  Handshake,
  Lightbulb,
  Map,
  Rocket,
  Sparkles,
} from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, PageHeader, Select, StatCard } from "@/components/ui/primitives";
import type {
  CampusEvent,
  LaunchpadFreelanceIdea,
  LaunchpadMentorshipItem,
  LaunchpadOpportunityPack,
  LaunchpadPortfolio,
  LaunchpadProject,
  LaunchpadRoadmap,
  LaunchpadSkill,
  LaunchpadStartupIdea,
} from "@/types/domain";

interface AuthorizedDocSummary {
  id: string;
  title: string;
  subjectName: string;
}

export default function LaunchpadDashboardPage() {
  const { locale, notify } = useApp();
  const [skills, setSkills] = useState<LaunchpadSkill[]>([]);
  const [freelance, setFreelance] = useState<LaunchpadFreelanceIdea[]>([]);
  const [startups, setStartups] = useState<LaunchpadStartupIdea[]>([]);
  const [projects, setProjects] = useState<LaunchpadProject[]>([]);
  const [roadmaps, setRoadmaps] = useState<LaunchpadRoadmap[]>([]);
  const [portfolio, setPortfolio] = useState<LaunchpadPortfolio | null>(null);
  const [mentorships, setMentorships] = useState<LaunchpadMentorshipItem[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [docs, setDocs] = useState<AuthorizedDocSummary[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [generatingPack, setGeneratingPack] = useState(false);
  const [latestPack, setLatestPack] = useState<LaunchpadOpportunityPack | null>(null);

  async function load() {
    const res = await fetch("/api/launchpad");
    if (!res.ok) return;
    const data = await res.json();
    setSkills(data.skills || []);
    setFreelance(data.freelanceIdeas || []);
    setStartups(data.startupIdeas || []);
    setProjects(data.projects || []);
    setRoadmaps(data.roadmaps || []);
    setPortfolio(data.portfolio || null);
    setMentorships(data.mentorships || []);
    setEvents(data.events || []);
    setDocs(data.authorizedDocs || []);
    if (data.authorizedDocs?.[0]?.id) setSelectedDocId(data.authorizedDocs[0].id);
    if (data.opportunityPacks?.[0]) setLatestPack(data.opportunityPacks[0]);
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleCourseToOpportunities() {
    if (!selectedDocId) return;
    setGeneratingPack(true);
    try {
      const res = await fetch("/api/ai/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "course_to_opportunities",
          courseDocumentId: selectedDocId,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.pack) {
        setLatestPack(data.pack);
        notify("Opportunités générées à partir du cours !", "success");
      } else {
        notify(data.error || "Erreur de génération.", "error");
      }
    } finally {
      setGeneratingPack(false);
    }
  }

  const confirmedSkills = skills.filter((s) => s.status === "self_confirmed" || s.status === "demonstrated");
  const savedStartups = startups.filter((s) => s.saved);
  const savedFreelance = freelance.filter((f) => f.saved);

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="primary">CampusMate Launchpad • Module 15</Badge>}
        title="Transformez vos connaissances en opportunités."
        description="Utilisez ce que vous avez appris à l'université, vos stages et vos projets pratiques pour démarrer en freelance, lancer votre startup et rayonner sur vos réseaux."
      />

      <LaunchpadNav />

      {/* Visual Journey: Learn -> Apply -> Build -> Launch */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { step: "1. Apprendre", desc: "Cours autorisés & quiz", href: "/student/courses", icon: <Sparkles className="w-4 h-4 text-blue-600" /> },
            { step: "2. Appliquer", desc: "Compétences & projets pratiques", href: "/student/launchpad/skills", icon: <FolderKanban className="w-4 h-4 text-indigo-600" /> },
            { step: "3. Construire", desc: "Canvas, roadmap & équipe", href: "/student/launchpad/business-canvas", icon: <Map className="w-4 h-4 text-emerald-600" /> },
            { step: "4. Lancer", desc: "Portfolio, CV & pitch jury", href: "/student/launchpad/portfolio", icon: <Rocket className="w-4 h-4 text-amber-600" /> },
          ].map((s) => (
            <Link
              key={s.step}
              href={s.href}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-blue-400 transition flex items-start gap-2.5"
            >
              <div className="mt-0.5">{s.icon}</div>
              <div>
                <p className="text-xs font-bold">{s.step}</p>
                <p className="text-[11px] text-slate-500">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Primary Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/student/launchpad/skills" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] p-4 hover:border-blue-500 transition flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Analyser mes compétences</p>
            <p className="text-xs text-slate-500">Extraction depuis vos cours</p>
          </div>
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
        </Link>
        <Link href="/student/launchpad/freelance" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] p-4 hover:border-blue-500 transition flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Explorer le freelance</p>
            <p className="text-xs text-slate-500">Services & kits de préparation</p>
          </div>
          <Briefcase className="w-5 h-5 text-indigo-600 shrink-0" />
        </Link>
        <Link href="/student/launchpad/startups" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] p-4 hover:border-blue-500 transition flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Générer des idées startup</p>
            <p className="text-xs text-slate-500">Hypothèses & faisabilité</p>
          </div>
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" />
        </Link>
        <Link href="/student/launchpad/projects" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] p-4 hover:border-blue-500 transition flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Démarrer un projet pratique</p>
            <p className="text-xs text-slate-500">Labo, tâches & portfolio</p>
          </div>
          <FolderKanban className="w-5 h-5 text-emerald-600 shrink-0" />
        </Link>
      </div>

      {/* Real Data KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Compétences identifiées" value={skills.length} hint={`${confirmedSkills.length} confirmées / démontrées`} icon={<Sparkles className="w-4 h-4" />} />
        <StatCard label="Idées sauvegardées" value={savedStartups.length + savedFreelance.length} hint={`${savedStartups.length} startup • ${savedFreelance.length} freelance`} icon={<Lightbulb className="w-4 h-4" />} />
        <StatCard label="Projets actifs" value={projects.length} hint={`${roadmaps.length} roadmaps enregistrées`} icon={<FolderKanban className="w-4 h-4" />} />
        <StatCard label="Éléments Portfolio" value={portfolio?.items.length || 0} hint={portfolio?.isPublicShared ? "Partage activé" : "Privé par défaut"} icon={<Award className="w-4 h-4" />} />
      </div>

      {/* Knowledge-to-Opportunity Quick Engine */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Badge variant="indigo">Moteur Connaissances → Opportunités</Badge>
            <h2 className="text-lg font-semibold mt-1">Transformer un cours en opportunités</h2>
            <p className="text-xs text-slate-500">
              Sélectionnez un support de cours autorisé pour générer projets pratiques, services freelance, idées startup et feuille de route.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)} className="flex-1">
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                [{d.subjectName}] {d.title}
              </option>
            ))}
          </Select>
          <Button type="button" onClick={handleCourseToOpportunities} disabled={generatingPack || !selectedDocId}>
            <Rocket className="w-4 h-4 me-1.5" />
            {generatingPack ? "Analyse en cours..." : "Transformer ce cours en opportunités"}
          </Button>
        </div>

        {latestPack && (
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{latestPack.courseTitle}</p>
              <Badge variant={latestPack.isDemoFallback ? "warning" : "success"}>
                {latestPack.isDemoFallback ? "Synthèse locale structurée" : "IA Gemini"}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">{latestPack.reasoningSummary}</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Projets Pratiques</p>
                {latestPack.practicalProjects.map((p) => (
                  <div key={p.title} className="text-xs space-y-0.5 border-b last:border-0 border-slate-100 dark:border-slate-800 pb-2">
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-slate-500">{p.connectionToCourse}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Services Freelance</p>
                {latestPack.freelanceIdeas.map((f) => (
                  <div key={f.title} className="text-xs space-y-0.5 border-b last:border-0 border-slate-100 dark:border-slate-800 pb-2">
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-slate-500">{f.connectionToCourse}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Idées Startup (Hypothèses)</p>
                {latestPack.startupIdeas.map((s) => (
                  <div key={s.title} className="text-xs space-y-0.5 border-b last:border-0 border-slate-100 dark:border-slate-800 pb-2">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-slate-500">{s.connectionToCourse}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Mentorship & University Events */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Handshake className="w-4 h-4 text-blue-600" /> Mentorat & Défis Campus
            </h2>
            <Link href="/student/launchpad/mentorship" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
              Tout voir <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {mentorships.slice(0, 3).map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">{m.title}</p>
                {m.isDemoSample && <Badge variant="warning">Exemple</Badge>}
              </div>
              <p className="text-[11px] text-slate-500">{m.authorName} • {m.relatedDiscipline}</p>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Événements & Entrepreneuriat
            </h2>
            <Link href="/student/events" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1">
              Calendrier <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {events.slice(0, 3).map((ev) => (
            <div key={ev.id} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 space-y-1">
              <p className="text-xs font-semibold">{ev.title}</p>
              <p className="text-[11px] text-slate-500">{ev.location} • {ev.eventDate.slice(0, 10)}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
