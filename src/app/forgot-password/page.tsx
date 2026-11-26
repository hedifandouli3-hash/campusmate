"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Button, Card, Input } from "@/components/ui/primitives";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-12">
        <Card className="p-6 sm:p-8 space-y-4">
          <h1 className="text-xl font-bold">Réinitialisation du mot de passe</h1>
          {sent ? (
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                Si un compte correspond à <strong>{email}</strong>, un lien de réinitialisation est envoyé lorsque le fournisseur e-mail ou Supabase Auth est configuré.
              </p>
              <Link href="/login" className="inline-block text-blue-600 hover:underline">
                ← Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">
                Saisissez votre e-mail universitaire pour recevoir les instructions.
              </p>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@isetb.demo.tn" />
              <Button type="submit" className="w-full">Envoyer le lien</Button>
            </form>
          )}
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
