"use client";

import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select, Textarea } from "@/components/ui/primitives";
import type { CampusEvent } from "@/types/domain";

export default function AdminEventsPage() {
  const { notify } = useApp();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("workshop");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState(60);
  const [description, setDescription] = useState("");

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const d = await res.json();
      setEvents(d.events || []);
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
      body: JSON.stringify({
        module: "events",
        action: "create",
        title,
        category,
        location,
        capacity: Number(capacity),
        description,
      }),
    });
    if (res.ok) {
      notify("Événement publié !", "success");
      setTitle("");
      setLocation("");
      setDescription("");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Calendar className="w-6 h-6 text-indigo-600" /> Événements Universitaires
      </h1>
      <Card>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'événement" />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="hackathon">Hackathon</option>
            <option value="workshop">Atelier</option>
            <option value="conference">Conférence</option>
            <option value="club">Club étudiant</option>
            <option value="cultural">Culturel</option>
          </Select>
          <Input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lieu (ex: Amphi 1)" />
          <Input type="number" min="5" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} placeholder="Capacité" />
          <Textarea className="sm:col-span-2" rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." />
          <div><Button type="submit">Publier l&apos;événement</Button></div>
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {events.map((ev) => (
          <Card key={ev.id} className="space-y-1">
            <div className="flex justify-between">
              <Badge variant="indigo">{ev.category}</Badge>
              <span className="text-xs text-slate-500">{ev.registeredUserIds.length} / {ev.capacity} inscrits</span>
            </div>
            <h2 className="font-semibold">{ev.title}</h2>
            <p className="text-xs text-slate-500">{ev.location}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
