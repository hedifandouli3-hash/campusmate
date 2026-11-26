"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  Copy,
  Edit3,
  FileCheck2,
  MessageSquarePlus,
  RefreshCw,
  Square,
  Send,
  Trash2,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, ConfirmDialog, Input, PageHeader } from "@/components/ui/primitives";
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
  failedQuestion?: string;
}

interface AssistantConversation {
  id: string;
  title: string;
  messages: ChatItem[];
  updatedAt: string;
}

const INITIAL_MESSAGE: ChatItem = {
  role: "assistant",
  content:
    "Bonjour ! Je suis l'Assistant Universitaire CampusMate. Posez-moi vos questions sur l'ISET Béja (départements, contacts, réclamations, attestations, examens) en français, anglais ou arabe.",
};

function makeNewConv(): AssistantConversation {
  return {
    id: `aiconv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: "Nouvelle discussion",
    messages: [INITIAL_MESSAGE],
    updatedAt: new Date().toISOString(),
  };
}

export default function UniversityAssistantPage() {
  const { locale, notify } = useApp();
  const [conversations, setConversations] = useState<AssistantConversation[]>(() => [makeNewConv()]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const storageKeyRef = useRef("cm_ai_assistant_convs_v2");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const key = d?.user?.id ? `cm_ai_assistant_convs_v2_${d.user.id}` : "cm_ai_assistant_convs_v2";
        storageKeyRef.current = key;
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved) as AssistantConversation[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setConversations(parsed);
              setActiveId(parsed[0].id);
              return;
            }
          }
        } catch {
          // ignore corrupted localStorage
        }
        setActiveId((prev) => prev || conversations[0]?.id || "");
      })
      .catch(() => {
        setActiveId((prev) => prev || conversations[0]?.id || "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(storageKeyRef.current, JSON.stringify(conversations.slice(0, 15)));
    } catch {
      // ignore quota errors
    }
  }, [conversations]);

  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0];
  const messages = activeConv?.messages || [INITIAL_MESSAGE];

  function createConversation() {
    const fresh = makeNewConv();
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
  }

  function commitRename(id: string) {
    if (renameDraft.trim()) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: renameDraft.trim().slice(0, 50) } : c))
      );
    }
    setRenamingId(null);
  }

  function deleteConversation(id: string) {
    setDeleteTargetId(null);
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh = makeNewConv();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) setActiveId(next[0].id);
      return next;
    });
  }

  function stopGeneration() {
    abortRef.current?.abort();
    setLoading(false);
  }

  async function sendQuestion(text: string) {
    if (!text.trim() || loading || !activeConv) return;
    const convId = activeConv.id;
    setInput("");
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              title: c.title === "Nouvelle discussion" ? text.trim().slice(0, 40) : c.title,
              messages: [...c.messages, { role: "user", content: text }],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: text,
          scope: "university_assistant",
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur assistant IA.");
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    role: "assistant",
                    content: data.answer || "Information non disponible dans les sources autorisées.",
                    citations: data.citations || [],
                    suggestedActions: data.suggestedActions || [],
                    isDemoFallback: data.isDemoFallback,
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        notify("Génération interrompue.", "info");
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      role: "assistant",
                      content: "Impossible de joindre le service IA pour le moment.",
                      failedQuestion: text,
                    },
                  ],
                }
              : c
          )
        );
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  async function copyMessage(content: string, idx: number) {
    await navigator.clipboard?.writeText(content).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        badge={<Badge variant="indigo">RAG Sourcé • isetb.rnu.tn</Badge>}
        title="Assistant Universitaire IA"
        description="Réponses sourcées sur la base officielle ISET Béja et les procédures validées (FR / EN / AR)."
        actions={
          <Button variant="outline" size="sm" onClick={createConversation}>
            <MessageSquarePlus className="w-3.5 h-3.5" /> Nouvelle conversation
          </Button>
        }
      />

      <div className="grid lg:grid-cols-4 gap-5 items-start">
        {/* Conversation History Sidebar */}
        <Card className="p-3 space-y-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">
            Historique ({conversations.length})
          </p>
          <div className="space-y-1 max-h-[380px] overflow-y-auto">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`rounded-lg px-2.5 py-2 text-xs flex items-center justify-between gap-1 ${
                  c.id === activeConv?.id
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200 font-semibold"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                {renamingId === c.id ? (
                  <Input
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onBlur={() => commitRename(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(c.id);
                    }}
                    className="h-7 text-xs py-0"
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className="flex-1 text-start truncate cursor-pointer"
                  >
                    {c.title}
                  </button>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="Renommer"
                    onClick={() => {
                      setRenamingId(c.id);
                      setRenameDraft(c.title);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer"
                    onClick={() => setDeleteTargetId(c.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Main Chat Area */}
        <div className="lg:col-span-3 space-y-4">
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

          <Card className="space-y-4 min-h-[460px] flex flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pe-1">
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
                    <div className="flex items-center gap-2">
                      {m.role === "assistant" && m.isDemoFallback !== undefined && (
                        <Badge variant={m.isDemoFallback ? "default" : "success"}>
                          {m.isDemoFallback ? "Synthèse Locale" : "Gemini RAG"}
                        </Badge>
                      )}
                      {m.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => copyMessage(m.content, idx)}
                          aria-label="Copier la réponse"
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

                  {m.failedQuestion && (
                    <Button type="button" size="sm" variant="outline" onClick={() => sendQuestion(m.failedQuestion!)}>
                      <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                    </Button>
                  )}

                  {m.citations && m.citations.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 space-y-1">
                      <p className="text-xs font-semibold flex items-center gap-1 text-slate-500">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" /> Sources vérifiées :
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
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 p-4 text-xs text-slate-500 flex items-center justify-between gap-2 me-10">
                  <span>Recherche dans les sources autorisées et génération de la réponse...</span>
                  <Button type="button" size="sm" variant="outline" onClick={stopGeneration}>
                    <Square className="w-3 h-3" /> Arrêter
                  </Button>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendQuestion(input);
              }}
              className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez une question administrative (FR, EN, العربية / Darija)..."
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                <Send className="w-4 h-4" />
                <span>{loading ? "..." : "Envoyer"}</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && deleteConversation(deleteTargetId)}
        title="Supprimer cette conversation ?"
        message="L'historique local de cette conversation sera effacé."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
