"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import type { NotificationItem } from "@/types/domain";

export default function StudentNotificationsPage() {
  const { locale, notify } = useApp();
  const [items, setItems] = useState<NotificationItem[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setItems(data.notifications || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    notify("Toutes les notifications marquées comme lues.", "success");
    load();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" /> Centre de Notifications
        </h1>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <Card key={n.id} className={n.isRead ? "opacity-75" : "border-blue-300 dark:border-blue-800"}>
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={n.isRead ? "default" : "primary"}>{n.category}</Badge>
                  <span className="text-xs text-slate-400">{formatDateTime(n.createdAt, locale)}</span>
                </div>
                <h2 className="font-semibold text-sm">{n.title}</h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">{n.body}</p>
              </div>
              {n.actionUrl && (
                <Link href={n.actionUrl} className="text-xs font-semibold text-blue-600 hover:underline shrink-0">
                  Ouvrir →
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
