"use client";

import React, { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import type { InternshipApplication } from "@/types/domain";

export default function StudentApplicationsPage() {
  const { locale, notify } = useApp();
  const [applications, setApplications] = useState<InternshipApplication[]>([]);

  async function load() {
    const res = await fetch("/api/internships");
    if (res.ok) {
      const data = await res.json();
      setApplications(data.applications || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function withdraw(applicationId: string) {
    const res = await fetch("/api/internships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "withdraw", applicationId }),
    });
    if (res.ok) {
      notify("Candidature retirée.", "info");
      load();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-blue-600" /> Mes Candidatures de Stage
        </h1>
        <p className="text-sm text-slate-500">Suivez les réponses des organisations vérifiées en temps réel.</p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-6 h-6" />}
          title="Aucune candidature soumise"
          description="Parcourez les offres de stage et envoyez votre candidature avec votre CV CampusMate."
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{app.offerTitle}</h2>
                  <p className="text-xs text-slate-500">
                    {app.organizationName} • Envoyée le {formatDate(app.createdAt, locale)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={app.status === "accepted" || app.status === "interview_requested" ? "success" : app.status === "rejected" ? "danger" : "primary"}>
                    {app.status}
                  </Badge>
                  {app.status === "submitted" && (
                    <Button variant="outline" size="sm" onClick={() => withdraw(app.id)}>
                      Retirer
                    </Button>
                  )}
                </div>
              </div>
              {app.organizationNote && (
                <p className="text-xs bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg">
                  <strong>Note de l&apos;organisation :</strong> {app.organizationNote}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
