"use client";

import React, { useEffect, useState } from "react";
import { Bus, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { ApprovedCarpoolOffer, TransportInfo } from "@/types/domain";

export default function StudentTransportPage() {
  const { notify } = useApp();
  const [info, setInfo] = useState<TransportInfo[]>([]);
  const [carpools, setCarpools] = useState<ApprovedCarpoolOffer[]>([]);
  const [departureArea, setDepartureArea] = useState("");
  const [departureWindow, setDepartureWindow] = useState("");
  const [availableSeats, setAvailableSeats] = useState(2);

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const data = await res.json();
      setInfo(data.transportInfo || []);
      setCarpools(data.carpoolOffers || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleAddCarpool(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "transport",
        departureArea,
        destinationArea: "Campus ISET Béja",
        departureWindow,
        availableSeats: Number(availableSeats),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Erreur.", "error");
      return;
    }
    notify("Trajet démo publié (sous validation institutionnelle).", "success");
    setDepartureArea("");
    setDepartureWindow("");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bus className="w-6 h-6 text-emerald-600" /> Transport Universitaire & Coordination
        </h1>
        <p className="text-sm text-slate-500">
          Horaires de navettes et covoiturage universitaire de démonstration (aucune adresse privée ni géolocalisation continue exposée).
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {info.map((t) => (
          <Card key={t.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <Badge variant="primary">{t.transportType}</Badge>
              <Badge variant="warning">Démo indicative</Badge>
            </div>
            <h2 className="font-semibold">{t.title}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">{t.routeSummary}</p>
            <p className="text-xs font-medium text-emerald-600">{t.scheduleSummary}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Covoiturage encadré (Adultes vérifiés — Démo)
          </h2>
          <Badge variant="warning">Données Démonstration</Badge>
        </div>

        <form onSubmit={handleAddCarpool} className="grid sm:grid-cols-3 gap-3">
          <Input required value={departureArea} onChange={(e) => setDepartureArea(e.target.value)} placeholder="Zone générale de départ (ex: Béja Gare)" />
          <Input required value={departureWindow} onChange={(e) => setDepartureWindow(e.target.value)} placeholder="Créneau (ex: 08h00 - 08h15)" />
          <div className="flex gap-2">
            <Input type="number" min="1" max="4" value={availableSeats} onChange={(e) => setAvailableSeats(Number(e.target.value))} />
            <Button type="submit">Proposer</Button>
          </div>
        </form>

        <div className="grid md:grid-cols-2 gap-3">
          {carpools.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs space-y-1">
              <p className="font-semibold">{c.departureArea} → {c.destinationArea}</p>
              <p className="text-slate-500">Conducteur : {c.driverName} • {c.departureWindow}</p>
              <Badge variant="success">{c.availableSeats} place(s) • Approuvé démo</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
