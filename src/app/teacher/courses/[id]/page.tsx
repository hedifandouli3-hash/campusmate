"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import type { Course, CourseDocument } from "@/types/domain";

export default function TeacherCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [docs, setDocs] = useState<CourseDocument[]>([]);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourse((data.courses || []).find((c: Course) => c.id === id) || null);
        setDocs((data.documents || []).filter((d: CourseDocument) => d.courseId === id));
      });
  }, [id]);

  return (
    <div className="space-y-5">
      <Link href="/teacher/courses" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux cours
      </Link>
      <h1 className="text-2xl font-bold">{course?.title || "Détail du cours"}</h1>
      <div className="space-y-3">
        {docs.map((d) => (
          <Card key={d.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{d.title}</p>
              <p className="text-xs text-slate-500">{d.fileName} • {d.pageCount} p.</p>
            </div>
            <Badge variant={d.isPublished ? "success" : "warning"}>
              {d.isPublished ? "Publié" : "Brouillon"}
            </Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
