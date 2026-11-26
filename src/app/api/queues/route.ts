import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { addNotification, getStore, persistToDisk, requireUser } from "@/lib/data/store";

export async function GET() {
  try {
    const user = await requireUser();
    const store = getStore();
    const services = store.queueServices.filter(
      (q) => user.role === "super_admin" || q.institutionId === user.institutionId
    );
    const tickets = store.queueTickets.filter(
      (t) =>
        (user.role === "super_admin" || t.institutionId === user.institutionId) &&
        (user.role === "university_admin" || user.role === "super_admin" || t.studentId === user.id || t.status === "waiting" || t.status === "called")
    );
    return NextResponse.json({ services, tickets });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const queueId = String(body.queueId || "");
    const store = getStore();
    const queue = store.queueServices.find(
      (q) => q.id === queueId && q.institutionId === user.institutionId
    );
    if (!queue) {
      return NextResponse.json({ error: "Service introuvable." }, { status: 404 });
    }
    if (!queue.isOpen) {
      return NextResponse.json({ error: "Cette file d'attente est actuellement fermée." }, { status: 400 });
    }

    const existing = store.queueTickets.find(
      (t) => t.queueId === queue.id && t.studentId === user.id && (t.status === "waiting" || t.status === "called")
    );
    if (existing) {
      return NextResponse.json({ ticket: existing, alreadyJoined: true });
    }

    queue.lastIssuedNumber += 1;
    const prefix = queue.name.slice(0, 3).toUpperCase();
    const ticket = {
      id: `tk-${crypto.randomUUID()}`,
      institutionId: queue.institutionId,
      queueId: queue.id,
      serviceName: queue.name,
      studentId: user.id,
      studentName: user.fullName,
      ticketNumber: queue.lastIssuedNumber,
      ticketCode: `${prefix}-${String(queue.lastIssuedNumber).padStart(3, "0")}`,
      status: "waiting" as const,
      joinedAt: new Date().toISOString(),
    };
    store.queueTickets.push(ticket);
    persistToDisk(store);

    return NextResponse.json({ ticket }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const store = getStore();

    if (body.action === "cancel_ticket") {
      const ticket = store.queueTickets.find(
        (t) =>
          t.id === body.ticketId &&
          (t.studentId === user.id ||
            (user.role === "university_admin" && t.institutionId === user.institutionId) ||
            user.role === "super_admin")
      );
      if (!ticket) return NextResponse.json({ error: "Ticket introuvable." }, { status: 404 });
      ticket.status = "cancelled";
      persistToDisk(store);
      return NextResponse.json({ ticket });
    }

    if (user.role !== "university_admin" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Réservé à l'administration." }, { status: 403 });
    }

    const queue = store.queueServices.find(
      (q) => q.id === body.queueId && (user.role === "super_admin" || q.institutionId === user.institutionId)
    );
    if (!queue) return NextResponse.json({ error: "File introuvable." }, { status: 404 });

    if (body.action === "toggle_open") {
      queue.isOpen = !queue.isOpen;
      persistToDisk(store);
      return NextResponse.json({ service: queue });
    }

    if (body.action === "call_next") {
      // Complete any previously called ticket in this queue
      for (const tk of store.queueTickets) {
        if (tk.queueId === queue.id && tk.status === "called") {
          tk.status = "completed";
        }
      }
      const next = store.queueTickets
        .filter((t) => t.queueId === queue.id && t.status === "waiting")
        .sort((a, b) => a.ticketNumber - b.ticketNumber)[0];

      if (next) {
        next.status = "called";
        queue.currentTicketNumber = next.ticketNumber;
        addNotification({
          institutionId: queue.institutionId,
          userId: next.studentId,
          category: "queue",
          title: `C'est votre tour ! Ticket ${next.ticketCode}`,
          body: `Veuillez vous présenter à ${queue.location} (${queue.name}).`,
          actionUrl: "/student/queue",
        });
      }
      persistToDisk(store);
      return NextResponse.json({ service: queue, calledTicket: next || null });
    }

    if (body.action === "mark_ticket" && body.ticketId) {
      const tk = store.queueTickets.find((t) => t.id === body.ticketId && t.queueId === queue.id);
      if (tk && ["completed", "missed"].includes(body.status)) {
        tk.status = body.status;
        persistToDisk(store);
        return NextResponse.json({ ticket: tk });
      }
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur file d'attente." }, { status: 500 });
  }
}
