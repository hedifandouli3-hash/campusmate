"use client";

import React, { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { QueueService, QueueTicket } from "@/types/domain";

export default function AdminQueuesPage() {
  const { notify } = useApp();
  const [services, setServices] = useState<QueueService[]>([]);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);

  async function load() {
    const res = await fetch("/api/queues");
    if (res.ok) {
      const d = await res.json();
      setServices(d.services || []);
      setTickets(d.tickets || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function callNext(queueId: string) {
    const res = await fetch("/api/queues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "call_next", queueId }),
    });
    const d = await res.json();
    if (res.ok) {
      notify(d.calledTicket ? `Ticket appelé : ${d.calledTicket.ticketCode}` : "Aucun ticket en attente.", "info");
      load();
    }
  }

  async function toggleOpen(queueId: string) {
    await fetch("/api/queues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_open", queueId }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Ticket className="w-6 h-6 text-blue-600" /> Gestion des Files d&apos;Attente
      </h1>
      <div className="grid md:grid-cols-2 gap-5">
        {services.map((s) => {
          const queueTickets = tickets.filter((t) => t.queueId === s.id && t.status === "waiting");
          return (
            <Card key={s.id} className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{s.name}</h2>
                  <p className="text-xs text-slate-500">{s.location} • Actuel : #{s.currentTicketNumber}</p>
                </div>
                <Badge variant={s.isOpen ? "success" : "danger"}>{s.isOpen ? "Ouvert" : "Fermé"}</Badge>
              </div>
              <p className="text-xs text-slate-500">{queueTickets.length} ticket(s) en attente</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => callNext(s.id)}>Appeler le suivant</Button>
                <Button size="sm" variant="outline" onClick={() => toggleOpen(s.id)}>
                  {s.isOpen ? "Fermer" : "Ouvrir"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
