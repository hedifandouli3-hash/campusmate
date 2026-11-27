"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Calendar, CheckCircle2, Mail, ShieldCheck, Users } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import type { ClubProfile } from "@/types/domain";

export default function StudentClubsPage() {
  const { notify } = useApp();
  const [clubs, setClubs] = useState<ClubProfile[]>([]);
  const [myId, setMyId] = useState("");

  const load = useCallback(async () => {
    const [clubsRes, meRes] = await Promise.all([fetch("/api/clubs"), fetch("/api/auth/me")]);
    if (clubsRes.ok) {
      const d = await clubsRes.json();
      setClubs(d.clubs || []);
    }
    if (meRes.ok) {
      const me = await meRes.json();
      setMyId(me.user?.id || "");
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function toggleMembership(clubId: string) {
    const res = await fetch("/api/clubs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_membership", clubId }),
    });
    if (res.ok) {
      notify("Adhésion au club mise à jour.", "success");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clubs & Associations Reconnus"
        description="Découvrez les clubs officiels de votre université, suivez leurs activités et rejoignez une communauté."
        badge="Vie Étudiante"
      />

      {clubs.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="Aucun club enregistré"
            description="Les clubs reconnus par votre établissement apparaîtront ici."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map((c) => {
            const isMember = myId ? c.memberIds.includes(myId) : false;
            return (
              <Card key={c.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge>{c.category}</Badge>
                    {c.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> Reconnu
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-base text-slate-900 dark:text-white">{c.name}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>
                  <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5" /> {c.upcomingActivity}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {c.contactEmail} • {c.memberIds.length} membre(s)
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isMember ? "secondary" : "primary"}
                  onClick={() => void toggleMembership(c.id)}
                >
                  {isMember ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 me-1.5" /> Membre (Quitter)
                    </>
                  ) : (
                    "Rejoindre le club"
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
