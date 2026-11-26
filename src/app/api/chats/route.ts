import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addNotification, getStore, persistToDisk, requireUser } from "@/lib/data/store";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const groupId = url.searchParams.get("groupId");
    const store = getStore();

    // Enforce strict membership & institution isolation
    const groups = store.chatGroups.filter(
      (g) =>
        g.institutionId === user.institutionId &&
        (user.role === "university_admin" || g.memberIds.includes(user.id))
    );

    if (groupId) {
      const target = groups.find((g) => g.id === groupId);
      if (!target) {
        return NextResponse.json({ error: "Accès refusé à ce groupe académique." }, { status: 403 });
      }
      const messages = store.chatMessages.filter(
        (m) => m.groupId === groupId && !m.isDeleted
      );
      return NextResponse.json({ group: target, messages, groups });
    }

    const activeGroup = groups[0] || null;
    const messages = activeGroup
      ? store.chatMessages.filter((m) => m.groupId === activeGroup.id && !m.isDeleted)
      : [];

    return NextResponse.json({ groups, group: activeGroup, messages });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

const SendMessageSchema = z.object({
  groupId: z.string().min(1),
  content: z.string().min(1).max(2000),
  replyToId: z.string().optional(),
  attachmentName: z.string().optional(),
  isPinned: z.boolean().optional(),
  isAnnouncement: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student", "teacher", "university_admin"]);
    if (!checkRateLimit(`chat:${user.id}`, 40, 60_000).allowed) {
      return NextResponse.json({ error: "Anti-spam : ralentissez vos messages." }, { status: 429 });
    }

    const body = await request.json();
    const store = getStore();

    if (body?.action === "report") {
      store.contentReports.unshift({
        id: `rep-${crypto.randomUUID()}`,
        institutionId: user.institutionId || "global",
        reporterId: user.id,
        reporterName: user.fullName,
        targetType: "chat_message",
        targetId: String(body.messageId || ""),
        reason: sanitizeText(String(body.reason || "Contenu inapproprié"), 300),
        status: "open",
        createdAt: new Date().toISOString(),
      });
      persistToDisk(store);
      return NextResponse.json({ ok: true });
    }

    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }

    const group = store.chatGroups.find(
      (g) =>
        g.id === parsed.data.groupId &&
        g.institutionId === user.institutionId &&
        (user.role === "university_admin" || g.memberIds.includes(user.id))
    );
    if (!group) {
      return NextResponse.json({ error: "Vous n'êtes pas membre de ce groupe." }, { status: 403 });
    }

    const canPin = user.role === "teacher" || user.role === "university_admin";
    const isPinned = Boolean(parsed.data.isPinned && canPin);
    const isAnnouncement = Boolean(parsed.data.isAnnouncement && canPin);

    const msg = {
      id: `msg-${crypto.randomUUID()}`,
      institutionId: group.institutionId,
      groupId: group.id,
      senderId: user.id,
      senderName: user.fullName,
      senderRole: user.role,
      replyToId: parsed.data.replyToId,
      content: sanitizeText(parsed.data.content, 2000),
      attachmentName: parsed.data.attachmentName,
      isPinned,
      isAnnouncement,
      isDeleted: false,
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
          body: `${user.fullName} : ${msg.content.slice(0, 120)}`,
          actionUrl: `/student/chats/${group.id}`,
        });
      }
    }

    persistToDisk(store);
    return NextResponse.json({ message: msg }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur d'envoi." }, { status: 500 });
  }
}
