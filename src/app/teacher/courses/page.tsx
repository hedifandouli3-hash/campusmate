"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import type { Course } from "@/types/domain";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-blue-600" /> Mes Cours & Matières
      </h1>
      <div className="grid md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <Card key={c.id} className="space-y-2">
            <div className="flex justify-between">
              <Badge variant="primary">{c.subjectCode}</Badge>
              <Badge variant="success">Semestre {c.semester}</Badge>
            </div>
            <h2 className="font-semibold text-lg">{c.title}</h2>
            <p className="text-xs text-slate-500">{c.sectionName}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{c.description}</p>
            <Link href={`/teacher/courses/${c.id}`} className="inline-block text-xs font-semibold text-blue-600 hover:underline pt-1">
              Gérer les supports →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
