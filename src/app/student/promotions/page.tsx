"use client";

import React, { useEffect, useState } from "react";
import {
  BadgeCheck,
  Copy,
  Heart,
  Home,
  MapPin,
  Plus,
  Tag,
  Trash2,
  Users,
  Utensils,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  SearchField,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import type { StudentPromotion } from "@/types/domain";

const CATEGORY_META: Record<
  StudentPromotion["category"],
  { label: string; badgeVariant: "warning" | "primary" | "indigo" | "success"; icon: React.ReactNode }
> = {
  resto: {
    label: "Restos & Cafés",
    badgeVariant: "warning",
    icon: <Utensils className="w-4 h-4 text-amber-600" />,
  },
  housing: {
    label: "Logement Étudiant",
    badgeVariant: "primary",
    icon: <Home className="w-4 h-4 text-blue-600" />,
  },
  roommate: {
    label: "Colocation",
    badgeVariant: "indigo",
    icon: <Users className="w-4 h-4 text-indigo-600" />,
  },
  services: {
    label: "Services Campus",
    badgeVariant: "success",
    icon: <Tag className="w-4 h-4 text-emerald-600" />,
  },
};

export default function StudentPromotionsPage() {
  const { notify } = useApp();
  const [items, setItems] = useState<StudentPromotion[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"" | StudentPromotion["category"]>("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [category, setCategory] = useState<StudentPromotion["category"]>("roommate");
  const [title, setTitle] = useState("");
  const [partnerOrArea, setPartnerOrArea] = useState("");
  const [discountOrPrice, setDiscountOrPrice] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [contactHint, setContactHint] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const [res, me] = await Promise.all([fetch("/api/community"), fetch("/api/auth/me")]);
    if (res.ok) {
      const data = await res.json();
      setItems(data.promotions || []);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "promotions",
          category,
          title,
          partnerOrArea,
          discountOrPrice,
          promoCode: promoCode.trim() || undefined,
          contactHint: contactHint.trim() || "Via messagerie CampusMate",
          description,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        notify(
          data?.pendingModeration
            ? "Offre soumise ! Visible à tous après validation par l'administration."
            : "Offre publiée avec succès !",
          "success"
        );
        setTitle("");
        setPartnerOrArea("");
        setDiscountOrPrice("");
        setPromoCode("");
        setContactHint("");
        setDescription("");
        setShowForm(false);
        await load();
      } else {
        notify(data?.error || "Impossible de publier l'offre.", "error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleSave(id: string) {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "promotions", action: "toggle_save", id }),
    });
    if (res.ok) await load();
  }

  async function deletePromo(id: string) {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "promotions", action: "delete", id }),
    });
    if (res.ok) {
      notify("Annonce supprimée.", "info");
      await load();
    }
  }

  function copyCode(code: string) {
    void navigator.clipboard?.writeText(code);
    notify(`Code ${code} copié !`, "success");
  }

  const filtered = items.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (onlySaved && !item.savedByUserIds.includes(currentUserId)) return false;
    if (
      search &&
      !`${item.title} ${item.partnerOrArea} ${item.description} ${item.discountOrPrice}`
        .toLowerCase()
        .includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Bons Plans & Logement</Badge>}
        title="Promotions, Logement & Colocation"
        description="Réductions étudiantes (restos, cafés, services), offres de location à proximité du campus et recherche de colocataires vérifiés."
        actions={
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="w-4 h-4 me-1.5" />
            {showForm ? "Fermer le formulaire" : "Publier une offre"}
          </Button>
        }
      />

      {showForm && (
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">
            Publier une promotion, un logement ou une recherche de colocataire
          </h2>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as StudentPromotion["category"])}
            >
              <option value="resto">Resto / Café (-% étudiant)</option>
              <option value="housing">Location Logement / Studio</option>
              <option value="roommate">Recherche Colocataire</option>
              <option value="services">Service Campus (Imprimerie, etc.)</option>
            </Select>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre (ex: Coloc S+2 proche ISET, Promo Resto...)"
            />
            <Input
              required
              value={partnerOrArea}
              onChange={(e) => setPartnerOrArea(e.target.value)}
              placeholder="Lieu ou quartier (ex: Cité Ennour, Centre-ville)"
            />
            <Input
              required
              value={discountOrPrice}
              onChange={(e) => setDiscountOrPrice(e.target.value)}
              placeholder="Tarif ou réduction (ex: 220 TND/mois ou -20%)"
            />
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Code promo (optionnel, ex: ISETB20)"
            />
            <Input
              value={contactHint}
              onChange={(e) => setContactHint(e.target.value)}
              placeholder="Contact / Modalité (ex: Via messagerie campus)"
            />
            <Textarea
              className="sm:col-span-2 lg:col-span-3"
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails (équipements, conditions étudiantes, horaires, colocation...)"
            />
            <div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Publication..." : "Publier l'offre"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { key: "", label: "Tout voir" },
            { key: "resto", label: "Restos & Cafés" },
            { key: "housing", label: "Location Logement" },
            { key: "roommate", label: "Colocation" },
            { key: "services", label: "Services" },
          ] as const
        ).map((tab) => (
          <Button
            key={tab.key || "all"}
            type="button"
            size="sm"
            variant={categoryFilter === tab.key && !onlySaved ? "primary" : "outline"}
            onClick={() => {
              setCategoryFilter(tab.key);
              setOnlySaved(false);
            }}
          >
            {tab.label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={onlySaved ? "primary" : "outline"}
          onClick={() => setOnlySaved((v) => !v)}
        >
          <Heart className="w-3.5 h-3.5 me-1.5" /> Favoris
        </Button>
      </div>

      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Rechercher un resto, quartier, studio ou colocataire..."
        ariaLabel="Rechercher une promotion ou un logement"
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-6 h-6" />}
          title="Aucune offre trouvée"
          description="Modifiez vos filtres ou publiez une nouvelle annonce logement / colocation."
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const meta = CATEGORY_META[item.category];
            const isSaved = item.savedByUserIds.includes(currentUserId);
            const isOwner = item.authorId === currentUserId;
            return (
              <Card key={item.id} className="space-y-3 flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={meta.badgeVariant} className="inline-flex items-center gap-1.5">
                        {meta.icon} {meta.label}
                      </Badge>
                      {item.moderationStatus === "pending" && <Badge variant="warning">En attente</Badge>}
                    </div>
                    {item.isVerifiedPartner && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="w-3.5 h-3.5" /> Vérifié
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold leading-snug">{item.title}</h3>

                  <div className="inline-block rounded-lg bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                    {item.discountOrPrice}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">{item.description}</p>

                  <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.partnerOrArea}</span>
                    </p>
                    <p>Contact : {item.contactHint}</p>
                    <p>Publié par : {item.authorName}</p>
                  </div>

                  {item.promoCode && (
                    <div className="flex items-center justify-between rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/30 px-2.5 py-1.5">
                      <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-200">
                        Code : {item.promoCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyCode(item.promoCode!)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Copier
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => toggleSave(item.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                      isSaved ? "text-rose-600" : "text-slate-500 hover:text-rose-600"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-600" : ""}`} />
                    {item.savedByUserIds.length}
                  </button>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => deletePromo(item.id)}
                      aria-label="Supprimer l'offre"
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
