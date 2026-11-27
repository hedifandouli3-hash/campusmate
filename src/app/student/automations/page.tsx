"use client";

import React, { useEffect, useState } from "react";
import {
  BellRing,
  CalendarClock,
  CalendarPlus,
  ExternalLink,
  Mail,
  Play,
  Plus,
  Power,
  Send,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from "@/components/ui/primitives";
import { buildEmailComposeLinks, downloadIcsReminder } from "@/lib/integrations/exports";
import { formatDate } from "@/lib/utils";
import type { AutomationTriggerType, AutomationWorkflow, EmailDraft } from "@/types/domain";

const TEMPLATES = [
  {
    title: "Briefing matinal des cours et examens",
    description: "Résumé quotidien des examens proches et devoirs prioritaires.",
    triggerType: "daily_schedule" as AutomationTriggerType,
    scheduleCronOrLabel: "Chaque matin à 08:00 (Africa/Tunis)",
    conditions: ["Examens dans les 7 jours", "Tâches actives"],
    actions: ["Générer le briefing", "Notifier l'étudiant"],
  },
  {
    title: "Synthèse nouveau cours enseignant",
    description: "Créer une fiche de révision dès qu'un support est publié.",
    triggerType: "new_course_published" as AutomationTriggerType,
    scheduleCronOrLabel: "À chaque publication de cours",
    conditions: ["Nouveau document de cours"],
    actions: ["Résumer via RAG", "Ajouter au Study Planner"],
  },
  {
    title: "Veille stages et PFE ISET Béja",
    description: "Vérifier les nouvelles offres correspondant aux compétences.",
    triggerType: "weekly_schedule" as AutomationTriggerType,
    scheduleCronOrLabel: "Chaque lundi à 09:00 (Africa/Tunis)",
    conditions: ["Offres PFE ou Stage"],
    actions: ["Scorer l'adéquation", "Envoyer alerte interne"],
  },
  {
    title: "Rappel échéance demande administrative",
    description: "Suivre les demandes en cours et préparer une relance.",
    triggerType: "deadline_approaching" as AutomationTriggerType,
    scheduleCronOrLabel: "Si statut inchangé > 5 jours",
    conditions: ["Statut en attente"],
    actions: ["Préparer brouillon email", "Notifier"],
  },
  {
    title: "Bilan hebdomadaire projet & Kanban",
    description: "Compiler l'avancement des tâches et tâches bloquées.",
    triggerType: "weekly_schedule" as AutomationTriggerType,
    scheduleCronOrLabel: "Chaque vendredi à 17:00 (Africa/Tunis)",
    conditions: ["Projets actifs"],
    actions: ["Calculer progression", "Créer rapport hebdo"],
  },
  {
    title: "Préparation soutenance & Pitch",
    description: "Générer une checklist 48h avant une présentation.",
    triggerType: "deadline_approaching" as AutomationTriggerType,
    scheduleCronOrLabel: "48h avant soutenance",
    conditions: ["Échéance projet proche"],
    actions: ["Vérifier slides", "Notifier"],
  },
  {
    title: "Alerte offres de stage compatibles",
    description: "Détecter les nouvelles offres de stage publiées sur CampusMate.",
    triggerType: "new_internship" as AutomationTriggerType,
    scheduleCronOrLabel: "Dès qu'une offre correspond au profil",
    conditions: ["Profil étudiant TI"],
    actions: ["Scorer l'adéquation", "Notifier"],
  },
];

export default function StudentAutomationsPage() {
  const { notify } = useApp();
  const [automations, setAutomations] = useState<AutomationWorkflow[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<EmailDraft[]>([]);
  const [integrations, setIntegrations] = useState({ resendConfigured: false, cronConfigured: false });
  const [title, setTitle] = useState("");
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>("daily_schedule");
  const [scheduleLabel, setScheduleLabel] = useState("Chaque jour à 08:00 (Africa/Tunis)");
  const [actionText, setActionText] = useState("Générer un briefing et notifier");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function load() {
    const res = await fetch("/api/automations");
    if (res.ok) {
      const data = await res.json();
      setAutomations(data.automations || []);
      setEmailDrafts(data.emailDrafts || []);
      if (data.integrations) setIntegrations(data.integrations);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleCreateAutomation(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        title: title.trim(),
        description: `Workflow personnalisé (${triggerType})`,
        triggerType,
        scheduleCronOrLabel: scheduleLabel,
        conditions: ["Contexte étudiant actif"],
        actions: [actionText],
      }),
    });
    if (res.ok) {
      setTitle("");
      notify("Automatisation créée", "success");
      await load();
    }
  }

  async function handleUseTemplate(tpl: (typeof TEMPLATES)[number]) {
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...tpl }),
    });
    if (res.ok) {
      notify(`Modèle "${tpl.title}" ajouté`, "success");
      await load();
    }
  }

  async function handleRunNow(id: string) {
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run_now", id }),
    });
    if (res.ok) {
      const data = await res.json();
      notify(data.summary || "Automatisation exécutée", "success");
      await load();
    }
  }

  async function handleToggle(id: string) {
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_active", id }),
    });
    if (res.ok) await load();
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    if (res.ok) {
      notify("Automatisation supprimée", "info");
      await load();
    }
  }

  async function handleCreateDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim()) return;
    const res = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "email_draft",
        action: "create",
        recipient: recipient.trim(),
        subject: subject.trim(),
        body: body.trim() || "Bonjour,\n\nVeuillez trouver ci-joint ma demande.\n\nCordialement.",
      }),
    });
    if (res.ok) {
      setRecipient("");
      setSubject("");
      setBody("");
      notify("Brouillon d'email enregistré (local)", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre d'Automatisation"
        description="Workflows Déclencheur → Conditions → Actions → Résultat, briefing quotidien et brouillons d'emails sécurisés (Africa/Tunis)."
        badge="Automations"
      />

      {/* Visual Builder */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Workflow className="w-4 h-4 text-blue-600" />
          Constructeur visuel (Déclencheur → Conditions → Actions → Résultat)
        </div>
        <form onSubmit={(e) => void handleCreateAutomation(e)} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nom du workflow"
          />
          <Select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as AutomationTriggerType)}
          >
            <option value="daily_schedule">Quotidien (Africa/Tunis)</option>
            <option value="weekly_schedule">Hebdomadaire (Africa/Tunis)</option>
            <option value="deadline_approaching">Échéance proche</option>
            <option value="new_course_published">Nouveau cours publié</option>
            <option value="new_internship">Nouvelle offre de stage</option>
          </Select>
          <Input
            value={scheduleLabel}
            onChange={(e) => setScheduleLabel(e.target.value)}
            placeholder="Fréquence / horaire"
          />
          <div className="flex gap-2">
            <Input
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder="Action"
            />
            <Button type="submit" disabled={!title.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>

      {/* 7 Templates */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          7 modèles prêts à l&apos;emploi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TEMPLATES.map((tpl) => (
            <Card key={tpl.title} className="p-3.5 flex flex-col justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {tpl.title}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{tpl.description}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handleUseTemplate(tpl)}
              >
                Activer ce modèle
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Automations */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-blue-600" />
            Mes automatisations ({automations.length})
          </h2>
          {automations.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={<BellRing className="w-6 h-6" />}
                title="Aucune automatisation active"
                description="Créez un workflow ou activez un modèle ci-dessus."
              />
            </Card>
          ) : (
            automations.map((auto) => (
              <Card key={auto.id} className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {auto.title}
                      </span>
                      <Badge variant={auto.isActive ? "success" : "default"}>
                        {auto.isActive ? "Actif" : "En pause"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {auto.scheduleCronOrLabel} · Actions : {auto.actions.join(" → ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="sm" onClick={() => void handleRunNow(auto.id)}>
                      <Play className="w-3.5 h-3.5 me-1" /> Exécuter maintenant
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        downloadIcsReminder({
                          title: auto.title,
                          description: `${auto.description} (${auto.scheduleCronOrLabel})`,
                        })
                      }
                      title="Exporter vers Google Calendar / Outlook / Apple Calendar"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 me-1" /> .ics
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void handleToggle(auto.id)}
                      aria-label="Activer ou mettre en pause"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDelete(auto.id)}
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </Button>
                  </div>
                </div>
                {auto.runs.length > 0 && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs text-slate-600 dark:text-slate-300">
                    Dernier résultat ({formatDate(auto.runs[0].executedAt)}) : {auto.runs[0].summary}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Email Drafts (local only, never fake-sent externally) */}
        <Card className="p-5 space-y-3 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-500" />
              Brouillons d&apos;emails (Validation requise)
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="success">Google Calendar (.ics)</Badge>
            <Badge variant="success">Gmail Compose</Badge>
            <Badge variant={integrations.resendConfigured ? "success" : "default"}>
              Resend {integrations.resendConfigured ? "Actif" : "Optionnel"}
            </Badge>
            <Badge variant={integrations.cronConfigured ? "success" : "default"}>
              Vercel Cron {integrations.cronConfigured ? "Actif" : "Optionnel"}
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500">
            Ouvrez vos brouillons dans Gmail/Client mail gratuitement, ou envoyez via Resend si configuré.
          </p>
          <form onSubmit={(e) => void handleCreateDraft(e)} className="space-y-2">
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Destinataire (ex: scolarite@isetb.rnu.tn)"
            />
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Contenu du message..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs"
            />
            <Button type="submit" size="sm" className="w-full" disabled={!recipient.trim() || !subject.trim()}>
              Enregistrer le brouillon
            </Button>
          </form>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {emailDrafts.map((d) => {
              const links = buildEmailComposeLinks({
                recipient: d.recipient,
                subject: d.subject,
                body: d.body,
              });
              return (
                <div key={d.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{d.subject}</span>
                    <Badge>{d.status}</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">À : {d.recipient}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <a
                      href={links.gmailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Gmail <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={links.mailtoUrl}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Client Mail
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch("/api/automations", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ entity: "email_draft", action: "send_via_resend", id: d.id }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          notify(data.error || "Erreur d'envoi", "error");
                        } else {
                          notify("Email envoyé via Resend !", "success");
                          await load();
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded bg-blue-600 text-white px-2 py-1 text-[11px] font-medium hover:bg-blue-700"
                    >
                      <Send className="w-3 h-3" /> Resend
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
