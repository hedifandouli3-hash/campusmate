"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, Plus, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import type { HousingListing, HousingProvider } from "@/types/domain";

export default function HousingProviderPortalPage() {
  const { notify } = useApp();
  const [providers, setProviders] = useState<HousingProvider[]>([]);
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [planCode, setPlanCode] = useState<"single_listing" | "pro_annual">("pro_annual");

  const [title, setTitle] = useState("");
  const [generalLocation, setGeneralLocation] = useState("");
  const [monthlyRentTnd, setMonthlyRentTnd] = useState(250);
  const [category, setCategory] = useState("studio");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/housing?scope=provider");
    if (res.ok) {
      const d = await res.json();
      setProviders(d.providers || []);
      setListings(d.listings || []);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function handleRegisterProvider(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/housing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register_provider", name, contactEmail, planCode }),
    });
    const d = await res.json();
    if (!res.ok) {
      notify(d.error || "Erreur", "error");
      return;
    }
    notify(d.message || "Demande enregistrée.", "success");
    setName("");
    setContactEmail("");
    await load();
  }

  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/housing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_listing",
        title,
        generalLocation,
        monthlyRentTnd,
        category,
        description,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      notify(d.error || "Vérification requise avant publication.", "error");
      return;
    }
    notify("Annonce soumise à modération.", "success");
    setTitle("");
    setDescription("");
    await load();
  }

  const verifiedProvider = providers.find((p) => p.verificationStatus === "verified");

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-8">
        <div className="space-y-2">
          <Badge variant="primary">Portail Prestataires Logement</Badge>
          <h1 className="text-3xl font-bold">CampusMate Housing — Espace Propriétaire</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Seuls les prestataires vérifiés par le Super Administrateur peuvent publier des logements étudiants. Aucun paiement de loyer n&apos;est traité en ligne.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              1. Demander une vérification prestataire
            </h2>
            <form onSubmit={(e) => void handleRegisterProvider(e)} className="space-y-3">
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de la résidence ou agence" />
              <Input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email professionnel" />
              <Select value={planCode} onChange={(e) => setPlanCode(e.target.value as typeof planCode)}>
                <option value="single_listing">Annonce unique (20 TND / 30 jours — indicatif)</option>
                <option value="pro_annual">Prestataire Pro (150 TND / an — indicatif)</option>
              </Select>
              <Button type="submit">Demander la vérification</Button>
            </form>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              2. Publier un logement ({verifiedProvider ? "Vérifié" : "Vérification requise"})
            </h2>
            <form onSubmit={(e) => void handleCreateListing(e)} className="space-y-3">
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du logement" />
              <div className="grid grid-cols-2 gap-2">
                <Input required value={generalLocation} onChange={(e) => setGeneralLocation(e.target.value)} placeholder="Quartier (ex: Béja Nord)" />
                <Input type="number" min={50} value={monthlyRentTnd} onChange={(e) => setMonthlyRentTnd(Number(e.target.value) || 200)} />
              </div>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="residence">Résidence</option>
                <option value="studio">Studio</option>
                <option value="apartment">Appartement</option>
                <option value="room">Chambre</option>
                <option value="shared">Colocation</option>
              </Select>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description, équipements..." />
              <Button type="submit">
                <Plus className="w-4 h-4 me-1" /> Publier l&apos;annonce
              </Button>
            </form>
          </Card>
        </div>

        {listings.length > 0 && (
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold">Vos annonces ({listings.length})</h2>
            <div className="space-y-2">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-xs">
                  <div>
                    <div className="font-semibold">{l.title}</div>
                    <div className="text-slate-500">{l.generalLocation} • {l.monthlyRentTnd} TND/mois</div>
                  </div>
                  <Badge>{l.moderationStatus}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
