"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  FileText,
  Globe,
  Monitor,
  Palette,
  Plus,
  Presentation,
  Save,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from "@/components/ui/primitives";
import { renderSandboxedWebsiteHtml } from "@/lib/agent/website-generator";
import {
  exportDocumentPdf,
  exportPresentationPdf,
  exportWebsiteDeployZip,
} from "@/lib/integrations/exports";
import type { CreationArtifact, CreationArtifactType } from "@/types/domain";

type StudioTab = "website" | "presentation" | "document" | "brand_kit";
type ViewportSize = "desktop" | "tablet" | "mobile";

export default function StudentStudioPage() {
  const { notify } = useApp();
  const [artifacts, setArtifacts] = useState<CreationArtifact[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<StudioTab>("website");
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<CreationArtifactType>("website");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/studio");
    if (res.ok) {
      const data = await res.json();
      const list: CreationArtifact[] = data.artifacts || [];
      setArtifacts(list);
      if (!selectedId && list.length > 0) {
        setSelectedId(list[0].id);
        if (list[0].type === "website" || list[0].type === "presentation" || list[0].type === "document" || list[0].type === "brand_kit") {
          setActiveTab(list[0].type);
        }
      }
    }
  }

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const current = artifacts.find((a) => a.id === selectedId) || null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_artifact",
        type: newType,
        title: newTitle.trim(),
        description: `Création ${newType} dans CampusMate Studio`,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewTitle("");
      setSelectedId(data.artifact.id);
      if (newType === "website" || newType === "presentation" || newType === "document" || newType === "brand_kit") {
        setActiveTab(newType);
      }
      notify("Nouveau livrable créé", "success");
      await load();
    }
  }

  async function handleSave(updated: CreationArtifact) {
    setSaving(true);
    try {
      const res = await fetch("/api/studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_artifact",
          id: updated.id,
          title: updated.title,
          description: updated.description,
          websiteData: updated.websiteData,
          slides: updated.slides,
          documentMarkdown: updated.documentMarkdown,
          brandKit: updated.brandKit,
        }),
      });
      if (res.ok) {
        notify("Modifications enregistrées", "success");
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_artifact", id }),
    });
    if (res.ok) {
      setSelectedId("");
      notify("Livrable supprimé", "info");
      await load();
    }
  }

  function handleExportHtml() {
    if (!current?.websiteData) return;
    const html = renderSandboxedWebsiteHtml(current.websiteData);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Fichier HTML exporté", "success");
  }

  function updateCurrentLocal(patch: Partial<CreationArtifact>) {
    if (!current) return;
    setArtifacts((prev) => prev.map((a) => (a.id === current.id ? { ...a, ...patch } : a)));
  }

  const sandboxHtml = current?.websiteData
    ? renderSandboxedWebsiteHtml(current.websiteData)
    : "";

  const frameWidthClass =
    viewport === "mobile"
      ? "max-w-[375px]"
      : viewport === "tablet"
        ? "max-w-[768px]"
        : "w-full";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Studio de Création IA"
        description="Concevez des sites web en sandbox sécurisée, présentations, documents académiques et kits de marque."
        badge="Creation Studio"
      />

      {/* Create bar */}
      <Card className="p-4">
        <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col sm:flex-row gap-2.5">
          <Select
            value={newType}
            onChange={(e) => setNewType(e.target.value as CreationArtifactType)}
            className="sm:w-48"
          >
            <option value="website">Site Web (Sandbox)</option>
            <option value="presentation">Présentation (Slides)</option>
            <option value="document">Document / Rapport</option>
            <option value="brand_kit">Kit de Marque</option>
          </Select>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nom du livrable (ex: Portfolio PFE, Pitch Deck...)"
            className="flex-1"
          />
          <Button type="submit" disabled={!newTitle.trim()}>
            <Plus className="w-4 h-4 me-1.5" /> Créer
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Artifact List */}
        <Card className="p-4 space-y-2 lg:col-span-1 h-fit">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
            Mes créations ({artifacts.length})
          </h2>
          {artifacts.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun livrable.</p>
          ) : (
            artifacts.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => {
                  setSelectedId(art.id);
                  if (art.type === "website" || art.type === "presentation" || art.type === "document" || art.type === "brand_kit") {
                    setActiveTab(art.type);
                  }
                }}
                className={`w-full text-start rounded-lg p-2.5 border transition ${
                  art.id === selectedId
                    ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-900 dark:text-white truncate">
                    {art.title}
                  </span>
                  <Badge>{art.type}</Badge>
                </div>
              </button>
            ))
          )}
        </Card>

        {/* Main Editor + Preview */}
        <div className="lg:col-span-3 space-y-4">
          {!current ? (
            <Card className="p-8">
              <EmptyState
                icon={<Globe className="w-6 h-6" />}
                title="Sélectionnez ou créez un livrable"
                description="Utilisez le formulaire ci-dessus pour démarrer un site web, une présentation, un document ou un brand kit."
              />
            </Card>
          ) : (
            <Card className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {activeTab === "website" && <Globe className="w-4 h-4 text-blue-600" />}
                  {activeTab === "presentation" && <Presentation className="w-4 h-4 text-indigo-600" />}
                  {activeTab === "document" && <FileText className="w-4 h-4 text-emerald-600" />}
                  {activeTab === "brand_kit" && <Palette className="w-4 h-4 text-amber-600" />}
                  <Input
                    value={current.title}
                    onChange={(e) => updateCurrentLocal({ title: e.target.value })}
                    className="font-semibold max-w-xs"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {current.websiteData && (
                    <>
                      <Button variant="secondary" size="sm" onClick={handleExportHtml}>
                        <Download className="w-3.5 h-3.5 me-1" /> Exporter HTML
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void exportWebsiteDeployZip(current)}
                      >
                        <Download className="w-3.5 h-3.5 me-1" /> ZIP Déploiement (Vercel / Netlify)
                      </Button>
                    </>
                  )}
                  {current.type === "presentation" && current.slides && current.slides.length > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => exportPresentationPdf(current.title, current.slides!)}
                    >
                      <Download className="w-3.5 h-3.5 me-1" /> Exporter PDF (Slides)
                    </Button>
                  )}
                  {current.type === "document" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => exportDocumentPdf(current.title, current.documentMarkdown || "")}
                    >
                      <Download className="w-3.5 h-3.5 me-1" /> Exporter PDF
                    </Button>
                  )}
                  <Button size="sm" onClick={() => void handleSave(current)} disabled={saving}>
                    <Save className="w-3.5 h-3.5 me-1" /> {saving ? "..." : "Enregistrer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void handleDelete(current.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </Button>
                </div>
              </div>

              {/* Website Builder */}
              {current.type === "website" && current.websiteData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Nom de marque
                      </label>
                      <Input
                        value={current.websiteData.brandName}
                        onChange={(e) =>
                          updateCurrentLocal({
                            websiteData: { ...current.websiteData!, brandName: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Couleur principale
                      </label>
                      <Input
                        type="color"
                        value={current.websiteData.primaryColor}
                        onChange={(e) =>
                          updateCurrentLocal({
                            websiteData: { ...current.websiteData!, primaryColor: e.target.value },
                          })
                        }
                        className="h-10 p-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Police
                      </label>
                      <Select
                        value={current.websiteData.fontFamily}
                        onChange={(e) =>
                          updateCurrentLocal({
                            websiteData: {
                              ...current.websiteData!,
                              fontFamily: e.target.value as "sans" | "serif" | "mono",
                            },
                          })
                        }
                      >
                        <option value="sans">Sans-serif moderne</option>
                        <option value="serif">Serif éditorial</option>
                        <option value="mono">Monospace Tech</option>
                      </Select>
                    </div>
                  </div>

                  {/* Viewport switcher */}
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/70 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Aperçu isolé (iframe sandbox, CSP strict, sans cookies)
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={viewport === "desktop" ? "primary" : "ghost"}
                        onClick={() => setViewport("desktop")}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewport === "tablet" ? "primary" : "ghost"}
                        onClick={() => setViewport("tablet")}
                      >
                        <Tablet className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={viewport === "mobile" ? "primary" : "ghost"}
                        onClick={() => setViewport("mobile")}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-center bg-slate-200/70 dark:bg-slate-950 p-3 rounded-xl">
                    <iframe
                      title="Aperçu site web sandboxé"
                      sandbox="allow-scripts"
                      srcDoc={sandboxHtml}
                      className={`${frameWidthClass} h-[420px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white transition-all`}
                    />
                  </div>
                </div>
              )}

              {/* Presentation Builder */}
              {current.type === "presentation" && (
                <div className="space-y-3">
                  {(current.slides || []).map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge>Slide {idx + 1}</Badge>
                      </div>
                      <Input
                        value={slide.title}
                        onChange={(e) => {
                          const next = [...(current.slides || [])];
                          next[idx] = { ...slide, title: e.target.value };
                          updateCurrentLocal({ slides: next });
                        }}
                      />
                      <textarea
                        value={slide.bullets.join("\n")}
                        onChange={(e) => {
                          const next = [...(current.slides || [])];
                          next[idx] = {
                            ...slide,
                            bullets: e.target.value.split("\n").filter(Boolean),
                          };
                          updateCurrentLocal({ slides: next });
                        }}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Document Builder */}
              {current.type === "document" && (
                <textarea
                  value={current.documentMarkdown || ""}
                  onChange={(e) => updateCurrentLocal({ documentMarkdown: e.target.value })}
                  rows={14}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm font-mono"
                />
              )}

              {/* Brand Kit */}
              {current.type === "brand_kit" && current.brandKit && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium">Nom de la marque</label>
                    <Input
                      value={current.brandKit.brandName}
                      onChange={(e) =>
                        updateCurrentLocal({
                          brandKit: { ...current.brandKit!, brandName: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Slogan</label>
                    <Input
                      value={current.brandKit.slogan}
                      onChange={(e) =>
                        updateCurrentLocal({
                          brandKit: { ...current.brandKit!, slogan: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Couleur primaire</label>
                    <Input
                      type="color"
                      value={current.brandKit.palette[0] || "#2563EB"}
                      onChange={(e) => {
                        const nextPalette = [...(current.brandKit!.palette || ["#2563EB", "#4F46E5"])];
                        nextPalette[0] = e.target.value;
                        updateCurrentLocal({
                          brandKit: { ...current.brandKit!, palette: nextPalette },
                        });
                      }}
                      className="h-10 p-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Couleur secondaire</label>
                    <Input
                      type="color"
                      value={current.brandKit.palette[1] || "#4F46E5"}
                      onChange={(e) => {
                        const nextPalette = [...(current.brandKit!.palette || ["#2563EB", "#4F46E5"])];
                        nextPalette[1] = e.target.value;
                        updateCurrentLocal({
                          brandKit: { ...current.brandKit!, palette: nextPalette },
                        });
                      }}
                      className="h-10 p-1"
                    />
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
