"use client";

import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { UserProfile } from "@/types/domain";

export default function AdminUsersPage() {
  const { notify } = useApp();
  const [users, setUsers] = useState<UserProfile[]>([]);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function toggleSuspend(u: UserProfile) {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "suspend_user", userId: u.id, isSuspended: !u.isSuspended }),
    });
    if (res.ok) {
      notify("Statut du compte mis à jour.", "info");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-600" /> Comptes & Rôles Plateforme
      </h1>
      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="font-semibold">{u.fullName}</p>
              <p className="text-xs text-slate-500">{u.email} • {u.institutionName || "Global"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary">{u.role}</Badge>
              <Badge variant={u.isSuspended ? "danger" : "success"}>{u.isSuspended ? "Suspendu" : "Actif"}</Badge>
              {u.role !== "super_admin" && (
                <Button size="sm" variant="outline" onClick={() => toggleSuspend(u)}>
                  {u.isSuspended ? "Réactiver" : "Suspendre"}
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
