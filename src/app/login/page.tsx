"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Card } from "@/components/ui/primitives";

const PORTALS = [
  {
    href: "/login/student",
    title: "Portail Étudiant",
    description: "Cours, résumés & quiz IA, assistant universitaire, documents, salles d'étude, CV et stages.",
    badge: "Étudiants",
    icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
  },
  {
    href: "/login/teacher",
    title: "Portail Enseignant & Professeurs",
    description: "Dépôt de supports PDF/DOCX/PPTX, génération de quiz IA, groupes académiques et annonces.",
    badge: "Corps Enseignant",
    icon: <Users className="w-6 h-6 text-indigo-600" />,
  },
  {
    href: "/login/administration",
    title: "Portail Administration Universitaire",
    description: "Validation des attestations, files d'attente, base de connaissances RAG, emplois du temps et salles.",
    badge: "Scolarité & Direction",
    icon: <Building2 className="w-6 h-6 text-emerald-600" />,
  },
  {
    href: "/login/organization",
    title: "Portail Organisations & Entreprises",
    description: "Publication d'offres de stage PFE/Perfectionnement et gestion des candidatures étudiantes.",
    badge: "Partenaires Pro",
    icon: <Briefcase className="w-6 h-6 text-blue-600" />,
  },
  {
    href: "/login/admin",
    title: "Portail Administrateur Plateforme",
    description: "Gouvernance multi-universités, vérification des organisations, modération et journaux d'audit.",
    badge: "Super Admin",
    icon: <ShieldCheck className="w-6 h-6 text-slate-700 dark:text-slate-300" />,
  },
];

export default function LoginPortalSelectorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="primary">Accès Sécurisé par Rôle</Badge>
          <h1 className="text-3xl font-bold tracking-tight">Choisissez votre portail de connexion</h1>
          <p className="text-sm text-slate-500">
            Chaque profil dispose d&apos;un espace dédié et d&apos;une authentification vérifiée côté serveur.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PORTALS.map((portal) => (
            <Link key={portal.href} href={portal.href} className="block group">
              <Card interactive className="h-full flex flex-col justify-between gap-4 p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900">
                      {portal.icon}
                    </div>
                    <Badge>{portal.badge}</Badge>
                  </div>
                  <h2 className="font-bold text-lg group-hover:text-blue-600 transition">{portal.title}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{portal.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  <span>Accéder au portail</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500">
          Nouvel étudiant ou entreprise partenaire ?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Créer un compte
          </Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
