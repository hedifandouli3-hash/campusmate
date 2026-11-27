"use client";

import React, { useEffect, useState } from "react";
import { Handshake, Send } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader } from "@/components/ui/primitives";
import type { LaunchpadMentorshipItem } from "@/types/domain";

export default function LaunchpadMentorshipPage() {
  const { notify } = useApp();
  const [items, setItems] = useState<LaunchpadMentorshipItem[]>([]);
  const [projectTitle, setProjectTitle] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/launchpad");
    if (res.ok) {
      const data = await res.json();
      setItems(data.mentorships || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function apply(id: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "mentorship",
        action: "apply",
        id,
        projectTitle: projectTitle[id] || "Mon projet Launchpad",
        message: message[id] || "Souhaite participer à cet accompagnement.",
      }),
    });
    if (res.ok) {
      notify("Candidature / inscription enregistrée !", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Écosystème & Accompagnement</Badge>}
        title="Mentorat, Défis & Entrepreneuriat"
        description="Défis pratiques publiés par les enseignants, ateliers d'accompagnement et challenges d'organisations vérifiées."
      />

      <LaunchpadNav />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((m) => (
          <Card key={m.id} className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="primary">{m.kind}</Badge>
                {m.isDemoSample && <Badge variant="warning">Exemple de démonstration</Badge>}
              </div>
              <h3 className="font-semibold text-sm">{m.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">{m.description}</p>
              <p className="text-[11px] text-slate-500">
                <Handshake className="w-3.5 h-3.5 inline me-1" />
                {m.authorName} • {m.relatedDiscipline}
              </p>
              <p className="text-[11px] text-slate-400">{m.eligibilityNote}</p>
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Input
                value={projectTitle[m.id] || ""}
                onChange={(e) => setProjectTitle((p) => ({ ...p, [m.id]: e.target.value }))}
                placeholder="Titre de votre projet..."
              />
              <div className="flex gap-2">
                <Input
                  value={message[m.id] || ""}
                  onChange={(e) => setMessage((p) => ({ ...p, [m.id]: e.target.value }))}
                  placeholder="Message court..."
                />
                <Button type="button" size="sm" onClick={() => apply(m.id)}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
