"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, CheckCircle2, DollarSign, ShieldCheck, XCircle } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui/primitives";
import type {
  HousingProvider,
  InstitutionLicense,
  InstitutionalPlanConfig,
  InstitutionalQuote,
  SponsorshipCampaign,
} from "@/types/domain";

export default function AdminBusinessPage() {
  const { notify } = useApp();
  const [plans, setPlans] = useState<InstitutionalPlanConfig[]>([]);
  const [licenses, setLicenses] = useState<InstitutionLicense[]>([]);
  const [quotes, setQuotes] = useState<InstitutionalQuote[]>([]);
  const [housingProviders, setHousingProviders] = useState<HousingProvider[]>([]);
  const [campaigns, setCampaigns] = useState<SponsorshipCampaign[]>([]);
  const [summary, setSummary] = useState({
    actualConfirmedArrTnd: 0,
    simulatedArrTnd: 0,
    simulatedInstitutionalArr: 0,
    simulatedCompanyArr: 0,
    simulatedHousingArr: 0,
    simulatedSponsorshipArr: 0,
    totalLicensedStudentSeats: 0,
    totalAssignedStudentSeats: 0,
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/business");
    if (res.ok) {
      const d = await res.json();
      setPlans(d.plans || []);
      setLicenses(d.licenses || []);
      setQuotes(d.quotes || []);
      setHousingProviders(d.housingProviders || []);
      setCampaigns(d.sponsorshipCampaigns || []);
      if (d.revenueSummary) setSummary(d.revenueSummary);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function updatePlanPrice(p: InstitutionalPlanConfig) {
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_plan_pricing",
        code: p.code,
        studentSeatPriceTnd: p.studentSeatPriceTnd,
        professorSeatPriceTnd: p.professorSeatPriceTnd,
      }),
    });
    if (res.ok) {
      notify(`Tarifs du plan ${p.name} mis à jour.`, "success");
      await load();
    }
  }

  async function verifyHousing(providerId: string, decision: "verified" | "rejected") {
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_housing_provider", providerId, decision }),
    });
    if (res.ok) {
      notify("Prestataire logement mis à jour.", "success");
      await load();
    }
  }

  async function moderateCampaign(campaignId: string, decision: "approved" | "rejected") {
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "moderate_campaign", campaignId, decision }),
    });
    if (res.ok) {
      notify("Campagne partenaire mise à jour.", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Control Center"
        description="Pilotez les plans institutionnels, devis, licences universitaires, prestataires logement et campagnes partenaires."
        badge="Super Admin SaaS"
      />

      {/* Revenue distinction: Actual vs Simulated */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-xs text-slate-500">ARR Confirmé (Contrats réels)</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.actualConfirmedArrTnd.toLocaleString("fr-FR")} TND
          </div>
          <Badge>0 contrat facturé en démo</Badge>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> ARR Simulé (Jury / Démo)
          </div>
          <div className="text-xl font-bold text-blue-600">
            {summary.simulatedArrTnd.toLocaleString("fr-FR")} TND
          </div>
          <Badge variant="warning">Simulé</Badge>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-xs text-slate-500">Sièges Étudiants Licenciés</div>
          <div className="text-xl font-bold">
            {summary.totalAssignedStudentSeats} / {summary.totalLicensedStudentSeats}
          </div>
          <div className="text-[11px] text-slate-400">Capacité multi-tenant</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-xs text-slate-500">Licences Actives</div>
          <div className="text-xl font-bold">{licenses.length}</div>
          <div className="text-[11px] text-slate-400">{quotes.length} devis enregistrés</div>
        </Card>
      </div>

      {/* Configurable Plans */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-base">Configuration des Tarifs Institutionnels (TND / siège / an)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p, idx) => (
            <div key={p.code} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="font-semibold text-sm">{p.name}</div>
              <div>
                <label className="text-xs text-slate-500">Prix / étudiant (TND)</label>
                <Input
                  type="number"
                  min={1}
                  value={p.studentSeatPriceTnd}
                  onChange={(e) => {
                    const next = [...plans];
                    next[idx] = { ...p, studentSeatPriceTnd: Number(e.target.value) || 1 };
                    setPlans(next);
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Prix / enseignant (TND)</label>
                <Input
                  type="number"
                  min={1}
                  value={p.professorSeatPriceTnd}
                  onChange={(e) => {
                    const next = [...plans];
                    next[idx] = { ...p, professorSeatPriceTnd: Number(e.target.value) || 1 };
                    setPlans(next);
                  }}
                />
              </div>
              <Button size="sm" onClick={() => void updatePlanPrice(p)}>
                Enregistrer tarif
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotes */}
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" /> Demandes de Devis ({quotes.length})
          </h2>
          <div className="space-y-2">
            {quotes.slice(0, 6).map((q) => (
              <div key={q.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>{q.institutionName}</span>
                  <Badge>{q.status}</Badge>
                </div>
                <p className="text-slate-500">
                  {q.planCode} • {q.studentSeats} étud. / {q.professorSeats} ens. • {q.annualTotalTnd.toLocaleString("fr-FR")} TND/an (simulé)
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Housing Providers & Sponsorship Campaigns */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Prestataires Logement &amp; Sponsoring
          </h2>
          <div className="space-y-2">
            {housingProviders.map((hp) => (
              <div key={hp.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 text-xs">
                <div>
                  <div className="font-medium">{hp.name}</div>
                  <div className="text-slate-500">{hp.planCode} ({hp.planPriceTnd} TND)</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={hp.verificationStatus === "verified" ? "success" : "warning"}>
                    {hp.verificationStatus}
                  </Badge>
                  {hp.verificationStatus === "pending" && (
                    <>
                      <Button size="sm" onClick={() => void verifyHousing(hp.id, "verified")}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void verifyHousing(hp.id, "rejected")}>
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 text-xs">
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-slate-500">{c.partnerName} • {c.clicks} clics agrégés</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={c.status === "approved" ? "success" : "warning"}>{c.status}</Badge>
                  {c.status !== "approved" && (
                    <Button size="sm" onClick={() => void moderateCampaign(c.id, "approved")}>
                      Approuver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
