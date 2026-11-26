"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Pin, Send } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { ChatGroup, ChatMessage } from "@/types/domain";

export default function TeacherChatsPage() {
  const { notify } = useApp();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [pinAnnouncement, setPinAnnouncement] = useState(false);

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
    const id = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(id);
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroup || !text.trim()) return;
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: activeGroup.id,
        content: text,
        isPinned: pinAnnouncement,
        isAnnouncement: pinAnnouncement,
      }),
    });
    if (res.ok) {
      if (pinAnnouncement) notify("Annonce épinglée envoyée aux étudiants !", "success");
      setText("");
      setPinAnnouncement(false);
      load(activeGroup.id);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-emerald-600" /> Groupes Académiques Assignés
      </h1>
      <div className="grid lg:grid-cols-4 gap-5">
        <Card className="p-3 space-y-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => load(g.id)}
              className={`w-full text-start rounded-lg p-2.5 text-xs cursor-pointer ${
                activeGroup?.id === g.id ? "bg-blue-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <p className="font-semibold">{g.name}</p>
            </button>
          ))}
        </Card>
        <Card className="lg:col-span-3 space-y-3">
          <h2 className="font-semibold">{activeGroup?.name}</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {messages.map((m) => (
              <div key={m.id} className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <strong>{m.senderName}</strong>
                  {m.isPinned && <Badge variant="warning"><Pin className="w-3 h-3" /> Épinglé</Badge>}
                </div>
                <p>{m.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message ou annonce épinglée..." />
              <Button type="submit"><Send className="w-4 h-4" /></Button>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={pinAnnouncement} onChange={(e) => setPinAnnouncement(e.target.checked)} />
              <span>Épingler comme annonce officielle du groupe</span>
            </label>
          </form>
        </Card>
      </div>
    </div>
  );
}
