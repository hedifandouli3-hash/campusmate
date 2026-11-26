"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronUp,
  Edit3,
  Flag,
  Info,
  Lock,
  MessageSquare,
  Paperclip,
  Pin,
  RefreshCw,
  Reply,
  Send,
  Trash2,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Input,
  SearchField,
} from "@/components/ui/primitives";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { ChatGroup, ChatMessage } from "@/types/domain";

interface GroupMemberPreview {
  id: string;
  fullName: string;
  role: string;
  sectionName?: string;
}

export function AcademicChatsWorkspace({
  initialGroupId,
  isModerator = false,
  basePath = "/student/chats",
}: {
  initialGroupId?: string;
  isModerator?: boolean;
  basePath?: string;
}) {
  const { locale, notify } = useApp();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<GroupMemberPreview[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [limit, setLimit] = useState(40);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [text, setText] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);

  const [pinAnnouncement, setPinAnnouncement] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; mime: string; size: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [offlineError, setOfflineError] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mobileShowGroups, setMobileShowGroups] = useState(!initialGroupId);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.id) setCurrentUserId(d.user.id);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async (groupId?: string, msgLimit = limit) => {
    try {
      const params = new URLSearchParams();
      if (groupId) params.set("groupId", groupId);
      params.set("limit", String(msgLimit));
      const res = await fetch(`/api/chats?${params.toString()}`);
      if (!res.ok) throw new Error("fetch_failed");
      const data = await res.json();
      setGroups(data.groups || []);
      setActiveGroup(data.group || null);
      setMessages(data.messages || []);
      setMembers(data.members || []);
      setHasMore(Boolean(data.hasMore));
      setOfflineError(false);
    } catch {
      setOfflineError(true);
    }
  }, [limit]);

  useEffect(() => {
    const id = setTimeout(() => { void load(initialGroupId, limit); }, 0);
    return () => clearTimeout(id);
  }, [initialGroupId, limit, load]);

  const activeGroupId = activeGroup?.id;
  useEffect(() => {
    if (!activeGroupId) return;
    const timer = setInterval(() => {
      void load(activeGroupId, limit);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeGroupId, limit, load]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeGroup || !text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: activeGroup.id,
          content: text,
          replyToId: replyTo?.id,
          attachmentName: attachment?.name,
          attachmentMime: attachment?.mime,
          attachmentSizeBytes: attachment?.size,
          isPinned: isModerator && pinAnnouncement,
          isAnnouncement: isModerator && pinAnnouncement,
          clientRequestId: `${Date.now()}-${text.slice(0, 12)}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || "Erreur d'envoi.", "error");
        return;
      }
      setText("");
      setReplyTo(null);
      setAttachment(null);
      setPinAnnouncement(false);
      await load(activeGroup.id, limit);
    } catch {
      setOfflineError(true);
      notify("Connexion interrompue — réessayez.", "error");
    } finally {
      setSending(false);
    }
  }

  async function submitEdit() {
    if (!editingMsg || !editDraft.trim()) return;
    const res = await fetch("/api/chats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", messageId: editingMsg.id, content: editDraft }),
    });
    if (res.ok) {
      setEditingMsg(null);
      setEditDraft("");
      await load(activeGroup?.id, limit);
      notify("Message modifié.", "success");
    } else {
      const data = await res.json();
      notify(data.error || "Impossible de modifier.", "error");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const res = await fetch("/api/chats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", messageId: deleteTarget.id }),
    });
    setDeleteTarget(null);
    if (res.ok) {
      await load(activeGroup?.id, limit);
      notify("Message supprimé.", "info");
    }
  }

  async function reportMessage(messageId: string) {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "report", messageId, reason: "Contenu signalé par un membre" }),
    });
    if (res.ok) notify("Message signalé aux modérateurs.", "info");
  }

  const filteredGroups = useMemo(
    () =>
      groups.filter((g) =>
        `${g.name} ${g.groupType}`.toLowerCase().includes(groupSearch.toLowerCase())
      ),
    [groups, groupSearch]
  );

  const pinned = useMemo(() => messages.filter((m) => m.isPinned), [messages]);
  const filteredMessages = useMemo(
    () =>
      messages.filter((m) =>
        `${m.content} ${m.senderName}`.toLowerCase().includes(msgSearch.toLowerCase())
      ),
    [messages, msgSearch]
  );

  const msgById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of messages) map.set(m.id, m);
    return map;
  }, [messages]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <MessageSquare className="w-6 h-6 text-blue-600" /> Groupes Académiques
          </h1>
          <p className="text-sm text-slate-500">
            Canaux par année, département, section et matière avec accès vérifié.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">
            <Lock className="w-3 h-3" /> HTTPS/WSS + AES-256-GCM au repos
          </Badge>
          <Button type="button" size="sm" variant="outline" onClick={() => setInfoOpen(true)}>
            <Info className="w-3.5 h-3.5" /> Infos & Sécurité
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="lg:hidden"
            onClick={() => setMobileShowGroups((s) => !s)}
          >
            {mobileShowGroups ? "Voir discussion" : "Tous les groupes"}
          </Button>
        </div>
      </div>

      {offlineError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <span className="flex items-center gap-2">
            <WifiOff className="w-4 h-4" /> Synchronisation temporairement interrompue.
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => load(activeGroup?.id, limit)}>
            <RefreshCw className="w-3 h-3" /> Reconnecter
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-5 items-start">
        {/* Groups Sidebar */}
        <Card className={`p-3 space-y-3 lg:col-span-1 ${mobileShowGroups ? "" : "hidden lg:block"}`}>
          <SearchField
            value={groupSearch}
            onChange={setGroupSearch}
            placeholder="Filtrer mes groupes..."
            ariaLabel="Rechercher un groupe"
          />
          <div className="space-y-1">
            {filteredGroups.map((g) => {
              const isActive = activeGroup?.id === g.id;
              return (
                <Link
                  key={g.id}
                  href={`${basePath}/${g.id}`}
                  onClick={() => {
                    setMobileShowGroups(false);
                    void load(g.id, limit);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-lg p-2.5 text-xs transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600 dark:bg-blue-950"
                      }`}
                    >
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{g.name}</p>
                      <p className="opacity-75 text-[11px] capitalize">{g.groupType}</p>
                    </div>
                  </div>
                  {g.unreadCount > 0 && !isActive && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {g.unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Active Conversation Panel */}
        <Card className={`lg:col-span-3 flex flex-col min-h-[540px] space-y-3 ${mobileShowGroups ? "hidden lg:flex" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {activeGroup?.name || "Sélectionnez un groupe"}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> {activeGroup?.memberIds.length || 0} membre(s) inscrits
              </p>
            </div>
            <SearchField
              className="w-full sm:w-56"
              value={msgSearch}
              onChange={setMsgSearch}
              placeholder="Rechercher dans le fil..."
              ariaLabel="Rechercher un message"
            />
          </div>

          {pinned.length > 0 && (
            <div className="rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 space-y-1">
              <p className="text-xs font-semibold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                <Pin className="w-3.5 h-3.5" /> Annonces épinglées
              </p>
              {pinned.slice(-2).map((p) => (
                <p key={p.id} className="text-xs text-slate-700 dark:text-slate-200">
                  <strong>{p.senderName} :</strong> {p.content}
                </p>
              ))}
            </div>
          )}

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pe-1">
            {hasMore && (
              <div className="text-center">
                <Button type="button" size="sm" variant="outline" onClick={() => setLimit((l) => l + 30)}>
                  <ChevronUp className="w-3.5 h-3.5" /> Charger les messages précédents
                </Button>
              </div>
            )}

            {filteredMessages.length === 0 ? (
              <EmptyState title="Aucun message" description="Commencez la discussion avec votre groupe académique." />
            ) : (
              filteredMessages.map((m, idx) => {
                const prev = filteredMessages[idx - 1];
                const showDateSep =
                  !prev || prev.createdAt.slice(0, 10) !== m.createdAt.slice(0, 10);
                const parentMsg = m.replyToId ? msgById.get(m.replyToId) : undefined;
                const canModify = m.senderId === currentUserId;
                const canDelete = canModify || isModerator;

                return (
                  <React.Fragment key={m.id}>
                    {showDateSep && (
                      <div className="flex items-center gap-2 py-1">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                        <span className="text-[11px] font-medium text-slate-400">
                          {formatDate(m.createdAt, locale)}
                        </span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      </div>
                    )}
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 p-3 text-sm space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">{m.senderName}</span>
                          <Badge variant={m.senderRole === "teacher" ? "indigo" : "default"}>{m.senderRole}</Badge>
                          {m.isAnnouncement && <Badge variant="warning">Annonce</Badge>}
                          {m.editedAt && <span className="text-[10px] text-slate-400">(modifié)</span>}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatDateTime(m.createdAt, locale)}</span>
                          <button
                            type="button"
                            onClick={() => setReplyTo(m)}
                            title="Répondre"
                            className="hover:text-blue-600 cursor-pointer"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          {canModify && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMsg(m);
                                setEditDraft(m.content);
                              }}
                              title="Modifier"
                              className="hover:text-blue-600 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(m)}
                              title="Supprimer"
                              className="hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => reportMessage(m.id)}
                            title="Signaler"
                            className="hover:text-rose-600 cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {parentMsg && (
                        <div className="rounded border-s-2 border-blue-500 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs text-slate-500">
                          <strong>{parentMsg.senderName} :</strong> {parentMsg.content.slice(0, 90)}
                        </div>
                      )}

                      <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-line">{m.content}</p>

                      {m.attachmentName && (
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
                          <Paperclip className="w-3 h-3 text-blue-600" />
                          <span>{m.attachmentName}</span>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {editingMsg && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 flex items-center gap-2">
              <Input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} />
              <Button type="button" size="sm" onClick={submitEdit}>Sauvegarder</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingMsg(null)}>Annuler</Button>
            </div>
          )}

          {replyTo && (
            <div className="text-xs bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded flex justify-between items-center">
              <span>Réponse à {replyTo.senderName} : « {replyTo.content.slice(0, 60)} »</span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-rose-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {attachment && (
            <div className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-blue-600" /> {attachment.name} ({Math.max(1, Math.round(attachment.size / 1024))} Ko)
              </span>
              <button type="button" onClick={() => setAttachment(null)} className="text-rose-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {isModerator && (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinAnnouncement}
                  onChange={(e) => setPinAnnouncement(e.target.checked)}
                />
                <Pin className="w-3.5 h-3.5 text-amber-600" /> Publier comme annonce épinglée (notifie les membres)
              </label>
            )}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 10 * 1024 * 1024) {
                      notify("Pièce jointe trop volumineuse (max 10 Mo).", "error");
                      return;
                    }
                    setAttachment({ name: f.name, mime: f.type, size: f.size });
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                aria-label="Joindre un document"
                title="Joindre un fichier autorisé"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Écrire un message au groupe..."
              />
              <Button type="submit" disabled={sending || !text.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <Dialog
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        title={activeGroup?.name || "Informations du groupe"}
        description="Membres inscrits et modèle de confidentialité"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 p-3 space-y-1">
            <p className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Architecture de chiffrement & confidentialité
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Les échanges transitent via HTTPS/WSS et sont stockés côté serveur avec chiffrement applicatif authentifié (AES-256-GCM). L&apos;accès est restreint aux membres vérifiés de l&apos;institution pour permettre la modération académique (il ne s&apos;agit pas d&apos;un E2EE client sans visibilité serveur). Les discussions ne sont jamais envoyées aux fournisseurs d&apos;IA.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Membres ({members.length})</p>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {members.map((mb) => (
                <div key={mb.id} className="flex items-center justify-between rounded bg-slate-50 dark:bg-slate-900 px-3 py-1.5">
                  <span className="font-medium">{mb.fullName}</span>
                  <Badge variant={mb.role === "teacher" ? "indigo" : "default"}>{mb.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Supprimer ce message ?"
        message="Le message sera retiré de l'historique du groupe pour tous les membres."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

export default function StudentChatsPage() {
  return <AcademicChatsWorkspace />;
}
