"use client";

import React, { useEffect, useState } from "react";
import { Bot, Globe, RefreshCw, Search } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, StatCard, Textarea } from "@/components/ui/primitives";
import type { KnowledgeDocument } from "@/types/domain";

interface InventoryEntry {
  url: string;
  title: string;
  category: string;
  status: string;
  isHistorical: boolean;
  detectedAcademicYear: string | null;
  reasons: string[];
}

interface RetrievalTestResult {
  scope: string;
  retrievedCount: number;
  chunks: Array<{ id: string; documentTitle: string; score: number; excerpt: string }>;
  answer: string;
  citations: Array<{ documentTitle: string; sourceUrl?: string; isHistorical?: boolean }>;
  isDemoFallback: boolean;
}

export default function AdminKnowledgeBasePage() {
  const { locale, notify } = useApp();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("procedure");
  const [contentText, setContentText] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [crawlSummary, setCrawlSummary] = useState<{
    syncedCount: number;
    chunksCount: number;
    rejectedCount: number;
    historicalCount: number;
    failedCount: number;
  } | null>(null);

  const [testQuery, setTestQuery] = useState("Quelles sont les licences proposées par l'ISET Béja ?");
  const [testingRag, setTestingRag] = useState(false);
  const [ragTestResult, setRagTestResult] = useState<RetrievalTestResult | null>(null);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setDocs(d.knowledgeDocs || []);
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
      body: JSON.stringify({ action: "add_knowledge", title, category, contentText }),
    });
    if (res.ok) {
      notify("Document indexé dans la base RAG universitaire !", "success");
      setTitle("");
      setContentText("");
      await load();
    }
  }

  async function handleSyncWebsite() {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_isetb_website" }),
      });
      const d = await res.json();
      if (!res.ok) {
        notify(d.error || "Erreur de synchronisation.", "error");
        return;
      }
      notify(`${d.syncedCount} pages officielles d'isetb.rnu.tn indexées (${d.chunksCount} segments) !`, "success");
      await load();
    } finally {
      setSyncing(false);
    }
  }

  async function handleControlledCrawl() {
    setCrawling(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_isetb_crawl" }),
      });
      const d = await res.json();
      if (!res.ok) {
        notify(d.error || "Erreur lors du crawl contrôlé.", "error");
        return;
      }
      setInventory(d.inventory || []);
      setCrawlSummary({
        syncedCount: d.syncedCount || 0,
        chunksCount: d.chunksCount || 0,
        rejectedCount: d.rejectedCount || 0,
        historicalCount: d.historicalCount || 0,
        failedCount: d.failedCount || 0,
      });
      notify(`Crawl contrôlé terminé : ${d.syncedCount} sources traitées.`, "success");
      await load();
    } finally {
      setCrawling(false);
    }
  }

  async function handleTestRag(e: React.FormEvent) {
    e.preventDefault();
    setTestingRag(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_rag_retrieval", query: testQuery, locale }),
      });
      const d = await res.json();
      if (res.ok) setRagTestResult(d);
    } finally {
      setTestingRag(false);
    }
  }

  const publishedCount = docs.filter((d) => d.isPublished && d.category !== "historical").length;
  const historicalDocs = docs.filter((d) => d.category === "historical").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-600" /> Base de Connaissances IA Officielle (RAG V5)
          </h1>
          <p className="text-sm text-slate-500">
            Ingestion contrôlée depuis isetb.rnu.tn, filtrage anti-spam/FSEGT, étiquetage historique et console de test RAG.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleControlledCrawl} disabled={crawling} variant="outline">
            <Globe className={`w-4 h-4 me-1.5 ${crawling ? "animate-spin" : ""}`} />
            {crawling ? "Crawl..." : "Crawl & Validation URLs"}
          </Button>
          <Button onClick={handleSyncWebsite} disabled={syncing} variant="secondary">
            <RefreshCw className={`w-4 h-4 me-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Synchronisation..." : "Sync WP API (isetb.rnu.tn)"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sources actives" value={publishedCount} hint="Approuvées pour RAG" />
        <StatCard label="Sources historiques" value={historicalDocs + (crawlSummary?.historicalCount || 0)} hint="Étiquetées années passées" />
        <StatCard label="Sources rejetées" value={crawlSummary?.rejectedCount || 0} hint="Spam / hors-institution" />
        <StatCard label="Total documents" value={docs.length} hint="Base institutionnelle" />
      </div>

      {inventory.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-semibold text-sm">Inventaire de synchronisation isetb.rnu.tn</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-start text-slate-500">
                  <th className="py-2 pe-3">URL</th>
                  <th className="py-2 pe-3">Statut</th>
                  <th className="py-2">Détail validation</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.url} className="border-b border-slate-100 dark:border-slate-800/60">
                    <td className="py-2 pe-3 font-mono">{item.url}</td>
                    <td className="py-2 pe-3">
                      <Badge variant={item.status === "approved" ? "success" : item.status === "historical" ? "warning" : "danger"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-slate-500">{item.reasons.join(" • ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Retrieval Testing Console */}
      <Card className="space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" /> Console de Test Retrieval & Citations RAG
        </h2>
        <form onSubmit={handleTestRag} className="flex flex-col sm:flex-row gap-2">
          <Input value={testQuery} onChange={(e) => setTestQuery(e.target.value)} placeholder="Question étudiante (FR, EN ou AR)..." />
          <Button type="submit" disabled={testingRag}>
            {testingRag ? "Test..." : "Tester le RAG"}
          </Button>
        </form>
        {ragTestResult && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="indigo">Scope : {ragTestResult.scope}</Badge>
              <Badge variant="primary">{ragTestResult.retrievedCount} segments récupérés</Badge>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-3 whitespace-pre-line">
              {ragTestResult.answer}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {ragTestResult.chunks.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-2.5">
                  <p className="font-semibold">{c.documentTitle} (score: {c.score})</p>
                  <p className="text-slate-500 mt-1">{c.excerpt}...</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex: Procédure Stage PFE — Démo)" />
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="procedure">Procédure administrative</option>
              <option value="calendar">Calendrier universitaire</option>
              <option value="scholarship">Bourses & Aides</option>
              <option value="regulation">Règlement intérieur</option>
            </Select>
          </div>
          <Textarea required rows={4} value={contentText} onChange={(e) => setContentText(e.target.value)} placeholder="Contenu textuel officiel / spécimen..." />
          <Button type="submit">Ajouter & Indexer pour l&apos;Assistant IA</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {docs.map((d) => (
          <Card key={d.id} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">{d.title}</h3>
              <Badge variant={d.category === "historical" ? "warning" : "primary"}>{d.category}</Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">{d.contentText}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
