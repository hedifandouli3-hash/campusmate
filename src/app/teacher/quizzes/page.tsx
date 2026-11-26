"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Select } from "@/components/ui/primitives";
import type { CourseDocument, Quiz } from "@/types/domain";

export default function TeacherQuizzesPage() {
  const { locale, notify } = useApp();
  const [docs, setDocs] = useState<CourseDocument[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [docId, setDocId] = useState("");
  const [generating, setGenerating] = useState(false);

  async function load() {
    const [crsRes, qRes] = await Promise.all([fetch("/api/courses"), fetch("/api/ai/quiz")]);
    if (crsRes.ok) {
      const c = await crsRes.json();
      setDocs(c.documents || []);
      setDocId((prev) => prev || c.documents?.[0]?.id || "");
    }
    if (qRes.ok) {
      const q = await qRes.json();
      setQuizzes(q.quizzes || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleGenerate() {
    if (!docId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", documentId: docId, locale }),
      });
      if (res.ok) {
        notify("Quiz IA généré et publié !", "success");
        load();
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-indigo-600" /> Générateur de Quiz IA
      </h1>
      <Card className="flex flex-wrap gap-3 items-center">
        <Select className="max-w-md" value={docId} onChange={(e) => setDocId(e.target.value)}>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </Select>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Génération..." : "Générer un Quiz IA"}
        </Button>
      </Card>

      <div className="space-y-4">
        {quizzes.map((q) => (
          <Card key={q.id} className="space-y-2">
            <div className="flex justify-between">
              <h2 className="font-semibold">{q.title}</h2>
              <Badge variant="success">{q.questions.length} questions</Badge>
            </div>
            {q.questions.map((item, idx) => (
              <p key={item.id} className="text-xs text-slate-600 dark:text-slate-300">
                {idx + 1}. [{item.questionType}] {item.prompt}
              </p>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
