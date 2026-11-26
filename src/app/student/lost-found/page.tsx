"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { LostFoundReport } from "@/types/domain";

export default function LostFoundPage() {
  const { notify } = useApp();
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [reportType, setReportType] = useState<"lost" | "found">("lost");
  const [itemName, setItemName] = useState("");
  const [generalLocation, setGeneralLocation] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const data = await res.json();
      setReports(data.lostFound || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "lost_found",
        reportType,
        itemName,
        generalLocation,
        description,
      }),
    });
    if (res.ok) {
      notify("Signalement publié.", "success");
      setItemName("");
      setGeneralLocation("");
      setDescription("");
      load();
    }
  }

  const filtered = reports.filter((r) =>
    `${r.itemName} ${r.generalLocation} ${r.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="w-6 h-6 text-indigo-600" /> Objets Perdus & Trouvés
        </h1>
        <p className="text-sm text-slate-500">
          Ne publiez jamais de numéros de CIN, carte étudiante ou contacts privés. La vérification de restitution se fait à l&apos;accueil.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold text-sm">Déclarer un objet</h2>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-3">
          <Select value={reportType} onChange={(e) => setReportType(e.target.value as "lost" | "found")}>
            <option value="lost">Objet perdu</option>
            <option value="found">Objet trouvé</option>
          </Select>
          <Input required value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Nom de l'objet..." />
          <Input required value={generalLocation} onChange={(e) => setGeneralLocation(e.target.value)} placeholder="Lieu général (ex: Bloc TI)" />
          <Textarea className="sm:col-span-3" rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description générale sans données personnelles..." />
          <div><Button type="submit">Publier le signalement</Button></div>
        </form>
      </Card>

      <Input placeholder="Rechercher un objet perdu/trouvé..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((rep) => (
          <Card key={rep.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant={rep.reportType === "found" ? "success" : "warning"}>
                {rep.reportType === "found" ? "Trouvé" : "Perdu"}
              </Badge>
              <Badge>{rep.status}</Badge>
            </div>
            <h3 className="font-semibold">{rep.itemName}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{rep.description}</p>
            <p className="text-xs text-slate-400">Lieu : {rep.generalLocation} • Date : {rep.eventDate}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
