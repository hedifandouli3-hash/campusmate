"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, FileText, HelpCircle, Layers, Send, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import type { AICitation, CourseDocument, Quiz } from "@/types/domain";

type SummaryMode = "short" | "detailed" | "key_concepts" | "exam_prep" | "beginner";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale, notify } = useApp();
  const [doc, setDoc] = useState<CourseDocument | null>(null);
  const [loading, setLoading] = useState(true);

  const [summaryMode, setSummaryMode] = useState<SummaryMode>("short");
  const [summaryText, setSummaryText] = useState("");
  const [summaryDemo, setSummaryDemo] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; citations?: AICitation[]; isDemoFallback?: boolean }>
  >([]);
  const [asking, setAsking] = useState(false);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; weakTopics: string[] } | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.documents || []).find((d: CourseDocument) => d.id === id);
        setDoc(found || null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSummarize() {
    if (!doc) return;
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id, mode: summaryMode, locale }),
      });
      const data = await res.json();
      setSummaryText(data.content || data.error || "");
      setSummaryDemo(Boolean(data.isDemoFallback));
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleAskDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!doc || !question.trim()) return;
    const q = question;
    setQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", content: q }]);
    setAsking(true);
    try {
      const res = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          scope: "learning",
          courseDocumentId: doc.id,
          locale,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.error,
          citations: data.citations || [],
          isDemoFallback: data.isDemoFallback,
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  async function handleGenerateQuiz() {
    if (!doc) return;
    setGeneratingQuiz(true);
    setQuizResult(null);
    setAnswers({});
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", documentId: doc.id, locale }),
      });
      const data = await res.json();
      if (data.quiz) {
        setQuiz(data.quiz);
        notify("Quiz généré à partir du support de cours !", "success");
      }
    } finally {
      setGeneratingQuiz(false);
    }
  }

  async function handleSubmitQuiz() {
    if (!quiz) return;
    const res = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "submit", quizId: quiz.id, answers }),
    });
    const data = await res.json();
    if (data.attempt) {
      setQuizResult(data.attempt);
      notify(`Score : ${data.attempt.score}/${data.attempt.maxScore}`, "success");
    }
  }

  if (loading) return <Card>Chargement du cours...</Card>;
  if (!doc) {
    return (
      <Card className="space-y-3">
        <p className="font-semibold">Document introuvable ou non publié.</p>
        <Link href="/student/courses" className="text-sm text-blue-600 hover:underline">← Retour aux cours</Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/student/courses" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour aux cours
          </Link>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <p className="text-sm text-slate-500">
            {doc.subjectName} • {doc.uploaderName} • {doc.fileName} ({doc.pageCount} p.)
          </p>
        </div>
        <Badge variant="success">Indexé RAG</Badge>
      </div>

      {/* Document Content Preview */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Aperçu du contenu extrait</span>
        </div>
        <pre className="whitespace-pre-wrap text-xs bg-slate-50 dark:bg-slate-900 p-4 rounded-lg max-h-56 overflow-y-auto font-sans leading-relaxed">
          {doc.extractedText}
        </pre>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Summary Tool */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Résumé & Concepts IA
            </h2>
            {summaryText && (
              <Badge variant={summaryDemo ? "default" : "success"}>
                {summaryDemo ? "Synthèse Locale" : "Gemini AI"}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={summaryMode} onChange={(e) => setSummaryMode(e.target.value as SummaryMode)}>
              <option value="short">Résumé court</option>
              <option value="detailed">Résumé détaillé</option>
              <option value="key_concepts">Concepts clés & définitions</option>
              <option value="exam_prep">Préparation examen</option>
              <option value="beginner">Explication débutant</option>
            </Select>
            <Button onClick={handleSummarize} disabled={loadingSummary}>
              {loadingSummary ? "Génération..." : "Générer"}
            </Button>
          </div>
          {summaryText && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-4 text-sm whitespace-pre-line">
              {summaryText}
            </div>
          )}
        </Card>

        {/* AI Document Q&A */}
        <Card className="space-y-4 flex flex-col">
          <div className="flex items-center gap-2 font-semibold">
            <Bot className="w-4 h-4 text-blue-600" />
            <span>Assistant Q&A sur ce document</span>
          </div>
          <div className="flex-1 space-y-3 max-h-72 overflow-y-auto">
            {chatHistory.length === 0 && (
              <p className="text-xs text-slate-500">
                Posez une question sur ce support. L&apos;assistant répond uniquement depuis les extraits autorisés avec référence de page.
              </p>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white ms-8"
                    : "bg-slate-50 dark:bg-slate-900 me-6 space-y-2"
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-500">Sources citées :</p>
                    {msg.citations.map((c, idx) => (
                      <p key={idx} className="text-[11px] text-slate-500">
                        • {c.documentTitle} (Page {c.pageNumber}) — « {c.excerpt.slice(0, 90)}... »
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleAskDoc} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Posez une question sur ce cours..."
            />
            <Button type="submit" disabled={asking}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>

      {/* AI Quiz Generator & Runner */}
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-600" /> Quiz d&apos;entraînement IA
          </h2>
          <Button onClick={handleGenerateQuiz} disabled={generatingQuiz} variant="secondary">
            <Layers className="w-4 h-4" />
            <span>{generatingQuiz ? "Création du quiz..." : "Générer un quiz depuis ce cours"}</span>
          </Button>
        </div>

        {quiz && (
          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-sm">{quiz.title}</h3>
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <p className="text-sm font-medium">
                  {idx + 1}. {q.prompt} <Badge className="ms-1">{q.topic}</Badge>
                </p>
                {q.options.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer ${
                          answers[q.id] === opt
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <Input
                    placeholder="Votre réponse courte..."
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <Button onClick={handleSubmitQuiz}>Valider mes réponses</Button>

            {quizResult && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm space-y-1">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Résultat : {quizResult.score} / {quizResult.maxScore}
                </p>
                {quizResult.weakTopics.length > 0 && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sujets recommandés à réviser : {quizResult.weakTopics.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
