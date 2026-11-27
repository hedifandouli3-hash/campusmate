import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { ensureStoreHydrated, getCurrentUser, persistStore } from "@/lib/data/store";
import { getInstitutionEntitlements } from "@/lib/licensing/engine";
import { sanitizeText } from "@/lib/utils";
import type { EducationalPartner, SponsorshipCampaign } from "@/types/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "public";
  const store = await ensureStoreHydrated();
  store.educationalPartners ??= [];
  store.sponsorshipCampaigns ??= [];

  const user = await getCurrentUser();
  if (scope === "partner") {
    if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    const partners = store.educationalPartners.filter(
      (p) => user.role === "super_admin" || p.userId === user.id
    );
    const partnerIds = new Set(partners.map((p) => p.id));
    const campaigns = store.sponsorshipCampaigns.filter(
      (c) => user.role === "super_admin" || partnerIds.has(c.partnerId)
    );
    return NextResponse.json({ partners, campaigns });
  }

  // Respect institution preference to disable educational sponsorships
  if (user) {
    const ent = getInstitutionEntitlements(store, user);
    if (!ent.sponsorshipsEnabled) {
      return NextResponse.json({ campaigns: [], disabledByInstitution: true });
    }
  }

  const approved = store.sponsorshipCampaigns.filter((c) => c.status === "approved");
  return NextResponse.json({ campaigns: approved, disabledByInstitution: false });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const store = await ensureStoreHydrated();
    store.educationalPartners ??= [];
    store.sponsorshipCampaigns ??= [];
    const now = new Date().toISOString();
    const user = await getCurrentUser();

    if (body.action === "track_click") {
      // Privacy-preserving aggregate counter only (zero user identity recorded)
      const camp = store.sponsorshipCampaigns.find((c) => c.id === body.id && c.status === "approved");
      if (camp) {
        camp.clicks += 1;
        await persistStore(store);
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "register_partner") {
      const name = sanitizeText(String(body.name || ""), 120);
      const website = sanitizeText(String(body.website || ""), 200);
      if (!name || !website.startsWith("https://")) {
        return NextResponse.json({ error: "Nom et URL HTTPS valide requis." }, { status: 400 });
      }
      const partner: EducationalPartner = {
        id: `edp-${crypto.randomUUID()}`,
        userId: user?.id,
        name,
        website,
        verificationStatus: "pending",
        createdAt: now,
      };
      store.educationalPartners.unshift(partner);
      await persistStore(store);
      return NextResponse.json({ partner }, { status: 201 });
    }

    if (body.action === "create_campaign") {
      if (!user) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
      const partner = store.educationalPartners.find(
        (p) => (p.id === body.partnerId || p.userId === user.id) && p.verificationStatus === "verified"
      );
      if (!partner && user.role !== "super_admin") {
        return NextResponse.json(
          { error: "Seuls les partenaires éducatifs vérifiés peuvent soumettre une campagne." },
          { status: 403 }
        );
      }

      const title = sanitizeText(String(body.title || ""), 140);
      const destinationUrl = sanitizeText(String(body.destinationUrl || ""), 240);
      if (!title || !destinationUrl.startsWith("https://")) {
        return NextResponse.json({ error: "Titre et URL HTTPS requis." }, { status: 400 });
      }

      const campaign: SponsorshipCampaign = {
        id: `spn-${crypto.randomUUID()}`,
        partnerId: partner?.id || "edp-1",
        partnerName: partner?.name || user.fullName,
        institutionId: body.institutionId || null,
        title,
        description: sanitizeText(String(body.description || ""), 500),
        category: sanitizeText(String(body.category || "Formation en ligne"), 80),
        certificationInfo: sanitizeText(String(body.certificationInfo || "Certificat partenaire"), 120),
        destinationUrl,
        startDate: String(body.startDate || now.slice(0, 10)),
        endDate: String(body.endDate || "2027-06-30"),
        status: user.role === "super_admin" ? "approved" : "pending_review",
        impressions: 0,
        clicks: 0,
        annualPackageTnd: Math.max(0, Number(body.annualPackageTnd || 1200)),
        isSimulated: true,
        createdAt: now,
      };
      store.sponsorshipCampaigns.unshift(campaign);
      await persistStore(store);
      return NextResponse.json({ campaign }, { status: 201 });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}
