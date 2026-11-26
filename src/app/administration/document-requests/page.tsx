"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  SearchField,
  Select,
  StatusBadge,
} from "@/components/ui/primitives";
import type { DocumentRequest } from "@/types/domain";

export default function AdminDocumentRequestsPage() {
  const { notify } = useApp();
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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
      notify("Demande mise à jour. L'étudiant a été notifié.", "success");
      await load();
    }
  }

  const uniqueTypes = useMemo(
    () => Array.from(new Set(requests.map((r) => r.requestTypeName))),
    [requests]
  );

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (statusFilter && r.status !== statusFilter) return false;
        if (typeFilter && r.requestTypeName !== typeFilter) return false;
        if (
          search &&
          !`${r.studentName} ${r.referenceNumber} ${r.requestTypeName} ${r.purpose}`
            .toLowerCase()
            .includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [requests, statusFilter, typeFilter, search]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="primary">Scolarité • {requests.length} demandes</Badge>}
        title="Traitement des Demandes Administratives"
        description="Filtrez par statut ou type, examinez le dossier et mettez à disposition les documents validés."
      />

      <Card className="grid sm:grid-cols-3 gap-3 p-4">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Rechercher par étudiant ou référence..."
          ariaLabel="Rechercher une demande"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="submitted">Soumis</option>
          <option value="under_review">En examen</option>
          <option value="additional_info_required">Infos requises</option>
          <option value="available_for_download">Disponible</option>
          <option value="rejected">Rejeté</option>
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tous types de document</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="Aucune demande correspondante"
          description="Modifiez vos filtres ou attendez les nouvelles soumissions étudiantes."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id} className="space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h2 className="font-semibold">{r.requestTypeName} — {r.studentName}</h2>
                  <p className="text-xs text-slate-500 font-mono">{r.referenceNumber} • {r.academicYearLabel}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">Motif : {r.purpose}</p>
              <Input
                placeholder="Commentaire administratif..."
                value={comments[r.id] || ""}
                onChange={(e) => setComments((prev) => ({ ...prev, [r.id]: e.target.value }))}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "under_review")}>
                  En examen
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "additional_info_required")}>
                  Complément requis
                </Button>
                <Button size="sm" onClick={() => updateStatus(r.id, "available_for_download")}>
                  Approuver &amp; Mettre à disposition
                </Button>
                <Button size="sm" variant="danger" onClick={() => updateStatus(r.id, "rejected")}>
                  Rejeter
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
