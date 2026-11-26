"use client";

import React, { useEffect, useState } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { KnowledgeDocument } from "@/types/domain";

export default function AdminKnowledgeBasePage() {
  const { notify } = useApp();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("procedure");
  const [contentText, setContentText] = useState("");
  const [syncing, setSyncing] = useState(false);

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
      load();
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
      load();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-600" /> Base de Connaissances IA Officielle
          </h1>
          <p className="text-sm text-slate-500">
            Ces documents alimentent l&apos;Assistant Universitaire RAG (incluant les pages publiques officielles de isetb.rnu.tn).
          </p>
        </div>
        <Button onClick={handleSyncWebsite} disabled={syncing} variant="secondary">
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Synchronisation..." : "Synchroniser depuis isetb.rnu.tn"}</span>
        </Button>
      </div>

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
        {docs.map((k) => (
          <Card key={k.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{k.title}</h2>
              <div className="flex gap-2">
                <Badge variant="indigo">{k.category}</Badge>
                <Badge variant={k.isDemoSample ? "default" : "success"}>
                  {k.isDemoSample ? "Document Interne" : "Officiel isetb.rnu.tn"}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{k.contentText}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
