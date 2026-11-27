import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { addNotification, ensureStoreHydrated, persistStore, requireUser } from "@/lib/data/store";
import { buildInitialDemoState, type CampusMateStoreState } from "@/lib/demo/seed";
import { sanitizeText } from "@/lib/utils";
import type { AutomationWorkflow, EmailDraft } from "@/types/domain";

function ensureAutomationArrays(store: CampusMateStoreState) {
  const defaults = buildInitialDemoState();
  store.automations ??= defaults.automations ?? [];
  store.emailDrafts ??= [];
}

export async function GET() {
  try {
    const user = await requireUser(["student"]);
    const store = await ensureStoreHydrated();
    ensureAutomationArrays(store);
    const automations = store.automations!.filter((a) => a.ownerId === user.id);
    const emailDrafts = store.emailDrafts!.filter((e) => e.ownerId === user.id);
    return NextResponse.json({
      automations,
      emailDrafts,
      integrations: {
        resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
        cronConfigured: Boolean(process.env.CRON_SECRET?.trim()),
      },
    });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const store = await ensureStoreHydrated();
    ensureAutomationArrays(store);
    const now = new Date().toISOString();
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";

    if (body.entity === "email_draft") {
      if (body.action === "create") {
        const recipient = sanitizeText(String(body.recipient || ""), 120);
        const subject = sanitizeText(String(body.subject || ""), 160);
        const content = sanitizeText(String(body.body || ""), 2000);
        if (!recipient || !subject || !content) {
          return NextResponse.json({ error: "Destinataire, objet et message requis." }, { status: 400 });
        }
        const draft: EmailDraft = {
          id: `eml-${crypto.randomUUID()}`,
          institutionId: instId,
          ownerId: user.id,
          recipient,
          subject,
          body: content,
          scheduledAt: body.scheduledAt ? String(body.scheduledAt) : undefined,
          status: body.scheduledAt ? "approved_local_pending_provider" : "draft",
          createdAt: now,
        };
        store.emailDrafts!.unshift(draft);
        await persistStore(store);
        return NextResponse.json({ draft }, { status: 201 });
      }
      if (body.action === "cancel") {
        const draft = store.emailDrafts!.find((d) => d.id === body.id && d.ownerId === user.id);
        if (!draft) return NextResponse.json({ error: "Brouillon introuvable." }, { status: 404 });
        draft.status = "cancelled";
        await persistStore(store);
        return NextResponse.json({ draft });
      }
      if (body.action === "send_via_resend") {
        const draft = store.emailDrafts!.find((d) => d.id === body.id && d.ownerId === user.id);
        if (!draft) return NextResponse.json({ error: "Brouillon introuvable." }, { status: 404 });
        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) {
          return NextResponse.json(
            {
              error:
                "RESEND_API_KEY non configurée sur le serveur. Utilisez « Ouvrir dans Gmail » ou ajoutez RESEND_API_KEY dans Vercel (3 000 emails/mois gratuits).",
            },
            { status: 503 }
          );
        }
        const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "CampusMate <onboarding@resend.dev>";
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [draft.recipient],
            subject: draft.subject,
            text: draft.body,
          }),
        });
        if (!resendRes.ok) {
          const errText = await resendRes.text();
          return NextResponse.json({ error: `Resend API error: ${errText}` }, { status: 502 });
        }
        draft.status = "approved_local_pending_provider";
        await persistStore(store);
        return NextResponse.json({ draft, sent: true });
      }
    }

    if (body.action === "create") {
      const title = sanitizeText(String(body.title || ""), 120);
      if (!title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
      const workflow: AutomationWorkflow = {
        id: `auto-${crypto.randomUUID()}`,
        institutionId: instId,
        ownerId: user.id,
        title,
        description: sanitizeText(String(body.description || ""), 300),
        triggerType: ([
          "weekly_schedule",
          "daily_schedule",
          "deadline_approaching",
          "new_course_published",
          "unread_messages",
          "new_internship",
        ].includes(body.triggerType)
          ? body.triggerType
          : "weekly_schedule") as AutomationWorkflow["triggerType"],
        scheduleCronOrLabel: sanitizeText(String(body.scheduleCronOrLabel || "Chaque lundi à 08:00 (Africa/Tunis)"), 80),
        timezone: "Africa/Tunis",
        conditions: Array.isArray(body.conditions) ? body.conditions.map((c: unknown) => sanitizeText(String(c), 80)) : ["Utilisateur autorisé"],
        actions: Array.isArray(body.actions) ? body.actions.map((a: unknown) => sanitizeText(String(a), 80)) : ["Créer notification interne"],
        isActive: true,
        runs: [],
        createdAt: now,
        updatedAt: now,
      };
      store.automations!.unshift(workflow);
      await persistStore(store);
      return NextResponse.json({ automation: workflow }, { status: 201 });
    }

    const automation = store.automations!.find((a) => a.id === body.id && a.ownerId === user.id);
    if (!automation) return NextResponse.json({ error: "Automatisation introuvable." }, { status: 404 });

    if (body.action === "toggle_active") {
      automation.isActive = !automation.isActive;
      automation.updatedAt = now;
      await persistStore(store);
      return NextResponse.json({ automation });
    }

    if (body.action === "run_now") {
      const openTasks = store.personalTasks.filter((t) => t.studentId === user.id && !t.isCompleted).length;
      const upcomingExams = store.exams.filter((e) => e.institutionId === instId).length;
      const unreadNotifs = store.notifications.filter((n) => n.userId === user.id && !n.isRead).length;
      const summary = `Briefing exécuté (${automation.timezone}) : ${openTasks} tâche(s) ouverte(s), ${upcomingExams} examen(s) à venir, ${unreadNotifs} notification(s) non lue(s).`;

      automation.lastRunAt = now;
      automation.runs.unshift({
        id: `arun-${crypto.randomUUID()}`,
        automationId: automation.id,
        status: "completed",
        summary,
        executedAt: now,
      });
      automation.updatedAt = now;

      addNotification({
        institutionId: instId,
        userId: user.id,
        category: "automation",
        title: `Automatisation : ${automation.title}`,
        body: summary,
        actionUrl: "/student/automations",
      });

      await persistStore(store);
      return NextResponse.json({ automation, summary });
    }

    if (body.action === "delete") {
      const idx = store.automations!.findIndex((a) => a.id === body.id && a.ownerId === user.id);
      store.automations!.splice(idx, 1);
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
