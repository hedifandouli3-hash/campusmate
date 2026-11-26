"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ClipboardList, FileEdit, Plus, ShieldCheck } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, SkeletonCard, StatCard } from "@/components/ui/primitives";
import type { InternshipApplication, InternshipOffer, Organization } from "@/types/domain";

export default function OrganizationDashboardPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [offers, setOffers] = useState<InternshipOffer[]>([]);
  const [apps, setApps] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/internships")
      .then((r) => r.json())
      .then((d) => {
        setOrg(d.organization || null);
        setOffers(d.offers || []);
        setApps(d.applications || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const activeCount = offers.filter((o) => o.status === "published").length;
  const draftCount = offers.filter((o) => o.status === "draft").length;

  return (
    <div className="space-y-6">
      <PageHeader
        badge={
          <Badge variant={org?.verificationStatus === "verified" ? "success" : "warning"}>
            <ShieldCheck className="w-3.5 h-3.5" /> {org?.verificationStatus || "pending"}
          </Badge>
        }
        title={org?.name || "Espace Organisation"}
        description={`${org?.sector || "Partenaire Stages"} • ${org?.city || "Tunisie"}`}
        actions={
          <Link href="/organization/internships/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" /> Publier une offre de stage
          </Link>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Offres actives" value={activeCount} icon={<Briefcase className="w-5 h-5" />} href="/organization/internships" />
        <StatCard label="Brouillons" value={draftCount} icon={<FileEdit className="w-5 h-5" />} href="/organization/internships" />
        <StatCard label="Candidatures reçues" value={apps.length} icon={<ClipboardList className="w-5 h-5" />} href="/organization/applications" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" /> Vos offres de stage
            </h2>
            <Link href="/organization/internships" className="text-xs text-blue-600 hover:underline">Tout voir</Link>
          </div>
          {offers.map((o) => (
            <Link key={o.id} href={`/organization/internships/${o.id}`} className="block rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs hover:ring-1 hover:ring-blue-500 transition">
              <div className="flex justify-between">
                <span className="font-semibold">{o.title}</span>
                <Badge variant={o.status === "published" ? "success" : "default"}>{o.status}</Badge>
              </div>
              <p className="text-slate-500 mt-1">{o.internshipType} • {o.positionsCount} poste(s)</p>
            </Link>
          ))}
        </Card>

        <Card className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" /> Candidatures récentes
            </h2>
            <Link href="/organization/applications" className="text-xs text-blue-600 hover:underline">Gérer</Link>
          </div>
          {apps.length === 0 ? (
            <EmptyState
              title="Aucune candidature reçue"
              description="Les candidatures soumises à vos offres apparaîtront ici."
            />
          ) : (
            apps.slice(0, 4).map((a) => (
              <div key={a.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs flex justify-between">
                <div>
                  <p className="font-semibold">{a.studentName}</p>
                  <p className="text-slate-500">{a.offerTitle}</p>
                </div>
                <Badge variant="primary">{a.status}</Badge>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
