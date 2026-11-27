import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { addNotification, ensureStoreHydrated, persistStore } from "@/lib/data/store";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = req.headers.get("authorization") || "";

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(
      {
        error: secret
          ? "Unauthorized cron invocation."
          : "CRON_SECRET is not configured in environment variables.",
      },
      { status: 401 }
    );
  }

  const store = await ensureStoreHydrated();
  store.automations ??= [];

  const now = new Date().toISOString();
  let executedCount = 0;

  for (const auto of store.automations) {
    if (!auto.isActive) continue;
    const summary = `Exécution planifiée (${auto.timezone || "Africa/Tunis"}) : ${auto.actions.join(" → ")}`;
    auto.lastRunAt = now;
    auto.updatedAt = now;
    auto.runs.unshift({
      id: `arunlog-${crypto.randomUUID()}`,
      automationId: auto.id,
      status: "completed",
      summary,
      executedAt: now,
    });
    auto.runs = auto.runs.slice(0, 15);
    addNotification({
      institutionId: auto.institutionId,
      userId: auto.ownerId,
      category: "automation",
      title: `Briefing planifié : ${auto.title}`,
      body: summary,
      actionUrl: "/student/automations",
    });
    executedCount++;
  }

  await persistStore(store);
  return NextResponse.json({ ok: true, executedCount, executedAt: now });
}
