"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import { Building2, CheckCircle2, Download, FileCheck2, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import { calculateInstitutionalQuote, DEFAULT_INSTITUTIONAL_PLANS } from "@/lib/licensing/engine";
import type { InstitutionalPlanCode, InstitutionalPlanConfig } from "@/types/domain";

export default function PricingPage() {
  const { notify } = useApp();
  const [plans, setPlans] = useState<InstitutionalPlanConfig[]>(DEFAULT_INSTITUTIONAL_PLANS);
  const [planCode, setPlanCode] = useState<InstitutionalPlanCode>("university_pro");
  const [studentSeats, setStudentSeats] = useState(1500);
  const [professorSeats, setProfessorSeats] = useState(100);
  const [onboardingServiceTnd, setOnboardingServiceTnd] = useState(0);

  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState<"iset" | "public_university" | "private_university" | "training_center" | "incubator">("iset");
  const [officialWebsite, setOfficialWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedQuoteId, setSubmittedQuoteId] = useState("");

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.plans?.length) setPlans(d.plans);
      })
      .catch(() => {});
  }, []);

  const selectedPlan = plans.find((p) => p.code === planCode) || plans[1] || DEFAULT_INSTITUTIONAL_PLANS[1];
  const calc = calculateInstitutionalQuote({
    plan: selectedPlan,
    studentSeats,
    professorSeats,
    onboardingServiceTnd,
    discountPercent: 0,
  });

  function handleDownloadQuotePdf() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("CampusMate — Devis Indicatif Licence Institutionnelle", 14, 17);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    const lines = [
      `Établissement : ${institutionName || "Établissement d'enseignement supérieur"}`,
      `Plan sélectionné : ${selectedPlan.name}`,
      `Sièges Étudiants : ${studentSeats} × ${selectedPlan.studentSeatPriceTnd} TND = ${calc.studentCostTnd} TND / an`,
      `Sièges Enseignants : ${professorSeats} × ${selectedPlan.professorSeatPriceTnd} TND = ${calc.professorCostTnd} TND / an`,
      `Services d'intégration : ${onboardingServiceTnd} TND`,
      `Total annuel estimé : ${calc.annualTotalTnd.toLocaleString("fr-FR")} TND / an`,
      `Équivalent mensuel (à titre indicatif) : ${calc.monthlyEquivalentTnd.toLocaleString("fr-FR")} TND / mois`,
      `Allocation IA mensuelle incluse : ${calc.aiMonthlyAllowance.toLocaleString("fr-FR")} jetons`,
      "",
      "Note : Ce document est une estimation indicative non contractuelle (hors taxes non vérifiées).",
      "Les étudiants et enseignants ne paient aucun abonnement individuel.",
    ];
    let y = 42;
    for (const l of lines) {
      doc.text(l, 14, y, { maxWidth: 182 });
      y += 9;
    }
    doc.save(`devis-campusmate-${selectedPlan.code}.pdf`);
  }

  async function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName,
          institutionType,
          officialWebsite,
          contactName,
          contactEmail,
          planCode,
          studentSeats,
          professorSeats,
          onboardingServiceTnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur lors de l'envoi du devis.", "error");
        return;
      }
      setSubmittedQuoteId(data.quote.id);
      notify("Demande de devis enregistrée avec succès.", "success");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="primary">Modèle B2B2C financé par l&apos;université</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Licences Institutionnelles Annuelles
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Les étudiants et enseignants ne paient jamais d&apos;abonnement individuel. L&apos;établissement finance une licence annuelle adaptée à sa capacité.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Tarifs indicatifs proposés dans le cadre de la présentation commerciale (devis non contractuels).
          </p>
        </div>

        {/* 3 Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const active = p.code === planCode;
            return (
              <Card
                key={p.code}
                className={`p-6 flex flex-col justify-between space-y-5 ${
                  active ? "border-2 border-blue-600 shadow-md" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{p.name}</h2>
                    {p.code === "university_pro" && <Badge variant="primary">Recommandé</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{p.tagline}</p>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1 text-sm">
                    <div>
                      <strong>{p.studentSeatPriceTnd} TND</strong> / étudiant / an
                    </div>
                    <div>
                      <strong>{p.professorSeatPriceTnd} TND</strong> / enseignant / an
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  variant={active ? "primary" : "outline"}
                  onClick={() => setPlanCode(p.code)}
                  className="w-full"
                >
                  {active ? "Plan sélectionné" : `Choisir ${p.name}`}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Interactive Calculator + Quote Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 space-y-5">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
              Simulateur de Licence Annuelle
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">Plan</label>
                <Select
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value as InstitutionalPlanCode)}
                >
                  {plans.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Services d&apos;onboarding (TND)</label>
                <Input
                  type="number"
                  min={0}
                  value={onboardingServiceTnd}
                  onChange={(e) => setOnboardingServiceTnd(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Nombre d&apos;étudiants</label>
                <Input
                  type="number"
                  min={10}
                  value={studentSeats}
                  onChange={(e) => setStudentSeats(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Nombre d&apos;enseignants</label>
                <Input
                  type="number"
                  min={1}
                  value={professorSeats}
                  onChange={(e) => setProfessorSeats(Math.max(0, Number(e.target.value) || 0))}
                />
              </div>
            </div>

            <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Coût étudiants ({studentSeats} × {selectedPlan.studentSeatPriceTnd} TND)</span>
                <strong>{calc.studentCostTnd.toLocaleString("fr-FR")} TND</strong>
              </div>
              <div className="flex justify-between">
                <span>Coût enseignants ({professorSeats} × {selectedPlan.professorSeatPriceTnd} TND)</span>
                <strong>{calc.professorCostTnd.toLocaleString("fr-FR")} TND</strong>
              </div>
              <div className="flex justify-between border-t border-blue-200 dark:border-blue-800 pt-2 text-base font-bold text-blue-700 dark:text-blue-300">
                <span>Total annuel estimé</span>
                <span>{calc.annualTotalTnd.toLocaleString("fr-FR")} TND / an</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Équivalent mensuel (à titre indicatif)</span>
                <span>{calc.monthlyEquivalentTnd.toLocaleString("fr-FR")} TND / mois</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleDownloadQuotePdf}>
                <Download className="w-4 h-4 me-1.5" /> Télécharger le devis PDF
              </Button>
              <Link href="/demo">
                <Button variant="ghost">Voir la démo interactive</Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              Demander un devis officiel
            </div>
            <p className="text-xs text-slate-500">
              Aucun paiement n&apos;est demandé en ligne. Votre demande est enregistrée pour validation par l&apos;équipe CampusMate.
            </p>

            {submittedQuoteId ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                <div className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Demande de devis enregistrée ({submittedQuoteId})
                </div>
                <p className="text-xs">
                  Plan {selectedPlan.name} • {studentSeats} étudiants • {professorSeats} enseignants • Total indicatif : {calc.annualTotalTnd.toLocaleString("fr-FR")} TND/an.
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmitQuote(e)} className="space-y-3">
                <Input
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="Nom de l'établissement (ex: ISET Béja)"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value as typeof institutionType)}
                  >
                    <option value="iset">ISET / Institut Technologique</option>
                    <option value="public_university">Université Publique</option>
                    <option value="private_university">Université Privée</option>
                    <option value="training_center">Centre de Formation</option>
                    <option value="incubator">Incubateur Universitaire</option>
                  </Select>
                  <Input
                    value={officialWebsite}
                    onChange={(e) => setOfficialWebsite(e.target.value)}
                    placeholder="Site officiel (https://...)"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nom du responsable"
                  />
                  <Input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email professionnel"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Envoi en cours..." : "Demander un devis institutionnel"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
