"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { UserRole } from "@/types/domain";

export function RoleLoginForm({
  role,
  title,
  subtitle,
  badgeText,
  emailPlaceholder,
  allowRegister = false,
  icon,
}: {
  role: UserRole;
  title: string;
  subtitle: string;
  badgeText: string;
  emailPlaceholder: string;
  allowRegister?: boolean;
  icon: React.ReactNode;
}) {
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
        body: JSON.stringify({ email, password, expectedRole: role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Identifiants incorrects.");
        return;
      }
      notify(`Bienvenue, ${data.user.fullName}`, "success");
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Tous les portails de connexion
        </Link>

        <Card className="p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                {icon}
              </div>
              <Badge variant="primary">{badgeText}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/50 dark:border-rose-800 px-3 py-2 text-sm text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium mb-1">Adresse e-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                <Input
                  id="login-email"
                  type="email"
                  required
                  className="ps-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                <Input
                  id="login-password"
                  type="password"
                  required
                  className="ps-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
              {allowRegister && (
                <Link href="/register" className="text-blue-600 hover:underline">
                  Créer un compte
                </Link>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Authentification..." : "Se connecter"}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 justify-center">
            <Link href="/login/student" className="hover:text-blue-600">Étudiant</Link>
            <Link href="/login/teacher" className="hover:text-blue-600">Enseignant</Link>
            <Link href="/login/administration" className="hover:text-blue-600">Administration</Link>
            <Link href="/login/organization" className="hover:text-blue-600">Organisation</Link>
            <Link href="/login/admin" className="hover:text-blue-600">Admin Plateforme</Link>
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
