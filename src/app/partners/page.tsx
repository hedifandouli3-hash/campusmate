"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, GraduationCap, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { SponsorshipCampaign } from "@/types/domain";

export default function PublicPartnersPage() {
  const [campaigns, setCampaigns] = useState<SponsorshipCampaign[]>([]);

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => (r.ok ? r.json() : { campaigns: [] }))
      .then((d) => setCampaigns(d.campaigns || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <Badge variant="indigo">Partenariats Éducatifs Responsables</Badge>
            <h1 className="text-3xl font-bold">Opportunités de formation sponsorisées</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Placements éducatifs contextuels clairement étiquetés, séparés du RAG officiel universitaire, sans ciblage comportemental ni vente de données personnelles.
            </p>
          </div>
          <Link href="/partner">
            <Button variant="outline">Portail Partenaire Éducatif</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((c) => (
            <Card key={c.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="warning">Sponsorisé</Badge>
                <span className="text-xs text-slate-400">{c.category}</span>
              </div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                {c.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">{c.partnerName}</span>
                <a
                  href={/^https:\/\//i.test(c.destinationUrl) ? c.destinationUrl : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
                >
                  Découvrir <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Transparence : chaque placement sponsorisé est modéré, comptabilise uniquement des statistiques agrégées (impressions/clics anonymes), et peut être désactivé par chaque université depuis son espace administration.
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
