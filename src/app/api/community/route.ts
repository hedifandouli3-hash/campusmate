import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { addNotification, getStore, persistToDisk, requireUser } from "@/lib/data/store";
import { sanitizeText } from "@/lib/utils";

function timesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function GET() {
  try {
    const user = await requireUser();
    const store = getStore();
    const instId = user.institutionId;

    const marketplace = store.marketplaceListings.filter(
      (m) => (user.role === "super_admin" || m.institutionId === instId) && m.status !== "removed"
    );
    const transportInfo = store.transportInfo.filter(
      (t) => user.role === "super_admin" || t.institutionId === instId
    );
    const carpoolOffers = user.isAdult
      ? store.carpoolOffers.filter(
          (c) => (user.role === "super_admin" || c.institutionId === instId) && c.isInstitutionApproved
        )
      : [];
    const lostFound = store.lostFoundReports.filter(
      (l) => user.role === "super_admin" || l.institutionId === instId
    );
    const rooms = store.rooms.filter(
      (r) => user.role === "super_admin" || r.institutionId === instId
    );
    const reservations = store.roomReservations.filter(
      (r) =>
        (user.role === "super_admin" || r.institutionId === instId) &&
        (user.role === "university_admin" || user.role === "super_admin" || r.requesterId === user.id || r.status === "confirmed")
    );
    // Confidential feedback reports are ONLY visible to their author and authorized university/super admins
    const feedback = store.feedbackReports.filter((f) => {
      if (user.role !== "super_admin" && f.institutionId !== instId) return false;
      if (!f.isConfidential) return true;
      return f.authorId === user.id || user.role === "university_admin" || user.role === "super_admin";
    });
    const events = store.events.filter(
      (e) => (user.role === "super_admin" || e.institutionId === instId) && e.isPublished
    );
    const announcements = store.announcements.filter(
      (a) => user.role === "super_admin" || a.institutionId === instId
    );

    return NextResponse.json({
      marketplace,
      transportInfo,
      carpoolOffers,
      lostFound,
      rooms,
      reservations,
      feedback,
      events,
      announcements,
    });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.institutionId && user.role !== "super_admin") {
      return NextResponse.json({ error: "Institution requise." }, { status: 400 });
    }
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";
    const body = await request.json();
    const store = getStore();
    const now = new Date().toISOString();

    switch (body.module) {
      case "marketplace": {
        if (body.action === "toggle_favorite") {
          const item = store.marketplaceListings.find((m) => m.id === body.id && m.institutionId === instId);
          if (!item) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
          if (item.favoriteUserIds.includes(user.id)) {
            item.favoriteUserIds = item.favoriteUserIds.filter((id) => id !== user.id);
          } else {
            item.favoriteUserIds.push(user.id);
          }
          persistToDisk(store);
          return NextResponse.json({ item });
        }
        if (body.action === "mark_sold") {
          const item = store.marketplaceListings.find((m) => m.id === body.id && m.sellerId === user.id);
          if (!item) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
          item.status = "sold";
          persistToDisk(store);
          return NextResponse.json({ item });
        }
        const allowedCategories = new Set([
          "textbooks",
          "calculators",
          "study_materials",
          "electronics",
          "supplies",
          "other_approved",
        ]);
        const rawPrice = Number(body.priceTnd ?? 0);
        const safePrice = Number.isFinite(rawPrice) ? Math.max(0, Math.min(100_000, rawPrice)) : 0;
        const listing = {
          id: `mkt-${crypto.randomUUID()}`,
          institutionId: instId,
          sellerId: user.id,
          sellerName: user.fullName,
          title: sanitizeText(String(body.title || ""), 120),
          description: sanitizeText(String(body.description || ""), 800),
          category: (allowedCategories.has(body.category)
            ? body.category
            : "study_materials") as "textbooks" | "calculators" | "study_materials" | "electronics" | "supplies" | "other_approved",
          priceTnd: safePrice,
          condition: sanitizeText(String(body.condition || "Bon état"), 40),
          status: "available" as const,
          favoriteUserIds: [],
          createdAt: now,
        };
        if (!listing.title) return NextResponse.json({ error: "Titre requis." }, { status: 400 });
        store.marketplaceListings.unshift(listing);
        persistToDisk(store);
        return NextResponse.json({ listing }, { status: 201 });
      }

      case "lost_found": {
        if (body.action === "mark_recovered") {
          const rep = store.lostFoundReports.find(
            (r) =>
              r.id === body.id &&
              r.institutionId === instId &&
              (r.reporterId === user.id || user.role === "university_admin")
          );
          if (!rep) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
          rep.status = "recovered";
          persistToDisk(store);
          return NextResponse.json({ report: rep });
        }
        const report = {
          id: `lf-${crypto.randomUUID()}`,
          institutionId: instId,
          reporterId: user.id,
          reporterName: user.fullName,
          reportType: (body.reportType === "found" ? "found" : "lost") as "lost" | "found",
          itemName: sanitizeText(String(body.itemName || ""), 120),
          category: sanitizeText(String(body.category || "Autre"), 60),
          description: sanitizeText(String(body.description || ""), 600),
          generalLocation: sanitizeText(String(body.generalLocation || ""), 120),
          eventDate: String(body.eventDate || now.slice(0, 10)),
          status: "open" as const,
          createdAt: now,
        };
        if (!report.itemName) return NextResponse.json({ error: "Nom de l'objet requis." }, { status: 400 });
        store.lostFoundReports.unshift(report);
        persistToDisk(store);
        return NextResponse.json({ report }, { status: 201 });
      }

      case "rooms": {
        if (body.action === "cancel") {
          const res = store.roomReservations.find(
            (r) =>
              r.id === body.id &&
              r.institutionId === instId &&
              (r.requesterId === user.id || user.role === "university_admin" || user.role === "super_admin")
          );
          if (!res) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
          res.status = "cancelled";
          persistToDisk(store);
          return NextResponse.json({ reservation: res });
        }
        const room = store.rooms.find((r) => r.id === body.roomId && r.institutionId === instId);
        if (!room || !room.isReservable) {
          return NextResponse.json({ error: "Salle non disponible à la réservation." }, { status: 404 });
        }
        const date = String(body.reservationDate || "");
        const startTime = String(body.startTime || "");
        const endTime = String(body.endTime || "");
        if (!date || !startTime || !endTime || startTime >= endTime) {
          return NextResponse.json({ error: "Plage horaire invalide." }, { status: 400 });
        }

        // Prevent overlapping reservations server-side
        const conflict = store.roomReservations.find(
          (r) =>
            r.roomId === room.id &&
            r.reservationDate === date &&
            r.status === "confirmed" &&
            timesOverlap(r.startTime, r.endTime, startTime, endTime)
        );
        if (conflict) {
          return NextResponse.json(
            { error: `Conflit de réservation : la salle est déjà réservée de ${conflict.startTime} à ${conflict.endTime}.` },
            { status: 409 }
          );
        }

        const reservation = {
          id: `res-${crypto.randomUUID()}`,
          institutionId: instId,
          roomId: room.id,
          roomName: room.name,
          requesterId: user.id,
          requesterName: user.fullName,
          reservationDate: date,
          startTime,
          endTime,
          purpose: sanitizeText(String(body.purpose || "Session d'étude"), 200),
          status: "confirmed" as const,
          createdAt: now,
        };
        store.roomReservations.unshift(reservation);
        addNotification({
          institutionId: instId,
          userId: user.id,
          category: "room",
          title: `Réservation confirmée : ${room.name}`,
          body: `${date} de ${startTime} à ${endTime}.`,
          actionUrl: "/student/study-rooms",
        });
        persistToDisk(store);
        return NextResponse.json({ reservation }, { status: 201 });
      }

      case "feedback": {
        if (body.action === "respond" && (user.role === "university_admin" || user.role === "super_admin")) {
          const fb = store.feedbackReports.find((f) => f.id === body.id && f.institutionId === instId);
          if (!fb) return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
          if (body.status && ["submitted", "under_review", "in_progress", "resolved", "closed"].includes(body.status)) {
            fb.status = body.status;
          }
          if (body.message) {
            fb.responses.push({
              responderName: user.fullName,
              message: sanitizeText(String(body.message), 800),
              createdAt: now,
            });
          }
          addNotification({
            institutionId: instId,
            userId: fb.authorId,
            category: "feedback",
            title: `Réponse à votre message : ${fb.title}`,
            body: `Statut : ${fb.status}`,
            actionUrl: "/student/feedback",
          });
          persistToDisk(store);
          return NextResponse.json({ report: fb });
        }
        const report = {
          id: `fb-${crypto.randomUUID()}`,
          institutionId: instId,
          authorId: user.id,
          authorName: body.isConfidential ? "Soumission confidentielle" : user.fullName,
          category: body.category || "suggestion",
          title: sanitizeText(String(body.title || ""), 140),
          description: sanitizeText(String(body.description || ""), 1500),
          isConfidential: Boolean(body.isConfidential),
          aiTheme: body.category === "facility" ? "Infrastructures" : "Vie Académique",
          status: "submitted" as const,
          responses: [],
          createdAt: now,
        };
        if (!report.title || !report.description) {
          return NextResponse.json({ error: "Titre et description requis." }, { status: 400 });
        }
        store.feedbackReports.unshift(report);
        persistToDisk(store);
        return NextResponse.json({ report }, { status: 201 });
      }

      case "events": {
        if (body.action === "register") {
          const evt = store.events.find((e) => e.id === body.id && e.institutionId === instId);
          if (!evt) return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
          if (evt.registeredUserIds.includes(user.id)) {
            evt.registeredUserIds = evt.registeredUserIds.filter((id) => id !== user.id);
          } else {
            if (evt.registeredUserIds.length >= evt.capacity) {
              return NextResponse.json({ error: "Capacité maximale atteinte pour cet événement." }, { status: 409 });
            }
            evt.registeredUserIds.push(user.id);
            addNotification({
              institutionId: instId,
              userId: user.id,
              category: "event",
              title: `Inscription confirmée : ${evt.title}`,
              body: `Rendez-vous à ${evt.location}.`,
              actionUrl: "/student/events",
            });
          }
          persistToDisk(store);
          return NextResponse.json({ event: evt });
        }
        if (body.action === "create" && (user.role === "university_admin" || user.role === "teacher")) {
          const evt = {
            id: `evt-${crypto.randomUUID()}`,
            institutionId: instId,
            organizerId: user.id,
            organizerName: user.fullName,
            title: sanitizeText(String(body.title || ""), 140),
            category: body.category || "workshop",
            description: sanitizeText(String(body.description || ""), 1200),
            location: sanitizeText(String(body.location || "Campus"), 120),
            eventDate: String(body.eventDate || now),
            capacity: Math.max(5, Number(body.capacity || 50)),
            registeredUserIds: [],
            savedUserIds: [],
            isPublished: true,
          };
          store.events.unshift(evt);
          persistToDisk(store);
          return NextResponse.json({ event: evt }, { status: 201 });
        }
        return NextResponse.json({ error: "Action événement invalide." }, { status: 400 });
      }

      case "transport": {
        if (!user.isAdult) {
          return NextResponse.json({ error: "Covoiturage réservé aux participants majeurs vérifiés." }, { status: 403 });
        }
        const offer = {
          id: `cp-${crypto.randomUUID()}`,
          institutionId: instId,
          driverId: user.id,
          driverName: `${user.fullName} (Démo)`,
          departureArea: sanitizeText(String(body.departureArea || ""), 100),
          destinationArea: sanitizeText(String(body.destinationArea || "Campus ISET Béja"), 100),
          departureWindow: sanitizeText(String(body.departureWindow || ""), 80),
          availableSeats: Math.min(4, Math.max(1, Number(body.availableSeats || 2))),
          isInstitutionApproved: true,
          adultsOnly: true,
          isDemoSample: true,
        };
        store.carpoolOffers.unshift(offer);
        persistToDisk(store);
        return NextResponse.json({ offer }, { status: 201 });
      }

      case "announcements": {
        if (user.role !== "teacher" && user.role !== "university_admin") {
          return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
        }
        const ann = {
          id: `ann-${crypto.randomUUID()}`,
          institutionId: instId,
          authorId: user.id,
          authorName: user.fullName,
          authorRole: user.role,
          title: sanitizeText(String(body.title || ""), 140),
          body: sanitizeText(String(body.body || ""), 2000),
          isOfficial: user.role === "university_admin",
          isPinned: Boolean(body.isPinned),
          createdAt: now,
        };
        store.announcements.unshift(ann);
        const recipients = store.users.filter((u) => u.institutionId === instId && u.id !== user.id);
        for (const rec of recipients) {
          addNotification({
            institutionId: instId,
            userId: rec.id,
            category: "announcement",
            title: ann.title,
            body: ann.body.slice(0, 120),
            actionUrl: rec.role === "student" ? "/student/dashboard" : "/teacher/announcements",
          });
        }
        persistToDisk(store);
        return NextResponse.json({ announcement: ann }, { status: 201 });
      }

      default:
        return NextResponse.json({ error: "Module inconnu." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
