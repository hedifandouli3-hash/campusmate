"use client";

import React, { useEffect, useState } from "react";
import { DoorOpen } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Select } from "@/components/ui/primitives";
import type { CampusRoom, RoomReservation } from "@/types/domain";

export default function StudyRoomsPage() {
  const { notify } = useApp();
  const [rooms, setRooms] = useState<CampusRoom[]>([]);
  const [reservations, setReservations] = useState<RoomReservation[]>([]);
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("16:00");
  const [purpose, setPurpose] = useState("");
  const [minCap, setMinCap] = useState(0);

  async function load() {
    const res = await fetch("/api/community");
    if (res.ok) {
      const data = await res.json();
      setRooms(data.rooms || []);
      setReservations(data.reservations || []);
      setRoomId((prev) => prev || data.rooms?.[0]?.id || "");
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleReserve(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "rooms",
        roomId,
        reservationDate: date,
        startTime,
        endTime,
        purpose,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.error || "Conflit de réservation.", "error");
      return;
    }
    notify("Salle réservée avec succès !", "success");
    setPurpose("");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DoorOpen className="w-6 h-6 text-emerald-600" /> Salles de Classe & Salles d&apos;Étude
        </h1>
        <p className="text-sm text-slate-500">
          Disponibilité basée sur les plannings et réservations confirmées (anti-conflit serveur).
        </p>
      </div>

      <Card className="space-y-4">
        <h2 className="font-semibold text-sm">Réserver une salle</h2>
        <form onSubmit={handleReserve} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.capacity} pl.)</option>
            ))}
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          <Input required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Motif (ex: Travail groupe PFE)" />
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit">Confirmer la réservation</Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium">Capacité min :</label>
        <Input type="number" className="w-28" value={minCap} onChange={(e) => setMinCap(Number(e.target.value))} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {rooms
          .filter((r) => r.capacity >= minCap)
          .map((room) => (
            <Card key={room.id} className="space-y-2">
              <div className="flex justify-between">
                <h3 className="font-semibold">{room.name}</h3>
                <Badge variant="primary">{room.capacity} places</Badge>
              </div>
              <p className="text-xs text-slate-500">{room.building} • {room.openingHours}</p>
              <div className="space-y-1 pt-1">
                {room.schedules.map((s, idx) => (
                  <p key={idx} className="text-xs text-slate-600 dark:text-slate-300">
                    • Créneau fixe : {s.startTime} - {s.endTime} ({s.label})
                  </p>
                ))}
              </div>
            </Card>
          ))}
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold text-sm">Réservations enregistrées</h2>
        {reservations.map((res) => (
          <div key={res.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">{res.roomName} — {res.purpose}</p>
              <p className="text-slate-500">{res.reservationDate} • {res.startTime} - {res.endTime} • Par {res.requesterName}</p>
            </div>
            <Badge variant={res.status === "confirmed" ? "success" : "default"}>{res.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
