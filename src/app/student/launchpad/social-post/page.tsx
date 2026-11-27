"use client";

import React, { useEffect, useState } from "react";
import { Check, Copy, ImagePlus, Share2, Sparkles, X } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import type { LaunchpadProject } from "@/types/domain";

interface SocialPostResult {
  platform: "linkedin" | "instagram" | "facebook";
  headline: string;
  body: string;
  hashtags: string[];
  callToAction: string;
}

const PLATFORM_LABELS: Record<SocialPostResult["platform"], { name: string; color: string }> = {
  linkedin: { name: "LinkedIn", color: "bg-sky-600 text-white" },
  instagram: { name: "Instagram", color: "bg-pink-600 text-white" },
  facebook: { name: "Facebook", color: "bg-blue-700 text-white" },
};

export default function LaunchpadSocialPostPage() {
  const { locale, notify } = useApp();
  const [projects, setProjects] = useState<LaunchpadProject[]>([]);
  const [idea, setIdea] = useState("");
  const [attachedType, setAttachedType] = useState<"project" | "certificate" | "stage" | "upload">("project");
  const [attachedTitle, setAttachedTitle] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState("");
  const [platforms, setPlatforms] = useState<Array<"linkedin" | "instagram" | "facebook">>(["linkedin", "instagram"]);
  const [posts, setPosts] = useState<SocialPostResult[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/launchpad")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.projects) {
          setProjects(d.projects);
          if (d.projects[0]?.title) setAttachedTitle(d.projects[0].title);
        }
      })
      .catch(() => {});
  }, []);

  function togglePlatform(p: "linkedin" | "instagram" | "facebook") {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedType("upload");
    setAttachedTitle(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setPreviewDataUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewDataUrl("");
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (platforms.length === 0) {
      notify("Sélectionnez au moins un réseau (LinkedIn, Instagram ou Facebook).", "error");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_social_posts",
          idea,
          attachedType,
          attachedTitle: attachedTitle.trim() || undefined,
          platforms,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok && data.posts) {
        setPosts(data.posts);
        notify("Publications IA générées pour vos réseaux !", "success");
      } else {
        notify(data.error || "Erreur de génération.", "error");
      }
    } finally {
      setGenerating(false);
    }
  }

  function copyPost(post: SocialPostResult) {
    const full = `${post.body}\n\n${post.callToAction}\n\n${post.hashtags.join(" ")}`;
    void navigator.clipboard?.writeText(full);
    notify(`Publication ${PLATFORM_LABELS[post.platform].name} copiée !`, "success");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Rédacteur Social IA</Badge>}
        title="Rédacteur de Posts IA (LinkedIn, Instagram, Facebook)"
        description="Décrivez votre idée, joignez un projet, un stage ou un certificat, choisissez vos plateformes et générez des publications prêtes à partager."
      />

      <LaunchpadNav />

      <Card className="space-y-4">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              1. Votre idée, accomplissement ou annonce
            </label>
            <Textarea
              required
              rows={3}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ex : J'ai utilisé mes cours de Bases de Données et mon stage d'été pour créer StockPulse TN, un prototype de gestion de stock pour PME..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                2. Joindre un projet, stage ou certificat (optionnel)
              </label>
              <Select
                value={attachedType}
                onChange={(e) => setAttachedType(e.target.value as typeof attachedType)}
              >
                <option value="project">Projet Launchpad</option>
                <option value="stage">Stage / Expérience</option>
                <option value="certificate">Certificat / Attestation</option>
                <option value="upload">Fichier / Capture importée</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Nom du projet, certificat ou stage
              </label>
              {attachedType === "project" && projects.length > 0 ? (
                <Select value={attachedTitle} onChange={(e) => setAttachedTitle(e.target.value)}>
                  {projects.map((p) => (
                    <option key={p.id} value={p.title}>
                      {p.title}
                    </option>
                  ))}
                  <option value="">Autre...</option>
                </Select>
              ) : (
                <Input
                  value={attachedTitle}
                  onChange={(e) => setAttachedTitle(e.target.value)}
                  placeholder="Ex : Certificat PostgreSQL, Stage TechBéja..."
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <ImagePlus className="w-4 h-4 text-blue-600" />
              <span>Importer un certificat, capture ou PDF</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,.pdf" className="hidden" onChange={handleFileUpload} />
            </label>
            {previewDataUrl && (
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-1 pe-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewDataUrl} alt="Aperçu" className="h-9 w-9 rounded object-cover" />
                <span className="text-xs text-slate-500">{attachedTitle}</span>
                <button type="button" onClick={() => setPreviewDataUrl("")} className="text-slate-400 hover:text-rose-600 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2">
              3. Choisir où publier
            </label>
            <div className="flex flex-wrap gap-2">
              {(["linkedin", "instagram", "facebook"] as const).map((p) => {
                const selected = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold border transition cursor-pointer ${
                      selected
                        ? `${PLATFORM_LABELS[p].color} border-transparent shadow-sm`
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {PLATFORM_LABELS[p].name}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" disabled={generating}>
            <Sparkles className="w-4 h-4 me-1.5" />
            {generating ? "Rédaction en cours..." : "Générer mes publications IA"}
          </Button>
        </form>
      </Card>

      {posts.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.platform} className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${PLATFORM_LABELS[post.platform].color}`}>
                    <Share2 className="w-3.5 h-3.5" /> {PLATFORM_LABELS[post.platform].name}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => copyPost(post)}>
                    <Copy className="w-3.5 h-3.5 me-1" /> Copier
                  </Button>
                </div>
                <Textarea
                  rows={8}
                  value={`${post.body}\n\n${post.callToAction}\n\n${post.hashtags.join(" ")}`}
                  onChange={(e) =>
                    setPosts((prev) =>
                      prev.map((x) => (x.platform === post.platform ? { ...x, body: e.target.value, callToAction: "", hashtags: [] } : x))
                    )
                  }
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Relisez et publiez directement sur {PLATFORM_LABELS[post.platform].name} quand vous êtes prêt.
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
