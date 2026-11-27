"use client";

import Link from "next/link";
import { Briefcase, CheckCircle2, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Button, Card } from "@/components/ui/primitives";

const COMPANY_PLANS = [
  {
    name: "Company Basic",
    price: "Gratuit / Découverte",
    features: ["Profil entreprise vérifié", "Publication limitée d'offres PFE/Stage", "Gestion des candidatures reçues"],
  },
  {
    name: "Company Professional",
    price: "600 TND / an (indicatif)",
    features: ["Offres de stage étendues", "Défis pédagogiques avec les étudiants", "Analytiques de recrutement autorisées", "Participation aux événements campus"],
  },
  {
    name: "Company Enterprise",
    price: "Sur devis annuel",
    features: ["Équipe de recrutement multi-comptes", "Campagnes multi-universités", "Partenariats académiques dédiés"],
  },
];

export default function CompaniesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">
        <div className="space-y-3 max-w-3xl">
          <Badge variant="indigo">Portail Entreprises &amp; Recrutement</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Recrutez des stagiaires et talents PFE vérifiés
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Les étudiants postulent gratuitement. Les entreprises vérifiées accèdent uniquement aux candidatures soumises à leurs offres, dans le respect strict de la vie privée.
          </p>
          <div className="flex gap-3">
            <Link href="/register">
              <Button>Créer un compte Entreprise</Button>
            </Link>
            <Link href="/login/organization">
              <Button variant="outline">Connexion Entreprise</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMPANY_PLANS.map((p) => (
            <Card key={p.name} className="p-6 space-y-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="font-bold text-lg">{p.name}</h2>
                <p className="text-sm font-semibold text-blue-600 mt-1">{p.price}</p>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <Card className="p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Protection des données : CampusMate ne vend jamais les profils étudiants. Toute entreprise est vérifiée par le Super Administrateur avant de publier des offres.
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
