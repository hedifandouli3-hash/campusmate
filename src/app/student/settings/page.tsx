"use client";

import React from "react";
import { Settings } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button, Card, Select } from "@/components/ui/primitives";
import type { Locale } from "@/types/domain";

export function SharedSettingsView({ roleLabel }: { roleLabel: string }) {
  const { locale, setLocale, dark, toggleTheme, notify } = useApp();

  async function saveLanguage(next: Locale) {
    await setLocale(next);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredLanguage: next }),
    });
    notify("Langue mise à jour.", "success");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="w-6 h-6 text-blue-600" /> Paramètres ({roleLabel})
      </h1>
      <Card className="space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">Langue de l&apos;interface (FR / EN / العربية RTL)</label>
          <Select value={locale} onChange={(e) => saveLanguage(e.target.value as Locale)}>
            <option value="fr">Français (Défaut)</option>
            <option value="en">English</option>
            <option value="ar">العربية (RTL)</option>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-sm font-medium">Apparence</p>
            <p className="text-xs text-slate-500">Mode actuel : {dark ? "Sombre" : "Clair"}</p>
          </div>
          <Button variant="outline" onClick={toggleTheme}>
            Basculer {dark ? "Mode Clair" : "Mode Sombre"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function StudentSettingsPage() {
  return <SharedSettingsView roleLabel="Étudiant" />;
}
