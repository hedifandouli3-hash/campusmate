"use client";

import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui/primitives";
import type { UserProfile } from "@/types/domain";

export default function StudentProfilePage() {
  const { notify } = useApp();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setBio(data.user.bio || "");
          setSkills((data.user.skills || []).join(", "));
        }
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    if (res.ok) notify("Profil mis à jour.", "success");
  }

  if (!user) return <Card>Chargement...</Card>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="w-6 h-6 text-blue-600" /> Mon Profil Académique
      </h1>
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{user.institutionName}</Badge>
          <Badge variant="indigo">{user.departmentName}</Badge>
          <Badge variant="success">{user.sectionName}</Badge>
        </div>
        <p className="font-semibold text-lg">{user.fullName}</p>
        <p className="text-xs text-slate-500">{user.email} • {user.academicYearLabel}</p>
      </Card>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium">Présentation</label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Compétences (séparées par virgules)</label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
          </div>
          <Button type="submit">Enregistrer les modifications</Button>
        </form>
      </Card>
    </div>
  );
}
