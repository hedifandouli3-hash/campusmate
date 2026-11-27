"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ImagePlus, Search, X } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, Input, PageHeader, SearchField, Select, StatusBadge, Textarea } from "@/components/ui/primitives";
import type { LostFoundReport } from "@/types/domain";

export default function LostFoundPage() {
  const { notify } = useApp();
  const [reports, setReports] = useState<LostFoundReport[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [reportType, setReportType] = useState<"lost" | "found">("lost");
  const [itemName, setItemName] = useState("");
  const [generalLocation, setGeneralLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    const [res, me] = await Promise.all([fetch("/api/community"), fetch("/api/auth/me")]);
    if (res.ok) {
      const data = await res.json();
      setReports(data.lostFound || []);
    }
    if (me.ok) {
      const meData = await me.json();
      if (meData?.user?.id) setCurrentUserId(meData.user.id);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      notify("Format accepté : PNG, JPG ou WebP.", "error");
      return;
    }
    if (file.size > 1_000_000) {
      notify("Image trop volumineuse (max 1 Mo).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "lost_found",
          reportType,
          itemName,
          generalLocation,
          description,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        notify("Signalement publié.", "success");
        setItemName("");
        setGeneralLocation("");
        setDescription("");
        setImageUrl("");
        await load();
      } else {
        notify(data?.error || "Impossible de publier le signalement.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function markRecovered(id: string) {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "lost_found", action: "mark_recovered", id }),
    });
    if (res.ok) {
      notify("Objet marqué comme restitué.", "success");
      await load();
    }
  }

  const filtered = reports.filter((r) =>
    `${r.itemName} ${r.generalLocation} ${r.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Solidarité Campus</Badge>}
        title="Objets Perdus & Trouvés"
        description="Ne publiez jamais de numéros de CIN, carte étudiante ou contacts privés. La vérification de restitution se fait à l'accueil."
      />

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
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <ImagePlus className="w-4 h-4 text-indigo-600" />
              <span>Ajouter une photo (optionnel)</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageSelect} />
            </label>
            {imageUrl && (
              <div className="relative inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-1 pe-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Aperçu" className="h-10 w-10 rounded object-cover" />
                <span className="text-xs text-slate-500">Photo prête</span>
                <button type="button" onClick={() => setImageUrl("")} aria-label="Retirer la photo" className="text-slate-400 hover:text-rose-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div><Button type="submit" disabled={submitting}>{submitting ? "Publication..." : "Publier le signalement"}</Button></div>
        </form>
      </Card>

      <SearchField placeholder="Rechercher un objet perdu/trouvé..." value={search} onChange={setSearch} ariaLabel="Rechercher un objet perdu ou trouvé" />

      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-6 h-6" />} title="Aucun objet trouvé" description="Aucun signalement ne correspond à votre recherche." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rep) => (
            <Card key={rep.id} className="space-y-3 flex flex-col justify-between overflow-hidden">
              <div className="space-y-2.5">
                {rep.imageUrl && (
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={rep.imageUrl} alt={rep.itemName} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <Badge variant={rep.reportType === "found" ? "success" : "warning"}>
                    {rep.reportType === "found" ? "Trouvé" : "Perdu"}
                  </Badge>
                  <StatusBadge
                    status={rep.status === "recovered" ? "completed" : "open"}
                    label={rep.status === "recovered" ? "Restitué" : "Ouvert"}
                  />
                </div>
                <h3 className="font-semibold">{rep.itemName}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">{rep.description}</p>
                <p className="text-xs text-slate-400">Lieu : {rep.generalLocation} • Date : {rep.eventDate}</p>
              </div>
              {rep.reporterId === currentUserId && rep.status !== "recovered" && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" size="sm" variant="outline" onClick={() => markRecovered(rep.id)}>
                    <CheckCircle2 className="w-3.5 h-3.5 me-1.5" /> Marquer comme restitué
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
