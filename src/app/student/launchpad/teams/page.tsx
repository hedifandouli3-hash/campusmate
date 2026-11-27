"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquare, Plus, Users, XCircle } from "lucide-react";
import { LaunchpadNav } from "@/components/launchpad/launchpad-nav";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, PageHeader, Textarea } from "@/components/ui/primitives";
import type { LaunchpadTeam } from "@/types/domain";

export default function LaunchpadTeamsPage() {
  const { notify } = useApp();
  const [teams, setTeams] = useState<LaunchpadTeam[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requiredRoles, setRequiredRoles] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [joinRole, setJoinRole] = useState<Record<string, string>>({});

  async function load() {
    const [res, me] = await Promise.all([fetch("/api/launchpad"), fetch("/api/auth/me")]);
    if (res.ok) {
      const data = await res.json();
      setTeams(data.teams || []);
    }
    if (me.ok) {
      const m = await me.json();
      if (m?.user?.id) setCurrentUserId(m.user.id);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "team",
        action: "create",
        projectTitle,
        description,
        requiredRoles,
        requiredSkills,
      }),
    });
    if (res.ok) {
      setProjectTitle("");
      setDescription("");
      setRequiredRoles("");
      setRequiredSkills("");
      notify("Équipe créée avec espace de discussion académique privé !", "success");
      await load();
    }
  }

  async function requestJoin(teamId: string) {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "team",
        action: "request_join",
        id: teamId,
        role: joinRole[teamId] || "Développeur / Contributeur",
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      notify("Demande d'adhésion envoyée au porteur de projet.", "success");
      await load();
    } else {
      notify(data?.error || "Impossible d'envoyer la demande.", "error");
    }
  }

  async function reviewRequest(teamId: string, requestId: string, decision: "accepted" | "rejected") {
    const res = await fetch("/api/launchpad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "team", action: "review_request", id: teamId, requestId, decision }),
    });
    if (res.ok) {
      notify(decision === "accepted" ? "Membre accepté dans l'équipe." : "Demande refusée.", "info");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge={<Badge variant="indigo">Collaboration Académique</Badge>}
        title="Constructeur d'Équipes Startup"
        description="Formez des équipes pluridisciplinaires au sein de votre université. Aucune adhésion automatique sans accord du porteur de projet."
      />

      <LaunchpadNav />

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold">Publier un projet & recruter des compétences complémentaires</h2>
        <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-3">
          <Input required value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Nom du projet (ex: Smart Energy Platform)" />
          <Input value={requiredRoles} onChange={(e) => setRequiredRoles(e.target.value)} placeholder="Rôles recherchés (ex: Génie Élec, Marketing, UI/UX)" />
          <Input className="sm:col-span-2" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} placeholder="Compétences requises (séparées par virgule)" />
          <Textarea className="sm:col-span-2" rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du projet et objectifs..." />
          <div>
            <Button type="submit">
              <Plus className="w-4 h-4 me-1.5" /> Créer l&apos;équipe
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {teams.map((team) => {
          const isMember = team.members.some((m) => m.userId === currentUserId);
          const isLeader = team.leaderId === currentUserId;
          return (
            <Card key={team.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{team.projectTitle}</h3>
                  <p className="text-xs text-slate-500">Porteur : {team.leaderName}</p>
                </div>
                <Badge variant="primary">
                  <Users className="w-3 h-3 me-1 inline" /> {team.members.length} membre(s)
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{team.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {team.requiredRoles.map((r) => (
                  <Badge key={r} variant="indigo">{r}</Badge>
                ))}
              </div>
              {isMember && team.chatGroupId && (
                <Link href={`/student/chats/${team.chatGroupId}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline">
                  <MessageSquare className="w-3.5 h-3.5" /> Ouvrir le groupe de discussion d&apos;équipe
                </Link>
              )}
              {!isMember && (
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Input
                    value={joinRole[team.id] || ""}
                    onChange={(e) => setJoinRole((p) => ({ ...p, [team.id]: e.target.value }))}
                    placeholder="Votre rôle proposé..."
                  />
                  <Button type="button" size="sm" onClick={() => requestJoin(team.id)}>
                    Postuler
                  </Button>
                </div>
              )}
              {isLeader && team.joinRequests.filter((r) => r.status === "pending").length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold">Demandes en attente :</p>
                  {team.joinRequests
                    .filter((r) => r.status === "pending")
                    .map((req) => (
                      <div key={req.id} className="flex items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                        <span>{req.fullName} ({req.role})</span>
                        <div className="flex gap-1">
                          <Button type="button" size="sm" onClick={() => reviewRequest(team.id, req.id, "accepted")}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => reviewRequest(team.id, req.id, "rejected")}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
