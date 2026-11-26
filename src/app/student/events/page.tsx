"use client";

import React, { useEffect, useState } from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import type { CampusEvent } from "@/types/domain";

export default function StudentEventsPage() {
  const { locale, notify } = useApp();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [myId, setMyId] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const [meRes, commRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/community")]);
    if (meRes.ok) {
      const me = await meRes.json();
      setMyId(me.user?.id || "");
    }
    if (commRes.ok) {
      const data = await commRes.json();
      setEvents(data.events || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function toggleRegister(eventId: string) {
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: "events", action: "register", id: eventId }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Erreur.", "error");
      return;
    }
    notify("Inscription mise à jour !", "success");
    load();
  }

  const filtered = events.filter((e) =>
    `${e.title} ${e.category} ${e.description}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" /> Événements & Clubs Universitaires
        </h1>
        <p className="text-sm text-slate-500">Hackathons, ateliers, conférences et activités étudiantes.</p>
      </div>

      <Input placeholder="Rechercher un événement..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid md:grid-cols-2 gap-5">
        {filtered.map((ev) => {
          const isRegistered = ev.registeredUserIds.includes(myId);
          const full = ev.registeredUserIds.length >= ev.capacity;
          return (
            <Card key={ev.id} className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant="indigo">{ev.category}</Badge>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {ev.registeredUserIds.length} / {ev.capacity}
                  </span>
                </div>
                <h2 className="font-semibold text-lg">{ev.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{ev.description}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {ev.location} • {formatDateTime(ev.eventDate, locale)}
                </p>
              </div>
              <Button
                variant={isRegistered ? "outline" : "primary"}
                disabled={!isRegistered && full}
                onClick={() => toggleRegister(ev.id)}
              >
                {isRegistered ? "Inscrit (Se désinscrire)" : full ? "Complet" : "S'inscrire à l'événement"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
