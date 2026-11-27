"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ExternalLink, Globe, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, PageHeader } from "@/components/ui/primitives";

export default function StudentUniversityPage() {
  const [data, setData] = useState<{
    institution?: { name: string; city: string; country: string; website?: string };
    departments: Array<{ id: string; name: string; code: string; description?: string }>;
    specializations: Array<{ id: string; name: string; code: string }>;
    clubs: Array<{ id: string; name: string; category: string; upcomingActivity: string }>;
    publicKnowledgeDocs: Array<{ id: string; title: string; sourceUrl?: string; academicYear?: string; isHistorical?: boolean }>;
    externalSources: Array<{ id: string; name: string; sourceUrl: string; connectionStatus: string; lastSummary: string }>;
  }>({
    departments: [],
    specializations: [],
    clubs: [],
    publicKnowledgeDocs: [],
    externalSources: [],
  });

  useEffect(() => {
    fetch("/api/university-connect?slug=iset-beja")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.institution?.name || "Mon Université — ISET Béja"}
        description="CampusMate University Connect : informations officielles, départements, parcours, clubs et sources validées."
        badge="Campus Officiel"
        actions={
          <div className="flex gap-2">
            <Link href="/student/ai-assistant">
              <Button size="sm">Poser une question RAG</Button>
            </Link>
            <Link href="/student/services">
              <Button size="sm" variant="outline">Services Campus</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-blue-600" /> Départements &amp; Parcours
          </h2>
          <div className="space-y-2">
            {data.departments.map((d) => (
              <div key={d.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs">
                <div className="font-semibold">{d.name} ({d.code})</div>
                {d.description && <p className="text-slate-500 mt-0.5">{d.description}</p>}
              </div>
            ))}
            {data.specializations.map((s) => (
              <Badge key={s.id} className="me-1.5">{s.code} — {s.name}</Badge>
            ))}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-emerald-600" /> Sources Centralisées (University Connect)
          </h2>
          <div className="space-y-2">
            {data.externalSources.map((src) => (
              <div key={src.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{src.name}</span>
                  <Badge variant={src.connectionStatus === "active" ? "success" : "default"}>
                    {src.connectionStatus}
                  </Badge>
                </div>
                <p className="text-slate-500">{src.lastSummary}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> Base Officielle Indexée ({data.publicKnowledgeDocs.length} documents)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {data.publicKnowledgeDocs.slice(0, 8).map((doc) => (
            <div key={doc.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs flex items-center justify-between gap-2">
              <div>
                <div className="font-medium">{doc.title}</div>
                <div className="text-[11px] text-slate-400">
                  {doc.academicYear || "Officiel"} {doc.isHistorical ? "• Archive historique" : ""}
                </div>
              </div>
              {doc.sourceUrl && /^https:\/\//i.test(doc.sourceUrl) && (
                <a href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
