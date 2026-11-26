"use client";

import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button, Card } from "@/components/ui/primitives";
import { SharedSettingsView } from "@/app/student/settings/page";

export default function SuperAdminSettingsPage() {
  const { notify } = useApp();
  const [settings, setSettings] = useState({
    allowStudentRegistration: true,
    requireOrgVerification: true,
    enableCommunityModules: true,
  });

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => {
        if (d.platformSettings) setSettings(d.platformSettings);
      });
  }, []);

  async function saveSettings() {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_settings", settings }),
    });
    if (res.ok) notify("Paramètres plateforme enregistrés.", "success");
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> Gouvernance Plateforme
        </h2>
        <Card className="space-y-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.allowStudentRegistration}
              onChange={(e) => setSettings({ ...settings, allowStudentRegistration: e.target.checked })}
            />
            <span>Autoriser l&apos;inscription publique des étudiants</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.requireOrgVerification}
              onChange={(e) => setSettings({ ...settings, requireOrgVerification: e.target.checked })}
            />
            <span>Exiger la vérification des organisations avant publication</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enableCommunityModules}
              onChange={(e) => setSettings({ ...settings, enableCommunityModules: e.target.checked })}
            />
            <span>Activer les modules communautaires</span>
          </label>
          <Button onClick={saveSettings}>Enregistrer la configuration</Button>
        </Card>
      </div>
      <SharedSettingsView roleLabel="Super Admin" />
    </div>
  );
}
