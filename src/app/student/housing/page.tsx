"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bookmark, Flag, Home, MapPin, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select } from "@/components/ui/primitives";
import type { HousingListing } from "@/types/domain";

export default function StudentHousingPage() {
  const { notify } = useApp();
  const [listings, setListings] = useState<HousingListing[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/housing");
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings || []);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function handleReport(id: string) {
    const res = await fetch("/api/housing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "report_listing", id, reason: "Vérification demandée par un étudiant" }),
    });
    if (res.ok) {
      notify("Signalement transmis à la modération.", "info");
    }
  }

  function toggleSave(id: string) {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const filtered = listings.filter((l) => {
    if (category !== "all" && l.category !== category) return false;
    if (l.monthlyRentTnd > maxPrice) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.generalLocation.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="CampusMate Housing — Logement Étudiant"
        description="Consultez gratuitement les résidences, studios et logements vérifiés près de votre université."
        badge="Gratuit Étudiants"
      />

      <Card className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un quartier, résidence..."
          className="sm:col-span-2"
        />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Toutes catégories</option>
          <option value="residence">Résidence</option>
          <option value="studio">Studio</option>
          <option value="apartment">Appartement</option>
          <option value="room">Chambre</option>
          <option value="shared">Colocation</option>
        </Select>
        <Input
          type="number"
          min={50}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value) || 1000)}
          placeholder="Budget max (TND)"
        />
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Home className="w-6 h-6" />}
            title="Aucun logement correspondant"
            description="Élargissez vos critères de recherche ou votre budget."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const isSaved = savedIds.includes(l.id);
            return (
              <Card key={l.id} className="p-5 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{l.category}</Badge>
                    <div className="flex items-center gap-1.5">
                      {l.isSponsored && <Badge variant="warning">Sponsorisé</Badge>}
                      <Badge variant={l.available ? "success" : "default"}>
                        {l.available ? "Disponible" : "Occupé"}
                      </Badge>
                    </div>
                  </div>
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-white">{l.title}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {l.generalLocation} (~{l.distanceKm} km)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{l.description}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {l.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-blue-600 text-sm">{l.monthlyRentTnd} TND / mois</strong>
                    {l.isVerifiedProvider && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" /> Prestataire vérifié
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Button size="sm" variant={isSaved ? "primary" : "outline"} onClick={() => toggleSave(l.id)}>
                      <Bookmark className="w-3.5 h-3.5 me-1" /> {isSaved ? "Enregistré" : "Sauvegarder"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void handleReport(l.id)}>
                      <Flag className="w-3.5 h-3.5 me-1" /> Signaler
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-4 text-xs text-slate-600 dark:text-slate-300">
        <strong>Conseils de sécurité :</strong> Ne versez jamais d&apos;acompte avant une visite réelle et la signature d&apos;un contrat conforme. CampusMate ne collecte aucun loyer et ne divulgue jamais la localisation privée des étudiants.
      </Card>
    </div>
  );
}
