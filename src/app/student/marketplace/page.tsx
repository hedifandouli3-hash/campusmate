"use client";

import React, { useEffect, useState } from "react";
import { Flag, Heart, ImagePlus, ShoppingBag, Trash2, X } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  SearchField,
  Select,
  StatusBadge,
  Textarea,
} from "@/components/ui/primitives";
import type { MarketplaceListing } from "@/types/domain";

export default function StudentMarketplacePage() {
  const { notify } = useApp();
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [priceTnd, setPriceTnd] = useState(20);
  const [newCat, setNewCat] = useState("textbooks");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function load() {
    const [res, me] = await Promise.all([fetch("/api/community"), fetch("/api/auth/me")]);
    if (res.ok) {
      const data = await res.json();
      setItems(data.marketplace || []);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "marketplace",
          title,
          priceTnd: Number(priceTnd),
          category: newCat,
          description,
          imageUrl: imageUrl || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        notify(
          data?.pendingModeration
            ? "Annonce soumise ! Elle sera visible à tous après validation par l'administration."
            : "Annonce publiée sur le Marketplace !",
          "success"
        );
        setTitle("");
        setDescription("");
        setImageUrl("");
        await load();
      } else {
        notify(data?.error || "Impossible de publier l'annonce.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function itemAction(id: string, action: "toggle_favorite" | "mark_sold" | "delete_listing" | "report") {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "marketplace", action, id }),
    });
    if (res.ok) {
      if (action === "report") notify("Annonce signalée aux modérateurs.", "info");
      else if (action === "mark_sold") notify("Annonce marquée comme vendue.", "success");
      else if (action === "delete_listing") notify("Annonce retirée.", "info");
      await load();
    }
  }

  const filtered = items.filter((i) => {
    if (category && i.category !== category) return false;
    if (search && !`${i.title} ${i.description}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Échanges Campus</Badge>}
        title="Marketplace Étudiant"
        description="Échangez des manuels, calculatrices et matériel universitaire approuvé sur le campus (sans paiement en ligne)."
      />

      <Card className="space-y-3">
        <h2 className="font-semibold text-sm">Publier un article</h2>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-3 gap-3">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'article..." />
          <Select value={newCat} onChange={(e) => setNewCat(e.target.value)}>
            <option value="textbooks">Manuels & Livres</option>
            <option value="calculators">Calculatrices</option>
            <option value="study_materials">Supports d&apos;étude</option>
            <option value="electronics">Électronique éducative</option>
            <option value="supplies">Fournitures</option>
          </Select>
          <Input type="number" min="0" value={priceTnd} onChange={(e) => setPriceTnd(Number(e.target.value))} placeholder="Prix (TND)" />
          <Textarea className="sm:col-span-3" rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="État, édition et point de remise sur le campus..." />
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <ImagePlus className="w-4 h-4 text-blue-600" />
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
          <div><Button type="submit" disabled={submitting}>{submitting ? "Publication..." : "Publier l'annonce"}</Button></div>
        </form>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <SearchField value={search} onChange={setSearch} placeholder="Rechercher un article..." ariaLabel="Rechercher sur le marketplace" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Toutes catégories</option>
          <option value="textbooks">Manuels & Livres</option>
          <option value="calculators">Calculatrices</option>
          <option value="study_materials">Supports d&apos;étude</option>
          <option value="electronics">Électronique</option>
          <option value="supplies">Fournitures</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="w-6 h-6" />} title="Aucune annonce trouvée" description="Ajustez vos filtres ou publiez le premier article." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isOwner = item.sellerId === currentUserId;
            return (
              <Card key={item.id} className="space-y-3 flex flex-col justify-between overflow-hidden">
                <div className="space-y-2.5">
                  {item.imageUrl && (
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
                    </div>
                  )}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="indigo">{item.category}</Badge>
                      {item.moderationStatus === "pending" && <Badge variant="warning">En attente</Badge>}
                    </div>
                    <span className="font-bold text-blue-600">{item.priceTnd} TND</span>
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                  <p className="text-[11px] text-slate-400">Vendeur : {item.sellerName} • {item.condition}</p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <StatusBadge status={item.status === "available" ? "open" : "completed"} label={item.status === "available" ? "Disponible" : "Vendu"} />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => itemAction(item.id, "toggle_favorite")}
                      className="inline-flex items-center gap-1 text-xs text-rose-600 cursor-pointer"
                      aria-label="Ajouter aux favoris"
                    >
                      <Heart className="w-4 h-4" /> {item.favoriteUserIds.length}
                    </button>
                    {isOwner && item.status === "available" && (
                      <Button type="button" size="sm" variant="outline" onClick={() => itemAction(item.id, "mark_sold")}>
                        Vendu
                      </Button>
                    )}
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => setDeleteId(item.id)}
                        aria-label="Supprimer l'annonce"
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => itemAction(item.id, "report")}
                        aria-label="Signaler l'annonce"
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) void itemAction(deleteId, "delete_listing");
          setDeleteId(null);
        }}
        title="Supprimer cette annonce ?"
        message="L'annonce ne sera plus visible aux autres étudiants."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
