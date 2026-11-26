"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bot, FileCheck2, RotateCcw, Send } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui/primitives";
import type { AICitation, AISuggestedAction } from "@/types/domain";

const SUGGESTED_PROMPTS = [
  "Comment obtenir une attestation d'inscription ?",
  "Quels sont les parcours du département Technologies de l'Informatique à l'ISET Béja ?",
  "Qui est la directrice de l'ISET Béja et comment contacter l'administration ?",
  "Quelle est la politique officielle de réclamation à l'ISET Béja ?",
  "Quand ont lieu les examens du semestre 1 ?",
];

interface ChatItem {
  role: "user" | "assistant";
  content: string;
  citations?: AICitation[];
  suggestedActions?: AISuggestedAction[];
  isDemoFallback?: boolean;
}

const INITIAL_MESSAGE: ChatItem = {
  role: "assistant",
  content:
    "Bonjour ! Je suis l'Assistant Universitaire CampusMate. Posez-moi vos questions sur l'ISET Béja (départements, contacts, réclamations, attestations, examens) en français, anglais ou arabe.",
};

export default function UniversityAssistantPage() {
  const { locale } = useApp();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([INITIAL_MESSAGE]);

  async function sendQuestion(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          scope: "university_assistant",
          locale,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.error,
          citations: data.citations || [],
          suggestedActions: data.suggestedActions || [],
          isDemoFallback: data.isDemoFallback,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        badge={<Badge variant="indigo">RAG Sourcé • isetb.rnu.tn</Badge>}
        title="Assistant Universitaire IA"
        description="Réponses basées exclusivement sur les documents officiels/spécimens de votre université (FR / EN / AR)."
        actions={
          <Button variant="outline" size="sm" onClick={() => setMessages([INITIAL_MESSAGE])}>
            <RotateCcw className="w-3.5 h-3.5" /> Nouvelle conversation
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={loading}
            onClick={() => sendQuestion(prompt)}
            className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <Card className="space-y-4 min-h-[440px] flex flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[520px] pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-4 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white ms-8 sm:ms-16 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-900 me-4 sm:me-10 space-y-3 border border-slate-200/70 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold flex items-center gap-1.5 opacity-85">
                  {m.role === "assistant" && <Bot className="w-3.5 h-3.5 text-blue-600" />}
                  {m.role === "user" ? "Vous" : "CampusMate Assistant"}
                </span>
                {m.role === "assistant" && m.isDemoFallback !== undefined && (
                  <Badge variant={m.isDemoFallback ? "default" : "success"}>
                    {m.isDemoFallback ? "Assistant Local" : "Gemini RAG"}
                  </Badge>
                )}
              </div>
              <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

              {m.citations && m.citations.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 space-y-1">
                  <p className="text-xs font-semibold flex items-center gap-1 text-slate-500">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Sources consultées :
                  </p>
                  {m.citations.map((c, i) => (
                    <p key={i} className="text-xs text-slate-500">
                      • {c.documentTitle} (Page {c.pageNumber})
                    </p>
                  ))}
                </div>
              )}

              {m.suggestedActions && m.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {m.suggestedActions.map((act) => (
                    <Link
                      key={act.href}
                      href={act.href}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                    >
                      {act.label} →
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-4 text-xs text-slate-500 animate-pulse me-10">
              Recherche dans les sources autorisées et génération de la réponse...
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(input);
          }}
          className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question administrative (FR, EN, العربية / Darija)..."
          />
          <Button type="submit" disabled={loading}>
            <Send className="w-4 h-4" />
            <span>{loading ? "..." : "Envoyer"}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
