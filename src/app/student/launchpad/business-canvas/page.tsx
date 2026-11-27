"use client";

import React, { useEffect, useState } from "react";
import { Copy, Download, LayoutGrid, Plus, Save, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, PageHeader, Select, Textarea } from "@/components/ui/primitives";
import type { LaunchpadBusinessCanvas, LaunchpadStartupIdea, LaunchpadTeam } from "@/types/domain";

export default function LaunchpadBusinessCanvasPage() {
  const { locale, notify } = useApp();
  const [canvases, setCanvases] = useState<LaunchpadBusinessCanvas[]>([]);
  const [activeId, setActiveId] = useState("");
  const [ideas, setIdeas] = useState<LaunchpadStartupIdea[]>([]);
  const [teams, setTeams] = useState<LaunchpadTeam[]>([]);
  const [saving, setSaving] = useState(false);

  async function load(selectId?: string) {
    const res = await fetch("/api/launchpad");
    if (!res.ok) return;
    const data = await res.json();
    const list: LaunchpadBusinessCanvas[] = data.canvases || [];
    setCanvases(list);
    setIdeas(data.startupIdeas || []);
    setTeams(data.teams || []);
    if (selectId && list.some((c) => c.id === selectId)) {
      setActiveId(selectId);
    } else if (list.length > 0 && !list.some((c) => c.id === activeId)) {
      setActiveId(list[0].id);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = canvases.find((c) => c.id === activeId) || canvases[0] || null;

  function updateField(field: keyof LaunchpadBusinessCanvas, value: string) {
    if (!active) return;
    setCanvases((prev) => prev.map((c) => (c.id === active.id ? { ...c, [field]: value } : c)));
  }

  async function handleSave() {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch("/api/launchpad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "canvas", action: "update", ...active }),
      });
      if (res.ok) {
        notify("Business Model Canvas enregistré.", "success");
        await load(active.id);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateFromIdea(startupIdeaId?: string) {
    const res = await fetch("/api/ai/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate_canvas", startupIdeaId, locale }),
    });
    const data = await res.json();
    if (res.ok && data.canvas) {
      notify("Nouveau Canvas généré.", "success");
      await load(data.canvas.id);
    }
  }

  async function handleDuplicate() {
    if (!active) return;
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "canvas", action: "duplicate", id: active.id }),
    });
    const data = await res.json();
    if (res.ok && data.canvas) {
      notify("Version dupliquée.", "success");
      await load(data.canvas.id);
    }
  }

  async function handleDelete() {
    if (!active) return;
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "canvas", action: "delete", id: active.id }),
    });
    if (res.ok) {
      notify("Canvas supprimé.", "info");
      await load();
    }
  }

  function exportPdf() {
    if (!active) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text(active.title, 14, 16);
    doc.setFontSize(9);
    const blocks: Array<[string, string]> = [
      ["1. Partenaires clés", active.keyPartnerships],
      ["2. Activités clés", active.keyActivities],
      ["3. Ressources clés", active.keyResources],
      ["4. Propositions de valeur", active.valuePropositions],
      ["5. Relations clients", active.customerRelationships],
      ["6. Canaux", active.channels],
      ["7. Segments clients", active.customerSegments],
      ["8. Structure de coûts", active.costStructure],
      ["9. Sources de revenus", active.revenueStreams],
    ];
    let y = 26;
    for (const [label, val] of blocks) {
      doc.setFont("helvetica", "bold");
      doc.text(label, 14, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(val || "-", 265);
      doc.text(lines, 14, y + 4);
      y += 6 + lines.length * 4;
      if (y > 190) {
        doc.addPage();
        y = 18;
      }
    }
    doc.save(`${active.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Business Model Canvas</Badge>}
        title="Éditeur Business Model Canvas"
        description="Modélisez les 9 blocs stratégiques, distinguez les faits validés des hypothèses et exportez votre canvas en PDF."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => handleCreateFromIdea(ideas[0]?.id)}>
              <Plus className="w-4 h-4 me-1" /> Nouveau Canvas
            </Button>
            {active && (
              <>
                <Button type="button" variant="outline" onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 me-1" /> Dupliquer
                </Button>
                <Button type="button" variant="outline" onClick={exportPdf}>
                  <Download className="w-4 h-4 me-1" /> PDF
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 me-1" /> {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </>
            )}
          </div>
        }
      />

      <LaunchpadNav />

      {canvases.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={active?.id || ""} onChange={(e) => setActiveId(e.target.value)} className="max-w-sm">
            {canvases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} (v{c.version})
              </option>
            ))}
          </Select>
          {active && teams.length > 0 && (
            <Select
              value={active.sharedWithTeamId || ""}
              onChange={(e) => updateField("sharedWithTeamId", e.target.value)}
              className="max-w-xs"
            >
              <option value="">Privé (non partagé à une équipe)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  Partager avec : {t.projectTitle}
                </option>
              ))}
            </Select>
          )}
          {active && (
            <Button type="button" size="sm" variant="ghost" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 text-rose-500" />
            </Button>
          )}
        </div>
      )}

      {!active ? (
        <EmptyState icon={<LayoutGrid className="w-6 h-6" />} title="Aucun Business Model Canvas" description="Créez un canvas depuis une idée startup ou un modèle vierge." />
      ) : (
        <div className="space-y-4">
          {/* Genuine 5-column visual Business Model Canvas grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            <Card className="p-3 space-y-2 lg:row-span-2">
              <p className="text-xs font-bold text-indigo-600">Partenaires clés</p>
              <Textarea rows={8} value={active.keyPartnerships} onChange={(e) => updateField("keyPartnerships", e.target.value)} />
            </Card>
            <Card className="p-3 space-y-2">
              <p className="text-xs font-bold text-blue-600">Activités clés</p>
              <Textarea rows={3} value={active.keyActivities} onChange={(e) => updateField("keyActivities", e.target.value)} />
            </Card>
            <Card className="p-3 space-y-2 lg:row-span-2">
              <p className="text-xs font-bold text-emerald-600">Propositions de valeur</p>
              <Textarea rows={8} value={active.valuePropositions} onChange={(e) => updateField("valuePropositions", e.target.value)} />
            </Card>
            <Card className="p-3 space-y-2">
              <p className="text-xs font-bold text-blue-600">Relations clients</p>
              <Textarea rows={3} value={active.customerRelationships} onChange={(e) => updateField("customerRelationships", e.target.value)} />
            </Card>
            <Card className="p-3 space-y-2 lg:row-span-2">
              <p className="text-xs font-bold text-indigo-600">Segments clients</p>
              <Textarea rows={8} value={active.customerSegments} onChange={(e) => updateField("customerSegments", e.target.value)} />
            </Card>
            <Card className="p-3 space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Ressources clés</p>
              <Textarea rows={3} value={active.keyResources} onChange={(e) => updateField("keyResources", e.target.value)} />
            </Card>
            <Card className="p-3 space-y-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Canaux</p>
              <Textarea rows={3} value={active.channels} onChange={(e) => updateField("channels", e.target.value)} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card className="p-3 space-y-2">
              <p className="text-xs font-bold text-rose-600">Structure de coûts</p>
              <Textarea rows={3} value={active.costStructure} onChange={(e) => updateField("costStructure", e.target.value)} />
            </Card>
            <Card className="p-3 space-y-2">
              <p className="text-xs font-bold text-emerald-600">Sources de revenus (hypothèses)</p>
              <Textarea rows={3} value={active.revenueStreams} onChange={(e) => updateField("revenueStreams", e.target.value)} />
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-xs">
            <Card className="p-3 space-y-1.5">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400">Faits validés</p>
              <ul className="list-disc ps-4 space-y-1 text-slate-600 dark:text-slate-300">
                {active.validatedFacts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-3 space-y-1.5">
              <p className="font-semibold text-amber-700 dark:text-amber-400">Hypothèses à tester</p>
              <ul className="list-disc ps-4 space-y-1 text-slate-600 dark:text-slate-300">
                {active.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
