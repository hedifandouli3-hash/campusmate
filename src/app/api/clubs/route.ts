import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureStoreHydrated, persistStore, requireUser } from "@/lib/data/store";
import { buildInitialDemoState } from "@/lib/demo/seed";
import { sanitizeText } from "@/lib/utils";
import type { ClubProfile } from "@/types/domain";

export async function GET() {
  try {
    const user = await requireUser();
    const store = await ensureStoreHydrated();
    store.clubProfiles ??= buildInitialDemoState().clubProfiles ?? [];
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";
    const clubs = store.clubProfiles.filter(
      (c) => user.role === "super_admin" || c.institutionId === instId
    );
    return NextResponse.json({ clubs });
  } catch {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const store = await ensureStoreHydrated();
    store.clubProfiles ??= buildInitialDemoState().clubProfiles ?? [];
    store.socialPosts ??= buildInitialDemoState().socialPosts ?? [];
    const instId = user.institutionId || "11111111-1111-1111-1111-111111111101";
    const now = new Date().toISOString();

    if (body.action === "toggle_membership") {
      const club = store.clubProfiles.find((c) => c.id === body.clubId && c.institutionId === instId);
      if (!club) return NextResponse.json({ error: "Club introuvable." }, { status: 404 });
      if (club.memberIds.includes(user.id)) {
        club.memberIds = club.memberIds.filter((id) => id !== user.id);
      } else {
        club.memberIds.push(user.id);
      }
      await persistStore(store);
      return NextResponse.json({ club });
    }

    if (body.action === "create_club") {
      if (!["university_admin", "super_admin"].includes(user.role)) {
        return NextResponse.json({ error: "Seule l'administration peut créer un club reconnu." }, { status: 403 });
      }
      const name = sanitizeText(String(body.name || ""), 120);
      if (!name) return NextResponse.json({ error: "Nom du club requis." }, { status: 400 });
      const club: ClubProfile = {
        id: `club-${crypto.randomUUID()}`,
        institutionId: instId,
        name,
        category: sanitizeText(String(body.category || "Vie étudiante"), 60),
        description: sanitizeText(String(body.description || ""), 400),
        contactEmail: sanitizeText(String(body.contactEmail || user.email), 120),
        isVerified: true,
        memberIds: [],
        upcomingActivity: sanitizeText(String(body.upcomingActivity || "À venir"), 140),
        createdAt: now,
      };
      store.clubProfiles.unshift(club);
      await persistStore(store);
      return NextResponse.json({ club }, { status: 201 });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}
