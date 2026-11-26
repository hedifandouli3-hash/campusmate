"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import type { InternshipApplication, InternshipOffer } from "@/types/domain";

export default function OrganizationOfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<InternshipOffer | null>(null);
  const [apps, setApps] = useState<InternshipApplication[]>([]);

  useEffect(() => {
    fetch("/api/internships")
      .then((r) => r.json())
      .then((d) => {
        setOffer((d.offers || []).find((o: InternshipOffer) => o.id === id) || null);
        setApps((d.applications || []).filter((a: InternshipApplication) => a.offerId === id));
      });
  }, [id]);

  return (
    <div className="space-y-5">
      <Link href="/organization/internships" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux offres
      </Link>
      <h1 className="text-2xl font-bold">{offer?.title || "Détail de l'offre"}</h1>
      <Card className="space-y-2">
        <Badge variant="primary">{offer?.status}</Badge>
        <p className="text-sm text-slate-600 dark:text-slate-300">{offer?.description}</p>
      </Card>
      <h2 className="font-semibold">Candidatures pour cette offre ({apps.length})</h2>
      {apps.map((a) => (
        <Card key={a.id} className="space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold">{a.studentName}</span>
            <Badge>{a.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">{a.cvHeadline}</p>
        </Card>
      ))}
    </div>
  );
}
