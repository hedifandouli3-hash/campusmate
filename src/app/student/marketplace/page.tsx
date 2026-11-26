"use client";

import React, { useEffect, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { MarketplaceListing } from "@/types/domain";

export default function StudentMarketplacePage() {
  const { notify } = useApp();
  const [items, setItems] = useState<MarketplaceListing[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [priceTnd, setPriceTnd] = useState(20);
  const [newCat, setNewCat] = useState("textbooks");
  const [description, setDescription] = useState("");

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const data = await res.json();
      setItems(data.marketplace || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "marketplace",
        title,
        priceTnd: Number(priceTnd),
        category: newCat,
        description,
      }),
    });
    if (res.ok) {
      notify("Annonce publiée sur le Marketplace !", "success");
      setTitle("");
      setDescription("");
      load();
    }
  }

  async function toggleFavorite(id: string) {
    await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "marketplace", action: "toggle_favorite", id }),
    });
    load();
  }

  const filtered = items.filter((i) => {
    if (category && i.category !== category) return false;
    if (search && !`${i.title} ${i.description}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-indigo-600" /> Marketplace Étudiant
        </h1>
        <p className="text-sm text-slate-500">
          Échange de manuels, calculatrices et matériel universitaire approuvé (sans paiement en ligne).
        </p>
      </div>

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
          <Textarea className="sm:col-span-3" rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="État, édition et lieu de remise sur le campus..." />
          <div><Button type="submit">Publier l&apos;annonce</Button></div>
        </form>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Input placeholder="Rechercher un article..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Toutes catégories</option>
          <option value="textbooks">Manuels & Livres</option>
          <option value="calculators">Calculatrices</option>
          <option value="study_materials">Supports d&apos;étude</option>
          <option value="electronics">Électronique</option>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Badge variant="indigo">{item.category}</Badge>
                <span className="font-bold text-blue-600">{item.priceTnd} TND</span>
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
              <p className="text-[11px] text-slate-400">Vendeur : {item.sellerName} • {item.condition}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Badge variant={item.status === "available" ? "success" : "default"}>{item.status}</Badge>
              <button onClick={() => toggleFavorite(item.id)} className="inline-flex items-center gap-1 text-xs text-rose-600 cursor-pointer">
                <Heart className="w-4 h-4" /> {item.favoriteUserIds.length}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
