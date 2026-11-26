"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";

export default function GlobalAppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full space-y-4 text-center p-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/60">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Une erreur inattendue est survenue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aucun détail technique interne n&apos;est affiché par sécurité. Vous pouvez réessayer ou revenir à l&apos;accueil.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset} size="sm">
            <RefreshCw className="w-3.5 h-3.5" /> Réessayer
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </Card>
    </div>
  );
}
