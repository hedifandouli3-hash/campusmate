"use client";

import React, { useCallback, useEffect, useState } from "react";
import { GraduationCap, Plus, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { SponsorshipCampaign } from "@/types/domain";

export default function EducationalPartnerPortalPage() {
  const { notify } = useApp();
  const [campaigns, setCampaigns] = useState<SponsorshipCampaign[]>([]);
  const [partnerName, setPartnerName] = useState("");
  const [website, setWebsite] = useState("");
  const [title, setTitle] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/partners?scope=partner");
    if (res.ok) {
      const d = await res.json();
      setCampaigns(d.campaigns || []);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function handleRegisterPartner(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register_partner", name: partnerName, website }),
    });
    const d = await res.json();
    if (!res.ok) {
      notify(d.error || "Erreur", "error");
      return;
    }
    notify("Demande partenaire enregistrée.", "success");
    setPartnerName("");
    setWebsite("");
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_campaign",
        title,
        destinationUrl,
        description,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      notify(d.error || "Vérification requise.", "error");
      return;
    }
    notify("Campagne soumise pour modération.", "success");
    setTitle("");
    setDestinationUrl("");
    setDescription("");
    await load();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-8">
        <div className="space-y-2">
          <Badge variant="indigo">Portail Partenaires Éducatifs</Badge>
          <h1 className="text-3xl font-bold">Campagnes de Formation Sponsorisées</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Soumettez des opportunités d&apos;apprentissage contextuelles. Toutes les campagnes sont modérées, clairement étiquetées « Sponsorisé » et n&apos;accèdent jamais aux profils individuels des étudiants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> 1. Demander l&apos;accréditation partenaire
            </h2>
            <form onSubmit={(e) => void handleRegisterPartner(e)} className="space-y-3">
              <Input required value={partnerName} onChange={(e) => setPartnerName(e.target.value)} placeholder="Nom de la plateforme / centre" />
              <Input required value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Site web (https://...)" />
              <Button type="submit">Soumettre la demande</Button>
            </form>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" /> 2. Proposer une campagne
            </h2>
            <form onSubmit={(e) => void handleCreateCampaign(e)} className="space-y-3">
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la formation" />
              <Input required value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="Lien HTTPS" />
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description pédagogique" />
              <Button type="submit">
                <Plus className="w-4 h-4 me-1" /> Soumettre pour validation
              </Button>
            </form>
          </Card>
        </div>

        {campaigns.length > 0 && (
          <Card className="p-5 space-y-2">
            <h2 className="font-semibold">Statistiques agrégées (sans suivi individuel)</h2>
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs">
                <div>
                  <div className="font-semibold">{c.title}</div>
                  <div className="text-slate-500">
                    {c.impressions} impressions agrégées • {c.clicks} clics agrégés
                  </div>
                </div>
                <Badge>{c.status}</Badge>
              </div>
            ))}
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
