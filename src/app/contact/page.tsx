"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";

export default function ContactPage() {
  const { notify } = useApp();
  const [institutionName, setInstitutionName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institutionName,
        institutionType: "iset",
        contactName,
        contactEmail,
        planCode: "university_pro",
        studentSeats: 500,
        professorSeats: 40,
      }),
    });
    if (res.ok) {
      setSent(true);
      notify("Demande de démonstration enregistrée.", "success");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 space-y-6">
        <div className="space-y-2">
          <Badge variant="primary">Contact &amp; Démonstration</Badge>
          <h1 className="text-3xl font-bold">Contacter CampusMate</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Demandez une démonstration institutionnelle ou un accompagnement pour votre établissement.
          </p>
        </div>

        <Card className="p-6 space-y-4">
          {sent ? (
            <div className="space-y-3 text-sm text-emerald-700 dark:text-emerald-300">
              <p className="font-semibold">Merci ! Votre demande a bien été enregistrée.</p>
              <Link href="/pricing" className="text-blue-600 underline text-xs">
                Retour au simulateur de licence →
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <Input
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Université / ISET / Organisation"
              />
              <Input
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nom complet"
              />
              <Input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email professionnel"
              />
              <Button type="submit" className="w-full">
                <MessageSquare className="w-4 h-4 me-1.5" /> Demander une démonstration
              </Button>
            </form>
          )}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Établissement pilote : ISET Béja, Tunisie
          </div>
        </Card>
      </main>
      <PublicFooter />
    </div>
  );
}
