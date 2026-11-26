"use client";

import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import type { AuditLog } from "@/types/domain";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => setLogs(d.auditLogs || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-blue-600" /> Journaux d&apos;Audit de Sécurité
      </h1>
      <Card className="space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs flex flex-wrap justify-between gap-2">
            <div>
              <span className="font-mono font-semibold text-blue-600">{l.action}</span> • {l.actorName}
              <p className="text-slate-500">{l.details}</p>
            </div>
            <span className="text-slate-400 font-mono">{l.createdAt.slice(0, 19).replace("T", " ")}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
