"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { getV6Copy } from "@/lib/i18n/v6";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
} from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import type {
  AgentApprovalRequest,
  AgentConversation,
  AgentPreferences,
  AgentRun,
  CreationArtifact,
} from "@/types/domain";

const QUICK_GOALS = [
  {
    label: "Site web pour mon projet PFE",
    goal: "Crée un site vitrine professionnel pour mon projet PFE CampusTech à l'ISET Béja avec sections fonctionnalités et contact.",
  },
  {
    label: "Présentation de soutenance",
    goal: "Génère une présentation de soutenance de 5 diapositives pour mon projet d'IA universitaire.",
  },
  {
    label: "Brouillon email administratif",
    goal: "Prépare un brouillon d'email formel pour demander une attestation de stage à l'administration de l'ISET Béja.",
  },
  {
    label: "Planifier mon étude et examens",
    goal: "Analyse mes cours et propose un plan de révision structuré pour mes examens.",
  },
];

export default function StudentAgentPage() {
  const { locale, notify } = useApp();
  const copy = getV6Copy(locale).agent;
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [approvals, setApprovals] = useState<AgentApprovalRequest[]>([]);
  const [artifacts, setArtifacts] = useState<CreationArtifact[]>([]);
  const [preferences, setPreferences] = useState<AgentPreferences>({
    studentId: "",
    enablePersonalization: true,
    preferredLanguage: "fr",
    customContextNote: "",
    timezone: "Africa/Tunis",
    updatedAt: "",
  });
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [goal, setGoal] = useState("");
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/agent");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
      setRuns(data.runs || []);
      setApprovals(data.approvals || []);
      setArtifacts(data.artifacts || []);
      if (data.preferences) setPreferences(data.preferences);
      setActiveConvId((prev) => prev || data.conversations?.[0]?.id || "");
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function handleRun(e?: React.FormEvent, presetGoal?: string) {
    if (e) e.preventDefault();
    const targetGoal = (presetGoal ?? goal).trim();
    if (!targetGoal) return;
    setRunning(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: targetGoal,
          conversationId: activeConvId || undefined,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur lors de l'exécution de l'agent", "error");
        return;
      }
      setGoal("");
      if (data.conversation?.id) setActiveConvId(data.conversation.id);
      notify("Exécution de l'agent terminée", "success");
      await load();
    } finally {
      setRunning(false);
    }
  }

  async function handleResolveApproval(approvalId: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_approval", approvalId, decision }),
    });
    if (res.ok) {
      notify(
        decision === "approved"
          ? "Action approuvée et exécutée en sécurité"
          : "Action refusée et annulée",
        decision === "approved" ? "success" : "info"
      );
      await load();
    }
  }

  async function handleTogglePersonalization() {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_preferences",
        enablePersonalization: !preferences.enablePersonalization,
        customContextNote: preferences.customContextNote,
        timezone: preferences.timezone,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setPreferences(data.preferences);
      notify("Préférences de mémoire agent mises à jour", "success");
    }
  }

  async function handleClearHistory() {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_history" }),
    });
    if (res.ok) {
      setActiveConvId("");
      notify("Historique de l'agent effacé", "info");
      await load();
    }
  }

  const activeConv =
    activeConvId === "__new__"
      ? undefined
      : conversations.find((c) => c.id === activeConvId) || conversations[0];
  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        badge="V6 Agent OS"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setActiveConvId("__new__");
                setGoal("");
              }}
            >
              <Plus className="w-4 h-4 me-1.5" />
              {copy.newConversation}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTogglePersonalization}
            >
              <ShieldCheck className="w-4 h-4 me-1.5" />
              {preferences.enablePersonalization ? copy.memoryActive : copy.memoryDisabled}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearHistory}>
              <Trash2 className="w-4 h-4 me-1.5" />
              {copy.clearHistory}
            </Button>
          </div>
        }
      />

      {/* Command bar */}
      <Card className="p-5 border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
        <form onSubmit={(e) => void handleRun(e)} className="space-y-3">
          <label className="block text-sm font-semibold text-slate-900 dark:text-white">
            {copy.promptLabel}
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={copy.promptPlaceholder}
              className="flex-1"
            />
            <Button type="submit" disabled={running || !goal.trim()}>
              <Send className="w-4 h-4 me-1.5" />
              {running ? copy.runningButton : copy.runButton}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {QUICK_GOALS.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => void handleRun(undefined, q.goal)}
                disabled={running}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 transition"
              >
                <Sparkles className="w-3 h-3 text-blue-500" />
                {q.label}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {/* Pending Approvals (Category D human-in-the-loop) */}
      {pendingApprovals.length > 0 && (
        <Card className="p-4 border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
            <ShieldAlert className="w-4 h-4" />
            Approbations humaines requises ({pendingApprovals.length})
          </div>
          <div className="space-y-2">
            {pendingApprovals.map((app) => (
              <div
                key={app.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-900 p-3 border border-amber-200 dark:border-amber-800/50"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {app.toolName}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {app.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleResolveApproval(app.id, "approved")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 me-1" /> Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleResolveApproval(app.id, "rejected")}
                  >
                    <XCircle className="w-3.5 h-3.5 me-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation & Messages */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                Session de l&apos;agent
              </h2>
              {conversations.length > 1 && (
                <select
                  value={activeConv?.id || ""}
                  onChange={(e) => setActiveConvId(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1"
                >
                  {conversations.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {!activeConv || activeConv.messages.length === 0 ? (
              <EmptyState
                icon={<Bot className="w-6 h-6" />}
                title="Prêt pour votre premier objectif"
                description="Décrivez une tâche ci-dessus ou choisissez un raccourci pour que l'agent exécute des outils et crée de vrais livrables."
              />
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pe-1">
                {activeConv.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl p-3.5 text-sm ${
                      m.role === "user"
                        ? "bg-blue-600 text-white ms-8"
                        : "bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 me-8"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] opacity-75 mb-1">
                      <span>{m.role === "user" ? "Vous" : "CampusMate Agent"}</span>
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tool execution trace */}
          <Card className="p-5 space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Wrench className="w-4 h-4 text-indigo-500" />
              Journal d&apos;exécution des outils (max 4 outils/tour)
            </h3>
            {runs.length === 0 ? (
              <p className="text-xs text-slate-500">Aucune exécution enregistrée pour le moment.</p>
            ) : (
              <div className="space-y-2.5">
                {runs.slice(0, 4).map((run) => (
                  <div
                    key={run.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {run.goal}
                      </span>
                      <Badge
                        variant={
                          run.status === "completed"
                            ? "success"
                            : run.status === "waiting_approval"
                              ? "warning"
                              : "default"
                        }
                      >
                        {run.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {run.toolExecutions.map((tc) => (
                        <span
                          key={tc.id}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-300"
                        >
                          <Clock className="w-3 h-3 text-blue-500" />
                          {tc.toolName} ({tc.status})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right rail: Generated Artifacts & Quick Links */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-emerald-500" />
                Livrables récents ({artifacts.length})
              </h3>
              <Link
                href="/student/studio"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Ouvrir Studio <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            {artifacts.length === 0 ? (
              <p className="text-xs text-slate-500">Aucun livrable créé pour l&apos;instant.</p>
            ) : (
              <div className="space-y-2">
                {artifacts.slice(0, 5).map((art) => (
                  <Link
                    key={art.id}
                    href="/student/studio"
                    className="block rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 hover:border-blue-400 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                        {art.title}
                      </span>
                      <Badge>{art.type}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {art.description}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-2">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
              Sécurité & Contrôle
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc ps-4">
              <li>Aucun envoi d&apos;email externe automatique sans validation humaine.</li>
              <li>Les sites web générés s&apos;exécutent en sandbox isolée sans accès aux cookies.</li>
              <li>Aucune action destructrice ou contournement de note/présence autorisé.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
