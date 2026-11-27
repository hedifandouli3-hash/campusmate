"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Building2, ExternalLink, Globe, ShieldCheck, Users } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/layout/public-chrome";
import { Badge, Button, Card } from "@/components/ui/primitives";

function UniversityProfileContent() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "iset-beja";
  const [data, setData] = useState<{
    institution?: { name: string; city: string; country: string; website?: string };
    departments: Array<{ id: string; name: string; code: string }>;
    specializations: Array<{ id: string; name: string; code: string }>;
    clubs: Array<{ id: string; name: string; category: string }>;
    announcements: Array<{ id: string; title: string; content: string }>;
  }>({
    departments: [],
    specializations: [],
    clubs: [],
    announcements: [],
  });

  useEffect(() => {
    fetch(`/api/university-connect?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {});
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10 space-y-8">
        <Card className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="primary">Campus Digital</Badge>
              <Badge variant="success">
                <ShieldCheck className="w-3 h-3 me-1" /> Sources officielles indexées
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {data.institution?.name || "ISET Béja"}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> {data.institution?.city || "Béja"}, {data.institution?.country || "Tunisie"}
              {data.institution?.website && (
                <a
                  href={data.institution.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 inline-flex items-center gap-1 hover:underline"
                >
                  Site officiel <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/login/student">
              <Button size="sm">Accès Étudiant</Button>
            </Link>
            <Link href="/pricing">
              <Button size="sm" variant="outline">Licence Établissement</Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-blue-600" /> Départements
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {data.departments.map((d) => (
                <li key={d.id}>• {d.name} ({d.code})</li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-emerald-600" /> Clubs Reconnus
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {data.clubs.map((c) => (
                <li key={c.id}>• {c.name} ({c.category})</li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">Annonces Publiques</h2>
            <div className="space-y-2 text-xs">
              {data.announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="rounded border border-slate-200 dark:border-slate-800 p-2">
                  <div className="font-semibold">{a.title}</div>
                  <p className="text-slate-500 line-clamp-2">{a.content}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export default function PublicUniversityProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Chargement...</div>}>
      <UniversityProfileContent />
    </Suspense>
  );
}
