import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runCampusMateAgent } from "@/lib/agent/orchestrator";
import { ensureStoreHydrated, persistStore, requireUser } from "@/lib/data/store";
import { buildInitialDemoState, type CampusMateStoreState } from "@/lib/demo/seed";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";

function ensureAgentArrays(store: CampusMateStoreState) {
  const defaults = buildInitialDemoState();
  store.agentConversations ??= [];
  store.agentRuns ??= [];
  store.agentApprovals ??= [];
  store.agentPreferences ??= defaults.agentPreferences ?? [];
  store.creationArtifacts ??= defaults.creationArtifacts ?? [];
}

export async function GET() {
  try {
    const user = await requireUser(["student"]);
    const store = await ensureStoreHydrated();
    ensureAgentArrays(store);

    const conversations = store.agentConversations!.filter((c) => c.studentId === user.id);
    const runs = store.agentRuns!.filter((r) => r.studentId === user.id);
    const approvals = store.agentApprovals!.filter((a) => a.studentId === user.id);
    const artifacts = store.creationArtifacts!.filter((a) => a.ownerId === user.id);
    const preferences = store.agentPreferences!.find((p) => p.studentId === user.id) || {
      studentId: user.id,
      enablePersonalization: true,
      preferredLanguage: user.preferredLanguage,
      timezone: "Africa/Tunis",
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ conversations, runs, approvals, artifacts, preferences });
  } catch {
    return NextResponse.json({ error: "Accès étudiant requis." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    if (!checkRateLimit(`agent:${user.id}`, 25, 60_000).allowed) {
      return NextResponse.json({ error: "Limite de requêtes atteinte." }, { status: 429 });
    }
    const body = await request.json();
    const store = await ensureStoreHydrated();
    ensureAgentArrays(store);
    const now = new Date().toISOString();
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";

    if (body.action === "update_preferences") {
      let pref = store.agentPreferences!.find((p) => p.studentId === user.id);
      if (!pref) {
        pref = {
          studentId: user.id,
          enablePersonalization: true,
          preferredLanguage: user.preferredLanguage,
          timezone: "Africa/Tunis",
          updatedAt: now,
        };
        store.agentPreferences!.push(pref);
      }
      if (typeof body.enablePersonalization === "boolean") pref.enablePersonalization = body.enablePersonalization;
      if (typeof body.customContextNote === "string") pref.customContextNote = sanitizeText(body.customContextNote, 400);
      if (typeof body.timezone === "string") pref.timezone = sanitizeText(body.timezone, 60);
      pref.updatedAt = now;
      await persistStore(store);
      return NextResponse.json({ preferences: pref });
    }

    if (body.action === "clear_history") {
      store.agentConversations = store.agentConversations!.filter((c) => c.studentId !== user.id);
      store.agentRuns = store.agentRuns!.filter((r) => r.studentId !== user.id);
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "resolve_approval") {
      const approval = store.agentApprovals!.find((a) => a.id === body.approvalId && a.studentId === user.id);
      if (!approval) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
      approval.status = body.decision === "approved" ? "approved" : "rejected";
      approval.resolvedAt = now;
      const run = store.agentRuns!.find((r) => r.id === approval.runId && r.studentId === user.id);
      if (run) {
        run.status = approval.status === "approved" ? "completed" : "cancelled";
        run.completedAt = now;
        for (const ex of run.toolExecutions) {
          if (ex.status === "waiting_approval") {
            ex.status = approval.status === "approved" ? "completed" : "rejected";
            ex.summary =
              approval.status === "approved"
                ? "Approuvé par l'étudiant (aucun connecteur OAuth externe actif : enregistré localement)."
                : "Refusé par l'étudiant.";
          }
        }
      }
      await persistStore(store);
      return NextResponse.json({ approval, run });
    }

    const goal = sanitizeText(String(body.goal || ""), 800);
    if (!goal) return NextResponse.json({ error: "Veuillez saisir une demande." }, { status: 400 });

    let conv = body.conversationId
      ? store.agentConversations!.find((c) => c.id === body.conversationId && c.studentId === user.id)
      : undefined;

    if (!conv) {
      conv = {
        id: `aconv-${crypto.randomUUID()}`,
        studentId: user.id,
        institutionId: instId,
        title: goal.slice(0, 60),
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      store.agentConversations!.unshift(conv);
    }

    conv.messages.push({
      id: `amsg-${crypto.randomUUID()}`,
      role: "user",
      content: goal,
      createdAt: now,
    });

    const result = await runCampusMateAgent({
      user,
      store,
      conversationId: conv.id,
      goal,
      locale: body.locale === "en" || body.locale === "ar" ? body.locale : "fr",
    });

    store.agentRuns!.unshift(result.run);
    conv.messages.push({
      id: `amsg-${crypto.randomUUID()}`,
      role: "assistant",
      content: result.run.finalAnswer,
      runId: result.run.id,
      createdAt: new Date().toISOString(),
    });
    conv.updatedAt = new Date().toISOString();

    await persistStore(store);
    return NextResponse.json({
      conversation: conv,
      run: result.run,
      createdArtifacts: result.createdArtifacts,
      createdApprovals: result.createdApprovals,
    });
  } catch {
    return NextResponse.json({ error: "Erreur d'exécution de l'agent." }, { status: 500 });
  }
}
