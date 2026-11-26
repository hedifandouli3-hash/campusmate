"use client";

import React, { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui/primitives";
import type { Announcement } from "@/types/domain";

export default function TeacherAnnouncementsPage() {
  const { notify } = useApp();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPinned, setIsPinned] = useState(true);

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const data = await res.json();
      setAnnouncements(data.announcements || []);
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
      body: JSON.stringify({ module: "announcements", title, body, isPinned }),
    });
    if (res.ok) {
      notify("Annonce publiée et notifications envoyées !", "success");
      setTitle("");
      setBody("");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-blue-600" /> Annonces Pédagogiques
      </h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'annonce..." />
          <Textarea required rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Contenu de l'annonce (ex: report séance, consignes TP)..." />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
            <span>Épingler cette annonce</span>
          </label>
          <Button type="submit">Publier l&apos;annonce</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id} className="space-y-1">
            <div className="flex justify-between">
              <h2 className="font-semibold">{a.title}</h2>
              {a.isPinned && <Badge variant="warning">Épinglée</Badge>}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{a.body}</p>
            <p className="text-xs text-slate-400">Par {a.authorName}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
