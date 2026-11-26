"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { BookOpen, Bot, Building2, Calendar, DoorOpen, FileText, MessageCircleWarning, Ticket, Users } from "lucide-react";
import { Badge, Card, PageHeader, SkeletonCard, StatCard } from "@/components/ui/primitives";
import type {
  CampusEvent,
  DocumentRequest,
  FeedbackReport,
  KnowledgeDocument,
  QueueService,
  RoomReservation,
  UserProfile,
} from "@/types/domain";

export default function AdministrationDashboardPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [queues, setQueues] = useState<QueueService[]>([]);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [reservations, setReservations] = useState<RoomReservation[]>([]);
  const [feedback, setFeedback] = useState<FeedbackReport[]>([]);
  const [kbDocs, setKbDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()),
      fetch("/api/queues").then((r) => r.json()),
      fetch("/api/community").then((r) => r.json()),
    ])
      .then(([adm, doc, q, comm]) => {
        setUsers(adm.users || []);
        setKbDocs(adm.knowledgeDocs || []);
        setRequests(doc.requests || []);
        setQueues(q.services || []);
        setEvents(comm.events || []);
        setReservations(comm.reservations || []);
        setFeedback(comm.feedback || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const studentsCount = users.filter((u) => u.role === "student" && u.isVerified).length;
  const teachersCount = users.filter((u) => u.role === "teacher").length;
  const pendingDocs = requests.filter((r) => r.status === "submitted" || r.status === "under_review").length;
  const unresolvedFeedback = feedback.filter((f) => f.status !== "resolved" && f.status !== "closed").length;

  const requestStatusData = [
    { name: "Soumis", value: requests.filter((r) => r.status === "submitted").length },
    { name: "En cours", value: requests.filter((r) => r.status === "under_review").length },
    { name: "Disponible", value: requests.filter((r) => r.status === "available_for_download" || r.status === "approved").length },
    { name: "Rejeté", value: requests.filter((r) => r.status === "rejected").length },
  ];

  const feedbackCatData = [
    { name: "Infrastructure", count: feedback.filter((f) => f.category === "facility").length },
    { name: "Suggestion", count: feedback.filter((f) => f.category === "suggestion").length },
    { name: "Académique", count: feedback.filter((f) => f.category === "academic").length },
    { name: "Admin", count: feedback.filter((f) => f.category === "administrative").length },
  ];

  const COLORS = ["#2563eb", "#6366f1", "#10b981", "#e11d48"];

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="primary"><Building2 className="w-3.5 h-3.5" /> Administration</Badge>}
        title="Administration Universitaire"
        description="Supervision des demandes administratives, files d'attente, base RAG isetb.rnu.tn et vie du campus."
        actions={
          <>
            <Link href="/administration/document-requests" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
              Traiter les demandes ({pendingDocs})
            </Link>
            <Link href="/administration/knowledge-base" className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              Base IA
            </Link>
          </>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Étudiants vérifiés" value={studentsCount} icon={<Users className="w-5 h-5" />} href="/administration/students" />
        <StatCard label="Enseignants" value={teachersCount} icon={<BookOpen className="w-5 h-5" />} href="/administration/teachers" />
        <StatCard label="Demandes en attente" value={pendingDocs} icon={<FileText className="w-5 h-5" />} href="/administration/document-requests" />
        <StatCard label="Files actives" value={queues.filter((q) => q.isOpen).length} icon={<Ticket className="w-5 h-5" />} href="/administration/queues" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Événements" value={events.length} icon={<Calendar className="w-4 h-4" />} href="/administration/events" />
        <StatCard label="Réservations salles" value={reservations.length} icon={<DoorOpen className="w-4 h-4" />} href="/administration/rooms" />
        <StatCard label="Signalements ouverts" value={unresolvedFeedback} icon={<MessageCircleWarning className="w-4 h-4" />} href="/administration/feedback" />
        <StatCard label="Documents Base IA" value={kbDocs.length} icon={<Bot className="w-4 h-4" />} href="/administration/knowledge-base" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">Statuts des demandes administratives</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={requestStatusData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {requestStatusData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">Catégories Voix Étudiante (agrégées)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedbackCatData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
