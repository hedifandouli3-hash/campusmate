"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, ExternalLink, Lock, Unlock } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import type { LaunchpadPortfolio } from "@/types/domain";

export default function LaunchpadPortfolioPage() {
  const { notify } = useApp();
  const [portfolio, setPortfolio] = useState<LaunchpadPortfolio | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/launchpad");
    if (res.ok) {
      const data = await res.json();
      setPortfolio(data.portfolio || null);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function saveSettings(nextShared?: boolean) {
    if (!portfolio) return;
    setSaving(true);
    try {
      const res = await fetch("/api/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "portfolio",
          action: "update_settings",
          headline: portfolio.headline,
          bio: portfolio.bio,
          template: portfolio.template,
          isPublicShared: typeof nextShared === "boolean" ? nextShared : portfolio.isPublicShared,
        }),
      });
      if (res.ok) {
        notify("Paramètres du Portfolio enregistrés.", "success");
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function importToCv(itemId: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "portfolio", action: "import_to_cv", itemId }),
    });
    if (res.ok) {
      notify("Projet importé dans votre CV Builder !", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="primary">Portfolio Professionnel</Badge>}
        title="Mon Portfolio & Intégration CV"
        description="Votre portfolio est privé par défaut. Importez vos projets vérifiés directement dans l'Assistant CV IA."
        actions={
          <Link href="/student/cv-builder" className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            Ouvrir Studio CV <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <LaunchpadNav />

      {portfolio && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Identité & Confidentialité</h2>
            <Button
              type="button"
              size="sm"
              variant={portfolio.isPublicShared ? "primary" : "outline"}
              onClick={() => saveSettings(!portfolio.isPublicShared)}
            >
              {portfolio.isPublicShared ? <Unlock className="w-3.5 h-3.5 me-1.5" /> : <Lock className="w-3.5 h-3.5 me-1.5" />}
              {portfolio.isPublicShared ? "Partage activé" : "Privé par défaut"}
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              value={portfolio.headline}
              onChange={(e) => setPortfolio({ ...portfolio, headline: e.target.value })}
              placeholder="Titre professionnel..."
            />
            <Select
              value={portfolio.template}
              onChange={(e) => setPortfolio({ ...portfolio, template: e.target.value as LaunchpadPortfolio["template"] })}
            >
              <option value="engineering">Template Ingénierie</option>
              <option value="product">Template Produit / Startup</option>
              <option value="minimal">Template Minimaliste</option>
            </Select>
          </div>
          <Textarea
            rows={2}
            value={portfolio.bio}
            onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
            placeholder="Présentation synthétique basée sur vos réalisations réelles..."
          />
          <Button type="button" onClick={() => saveSettings()} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer le Portfolio"}
          </Button>
        </Card>
      )}

      {!portfolio || portfolio.items.length === 0 ? (
        <EmptyState icon={<Award className="w-6 h-6" />} title="Aucun projet dans le Portfolio" description="Ajoutez un projet depuis le Labo Projets." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {portfolio.items.map((item) => (
            <Card key={item.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-xs text-slate-500">Achevé le {item.completionDate}</p>
                </div>
                {item.importedToCv ? (
                  <Badge variant="success">
                    <CheckCircle2 className="w-3 h-3 me-1 inline" /> Importé dans le CV
                  </Badge>
                ) : (
                  <Button type="button" size="sm" onClick={() => importToCv(item.id)}>
                    Importer dans le CV
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
              <p className="text-xs"><strong>Contribution :</strong> {item.contribution}</p>
              <div className="flex flex-wrap gap-1.5">
                {item.technologies.map((tech) => (
                  <Badge key={tech} variant="indigo">{tech}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
