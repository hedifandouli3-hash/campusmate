"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Layers, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { getV6Copy } from "@/lib/i18n/v6";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
} from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import type { CreationArtifact } from "@/types/domain";

export default function StudentArtifactsPage() {
  const { locale, notify } = useApp();
  const copy = getV6Copy(locale).artifacts;
  const [artifacts, setArtifacts] = useState<CreationArtifact[]>([]);
  const [filterType, setFilterType] = useState<string>("all");

  async function load() {
    const res = await fetch("/api/studio");
    if (res.ok) {
      const data = await res.json();
      setArtifacts(data.artifacts || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch("/api/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_artifact", id }),
    });
    if (res.ok) {
      notify("Livrable supprimé", "info");
      await load();
    }
  }

  const filtered =
    filterType === "all" ? artifacts : artifacts.filter((a) => a.type === filterType);

  return (
    <div className="space-y-6">
      <PageHeader
        title={copy.title}
        description={copy.description}
        badge="Artifacts"
        actions={
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-44"
          >
            <option value="all">{copy.allTypes}</option>
            <option value="website">Websites</option>
            <option value="presentation">Presentations</option>
            <option value="document">Documents</option>
            <option value="brand_kit">Brand Kits</option>
          </Select>
        }
      />

      {filtered.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            icon={<Layers className="w-6 h-6" />}
            title={copy.emptyTitle}
            description={copy.emptyDesc}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((art) => (
            <Card key={art.id} className="p-4 flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge>{art.type}</Badge>
                  <span className="text-[11px] text-slate-400">{formatDate(art.updatedAt)}</span>
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{art.description}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/student/studio"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {copy.openInStudio} <ExternalLink className="w-3 h-3" />
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleDelete(art.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
