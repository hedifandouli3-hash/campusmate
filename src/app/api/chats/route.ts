import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addNotification, getStore, persistToDisk, requireUser } from "@/lib/data/store";
import {
  decryptChatPayload,
  encryptChatPayload,
  sanitizeDownloadFilename,
} from "@/lib/security/crypto";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";
import type { ChatGroup, ChatMessage } from "@/types/domain";

const recentClientIds = new Map<string, number>();

function isAuthorizedMember(group: ChatGroup, userId: string, role: string, instId: string | null): boolean {
  if (!instId || group.institutionId !== instId) return false;
  return role === "university_admin" || group.memberIds.includes(userId);
}

function hydrateMessage(m: ChatMessage): ChatMessage {
  return {
    ...m,
    content: m.isDeleted ? "[Message supprimé]" : decryptChatPayload(m.content),
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const limitParam = Math.min(80, Math.max(10, Number(url.searchParams.get("limit") || 40)));
    const before = url.searchParams.get("before");
    const store = getStore();

    if (!store.chatReadCursors) store.chatReadCursors = {};

    const authorizedGroups = store.chatGroups.filter((g) =>
      isAuthorizedMember(g, user.id, user.role, user.institutionId)
    );

    const targetGroup = groupId
      ? authorizedGroups.find((g) => g.id === groupId) || null
      : authorizedGroups[0] || null;

    if (groupId && !targetGroup) {
      return NextResponse.json({ error: "Accès refusé à ce groupe académique." }, { status: 403 });
    }

    if (targetGroup) {
      if (!store.chatReadCursors[targetGroup.id]) store.chatReadCursors[targetGroup.id] = {};
      store.chatReadCursors[targetGroup.id][user.id] = new Date().toISOString();
      persistToDisk(store);
    }

    const groupsWithUnread = authorizedGroups.map((g) => {
      const lastRead = store.chatReadCursors?.[g.id]?.[user.id] || "";
      const unreadCount = store.chatMessages.filter(
        (m) =>
          m.groupId === g.id &&
          !m.isDeleted &&
          m.senderId !== user.id &&
          (!lastRead || m.createdAt > lastRead)
      ).length;
      return { ...g, unreadCount };
    });

    const allGroupMessages = targetGroup
      ? store.chatMessages
          .filter((m) => m.groupId === targetGroup.id && !m.isDeleted)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      : [];

    const filteredBefore = before
      ? allGroupMessages.filter((m) => m.createdAt < before)
      : allGroupMessages;
    const hasMore = filteredBefore.length > limitParam;
    const sliced = filteredBefore.slice(-limitParam).map(hydrateMessage);

    const groupMembers = targetGroup
      ? store.users
          .filter((u) => targetGroup.memberIds.includes(u.id))
          .map((u) => ({ id: u.id, fullName: u.fullName, role: u.role, sectionName: u.sectionName }))
      : [];

    return NextResponse.json({
      groups: groupsWithUnread,
      group: targetGroup,
      messages: sliced,
      hasMore,
      members: groupMembers,
      encryptionModel: {
        transport: "HTTPS/WSS (TLS)",
        storage: "AES-256-GCM application-layer AEAD + RBAC",
        isClientE2EE: false,
      },
    });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

const SendMessageSchema = z.object({
  groupId: z.string().min(1),
  content: z.string().min(1).max(2000),
  replyToId: z.string().optional(),
  attachmentName: z.string().max(120).optional(),
  attachmentMime: z.string().max(100).optional(),
  attachmentSizeBytes: z.number().int().min(0).max(10 * 1024 * 1024).optional(),
  isPinned: z.boolean().optional(),
  isAnnouncement: z.boolean().optional(),
  clientRequestId: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student", "teacher", "university_admin"]);
    if (!checkRateLimit(`chat:${user.id}`, 45, 60_000).allowed) {
      return NextResponse.json({ error: "Anti-spam : ralentissez vos messages." }, { status: 429 });
    }

    const body = await request.json();
    const store = getStore();

    if (body?.action === "report") {
      const targetMsg = store.chatMessages.find((m) => m.id === String(body.messageId || ""));
      if (!targetMsg) {
        return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
      }
      const grp = store.chatGroups.find((g) => g.id === targetMsg.groupId);
      if (!grp || !isAuthorizedMember(grp, user.id, user.role, user.institutionId)) {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      }
      store.contentReports.unshift({
        id: `rep-${crypto.randomUUID()}`,
        institutionId: grp.institutionId,
        reporterId: user.id,
        reporterName: user.fullName,
        targetType: "chat_message",
        targetId: targetMsg.id,
        reason: sanitizeText(String(body.reason || "Contenu inapproprié"), 300),
        status: "open",
        createdAt: new Date().toISOString(),
      });
      persistToDisk(store);
      return NextResponse.json({ ok: true });
    }

    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Message ou pièce jointe invalide." }, { status: 400 });
    }

    if (parsed.data.clientRequestId) {
      const dedupeKey = `${user.id}:${parsed.data.clientRequestId}`;
      const existingAt = recentClientIds.get(dedupeKey);
      if (existingAt && Date.now() - existingAt < 15_000) {
        return NextResponse.json({ duplicate: true }, { status: 200 });
      }
      recentClientIds.set(dedupeKey, Date.now());
    }

    const group = store.chatGroups.find(
      (g) => g.id === parsed.data.groupId && isAuthorizedMember(g, user.id, user.role, user.institutionId)
    );
    if (!group) {
      return NextResponse.json({ error: "Vous n'êtes pas membre de ce groupe." }, { status: 403 });
    }

    let cleanAttachmentName: string | undefined;
    if (parsed.data.attachmentName) {
      if (!/\.(pdf|docx|pptx|txt|png|jpe?g)$/i.test(parsed.data.attachmentName)) {
        return NextResponse.json(
          { error: "Type de pièce jointe non autorisé (PDF, DOCX, PPTX, TXT, PNG, JPG)." },
          { status: 400 }
        );
      }
      cleanAttachmentName = sanitizeDownloadFilename(parsed.data.attachmentName);
    }

    const canPin = user.role === "teacher" || user.role === "university_admin";
    const isPinned = Boolean(parsed.data.isPinned && canPin);
    const isAnnouncement = Boolean(parsed.data.isAnnouncement && canPin);
    const plainContent = sanitizeText(parsed.data.content, 2000);

    const msg: ChatMessage = {
      id: `msg-${crypto.randomUUID()}`,
      institutionId: group.institutionId,
      groupId: group.id,
      senderId: user.id,
      senderName: user.fullName,
      senderRole: user.role,
      replyToId: parsed.data.replyToId,
      content: encryptChatPayload(plainContent),
      attachmentName: cleanAttachmentName,
      attachmentMime: parsed.data.attachmentMime,
      attachmentSizeBytes: parsed.data.attachmentSizeBytes,
      isPinned,
      isAnnouncement,
      isDeleted: false,
      encryptionVersion: "cmv1-aead",
      createdAt: new Date().toISOString(),
    };

    store.chatMessages.push(msg);

    if (isAnnouncement) {
      for (const memberId of group.memberIds) {
        if (memberId === user.id) continue;
        addNotification({
          institutionId: group.institutionId,
          userId: memberId,
          category: "announcement",
          title: `Annonce épinglée dans ${group.name}`,
          body: `${user.fullName} : ${plainContent.slice(0, 120)}`,
          actionUrl: `/student/chats/${group.id}`,
        });
      }
    }

    persistToDisk(store);
    return NextResponse.json({ message: { ...msg, content: plainContent } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur d'envoi." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(["student", "teacher", "university_admin"]);
    const body = await request.json();
    const store = getStore();

    if (body?.action === "mark_read" && body.groupId) {
      const grp = store.chatGroups.find(
        (g) => g.id === body.groupId && isAuthorizedMember(g, user.id, user.role, user.institutionId)
      );
      if (!grp) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      if (!store.chatReadCursors) store.chatReadCursors = {};
      if (!store.chatReadCursors[grp.id]) store.chatReadCursors[grp.id] = {};
      store.chatReadCursors[grp.id][user.id] = new Date().toISOString();
      persistToDisk(store);
      return NextResponse.json({ ok: true });
    }

    const msg = store.chatMessages.find((m) => m.id === String(body?.messageId || ""));
    if (!msg) return NextResponse.json({ error: "Message introuvable." }, { status: 404 });
    const grp = store.chatGroups.find((g) => g.id === msg.groupId);
    if (!grp || !isAuthorizedMember(grp, user.id, user.role, user.institutionId)) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const isOwner = msg.senderId === user.id;
    const isMod = user.role === "university_admin" || (user.role === "teacher" && grp.institutionId === user.institutionId);

    if (body?.action === "edit") {
      if (!isOwner || msg.isDeleted) {
        return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres messages." }, { status: 403 });
      }
      const nextText = sanitizeText(String(body.content || ""), 2000);
      if (!nextText) return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
      msg.content = encryptChatPayload(nextText);
      msg.editedAt = new Date().toISOString();
      msg.encryptionVersion = "cmv1-aead";
      persistToDisk(store);
      return NextResponse.json({ message: { ...msg, content: nextText } });
    }

    if (body?.action === "delete") {
      if (!isOwner && !isMod) {
        return NextResponse.json({ error: "Suppression non autorisée." }, { status: 403 });
      }
      msg.isDeleted = true;
      msg.isPinned = false;
      persistToDisk(store);
      return NextResponse.json({ ok: true, id: msg.id });
    }

    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
