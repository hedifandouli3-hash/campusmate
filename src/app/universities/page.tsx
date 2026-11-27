"use client";

import Link from "next/link";
import { Building2, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Button, Card } from "@/components/ui/primitives";

export default function UniversitiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">
        <div className="space-y-4 max-w-3xl">
          <Badge variant="primary">Pour les Universités &amp; ISET</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Équipez votre établissement avec une licence annuelle unique
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            CampusMate est financé par l&apos;université pour offrir gratuitement à chaque étudiant et enseignant un écosystème complet : RAG officiel, cours IA, scolarité digitale, Launchpad et Studio.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/pricing">
              <Button>Calculer votre licence annuelle</Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline">Explorer la démo</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Lock className="w-5 h-5 text-blue-600" />,
              title: "Isolation Multi-Tenant & RLS",
              desc: "Chaque université dispose de ses départements, sections, base RAG et utilisateurs isolés par Row Level Security.",
            },
            {
              icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
              title: "Contrôle des quotas IA & sièges",
              desc: "Gérez la capacité de sièges étudiants/enseignants et les quotas IA mensuels depuis votre tableau de bord.",
            },
            {
              icon: <Building2 className="w-5 h-5 text-emerald-600" />,
              title: "Déploiement rapide",
              desc: "Indexation automatique de votre site officiel, portails dédiés et export des rapports d'utilisation.",
            },
          ].map((c) => (
            <Card key={c.title} className="p-5 space-y-2">
              {c.icon}
              <h2 className="font-semibold">{c.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{c.desc}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 space-y-3">
          <h2 className="font-semibold text-lg">Ce que vos étudiants reçoivent automatiquement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
            {[
              "Zéro paiement étudiant ou enseignant",
              "Héritage automatique des droits selon le plan Plus / Pro / Ultra",
              "Assistant universitaire sourcé sur les documents officiels",
              "Scolarité digitale, files d'attente et réservation de salles",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
