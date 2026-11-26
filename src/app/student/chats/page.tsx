"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, MessageSquare, Pin, Send } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import { formatDateTime } from "@/lib/utils";
import type { ChatGroup, ChatMessage } from "@/types/domain";

export function AcademicChatsWorkspace({ initialGroupId }: { initialGroupId?: string }) {
  const { locale, notify } = useApp();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  async function load(groupId?: string) {
    const q = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
    const res = await fetch(`/api/chats${q}`);
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups || []);
      setActiveGroup(data.group || null);
      setMessages(data.messages || []);
    }
  }

  useEffect(() => {
    const id = setTimeout(() => { void load(initialGroupId); }, 0);
    return () => clearTimeout(id);
  }, [initialGroupId]);

  const activeGroupId = activeGroup?.id;
  useEffect(() => {
    if (!activeGroupId) return;
    const timer = setInterval(() => load(activeGroupId), 4500);
    return () => clearInterval(timer);
  }, [activeGroupId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroup || !text.trim()) return;
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: activeGroup.id,
        content: text,
        replyToId: replyTo?.id,
      }),
    });
    if (res.ok) {
      setText("");
      setReplyTo(null);
      load(activeGroup.id);
    } else {
      const data = await res.json();
      notify(data.error || "Erreur d'envoi.", "error");
    }
  }

  async function reportMessage(messageId: string) {
    await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "report", messageId, reason: "Contenu signalé par un membre" }),
    });
    notify("Message signalé aux modérateurs.", "info");
  }

  const pinned = messages.filter((m) => m.isPinned);
  const filtered = messages.filter((m) =>
    `${m.content} ${m.senderName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-600" /> Groupes Académiques
        </h1>
        <p className="text-sm text-slate-500">
          Canaux automatiques selon votre année, département et section vérifiée.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Groups List */}
        <Card className="p-3 space-y-2 lg:col-span-1">
          <p className="text-xs font-semibold uppercase text-slate-400 px-2">Mes Groupes</p>
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/student/chats/${g.id}`}
              onClick={() => load(g.id)}
              className={`block rounded-lg p-2.5 text-xs transition ${
                activeGroup?.id === g.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <p className="font-semibold truncate">{g.name}</p>
              <p className="opacity-75 text-[11px]">{g.groupType}</p>
            </Link>
          ))}
        </Card>

        {/* Active Chat */}
        <Card className="lg:col-span-3 flex flex-col min-h-[480px] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="font-semibold">{activeGroup?.name || "Sélectionnez un groupe"}</h2>
              <p className="text-xs text-slate-500">{activeGroup?.memberIds.length || 0} membre(s)</p>
            </div>
            <Input
              className="w-48"
              placeholder="Filtrer les messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {pinned.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 space-y-1">
              <p className="text-xs font-semibold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                <Pin className="w-3.5 h-3.5" /> Annonces épinglées
              </p>
              {pinned.map((p) => (
                <p key={p.id} className="text-xs">
                  <strong>{p.senderName} :</strong> {p.content}
                </p>
              ))}
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[360px]">
            {filtered.map((m) => (
              <div key={m.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-sm space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs">{m.senderName}</span>
                    <Badge variant={m.senderRole === "teacher" ? "indigo" : "default"}>{m.senderRole}</Badge>
                    {m.isAnnouncement && <Badge variant="warning">Annonce</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{formatDateTime(m.createdAt, locale)}</span>
                    <button onClick={() => setReplyTo(m)} className="hover:text-blue-600 cursor-pointer">Répondre</button>
                    <button onClick={() => reportMessage(m.id)} title="Signaler" className="hover:text-rose-600 cursor-pointer">
                      <Flag className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-sm">{m.content}</p>
              </div>
            ))}
          </div>

          {replyTo && (
            <div className="text-xs bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded flex justify-between">
              <span>Réponse à {replyTo.senderName} : « {replyTo.content.slice(0, 50)}... »</span>
              <button onClick={() => setReplyTo(null)} className="text-rose-600 cursor-pointer">Annuler</button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrire un message au groupe..."
            />
            <Button type="submit">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function StudentChatsPage() {
  return <AcademicChatsWorkspace />;
}
