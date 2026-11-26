"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { Organization } from "@/types/domain";

export default function OrganizationVerificationPage() {
  const { notify } = useApp();
  const [org, setOrg] = useState<Organization | null>(null);
  const [regNum, setRegNum] = useState("");

  useEffect(() => {
    fetch("/api/internships")
      .then((r) => r.json())
      .then((d) => {
        setOrg(d.organization || null);
        setRegNum(d.organization?.registrationNumber || "");
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/internships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_org_profile", registrationNumber: regNum }),
    });
    if (res.ok) notify("Informations de vérification soumises.", "success");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-emerald-600" /> Vérification Organisation
      </h1>
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Statut de vérification</span>
          <Badge variant={org?.verificationStatus === "verified" ? "success" : "warning"}>
            {org?.verificationStatus || "pending"}
          </Badge>
        </div>
        <p className="text-xs text-slate-500">
          Les organisations doivent être vérifiées par le Super Administrateur avant que leurs offres de stage soient visibles publiquement aux étudiants.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input value={regNum} onChange={(e) => setRegNum(e.target.value)} placeholder="Numéro RC / Matricule fiscal (démo)" />
          <Button type="submit">Mettre à jour le dossier</Button>
        </form>
      </Card>
    </div>
  );
}
