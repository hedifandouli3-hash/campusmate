import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureStoreHydrated, getCurrentUser, persistStore, requireUser } from "@/lib/data/store";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";
import type { HousingListing, HousingProvider } from "@/types/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "public";
  const store = await ensureStoreHydrated();
  store.housingListings ??= [];
  store.housingProviders ??= [];

  if (scope === "provider") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    const providers = store.housingProviders.filter(
      (p) => user.role === "super_admin" || p.userId === user.id || p.contactEmail === user.email
    );
    const providerIds = new Set(providers.map((p) => p.id));
    const listings = store.housingListings.filter(
      (l) => user.role === "super_admin" || providerIds.has(l.providerId)
    );
    return NextResponse.json({ providers, listings });
  }

  const user = await getCurrentUser();
  const approvedListings = store.housingListings.filter(
    (l) =>
      l.moderationStatus === "approved" &&
      l.isVerifiedProvider &&
      (!user?.institutionId || l.institutionId === user.institutionId)
  );

  return NextResponse.json({ listings: approvedListings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = await ensureStoreHydrated();
    store.housingProviders ??= [];
    store.housingListings ??= [];
    const now = new Date().toISOString();

    if (body.action === "register_provider") {
      const ip = request.headers.get("x-forwarded-for") || "local";
      if (!checkRateLimit(`housing-provider:${ip}`, 10, 60_000).allowed) {
        return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
      }
      const user = await getCurrentUser();
      const name = sanitizeText(String(body.name || ""), 120);
      const contactEmail = sanitizeText(String(body.contactEmail || user?.email || ""), 120).toLowerCase();
      if (!name || !contactEmail) {
        return NextResponse.json({ error: "Nom et email requis." }, { status: 400 });
      }
      const planCode = body.planCode === "pro_annual" ? "pro_annual" : "single_listing";
      const provider: HousingProvider = {
        id: `hprov-${crypto.randomUUID()}`,
        userId: user?.id,
        name,
        contactEmail,
        verificationStatus: "pending",
        planCode,
        planPriceTnd: planCode === "pro_annual" ? 150 : 20,
        isSimulated: true,
        createdAt: now,
      };
      store.housingProviders.unshift(provider);
      await persistStore(store);
      return NextResponse.json(
        {
          provider,
          message: "Demande de prestataire logement enregistrée en attente de vérification.",
        },
        { status: 201 }
      );
    }

    const user = await requireUser(["student", "teacher", "university_admin", "organization", "super_admin"]);

    if (body.action === "create_listing") {
      const provider = store.housingProviders.find(
        (p) =>
          (p.id === body.providerId || p.userId === user.id || p.contactEmail === user.email) &&
          p.verificationStatus === "verified"
      );
      if (!provider && user.role !== "super_admin") {
        return NextResponse.json(
          { error: "Seuls les prestataires logement vérifiés peuvent publier des annonces." },
          { status: 403 }
        );
      }

      const title = sanitizeText(String(body.title || ""), 140);
      const generalLocation = sanitizeText(String(body.generalLocation || ""), 120);
      const monthlyRentTnd = Math.max(50, Number(body.monthlyRentTnd || 0));
      if (!title || !generalLocation) {
        return NextResponse.json({ error: "Titre et localisation générale requis." }, { status: 400 });
      }

      const listing: HousingListing = {
        id: `hous-${crypto.randomUUID()}`,
        providerId: provider?.id || "hprov-1",
        providerName: provider?.name || user.fullName,
        institutionId: user.institutionId || "11111111-1111-1111-1111-111111111101",
        title,
        description: sanitizeText(String(body.description || ""), 600),
        category: (["residence", "studio", "apartment", "room", "shared", "university_info"].includes(body.category)
          ? body.category
          : "studio") as HousingListing["category"],
        generalLocation,
        monthlyRentTnd,
        distanceKm: Math.max(0.1, Number(body.distanceKm || 1.2)),
        available: true,
        amenities: Array.isArray(body.amenities)
          ? body.amenities.map((a: unknown) => sanitizeText(String(a), 40)).slice(0, 8)
          : ["Wi-Fi"],
        leaseDuration: sanitizeText(String(body.leaseDuration || "Année universitaire"), 60),
        includedExpenses: sanitizeText(String(body.includedExpenses || "À préciser"), 80),
        photos: ["/images/demo/study-room.svg"],
        isVerifiedProvider: true,
        isSponsored: Boolean(body.isSponsored && provider?.planCode === "pro_annual"),
        moderationStatus: user.role === "super_admin" ? "approved" : "pending",
        createdAt: now,
      };
      store.housingListings.unshift(listing);
      await persistStore(store);
      return NextResponse.json({ listing }, { status: 201 });
    }

    if (body.action === "toggle_availability") {
      const listing = store.housingListings.find((l) => l.id === body.id);
      if (!listing) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
      const ownsProvider = store.housingProviders.some(
        (p) => p.id === listing.providerId && (p.userId === user.id || p.contactEmail === user.email)
      );
      if (!ownsProvider && user.role !== "super_admin") {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      }
      listing.available = !listing.available;
      await persistStore(store);
      return NextResponse.json({ listing });
    }

    if (body.action === "report_listing") {
      store.contentReports.unshift({
        id: `rep-${crypto.randomUUID()}`,
        institutionId: user.institutionId || "11111111-1111-1111-1111-111111111101",
        reporterId: user.id,
        reporterName: user.fullName,
        targetType: "marketplace_listing",
        targetId: String(body.id || ""),
        reason: sanitizeText(String(body.reason || "Signalement logement"), 300),
        status: "open",
        createdAt: now,
      });
      await persistStore(store);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Erreur d'autorisation ou de requête." }, { status: 401 });
  }
}
