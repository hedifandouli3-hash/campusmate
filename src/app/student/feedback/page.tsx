"use client";

import React, { useEffect, useState } from "react";
import { Lock, MessageCircleWarning } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { FeedbackReport } from "@/types/domain";

export default function StudentVoicePage() {
  const { notify } = useApp();
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [category, setCategory] = useState("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const data = await res.json();
      setReports(data.feedback || []);
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
        module: "feedback",
        category,
        title,
        description,
        isConfidential,
      }),
    });
    if (res.ok) {
      notify("Contribution envoyée à l'administration !", "success");
      setTitle("");
      setDescription("");
      setIsConfidential(false);
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircleWarning className="w-6 h-6 text-blue-600" /> Voix Étudiante — Suggestions & Signalements
        </h1>
        <p className="text-sm text-slate-500">
          Les soumissions confidentielles ne sont visibles que par vous et les administrateurs autorisés de votre établissement.
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold text-sm">Nouvelle soumission</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="suggestion">Suggestion d&apos;amélioration</option>
              <option value="facility">Infrastructure / Salle</option>
              <option value="academic">Service académique</option>
              <option value="administrative">Service administratif</option>
              <option value="complaint">Réclamation</option>
            </Select>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Objet court..." />
          </div>
          <Textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Décrivez votre suggestion ou signalement..." />
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input type="checkbox" checked={isConfidential} onChange={(e) => setIsConfidential(e.target.checked)} />
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Marquer comme confidentiel (invisible aux autres étudiants)</span>
          </label>
          <Button type="submit">Envoyer</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {reports.map((fb) => (
          <Card key={fb.id} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{fb.title}</h3>
              <div className="flex items-center gap-2">
                {fb.isConfidential && <Badge variant="warning">Confidentiel</Badge>}
                <Badge variant="primary">{fb.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{fb.description}</p>
            <p className="text-xs text-slate-400">Par {fb.authorName} • Catégorie : {fb.category}</p>
            {fb.responses.map((resp, idx) => (
              <div key={idx} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs">
                <strong>{resp.responderName} :</strong> {resp.message}
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
