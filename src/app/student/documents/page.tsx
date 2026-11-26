"use client";

import React, { useEffect, useState } from "react";
import { Download, FileText, Plus } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { DocumentRequest } from "@/types/domain";

export default function StudentDocumentsPage() {
  const { notify } = useApp();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [types, setTypes] = useState<Array<{ code: string; name: string }>>([]);
  const [requestTypeCode, setRequestTypeCode] = useState("ATTEST_INSCR");
  const [purpose, setPurpose] = useState("");
  const [academicYearLabel, setAcademicYearLabel] = useState("2026-2027");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests || []);
      setTypes(data.documentTypes || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestTypeCode, purpose, academicYearLabel }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur.", "error");
        return;
      }
      notify(`Demande soumise (${data.request.referenceNumber})`, "success");
      setPurpose("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" /> Administration Digitale — Mes Demandes
        </h1>
        <p className="text-sm text-slate-500">
          Soumettez vos demandes d&apos;attestations et suivez leur avancement en temps réel jusqu&apos;au téléchargement.
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Nouvelle demande de document
        </h2>
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
          <Select value={requestTypeCode} onChange={(e) => setRequestTypeCode(e.target.value)}>
            {types.map((t) => (
              <option key={t.code} value={t.code}>{t.name}</option>
            ))}
          </Select>
          <Input
            value={academicYearLabel}
            onChange={(e) => setAcademicYearLabel(e.target.value)}
            placeholder="Année universitaire (ex: 2026-2027)"
          />
          <Textarea
            className="md:col-span-2"
            rows={2}
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Motif de la demande (ex: Dossier de bourse OOUN, carte transport, convention stage)..."
          />
          <div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Envoi..." : "Soumettre la demande"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {requests.map((r) => (
          <Card key={r.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{r.requestTypeName}</p>
                <p className="text-xs text-slate-500 font-mono">
                  Réf : {r.referenceNumber} • Année {r.academicYearLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === "available_for_download" ? "success" : r.status === "rejected" ? "danger" : "warning"}>
                  {r.status}
                </Badge>
                {r.status === "available_for_download" && (
                  <a
                    href={`/api/documents?download=${r.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Télécharger le document
                  </a>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Motif : {r.purpose}</p>
            {r.adminComment && (
              <p className="text-xs rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5">
                <strong>Administration :</strong> {r.adminComment}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
