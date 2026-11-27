"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Button, Card, Input, Select } from "@/components/ui/primitives";

export default function RegisterPage() {
  const router = useRouter();
  const { notify } = useApp();
  const [role, setRole] = useState<"student" | "teacher" | "organization" | "university_admin">("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPendingMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          fullName,
          email,
          password,
          organizationName: role === "organization" ? organizationName : undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || (res.status >= 500 ? `Erreur serveur (${res.status}).` : "Erreur d'inscription."));
        return;
      }
      if (data?.pendingApproval) {
        setPendingMessage(data.message || "Compte créé et en attente de validation.");
        notify("Compte créé ! En attente de validation.", "success");
        return;
      }
      if (!data?.redirectTo) {
        setError("Réponse invalide du serveur.");
        return;
      }
      notify("Compte créé avec succès !", "success");
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
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12">
        <Card className="p-6 sm:p-8 space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Créer un compte</h1>
            <p className="text-xs text-slate-500 mt-1">
              Chaque nouveau compte est vérifié avant activation (étudiants & enseignants par l&apos;Administration, organisations & admins par le Super Admin).
            </p>
          </div>

          {pendingMessage && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 px-3 py-3 text-sm text-emerald-800 dark:text-emerald-200 space-y-2">
              <p className="font-medium">{pendingMessage}</p>
              <Link href="/login" className="inline-block text-xs font-semibold text-blue-600 hover:underline">
                Aller aux portails de connexion →
              </Link>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Type de compte</label>
              <Select value={role} onChange={(e) => setRole(e.target.value as "student" | "teacher" | "organization" | "university_admin")}>
                <option value="student">Étudiant (Vérifié par l&apos;Administration)</option>
                <option value="teacher">Enseignant (Vérifié par l&apos;Administration)</option>
                <option value="organization">Organisation / Entreprise (Vérifiée par Super Admin)</option>
                <option value="university_admin">Administration Universitaire (Vérifiée par Super Admin)</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nom complet</label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex : Ons Ben Salem" />
            </div>
            {role === "organization" && (
              <div>
                <label className="block text-xs font-medium mb-1">Nom de l&apos;organisation</label>
                <Input
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Ex : Tunisia Dev Lab"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1">Adresse e-mail</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.tn" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mot de passe (8 caractères min.)</label>
              <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
