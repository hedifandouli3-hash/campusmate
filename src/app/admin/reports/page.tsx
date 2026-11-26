"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";
import type { ContentReport } from "@/types/domain";

export default function AdminReportsPage() {
  const { notify } = useApp();
  const [reports, setReports] = useState<ContentReport[]>([]);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setReports(d.reports || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function resolve(reportId: string, status: "action_taken" | "dismissed") {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_report", reportId, status }),
    });
    notify("Signalement traité.", "success");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-rose-600" /> Signalements & Modération Globale
      </h1>
      {reports.length === 0 ? (
        <EmptyState title="Aucun signalement" description="Aucun contenu signalé actuellement." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-semibold text-sm">{r.targetType} — {r.reason}</p>
                <p className="text-xs text-slate-500">Signalé par {r.reporterName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{r.status}</Badge>
                <Button size="sm" onClick={() => resolve(r.id, "action_taken")}>Modérer</Button>
                <Button size="sm" variant="outline" onClick={() => resolve(r.id, "dismissed")}>Ignorer</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
