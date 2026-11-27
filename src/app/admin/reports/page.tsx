"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";
import type { ContentReport, UserProfile } from "@/types/domain";

interface PendingPostItem {
  id: string;
  module: "marketplace" | "lost_found" | "promotions";
  title: string;
  authorName: string;
  summary: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const { notify } = useApp();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [pendingPosts, setPendingPosts] = useState<PendingPostItem[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.ok) {
      const d = await res.json();
      setReports(d.reports || []);
      setPendingPosts(d.pendingPosts || []);
      setPendingUsers(
        (d.users || []).filter(
          (u: UserProfile) => u.approvalStatus === "pending" || (!u.isDemoAccount && !u.isVerified)
        )
      );
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function resolve(reportId: string, status: "action_taken" | "dismissed") {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resolve_report", reportId, status }),
    });
    notify("Signalement traité.", "success");
    await load();
  }

  async function moderatePost(item: PendingPostItem, decision: "approved" | "rejected") {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "moderate_post", module: item.module, id: item.id, decision }),
    });
    if (res.ok) {
      notify(decision === "approved" ? "Publication approuvée et visible à tous." : "Publication refusée.", "info");
      await load();
    }
  }

  async function verifyUser(userId: string, approve: boolean) {
    const res = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "verify_user",
        userId,
        isVerified: approve,
        approvalStatus: approve ? "approved" : "rejected",
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      notify(approve ? "Compte vérifié et activé." : "Compte refusé.", "success");
      await load();
    } else {
      notify(data?.error || "Action non autorisée pour ce rôle.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-rose-600" /> Vérification Comptes, Publications & Modération
      </h1>

      {/* Pending Accounts */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Comptes en attente de vérification ({pendingUsers.length})</h2>
          <Badge variant="warning">Validation requise</Badge>
        </div>
        {pendingUsers.length === 0 ? (
          <p className="text-xs text-slate-500">Aucun compte en attente de validation.</p>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div>
                  <p className="text-sm font-semibold">{u.fullName} ({u.role})</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => verifyUser(u.id, true)}>
                    <CheckCircle2 className="w-3.5 h-3.5 me-1" /> Approuver
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => verifyUser(u.id, false)}>
                    <XCircle className="w-3.5 h-3.5 me-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Posts */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Publications en attente de vérification ({pendingPosts.length})</h2>
          <Badge variant="indigo">Marketplace • Objets Trouvés • Promos</Badge>
        </div>
        {pendingPosts.length === 0 ? (
          <p className="text-xs text-slate-500">Toutes les publications ont été vérifiées.</p>
        ) : (
          <div className="space-y-2">
            {pendingPosts.map((p) => (
              <div key={`${p.module}-${p.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{p.module}</Badge>
                    <p className="text-sm font-semibold">{p.title}</p>
                  </div>
                  <p className="text-xs text-slate-500">Par {p.authorName} • {p.summary}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => moderatePost(p, "approved")}>
                    <CheckCircle2 className="w-3.5 h-3.5 me-1" /> Publier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moderatePost(p, "rejected")}>
                    <XCircle className="w-3.5 h-3.5 me-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reports */}
      {reports.length === 0 ? (
        <EmptyState title="Aucun signalement" description="Aucun contenu signalé actuellement." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-semibold text-sm">{r.targetType} — {r.reason}</p>
                <p className="text-xs text-slate-500">Signalé par {r.reporterName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{r.status}</Badge>
                <Button size="sm" onClick={() => resolve(r.id, "action_taken")}>Modérer</Button>
                <Button size="sm" variant="outline" onClick={() => resolve(r.id, "dismissed")}>Ignorer</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
