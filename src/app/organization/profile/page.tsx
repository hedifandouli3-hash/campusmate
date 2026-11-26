"use client";

import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button, Card, Input, Textarea } from "@/components/ui/primitives";
import type { Organization } from "@/types/domain";

export default function OrganizationProfilePage() {
  const { notify } = useApp();
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetch("/api/internships")
      .then((r) => r.json())
      .then((d) => setOrg(d.organization || null));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!org) return;
    const res = await fetch("/api/internships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_org_profile",
        name: org.name,
        sector: org.sector,
        city: org.city,
        website: org.website,
        description: org.description,
      }),
    });
    if (res.ok) notify("Profil organisation enregistré !", "success");
  }

  if (!org) return <Card>Chargement...</Card>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Building2 className="w-6 h-6 text-blue-600" /> Profil de l&apos;Organisation
      </h1>
      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Nom</label>
              <Input value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Secteur</label>
              <Input value={org.sector} onChange={(e) => setOrg({ ...org, sector: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Ville</label>
              <Input value={org.city} onChange={(e) => setOrg({ ...org, city: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Site web</label>
              <Input value={org.website || ""} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Description</label>
            <Textarea rows={4} value={org.description} onChange={(e) => setOrg({ ...org, description: e.target.value })} />
          </div>
          <Button type="submit">Enregistrer</Button>
        </form>
      </Card>
    </div>
  );
}
