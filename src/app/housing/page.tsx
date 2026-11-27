"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { HousingListing } from "@/types/domain";

export default function PublicHousingPage() {
  const [listings, setListings] = useState<HousingListing[]>([]);

  useEffect(() => {
    fetch("/api/housing")
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((d) => setListings(d.listings || []))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <Badge variant="success">Gratuit pour les étudiants</Badge>
            <h1 className="text-3xl font-bold">CampusMate Housing — Logement Étudiant</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Découvrez des résidences, studios et logements vérifiés près de votre université. Les propriétaires vérifiés peuvent gérer leurs annonces via le portail dédié.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/student/housing">
              <Button>Espace Étudiant</Button>
            </Link>
            <Link href="/housing-provider">
              <Button variant="outline">Portail Propriétaire</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <Card key={l.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Badge>{l.category}</Badge>
                {l.isSponsored && <Badge variant="warning">Sponsorisé</Badge>}
              </div>
              <h2 className="font-semibold text-base">{l.title}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {l.generalLocation} ({l.distanceKm} km)
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{l.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <strong className="text-blue-600 text-sm">{l.monthlyRentTnd} TND / mois</strong>
                {l.isVerifiedProvider && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Vérifié
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Offres Commerciales Prestataires (Indicatives)
            </h3>
            <p className="text-xs text-slate-500">
              Annonce unique : <strong>20 TND / 30 jours</strong> • Prestataire Pro : <strong>150 TND / an</strong>. Aucun paiement de loyer en ligne.
            </p>
          </div>
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Vérification obligatoire du prestataire avant publication.
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Localisation générale uniquement (protection des étudiants).
            </div>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
