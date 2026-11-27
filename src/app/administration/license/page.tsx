"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, CheckCircle2, Sparkles, Users } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader, Select } from "@/components/ui/primitives";
import type { InstitutionLicense, InstitutionalPlanCode, InstitutionalPlanConfig } from "@/types/domain";

export default function AdministrationLicensePage() {
  const { notify } = useApp();
  const [license, setLicense] = useState<InstitutionLicense | null>(null);
  const [plans, setPlans] = useState<InstitutionalPlanConfig[]>([]);
  const [reqPlan, setReqPlan] = useState<InstitutionalPlanCode>("university_pro");
  const [reqStudents, setReqStudents] = useState(2000);
  const [reqProfessors, setReqProfessors] = useState(120);

  const load = useCallback(async () => {
    const res = await fetch("/api/business");
    if (res.ok) {
      const data = await res.json();
      setLicense(data.license || null);
      setPlans(data.plans || []);
      if (data.license) {
        setReqPlan(data.license.planCode);
        setReqStudents(data.license.maxStudentSeats);
        setReqProfessors(data.license.maxProfessorSeats);
      }
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function handleToggleSponsorships() {
    if (!license) return;
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_sponsorships",
        sponsorshipsEnabled: !license.sponsorshipsEnabled,
      }),
    });
    if (res.ok) {
      notify("Préférence des opportunités sponsorisées mise à jour.", "success");
      await load();
    }
  }

  async function handleRequestChange(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request_license_change",
        planCode: reqPlan,
        studentSeats: reqStudents,
        professorSeats: reqProfessors,
      }),
    });
    if (res.ok) {
      notify("Demande d'évolution de licence transmise au Super Admin.", "success");
      await load();
    }
  }

  const currentPlan = plans.find((p) => p.code === license?.planCode);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licence Institutionnelle & Sièges"
        description="Pilotez la capacité de sièges étudiants/enseignants, les quotas IA et l'abonnement annuel de votre établissement."
        badge={currentPlan?.name || "Licence Active"}
      />

      {license && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <div className="text-xs text-slate-500">Plan Actuel</div>
            <div className="text-lg font-bold flex items-center gap-2">
              {currentPlan?.name || license.planCode}
              <Badge variant="success">{license.status}</Badge>
            </div>
            <div className="text-[11px] text-slate-400">
              {license.startDate} → {license.expirationDate}
            </div>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Sièges Étudiants
            </div>
            <div className="text-lg font-bold">
              {license.assignedStudentSeats} / {license.maxStudentSeats}
            </div>
            <div className="text-[11px] text-slate-400">
              {license.maxStudentSeats - license.assignedStudentSeats} restants
            </div>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Sièges Enseignants
            </div>
            <div className="text-lg font-bold">
              {license.assignedProfessorSeats} / {license.maxProfessorSeats}
            </div>
            <div className="text-[11px] text-slate-400">
              {license.maxProfessorSeats - license.assignedProfessorSeats} restants
            </div>
          </Card>

          <Card className="p-4 space-y-1">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Quota IA Mensuel
            </div>
            <div className="text-lg font-bold">
              {license.aiUsedThisPeriod.toLocaleString("fr-FR")} / {license.aiMonthlyAllowance.toLocaleString("fr-FR")}
            </div>
            <div className="text-[11px] text-slate-400">Jetons estimés</div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-base">Demander une extension ou un changement de plan</h2>
          <p className="text-xs text-slate-500">
            Les modifications commerciales sont validées par le Super Administrateur CampusMate.
          </p>
          <form onSubmit={(e) => void handleRequestChange(e)} className="space-y-3">
            <Select value={reqPlan} onChange={(e) => setReqPlan(e.target.value as InstitutionalPlanCode)}>
              {plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.studentSeatPriceTnd} TND étud. / {p.professorSeatPriceTnd} TND ens.)
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Sièges étudiants souhaités</label>
                <Input type="number" min={10} value={reqStudents} onChange={(e) => setReqStudents(Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className="text-xs font-medium">Sièges enseignants souhaités</label>
                <Input type="number" min={1} value={reqProfessors} onChange={(e) => setReqProfessors(Number(e.target.value) || 0)} />
              </div>
            </div>
            <Button type="submit">Envoyer la demande commerciale</Button>
          </form>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-base">Gouvernance &amp; Fonctionnalités incluses</h2>
          {currentPlan && (
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {currentPlan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          {license && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold">Opportunités de formation sponsorisées</div>
                <div className="text-[11px] text-slate-500">
                  Contrôlez l&apos;affichage des partenaires éducatifs pour vos étudiants.
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => void handleToggleSponsorships()}>
                {license.sponsorshipsEnabled ? "Activées" : "Désactivées"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
