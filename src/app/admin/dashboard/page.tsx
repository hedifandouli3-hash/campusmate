"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import type { AuditLog, ContentReport, Institution, Organization, UserProfile } from "@/types/domain";

export default function SuperAdminDashboardPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => {
        setInstitutions(d.institutions || []);
        setUsers(d.users || []);
        setOrgs(d.organizations || []);
        setReports(d.reports || []);
        setLogs(d.auditLogs || []);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="cm-card p-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <Badge variant="primary">Gouvernance Plateforme Multi-Tenant</Badge>
          <h1 className="text-2xl font-bold mt-1">Super Administration CampusMate</h1>
          <p className="text-sm text-slate-500">Supervision des universités, comptes, organisations et journaux d&apos;audit.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Universités</p>
          <p className="text-3xl font-bold mt-1">{institutions.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Comptes plateforme</p>
          <p className="text-3xl font-bold mt-1">{users.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Organisations</p>
          <p className="text-3xl font-bold mt-1">{orgs.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> Signalements ouverts</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{reports.filter((r) => r.status === "open").length}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-sm">Derniers événements d&apos;audit</h2>
          <Link href="/admin/audit-logs" className="text-xs text-blue-600 hover:underline">Voir tout</Link>
        </div>
        {logs.slice(0, 6).map((l) => (
          <div key={l.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs flex justify-between gap-2">
            <div>
              <span className="font-mono font-semibold text-blue-600">{l.action}</span> — {l.actorName}
              <p className="text-slate-500">{l.details}</p>
            </div>
            <span className="text-slate-400 shrink-0">{l.resourceType}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
