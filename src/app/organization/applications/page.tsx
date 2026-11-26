"use client";

import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui/primitives";
import type { InternshipApplication } from "@/types/domain";

export default function OrganizationApplicationsPage() {
  const { notify } = useApp();
  const [apps, setApps] = useState<InternshipApplication[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/internships");
    if (res.ok) {
      const d = await res.json();
      setApps(d.applications || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function updateStatus(applicationId: string, status: string) {
    const res = await fetch("/api/internships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_application",
        applicationId,
        status,
        organizationNote: notes[applicationId] || undefined,
      }),
    });
    if (res.ok) {
      notify(`Candidature mise à jour (${status}) — étudiant notifié.`, "success");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-emerald-600" /> Candidatures Reçues
      </h1>

      {apps.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6" />}
          title="Aucune candidature reçue"
          description="Les candidatures soumises à vos propres offres apparaîtront ici."
        />
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <Card key={a.id} className="space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <h2 className="font-semibold text-lg">{a.studentName}</h2>
                  <p className="text-xs text-slate-500">{a.offerTitle} • {a.cvHeadline}</p>
                </div>
                <Badge variant="primary">{a.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {a.cvSkills.map((sk) => (
                  <Badge key={sk}>{sk}</Badge>
                ))}
              </div>
              <p className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-lg whitespace-pre-line">
                {a.motivationLetter}
              </p>
              <Input
                placeholder="Note ou proposition d'entretien pour l'étudiant..."
                value={notes[a.id] || ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "under_review")}>En étude</Button>
                <Button size="sm" variant="secondary" onClick={() => updateStatus(a.id, "interview_requested")}>Convoquer en entretien</Button>
                <Button size="sm" onClick={() => updateStatus(a.id, "accepted")}>Accepter</Button>
                <Button size="sm" variant="danger" onClick={() => updateStatus(a.id, "rejected")}>Refuser</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
