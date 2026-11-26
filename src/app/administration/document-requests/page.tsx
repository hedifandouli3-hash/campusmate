"use client";

import React, { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { DocumentRequest } from "@/types/domain";

export default function AdminDocumentRequestsPage() {
  const { notify } = useApp();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function updateStatus(requestId: string, status: string) {
    const res = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        status,
        adminComment: comments[requestId] || undefined,
      }),
    });
    if (res.ok) {
      notify(`Demande mise à jour (${status}). Étudiant notifié.`, "success");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" /> Traitement des Demandes Administratives
        </h1>
        <p className="text-sm text-slate-500">
          L&apos;approbation en mode démonstration génère un spécimen clairement marqué « Non Officiel » pour l&apos;étudiant.
        </p>
      </div>

      <div className="space-y-4">
        {requests.map((r) => (
          <Card key={r.id} className="space-y-3">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <div>
                <h2 className="font-semibold">{r.requestTypeName} — {r.studentName}</h2>
                <p className="text-xs text-slate-500 font-mono">{r.referenceNumber} • {r.academicYearLabel}</p>
              </div>
              <Badge variant={r.status === "available_for_download" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                {r.status}
              </Badge>
            </div>
            <p className="text-sm">Motif : {r.purpose}</p>
            <Input
              placeholder="Commentaire administratif..."
              value={comments[r.id] || ""}
              onChange={(e) => setComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "under_review")}>En cours d&apos;examen</Button>
              <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "additional_info_required")}>Complément requis</Button>
              <Button size="sm" onClick={() => updateStatus(r.id, "available_for_download")}>Approuver & Déposer Spécimen Démo</Button>
              <Button size="sm" variant="danger" onClick={() => updateStatus(r.id, "rejected")}>Rejeter</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
