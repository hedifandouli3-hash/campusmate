"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, Building2, GraduationCap, ShieldAlert, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";

const DEMO_ACCOUNTS = [
  {
    role: "Étudiant",
    email: "amira.benali@isetb.demo.tn",
    detail: "Amira Ben Ali • 2ème Année TI DSI",
    hint: "Cours IA, Assistant ISET Béja, Attestations, CV & Stages",
    icon: <GraduationCap className="w-5 h-5 text-blue-600" />,
  },
  {
    role: "Enseignant",
    email: "karim.trabelsi@isetb.demo.tn",
    detail: "Dr. Karim Trabelsi • Département TI",
    hint: "Dépôt PDF/DOCX/PPTX, Quiz IA, Groupes & Annonces",
    icon: <Users className="w-5 h-5 text-indigo-600" />,
  },
  {
    role: "Administration",
    email: "admin.isetbeja@isetb.demo.tn",
    detail: "Sonia Mansouri • Scolarité ISET Béja",
    hint: "Validation demandes, Sync isetb.rnu.tn, Files & Analytiques",
    icon: <Building2 className="w-5 h-5 text-emerald-600" />,
  },
  {
    role: "Organisation",
    email: "rh@techbeja.demo.tn",
    detail: "TechBéja Solutions • Stages vérifiés",
    hint: "Publication d'offres PFE & gestion des candidatures",
    icon: <Briefcase className="w-5 h-5 text-blue-600" />,
  },
  {
    role: "Super Admin",
    email: "superadmin@campusmate.demo.tn",
    detail: "Youssef Khelifi • Gouvernance SaaS",
    hint: "Multi-universités, vérifications, modération & audit",
    icon: <ShieldCheck className="w-5 h-5 text-slate-700 dark:text-slate-300" />,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { notify } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Échec de connexion.");
        return;
      }
      notify("Connexion réussie", "success");
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoQuickLogin(demoEmail: string) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Connexion démo indisponible.");
        return;
      }
      notify(`Connecté en mode démo (${data.user.role})`, "success");
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 grid lg:grid-cols-5 gap-8 items-start">
        <Card className="p-6 sm:p-8 space-y-5 lg:col-span-2">
          <div>
            <Badge variant="primary" className="mb-2">Portail Unifié</Badge>
            <h1 className="text-2xl font-bold">Connexion à CampusMate</h1>
            <p className="text-sm text-slate-500 mt-1">
              Accédez à votre espace universitaire ou partenaire.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/50 dark:border-rose-800 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Adresse e-mail</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@isetb.demo.tn"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mot de passe</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
              <Link href="/register" className="text-blue-600 hover:underline">
                Créer un compte
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </Card>

        <Card className="p-6 sm:p-8 space-y-4 lg:col-span-3 border-amber-200/80 dark:border-amber-800/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-base">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Accès Rapide Démonstration (1 Clic)</span>
            </div>
            <Badge variant="warning">Fictif • ISET Béja</Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Choisissez un profil pour tester instantanément les 5 rôles du hackathon. Vous pourrez aussi changer de rôle à tout moment depuis la barre supérieure.
            </span>
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={loading}
                onClick={() => handleDemoQuickLogin(acc.email)}
                className="text-start rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 hover:border-blue-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800">
                      {acc.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{acc.role}</p>
                      <p className="text-xs text-slate-500">{acc.detail}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-1" />
                </div>
                <p className="text-[11px] text-slate-500">{acc.hint}</p>
              </button>
            ))}
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
