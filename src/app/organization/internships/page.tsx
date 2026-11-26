"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { InternshipOffer } from "@/types/domain";

export default function OrganizationInternshipsPage() {
  const { notify } = useApp();
  const [offers, setOffers] = useState<InternshipOffer[]>([]);

  async function load() {
    const res = await fetch("/api/internships");
    if (res.ok) {
      const d = await res.json();
      setOffers(d.offers || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function setStatus(offerId: string, status: "published" | "closed" | "draft") {
    const res = await fetch("/api/internships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_offer_status", offerId, status }),
    });
    if (res.ok) {
      notify(`Offre mise à jour (${status}).`, "success");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-600" /> Offres de Stage
        </h1>
        <Link href="/organization/internships/new" className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          <Plus className="w-4 h-4" /> Nouvelle offre
        </Link>
      </div>

      <div className="space-y-4">
        {offers.map((o) => (
          <Card key={o.id} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/organization/internships/${o.id}`} className="font-semibold hover:text-blue-600">
                  {o.title}
                </Link>
                <Badge variant={o.status === "published" ? "success" : "default"}>{o.status}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {o.internshipType} • {o.location} • Date limite : {o.deadline}
              </p>
            </div>
            <div className="flex gap-2">
              {o.status !== "published" && (
                <Button size="sm" onClick={() => setStatus(o.id, "published")}>Publier</Button>
              )}
              {o.status === "published" && (
                <Button size="sm" variant="outline" onClick={() => setStatus(o.id, "closed")}>Clôturer</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
