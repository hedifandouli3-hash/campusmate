"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import type { ExamItem, TimetableEntry } from "@/types/domain";

const DAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function AdminTimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);

  useEffect(() => {
    fetch("/api/ai/study-plan")
      .then((r) => r.json())
      .then((d) => {
        setTimetable(d.timetable || []);
        setExams(d.exams || []);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Clock className="w-6 h-6 text-blue-600" /> Emploi du Temps & Examens (Institution)
      </h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">Séances configurées</h2>
          {timetable.map((t) => (
            <div key={t.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs flex justify-between">
              <div>
                <p className="font-semibold">{DAYS[t.dayOfWeek]} — {t.subjectName}</p>
                <p className="text-slate-500">{t.teacherName} • {t.roomName} ({t.sessionType})</p>
              </div>
              <span className="font-mono">{t.startTime} - {t.endTime}</span>
            </div>
          ))}
        </Card>
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">Calendrier des examens</h2>
          {exams.map((ex) => (
            <div key={ex.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs flex justify-between">
              <div>
                <p className="font-semibold">{ex.title}</p>
                <p className="text-slate-500">{ex.roomName}</p>
              </div>
              <span className="font-mono">{ex.examDate} {ex.startTime}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
