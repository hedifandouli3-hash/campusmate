"use client";

import React, { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { Institution } from "@/types/domain";

export default function AdminInstitutionsPage() {
  const { notify } = useApp();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setInstitutions(d.institutions || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_institution", code, name, city }),
    });
    if (res.ok) {
      notify("Université ajoutée au réseau multi-tenant !", "success");
      setCode("");
      setName("");
      setCity("");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Building2 className="w-6 h-6 text-blue-600" /> Universités & Établissements (Tenants)
      </h1>
      <Card>
        <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-3">
          <Input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (ex: ISET-SFAX)" />
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l'institution" />
          <Input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" />
          <Button type="submit">Ajouter un tenant</Button>
        </form>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        {institutions.map((i) => (
          <Card key={i.id} className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{i.name}</p>
              <p className="text-xs text-slate-500">{i.code} • {i.city}, {i.country}</p>
            </div>
            <Badge variant={i.isDemo ? "warning" : "success"}>{i.isDemo ? "Démo" : "Actif"}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
