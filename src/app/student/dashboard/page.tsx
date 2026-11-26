"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Bot,
  Briefcase,
  Calendar,
  CalendarClock,
  Clock,
  FileText,
  Megaphone,
  MessageSquare,
  Send,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader, SkeletonCard, StatCard } from "@/components/ui/primitives";
import type {
  Announcement,
  CampusEvent,
  ChatMessage,
  CourseDocument,
  DocumentRequest,
  ExamItem,
  InternshipOffer,
  StudyPlan,
  TimetableEntry,
  UserProfile,
} from "@/types/domain";

const QUICK_AI_PROMPTS = [
  "Comment obtenir une attestation d'inscription ?",
  "Quels sont les parcours TI à l'ISET Béja ?",
  "Qui est la directrice de l'ISET Béja ?",
];

export default function StudentDashboardPage() {
  const { locale } = useApp();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [docs, setDocs] = useState<CourseDocument[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [offers, setOffers] = useState<InternshipOffer[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const [quickQ, setQuickQ] = useState("");
  const [quickAnswer, setQuickAnswer] = useState<{
    answer: string;
    suggestedActions: Array<{ label: string; href: string }>;
  } | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()),
      fetch("/api/ai/study-plan").then((r) => r.json()),
      fetch("/api/chats").then((r) => r.json()),
      fetch("/api/internships").then((r) => r.json()),
      fetch("/api/community").then((r) => r.json()),
    ])
      .then(([me, crs, docReq, planData, chatData, intData, commData]) => {
        setUser(me.user || null);
        setDocs(crs.documents || []);
        setRequests(docReq.requests || []);
        setTimetable(planData.timetable || []);
        setExams(planData.exams || []);
        setPlans(planData.plans || []);
        setMessages(chatData.messages || []);
        setOffers(intData.offers || []);
        setEvents(commData.events || []);
        setAnnouncements(commData.announcements || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function askRag(questionText: string) {
    if (!questionText.trim()) return;
    setQuickQ(questionText);
    setAsking(true);
    try {
      const res = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText, scope: "university_assistant", locale }),
      });
      const data = await res.json();
      setQuickAnswer({
        answer: data.answer || data.error || "Aucune réponse.",
        suggestedActions: data.suggestedActions || [],
      });
    } finally {
      setAsking(false);
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const allSessions = plans.flatMap((p) => p.sessions);
  const doneSessions = allSessions.filter((s) => s.isCompleted).length;
  const planProgress = allSessions.length ? Math.round((doneSessions / allSessions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <>
            <Badge variant="primary">{user?.institutionName || "ISET Béja"}</Badge>
            {user?.sectionName && <Badge variant="indigo">{user.sectionName}</Badge>}
          </>
        }
        title={`Bonjour, ${user?.fullName || "Étudiant"}`}
        description={`${user?.departmentName || "Technologies de l'Informatique"} • ${user?.academicYearLabel || "2ème Année Licence"}`}
        actions={
          <>
            <Link
              href="/student/courses"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Mes cours ({docs.length})
            </Link>
            <Link
              href="/student/ai-assistant"
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Assistant IA
            </Link>
          </>
        }
      />

      {/* Quick Stat Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Supports disponibles"
          value={docs.length}
          hint="Résumés & Quiz IA"
          icon={<BookOpen className="w-5 h-5" />}
          href="/student/courses"
        />
        <StatCard
          label="Demandes admin"
          value={requests.length}
          hint="Suivi en ligne"
          icon={<FileText className="w-5 h-5" />}
          href="/student/documents"
        />
        <StatCard
          label="Offres de stage"
          value={offers.length}
          hint="Organisations vérifiées"
          icon={<Briefcase className="w-5 h-5" />}
          href="/student/internships"
        />
        <StatCard
          label="Progression révisions"
          value={`${planProgress}%`}
          hint={`${plans.length} plan(s) actif(s)`}
          icon={<CalendarClock className="w-5 h-5" />}
          href="/student/study-planner"
        />
      </div>

      {/* 1-Tap Quick Actions Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "AI Learning Hub", href: "/student/courses", icon: <Sparkles className="w-4 h-4 text-blue-600" /> },
          { label: "Attestation", href: "/student/documents", icon: <FileText className="w-4 h-4 text-indigo-600" /> },
          { label: "File Digitale", href: "/student/queue", icon: <Ticket className="w-4 h-4 text-emerald-600" /> },
          { label: "Mon CV PDF", href: "/student/cv-builder", icon: <Award className="w-4 h-4 text-blue-600" /> },
          { label: "Groupes Chat", href: "/student/chats", icon: <MessageSquare className="w-4 h-4 text-emerald-600" /> },
        ].map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="cm-card cm-card-interactive px-3.5 py-3 flex items-center gap-2.5 text-xs font-semibold"
          >
            {q.icon}
            <span className="truncate">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick AI Assistant Widget */}
      <Card className="border-blue-200/80 dark:border-blue-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="w-5 h-5 text-blue-600" />
            <span>Assistant Universitaire Rapide (ISET Béja RAG)</span>
          </div>
          <Link href="/student/ai-assistant" className="text-xs font-medium text-blue-600 hover:underline">
            Ouvrir le chat complet →
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_AI_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => askRag(p)}
              className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            askRag(quickQ);
          }}
          className="flex gap-2"
        >
          <Input
            value={quickQ}
            onChange={(e) => setQuickQ(e.target.value)}
            placeholder="Posez une question sur l'ISET Béja, vos attestations, examens..."
          />
          <Button type="submit" disabled={asking}>
            <Send className="w-4 h-4" />
            <span>{asking ? "..." : "Demander"}</span>
          </Button>
        </form>
        {quickAnswer && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3.5 text-sm space-y-2 border border-slate-200/70 dark:border-slate-800">
            <p className="whitespace-pre-line">{quickAnswer.answer}</p>
            {quickAnswer.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickAnswer.suggestedActions.map((act) => (
                  <Link
                    key={act.href}
                    href={act.href}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    {act.label} →
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Main Grid Widgets */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" /> Emploi du temps
            </h2>
            <Link href="/student/study-planner" className="text-xs text-blue-600 hover:underline">Voir</Link>
          </div>
          {timetable.slice(0, 3).map((t) => (
            <div key={t.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs flex justify-between">
              <div>
                <p className="font-semibold">{t.subjectName}</p>
                <p className="text-slate-500">{t.roomName} • {t.sessionType}</p>
              </div>
              <span className="font-mono text-slate-600 dark:text-slate-300">{t.startTime}</span>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Examens à venir
            </h2>
            <Link href="/student/study-planner" className="text-xs text-blue-600 hover:underline">Planifier</Link>
          </div>
          {exams.slice(0, 3).map((ex) => (
            <div key={ex.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs">
              <p className="font-semibold">{ex.title}</p>
              <p className="text-slate-500">{ex.examDate} à {ex.startTime} • {ex.roomName}</p>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-blue-600" /> Cours Récents
            </h2>
            <Link href="/student/courses" className="text-xs text-blue-600 hover:underline">Tout voir</Link>
          </div>
          {docs.slice(0, 3).map((d) => (
            <Link
              key={d.id}
              href={`/student/courses/${d.id}`}
              className="block rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs hover:ring-1 hover:ring-blue-500 transition"
            >
              <p className="font-semibold truncate">{d.title}</p>
              <p className="text-slate-500">{d.subjectName} • {d.pageCount} p.</p>
            </Link>
          ))}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-blue-600" /> Demandes Administratives
            </h2>
            <Link href="/student/documents" className="text-xs text-blue-600 hover:underline">Demander</Link>
          </div>
          {requests.slice(0, 3).map((r) => (
            <div key={r.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold truncate">{r.requestTypeName}</p>
                <p className="text-slate-500 font-mono">{r.referenceNumber}</p>
              </div>
              <Badge variant={r.status === "available_for_download" ? "success" : "warning"}>{r.status}</Badge>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Messages de Groupe
            </h2>
            <Link href="/student/chats" className="text-xs text-blue-600 hover:underline">Ouvrir</Link>
          </div>
          {messages.slice(-3).map((m) => (
            <div key={m.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs">
              <p className="font-semibold">{m.senderName} {m.isPinned ? "📌" : ""}</p>
              <p className="text-slate-600 dark:text-slate-300 truncate">{m.content}</p>
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-blue-600" /> Stages & Événements
            </h2>
            <Link href="/student/internships" className="text-xs text-blue-600 hover:underline">Explorer</Link>
          </div>
          {offers.slice(0, 2).map((o) => (
            <Link key={o.id} href={`/student/internships/${o.id}`} className="block rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs hover:ring-1 hover:ring-blue-500 transition">
              <p className="font-semibold truncate">{o.title}</p>
              <p className="text-slate-500">{o.organizationName} • {o.location}</p>
            </Link>
          ))}
          {events.slice(0, 1).map((ev) => (
            <Link key={ev.id} href="/student/events" className="block rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 p-2.5 text-xs">
              <p className="font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-600" /> {ev.title}</p>
              <p className="text-slate-500">{ev.location}</p>
            </Link>
          ))}
          {announcements.slice(0, 1).map((a) => (
            <div key={a.id} className="rounded-lg bg-amber-50/60 dark:bg-amber-950/30 p-2.5 text-xs">
              <p className="font-semibold flex items-center gap-1"><Megaphone className="w-3.5 h-3.5 text-amber-600" /> {a.title}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
