"use client";

import React, { useEffect, useState } from "react";
import { MessageCircleWarning } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { FeedbackReport } from "@/types/domain";

export default function AdminFeedbackPage() {
  const { notify } = useApp();
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [reply, setReply] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const d = await res.json();
      setReports(d.feedback || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function respond(id: string, status: string) {
    await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "feedback",
        action: "respond",
        id,
        status,
        message: reply[id] || "Pris en charge par l'administration.",
      }),
    });
    notify("Réponse envoyée.", "success");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageCircleWarning className="w-6 h-6 text-blue-600" /> Voix Étudiante — Traitement Administration
      </h1>
      <div className="space-y-4">
        {reports.map((fb) => (
          <Card key={fb.id} className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{fb.title}</h2>
              <div className="flex gap-2">
                {fb.isConfidential && <Badge variant="warning">Confidentiel</Badge>}
                <Badge variant="primary">{fb.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{fb.description}</p>
            <Input
              placeholder="Réponse officielle..."
              value={reply[fb.id] || ""}
              onChange={(e) => setReply((p) => ({ ...p, [fb.id]: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => respond(fb.id, "in_progress")}>En cours</Button>
              <Button size="sm" onClick={() => respond(fb.id, "resolved")}>Marquer résolu</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
