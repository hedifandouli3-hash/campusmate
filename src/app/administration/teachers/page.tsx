"use client";

import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { UserProfile } from "@/types/domain";

export default function AdminTeachersPage() {
  const { notify } = useApp();
  const [users, setUsers] = useState<UserProfile[]>([]);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setUsers((d.users || []).filter((u: UserProfile) => u.role === "teacher"));
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function toggleVerify(u: UserProfile) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_user", userId: u.id, isVerified: !u.isVerified }),
    });
    notify("Statut enseignant mis à jour.", "success");
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-indigo-600" /> Enseignants
      </h1>
      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <p className="font-semibold">{u.fullName}</p>
              <p className="text-xs text-slate-500">{u.email} • {u.departmentName || "Département"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={u.isVerified ? "success" : "warning"}>{u.isVerified ? "Vérifié" : "En attente"}</Badge>
              <Button size="sm" variant="outline" onClick={() => toggleVerify(u)}>
                {u.isVerified ? "Retirer vérif." : "Vérifier"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
