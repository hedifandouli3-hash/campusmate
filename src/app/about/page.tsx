"use client";

import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Card } from "@/components/ui/primitives";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div className="space-y-3">
          <Badge variant="primary">À propos de CampusMate</Badge>
          <h1 className="text-3xl font-bold">Un campus. Une plateforme. Des possibilités infinies.</h1>
          <p className="text-slate-600 dark:text-slate-300">
            CampusMate est un écosystème SaaS universitaire propulsé par l&apos;intelligence artificielle, conçu pour l&apos;IA Student Discovery Camp autour de la thématique « L&apos;intelligence artificielle au service de la vie estudiantine ».
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Card className="space-y-2">
            <h2 className="font-semibold text-lg">Vision & Architecture Multi-Tenant</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Conçu initialement pour illustrer le quotidien d&apos;un campus comme l&apos;ISET Béja, CampusMate repose sur une architecture hiérarchique complète (Université → Département → Filière → Année → Section → Matière) prête pour toutes les universités tunisiennes.
            </p>
          </Card>
          <Card className="space-y-2">
            <h2 className="font-semibold text-lg">Sécurité & Transparence Démo</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Contrôle d&apos;accès par rôle côté serveur, isolation stricte par institution, protection contre les injections dans les documents RAG, et séparation claire entre données de démonstration et systèmes officiels.
            </p>
          </Card>
        </div>

        <Link href="/login" className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          Tester la démonstration
        </Link>
      </main>
      <PublicFooter />
    </div>
  );
}
