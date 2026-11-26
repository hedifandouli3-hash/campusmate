"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileCheck2, FileEdit, FileText, FileUp, Megaphone, MessageSquare, Sparkles } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, SkeletonCard, StatCard } from "@/components/ui/primitives";
import type { Announcement, Course, CourseDocument } from "@/types/domain";

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [docs, setDocs] = useState<CourseDocument[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/community").then((r) => r.json()),
    ])
      .then(([crs, comm]) => {
        setCourses(crs.courses || []);
        setDocs(crs.documents || []);
        setAnnouncements(comm.announcements || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const publishedCount = docs.filter((d) => d.isPublished && !d.isTeacherOnly).length;
  const draftCount = docs.filter((d) => !d.isPublished || d.isTeacherOnly).length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Espace Pédagogique</Badge>}
        title="Espace Enseignant — Tableau de bord"
        description="Publiez vos supports PDF/DOCX/PPTX, générez des quiz IA et communiquez avec vos sections."
        actions={
          <>
            <Link href="/teacher/documents" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
              <FileUp className="w-4 h-4" /> Déposer un support
            </Link>
            <Link href="/teacher/quizzes" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Générer un quiz IA
            </Link>
          </>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cours assignés" value={courses.length} icon={<BookOpen className="w-5 h-5" />} href="/teacher/courses" />
        <StatCard label="Documents publiés" value={publishedCount} hint="Visibles aux étudiants" icon={<FileCheck2 className="w-5 h-5" />} href="/teacher/documents" />
        <StatCard label="Brouillons / Réservés" value={draftCount} hint="Exclus du RAG étudiant" icon={<FileEdit className="w-5 h-5" />} href="/teacher/documents" />
        <StatCard label="Groupes & Annonces" value={announcements.length} icon={<MessageSquare className="w-5 h-5" />} href="/teacher/chats" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-blue-600" /> Dépôts récents
            </h2>
            <Link href="/teacher/documents" className="text-xs text-blue-600 hover:underline">Gérer</Link>
          </div>
          {docs.length === 0 ? (
            <EmptyState title="Aucun document" description="Déposez votre premier support de cours." />
          ) : (
            docs.slice(0, 4).map((d) => (
              <div key={d.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{d.title}</p>
                  <p className="text-slate-500">{d.subjectName} • {d.sectionName}</p>
                </div>
                <Badge variant={d.isPublished && !d.isTeacherOnly ? "success" : "warning"}>
                  {d.isTeacherOnly ? "Réservé enseignant" : d.isPublished ? "Publié" : "Brouillon"}
                </Badge>
              </div>
            ))
          )}
        </Card>

        <Card className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Megaphone className="w-4 h-4 text-indigo-600" /> Annonces récentes
            </h2>
            <Link href="/teacher/announcements" className="text-xs text-blue-600 hover:underline">Publier</Link>
          </div>
          {announcements.slice(0, 4).map((a) => (
            <div key={a.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs">
              <p className="font-semibold">{a.title}</p>
              <p className="text-slate-500 line-clamp-2">{a.body}</p>
            </div>
          ))}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4 text-blue-600" /> Mes Cours
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/teacher/courses/${c.id}`} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 hover:border-blue-500 transition">
              <p className="font-semibold text-sm">{c.title}</p>
              <p className="text-xs text-slate-500">{c.subjectCode} • {c.sectionName}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
