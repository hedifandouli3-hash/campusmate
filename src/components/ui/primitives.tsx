"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  RefreshCw,
  Search,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive = false,
  children,
}: {
  className?: string;
  interactive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "cm-card p-5 transition-colors",
        interactive && "cm-card-interactive",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="cm-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1 min-w-0">
        {badge && <div className="flex flex-wrap items-center gap-2 mb-1">{badge}</div>}
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-[#171A21] dark:text-[#F2F4F8]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[#515C6D] dark:text-[#BCC4D0] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <Card interactive={Boolean(href)} className="p-4 flex items-center justify-between gap-3 h-full">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 tabular-nums">
          {value}
        </p>
        {hint && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{hint}</p>}
      </div>
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-100 dark:border-blue-900">
          {icon}
        </div>
      )}
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:outline-none">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "indigo";
  className?: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    default: "bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    primary: "bg-blue-50 text-blue-700 border border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    warning: "bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    danger: "bg-rose-50 text-rose-800 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "primary" | "success" | "warning" | "danger" | "indigo"; kind: "ok" | "wait" | "err" | "info" }
> = {
  submitted: { label: "Soumis", variant: "primary", kind: "info" },
  under_review: { label: "En examen", variant: "indigo", kind: "wait" },
  in_progress: { label: "En cours", variant: "indigo", kind: "wait" },
  additional_info_required: { label: "Infos requises", variant: "warning", kind: "wait" },
  approved: { label: "Approuvé", variant: "success", kind: "ok" },
  available_for_download: { label: "Disponible", variant: "success", kind: "ok" },
  ready_for_collection: { label: "Prêt guichet", variant: "success", kind: "ok" },
  ready: { label: "Prêt", variant: "success", kind: "ok" },
  published: { label: "Publié", variant: "success", kind: "ok" },
  verified: { label: "Vérifié", variant: "success", kind: "ok" },
  confirmed: { label: "Confirmé", variant: "success", kind: "ok" },
  completed: { label: "Terminé", variant: "success", kind: "ok" },
  accepted: { label: "Accepté", variant: "success", kind: "ok" },
  recovered: { label: "Restitué", variant: "success", kind: "ok" },
  resolved: { label: "Résolu", variant: "success", kind: "ok" },
  interview_requested: { label: "Entretien", variant: "primary", kind: "info" },
  waiting: { label: "En attente", variant: "warning", kind: "wait" },
  pending: { label: "En attente", variant: "warning", kind: "wait" },
  called: { label: "Appelé", variant: "primary", kind: "info" },
  draft: { label: "Brouillon", variant: "default", kind: "info" },
  open: { label: "Ouvert", variant: "primary", kind: "info" },
  closed: { label: "Fermé", variant: "default", kind: "info" },
  cancelled: { label: "Annulé", variant: "default", kind: "err" },
  withdrawn: { label: "Retiré", variant: "default", kind: "err" },
  missed: { label: "Manqué", variant: "warning", kind: "err" },
  rejected: { label: "Rejeté", variant: "danger", kind: "err" },
  failed: { label: "Échec", variant: "danger", kind: "err" },
};

/**
 * Accessible status indicator that pairs iconography with explicit text (never color alone).
 */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const meta = STATUS_MAP[status] || { label: status, variant: "default" as const, kind: "info" as const };
  const Icon =
    meta.kind === "ok"
      ? CheckCircle2
      : meta.kind === "wait"
        ? Clock
        : meta.kind === "err"
          ? XCircle
          : Info;

  return (
    <Badge variant={meta.variant}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{label || meta.label}</span>
    </Badge>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const variants: Record<string, string> = {
    primary: "bg-[#2457D6] text-white hover:bg-[#1D46B8] disabled:opacity-50",
    secondary: "bg-[#20232B] dark:bg-[#292D36] text-white hover:bg-[#171A21] dark:hover:bg-[#343946] disabled:opacity-50",
    outline:
      "border border-[#E2E6EC] dark:border-[#303540] bg-white dark:bg-[#181A20] hover:bg-[#F1F3F5] dark:hover:bg-[#20232B] text-[#171A21] dark:text-[#F2F4F8] disabled:opacity-50",
    ghost: "bg-transparent hover:bg-[#F1F3F5] dark:hover:bg-[#20232B] text-[#515C6D] dark:text-[#BCC4D0] hover:text-[#171A21] dark:hover:text-[#F2F4F8]",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs min-h-[32px]",
    md: "px-4 py-2 text-sm min-h-[40px]",
    lg: "px-5 py-2.5 text-sm sm:text-base min-h-[48px]",
  };

  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2457D6] dark:focus-visible:ring-[#739BFF] cursor-pointer disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-[#E2E6EC] dark:border-[#303540] bg-white dark:bg-[#181A20] px-3 py-2 text-sm text-[#171A21] dark:text-[#F2F4F8] placeholder:text-[#697586] dark:placeholder:text-[#929DAD] focus:border-[#2457D6] dark:focus:border-[#739BFF] focus:outline-none focus:ring-2 focus:ring-[#2457D6]/15 dark:focus:ring-[#739BFF]/20 transition-colors duration-150 min-h-[40px]",
        className
      )}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-[#E2E6EC] dark:border-[#303540] bg-white dark:bg-[#181A20] px-3 py-2 text-sm text-[#171A21] dark:text-[#F2F4F8] placeholder:text-[#697586] dark:placeholder:text-[#929DAD] focus:border-[#2457D6] dark:focus:border-[#739BFF] focus:outline-none focus:ring-2 focus:ring-[#2457D6]/15 dark:focus:ring-[#739BFF]/20 transition-colors duration-150",
        className
      )}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-[#E2E6EC] dark:border-[#303540] bg-white dark:bg-[#181A20] px-3 py-2 text-sm text-[#171A21] dark:text-[#F2F4F8] focus:border-[#2457D6] dark:focus:border-[#739BFF] focus:outline-none focus:ring-2 focus:ring-[#2457D6]/15 dark:focus:ring-[#739BFF]/20 transition-colors duration-150 min-h-[40px]",
        className
      )}
    />
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Rechercher...",
  className,
  ariaLabel = "Rechercher",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5 pointer-events-none" aria-hidden="true" />
      <Input
        type="search"
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ps-9 pe-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Effacer la recherche"
          className="absolute end-2 top-2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<{ id: T; label: string; count?: number; icon?: React.ReactNode }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-lg border border-[#E2E6EC] dark:border-[#303540] bg-[#F1F3F5] dark:bg-[#20232B] p-1",
        className
      )}
    >
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer",
              selected
                ? "bg-white dark:bg-[#292D36] text-[#171A21] dark:text-[#F2F4F8] shadow-xs"
                : "text-[#515C6D] dark:text-[#929DAD] hover:text-[#171A21] dark:hover:text-[#F2F4F8]"
            )}
          >
            {item.icon}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span className="rounded-full bg-slate-200/80 dark:bg-slate-700 px-1.5 py-0.2 text-[10px]">
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto",
          maxWidth
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  destructive = true,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">{message}</p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          type="button"
          variant={destructive ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Traitement..." : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Aucun élément ne correspond à vos critères actuels.",
}: {
  columns: Array<{ header: string; className?: string; render: (row: T) => React.ReactNode }>;
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="cm-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                {columns.map((col, idx) => (
                  <td key={idx} className={cn("px-4 py-3 align-middle", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2 pt-2 text-xs text-slate-500">
      <span>
        Page {page} / {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Précédent
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Page suivante"
        >
          Suivant <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </nav>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <ChevronRight className="w-3 h-3 opacity-60 shrink-0" aria-hidden="true" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-blue-600 transition font-medium">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-semibold text-slate-800 dark:text-slate-200")}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function FileUploadDropzone({
  accept,
  selectedFile,
  onSelectFile,
  label = "Glissez votre document ici ou cliquez pour parcourir",
  hint = "Formats acceptés : PDF, DOCX, PPTX, TXT (max 20 Mo)",
}: {
  accept?: string;
  selectedFile: File | null;
  onSelectFile: (file: File | null) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onSelectFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        "rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition",
        dragging
          ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30"
          : "border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-900/40"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
      />
      <Upload className="w-6 h-6 text-blue-600 mx-auto mb-2" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
        {selectedFile ? `${selectedFile.name} (${Math.max(1, Math.round(selectedFile.size / 1024))} Ko)` : label}
      </p>
      <p className="text-xs text-slate-500 mt-1">{hint}</p>
      {selectedFile && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectFile(null);
          }}
          className="mt-2 inline-flex items-center gap-1 text-xs text-rose-600 hover:underline cursor-pointer"
        >
          <X className="w-3 h-3" /> Retirer le fichier
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Impossible de charger les données",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="cm-card border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">{title}</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="w-3.5 h-3.5" /> Réessayer
        </Button>
      )}
    </div>
  );
}

export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group inline-flex items-center" title={text}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute bottom-full start-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-md z-40"
      >
        {text}
      </span>
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="cm-card flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="mb-3 rounded-full bg-slate-100 dark:bg-slate-800 p-3 text-slate-500">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="cm-card p-5 animate-pulse space-y-3" aria-busy="true">
      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
