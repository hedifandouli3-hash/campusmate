"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Textarea } from "@/components/ui/primitives";
import type { InternshipOffer } from "@/types/domain";

export default function InternshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, notify } = useApp();
  const [offer, setOffer] = useState<InternshipOffer | null>(null);
  const [letter, setLetter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/internships")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.offers || []).find((o: InternshipOffer) => o.id === id);
        setOffer(found || null);
      });
  }, [id]);

  async function generateLetter() {
    if (!offer) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offer.id, locale }),
      });
      const data = await res.json();
      if (data.letter) {
        setLetter(data.letter);
        notify("Lettre de motivation générée depuis votre vrai profil !", "success");
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!offer) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", offerId: offer.id, motivationLetter: letter }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur de candidature.", "error");
        return;
      }
      notify("Candidature envoyée à l'organisation !", "success");
      router.push("/student/applications");
    } finally {
      setSubmitting(false);
    }
  }

  if (!offer) {
    return (
      <Card className="space-y-3">
        <p>Chargement de l&apos;offre...</p>
        <Link href="/student/internships" className="text-xs text-blue-600">← Retour</Link>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/student/internships" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux offres
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{offer.title}</h1>
          <Badge variant="primary">{offer.internshipType}</Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          {offer.organizationName} • {offer.location} ({offer.workMode}) • Durée : {offer.duration} • Date limite : {offer.deadline}
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">Description de la mission</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{offer.description}</p>
        <div className="flex flex-wrap gap-1.5 pt-2">
          {offer.requiredSkills.map((sk) => (
            <Badge key={sk} variant="indigo">{sk}</Badge>
          ))}
        </div>
        {offer.compensation && <p className="text-xs text-emerald-600 font-medium">Gratification : {offer.compensation}</p>}
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Postuler avec votre CV CampusMate</h2>
          <Button type="button" variant="secondary" size="sm" onClick={generateLetter} disabled={generating}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>{generating ? "Génération..." : "Générer une lettre IA éditable"}</span>
          </Button>
        </div>

        <form onSubmit={handleApply} className="space-y-3">
          <Textarea
            required
            rows={8}
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            placeholder="Rédigez ou générez votre lettre de motivation basée sur vos compétences réelles..."
          />
          <Button type="submit" disabled={submitting}>
            <Send className="w-4 h-4" />
            <span>{submitting ? "Envoi..." : "Envoyer ma candidature"}</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
