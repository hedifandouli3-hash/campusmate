"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, CheckCircle2, Download, FileText, HelpCircle, Layers, Rocket, Send, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import type { AICitation, CourseDocument, LaunchpadOpportunityPack, Quiz } from "@/types/domain";

type SummaryMode = "short" | "detailed" | "key_concepts" | "exam_prep" | "beginner";

interface QuizFeedbackItem {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  topic: string;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale, notify } = useApp();
  const [doc, setDoc] = useState<CourseDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [markedRead, setMarkedRead] = useState(false);

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
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    weakTopics: string[];
    feedback?: QuizFeedbackItem[];
  } | null>(null);
  const [pastAttempts, setPastAttempts] = useState<Array<{ id: string; score: number; maxScore: number; createdAt: string }>>([]);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [opportunityPack, setOpportunityPack] = useState<LaunchpadOpportunityPack | null>(null);
  const [generatingOpportunities, setGeneratingOpportunities] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/ai/quiz").then((r) => (r.ok ? r.json() : { attempts: [] })),
    ])
      .then(([data, quizData]) => {
        const found = (data.documents || []).find((d: CourseDocument) => d.id === id);
        setDoc(found || null);
        setMarkedRead((data.readDocIds || []).includes(id));
        setPastAttempts((quizData.attempts || []).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function markAsRead() {
    if (!doc) return;
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", documentId: doc.id }),
    });
    if (res.ok) {
      setMarkedRead(true);
      notify("Progression enregistrée.", "success");
    }
  }

  async function turnCourseIntoOpportunities() {
    if (!doc) return;
    setGeneratingOpportunities(true);
    try {
      const res = await fetch("/api/ai/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "course_to_opportunities", courseDocumentId: doc.id, locale }),
      });
      const data = await res.json();
      if (res.ok && data.pack) {
        setOpportunityPack(data.pack);
        notify("Opportunités générées dans Launchpad !", "success");
      } else {
        notify(data.error || "Impossible d'analyser ce cours.", "error");
      }
    } finally {
      setGeneratingOpportunities(false);
    }
  }

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
      setQuizResult({ ...data.attempt, feedback: data.feedback || [] });
      setPastAttempts((prev) => [data.attempt, ...prev].slice(0, 5));
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
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={turnCourseIntoOpportunities} disabled={generatingOpportunities}>
            <Rocket className="w-3.5 h-3.5" /> {generatingOpportunities ? "Analyse..." : "Transformer ce cours en opportunités"}
          </Button>
          <Button type="button" size="sm" variant={markedRead ? "outline" : "primary"} onClick={markAsRead} disabled={markedRead}>
            <CheckCircle2 className="w-3.5 h-3.5" /> {markedRead ? "Document lu" : "Marquer comme lu"}
          </Button>
          <a
            href={`/api/courses?downloadDocId=${encodeURIComponent(doc.id)}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Download className="w-3.5 h-3.5" /> Télécharger
          </a>
          <Badge variant="success">Indexé RAG</Badge>
        </div>
      </div>

      {/* Document Content Preview */}
      {opportunityPack && (
        <Card className="space-y-4 border-blue-200 dark:border-blue-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Badge variant="indigo">CampusMate Launchpad</Badge>
              <h2 className="font-semibold text-base mt-1">Opportunités issues de ce cours</h2>
            </div>
            <Link href="/student/launchpad" className="text-xs font-semibold text-blue-600 hover:underline">
              Ouvrir dans Launchpad →
            </Link>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{opportunityPack.reasoningSummary}</p>
          <div className="grid md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1.5">
              <p className="font-bold text-emerald-700 dark:text-emerald-400">Projets pratiques</p>
              {opportunityPack.practicalProjects.map((p) => (
                <div key={p.title}>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-slate-500">{p.connectionToCourse}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1.5">
              <p className="font-bold text-blue-700 dark:text-blue-400">Services freelance</p>
              {opportunityPack.freelanceIdeas.map((f) => (
                <div key={f.title}>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-slate-500">{f.connectionToCourse}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-1.5">
              <p className="font-bold text-amber-700 dark:text-amber-400">Idées startup</p>
              {opportunityPack.startupIdeas.map((s) => (
                <div key={s.title}>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-slate-500">{s.connectionToCourse}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

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
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-sm space-y-3">
                <p className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Résultat : {quizResult.score} / {quizResult.maxScore}
                </p>
                {quizResult.weakTopics.length > 0 && (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Sujets recommandés à réviser : {quizResult.weakTopics.join(", ")}
                  </p>
                )}
                {quizResult.feedback && quizResult.feedback.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                    {quizResult.feedback.map((fb, idx) => (
                      <div key={fb.questionId} className="text-xs">
                        <p className={fb.isCorrect ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-rose-700 dark:text-rose-300 font-medium"}>
                          Question {idx + 1} ({fb.topic}) : {fb.isCorrect ? "Correct" : `Incorrect — Réponse attendue : ${fb.correctAnswer}`}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">{fb.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Flashcards extracted cleanly from document segments */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Cartes mémo rapides (cliquez pour retourner)
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {doc.extractedText
              .split(/(?<=[.!?])\s+/)
              .filter((s) => s.trim().length > 30)
              .slice(0, 3)
              .map((sentence, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFlippedCard(flippedCard === idx ? null : idx)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 p-3 text-start text-xs cursor-pointer hover:border-blue-500 transition"
                >
                  <p className="font-semibold text-blue-600 mb-1">
                    {flippedCard === idx ? "Extrait source" : `Carte #${idx + 1} — ${doc.subjectName}`}
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 line-clamp-3">
                    {flippedCard === idx ? sentence : `Quel point clé de « ${doc.title} » concerne : ${sentence.slice(0, 48)}... ?`}
                  </p>
                </button>
              ))}
          </div>
        </div>

        {pastAttempts.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold">Historique des tentatives : </span>
            {pastAttempts.map((a) => `${a.score}/${a.maxScore}`).join(" • ")}
          </div>
        )}
      </Card>
    </div>
  );
}
