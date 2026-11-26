"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Ticket } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { QueueService, QueueTicket } from "@/types/domain";

export default function StudentQueuePage() {
  const { notify } = useApp();
  const [services, setServices] = useState<QueueService[]>([]);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);

  async function load() {
    const res = await fetch("/api/queues");
    if (res.ok) {
      const data = await res.json();
      setServices(data.services || []);
      setTickets(data.tickets || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    const timer = setInterval(load, 6000);
    return () => {
      clearTimeout(id);
      clearInterval(timer);
    };
  }, []);

  async function joinQueue(queueId: string) {
    const res = await fetch("/api/queues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueId }),
    });
    const data = await res.json();
    if (res.ok) {
      notify(`Ticket attribué : ${data.ticket.ticketCode}`, "success");
      load();
    } else {
      notify(data.error || "Erreur.", "error");
    }
  }

  async function cancelTicket(ticketId: string) {
    await fetch("/api/queues", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel_ticket", ticketId }),
    });
    notify("Ticket annulé.", "info");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" /> File d&apos;Attente Digitale
          </h1>
          <p className="text-sm text-slate-500">
            Prenez un ticket virtuel sans vous déplacer au guichet. Les temps d&apos;attente sont des estimations indicatives.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Actualiser
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {services.map((srv) => {
          const waitingForQueue = tickets.filter(
            (t) => t.queueId === srv.id && t.status === "waiting"
          );
          const myTicket = tickets.find(
            (t) => t.queueId === srv.id && (t.status === "waiting" || t.status === "called")
          );
          const aheadCount = myTicket
            ? waitingForQueue.filter((t) => t.ticketNumber < myTicket.ticketNumber).length
            : waitingForQueue.length;
          const estimatedWait = aheadCount * srv.avgServiceMinutes;

          return (
            <Card key={srv.id} className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-lg">{srv.name}</h2>
                  <p className="text-xs text-slate-500">{srv.location}</p>
                </div>
                <Badge variant={srv.isOpen ? "success" : "danger"}>
                  {srv.isOpen ? "Ouvert" : "Fermé"}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{srv.description}</p>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-center">
                <div>
                  <p className="text-[11px] text-slate-500">Ticket appelé</p>
                  <p className="text-lg font-bold text-blue-600">#{srv.currentTicketNumber}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">En attente</p>
                  <p className="text-lg font-bold">{waitingForQueue.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Attente estimée</p>
                  <p className="text-lg font-bold">~{estimatedWait} min</p>
                </div>
              </div>

              {myTicket ? (
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Votre ticket : {myTicket.ticketCode}</p>
                    <p className="text-xs text-slate-500">
                      Statut : {myTicket.status === "called" ? "C'est votre tour !" : `${aheadCount} personne(s) devant vous`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => cancelTicket(myTicket.id)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button disabled={!srv.isOpen} onClick={() => joinQueue(srv.id)} className="w-full">
                  Prendre un ticket virtuel
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
