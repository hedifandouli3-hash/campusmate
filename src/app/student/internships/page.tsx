"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Briefcase, MapPin, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Card, Input, Select } from "@/components/ui/primitives";
import type { InternshipOffer } from "@/types/domain";

export default function StudentInternshipsPage() {
  const { notify } = useApp();
  const [offers, setOffers] = useState<InternshipOffer[]>([]);
  const [recommendations, setRecommendations] = useState<Array<{ offerId: string; score: number; reason: string }>>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  async function load() {
    const res = await fetch("/api/internships");
    if (res.ok) {
      const data = await res.json();
      setOffers(data.offers || []);
      setRecommendations(data.recommendations || []);
      setSavedIds(data.savedIds || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function toggleSave(offerId: string) {
    const res = await fetch("/api/internships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_save", offerId }),
    });
    if (res.ok) {
      const data = await res.json();
      setSavedIds(data.savedIds || []);
      notify("Favoris mis à jour.", "info");
    }
  }

  const filtered = offers.filter((o) => {
    if (typeFilter && o.internshipType !== typeFilter) return false;
    if (search && !`${o.title} ${o.organizationName} ${o.requiredSkills.join(" ")}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-600" /> Offres de Stage & Opportunités
        </h1>
        <p className="text-sm text-slate-500">
          Offres publiées par des organisations vérifiées, avec recommandations IA transparentes basées sur vos compétences.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Input placeholder="Rechercher par titre, entreprise ou compétence..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tous types de stage</option>
          <option value="initiation">Stage d&apos;initiation</option>
          <option value="perfectionnement">Stage de perfectionnement</option>
          <option value="pfe">Stage PFE</option>
          <option value="summer">Stage d&apos;été</option>
          <option value="research">Recherche</option>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {filtered.map((offer) => {
          const rec = recommendations.find((r) => r.offerId === offer.id);
          const isSaved = savedIds.includes(offer.id);
          return (
            <Card key={offer.id} className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="primary">{offer.internshipType}</Badge>
                  <button onClick={() => toggleSave(offer.id)} className="text-xs flex items-center gap-1 text-slate-500 hover:text-blue-600 cursor-pointer">
                    <Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                    {isSaved ? "Enregistrée" : "Sauvegarder"}
                  </button>
                </div>
                <h2 className="font-semibold text-lg">{offer.title}</h2>
                <p className="text-xs font-medium text-slate-500">
                  {offer.organizationName} • <MapPin className="inline w-3 h-3" /> {offer.location} ({offer.workMode}) • {offer.duration}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{offer.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {offer.requiredSkills.map((sk) => (
                    <Badge key={sk} variant="default">{sk}</Badge>
                  ))}
                </div>
                {rec && (
                  <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 p-2.5 text-xs text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Compatibilité IA ({rec.score}%) : {rec.reason}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/student/internships/${offer.id}`}
                className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Voir l&apos;offre & Postuler
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
