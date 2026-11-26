"use client";

import React, { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card } from "@/components/ui/primitives";
import type { Organization } from "@/types/domain";

export default function AdminOrganizationsPage() {
  const { notify } = useApp();
  const [orgs, setOrgs] = useState<Organization[]>([]);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setOrgs(d.organizations || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function verifyOrg(organizationId: string, status: "verified" | "rejected") {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_org", organizationId, status }),
    });
    if (res.ok) {
      notify(`Organisation ${status}.`, "success");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-blue-600" /> Vérification des Organisations
      </h1>
      <div className="space-y-3">
        {orgs.map((o) => (
          <Card key={o.id} className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="font-semibold">{o.name}</p>
              <p className="text-xs text-slate-500">{o.sector} • {o.city} • {o.contactEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={o.verificationStatus === "verified" ? "success" : "warning"}>{o.verificationStatus}</Badge>
              <Button size="sm" onClick={() => verifyOrg(o.id, "verified")}>Vérifier</Button>
              <Button size="sm" variant="danger" onClick={() => verifyOrg(o.id, "rejected")}>Rejeter</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
