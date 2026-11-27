"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Users, XCircle } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Select } from "@/components/ui/primitives";
import type { UserProfile } from "@/types/domain";

export default function AdminUsersPage() {
  const { notify } = useApp();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users || []);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, [load]);

  async function verifyUser(u: UserProfile, decision: "approved" | "rejected") {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_user",
        userId: u.id,
        isVerified: decision === "approved",
        approvalStatus: decision,
      }),
    });
    if (res.ok) {
      notify(
        decision === "approved"
          ? `Compte ${u.fullName} approuvé.`
          : `Compte ${u.fullName} refusé.`,
        decision === "approved" ? "success" : "info"
      );
      await load();
    }
  }

  async function toggleSuspend(u: UserProfile) {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suspend_user", userId: u.id, isSuspended: !u.isSuspended }),
    });
    if (res.ok) {
      notify("Statut du compte mis à jour.", "info");
      await load();
    }
  }

  const pendingUsers = users.filter((u) => u.approvalStatus === "pending" || (!u.isDemoAccount && !u.isVerified && u.approvalStatus !== "rejected"));
  const filteredUsers =
    filter === "all"
      ? users
      : users.filter((u) => (u.approvalStatus || (u.isVerified ? "approved" : "pending")) === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" /> Comptes &amp; Rôles Plateforme
        </h1>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "pending" | "approved" | "rejected")}
          className="w-48"
        >
          <option value="all">Tous les comptes ({users.length})</option>
          <option value="pending">En attente ({pendingUsers.length})</option>
          <option value="approved">Approuvés</option>
          <option value="rejected">Refusés</option>
        </Select>
      </div>

      {pendingUsers.length > 0 && (
        <Card className="p-4 border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Clock className="w-4 h-4" />
            Demandes en attente de validation ({pendingUsers.length})
          </div>
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white dark:bg-slate-900 p-3 border border-amber-200 dark:border-amber-800/50"
              >
                <div>
                  <p className="font-semibold text-sm">{u.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {u.email} • Rôle : <strong>{u.role}</strong> • {u.institutionName || "Global"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => void verifyUser(u, "approved")}>
                    <CheckCircle2 className="w-3.5 h-3.5 me-1" /> Approuver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void verifyUser(u, "rejected")}>
                    <XCircle className="w-3.5 h-3.5 me-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filteredUsers.map((u) => {
          const status = u.approvalStatus || (u.isVerified ? "approved" : "pending");
          return (
            <Card key={u.id} className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-semibold">{u.fullName}</p>
                <p className="text-xs text-slate-500">{u.email} • {u.institutionName || "Global"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">{u.role}</Badge>
                <Badge
                  variant={
                    status === "approved"
                      ? "success"
                      : status === "rejected"
                        ? "danger"
                        : "warning"
                  }
                >
                  {status === "approved" ? "Approuvé" : status === "rejected" ? "Refusé" : "En attente"}
                </Badge>
                <Badge variant={u.isSuspended ? "danger" : "default"}>
                  {u.isSuspended ? "Suspendu" : "Actif"}
                </Badge>
                {u.role !== "super_admin" && status !== "approved" && (
                  <Button size="sm" onClick={() => void verifyUser(u, "approved")}>
                    Approuver
                  </Button>
                )}
                {u.role !== "super_admin" && (
                  <Button size="sm" variant="outline" onClick={() => toggleSuspend(u)}>
                    {u.isSuspended ? "Réactiver" : "Suspendre"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
