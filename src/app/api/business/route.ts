import { NextResponse } from "next/server";
import { addAuditLog, ensureStoreHydrated, persistStore, requireUser } from "@/lib/data/store";
import {
  calculateInstitutionalQuote,
  DEFAULT_INSTITUTIONAL_PLANS,
  getInstitutionEntitlements,
} from "@/lib/licensing/engine";
import { sanitizeText } from "@/lib/utils";
import type { InstitutionalPlanCode, InstitutionLicenseStatus } from "@/types/domain";

export async function GET() {
  try {
    const user = await requireUser(["university_admin", "super_admin"]);
    const store = await ensureStoreHydrated();
    const plans = store.institutionalPlans ?? DEFAULT_INSTITUTIONAL_PLANS;
    store.institutionLicenses ??= [];
    store.institutionalQuotes ??= [];
    store.companySubscriptions ??= [];
    store.housingProviders ??= [];
    store.sponsorshipCampaigns ??= [];
    store.institutionUsageEvents ??= [];

    if (user.role === "university_admin") {
      const license = store.institutionLicenses.find((l) => l.institutionId === user.institutionId) || null;
      const entitlements = getInstitutionEntitlements(store, user);
      const quotes = store.institutionalQuotes.filter(
        (q) => q.contactEmail === user.email || q.institutionName.toLowerCase().includes("béja")
      );
      const usageEvents = store.institutionUsageEvents
        .filter((e) => e.institutionId === user.institutionId)
        .slice(0, 20);
      return NextResponse.json({
        role: user.role,
        plans,
        license,
        entitlements,
        quotes,
        usageEvents,
      });
    }

    // super_admin full Business Control Center
    const simulatedInstitutionalArr = store.institutionLicenses
      .filter((l) => l.status === "active")
      .reduce((acc, l) => acc + l.annualContractTnd, 0);
    const simulatedCompanyArr = store.companySubscriptions
      .filter((c) => c.status === "active")
      .reduce((acc, c) => acc + c.annualPriceTnd, 0);
    const simulatedHousingArr = store.housingProviders
      .filter((h) => h.verificationStatus === "verified")
      .reduce((acc, h) => acc + h.planPriceTnd, 0);
    const simulatedSponsorshipArr = store.sponsorshipCampaigns
      .filter((s) => s.status === "approved")
      .reduce((acc, s) => acc + s.annualPackageTnd, 0);

    return NextResponse.json({
      role: user.role,
      plans,
      institutions: store.institutions,
      licenses: store.institutionLicenses,
      quotes: store.institutionalQuotes,
      companySubscriptions: store.companySubscriptions,
      housingProviders: store.housingProviders,
      housingListings: store.housingListings ?? [],
      educationalPartners: store.educationalPartners ?? [],
      sponsorshipCampaigns: store.sponsorshipCampaigns,
      revenueSummary: {
        actualConfirmedArrTnd: 0,
        simulatedArrTnd:
          simulatedInstitutionalArr +
          simulatedCompanyArr +
          simulatedHousingArr +
          simulatedSponsorshipArr,
        simulatedInstitutionalArr,
        simulatedCompanyArr,
        simulatedHousingArr,
        simulatedSponsorshipArr,
        totalLicensedStudentSeats: store.institutionLicenses.reduce((a, l) => a + l.maxStudentSeats, 0),
        totalAssignedStudentSeats: store.institutionLicenses.reduce((a, l) => a + l.assignedStudentSeats, 0),
        totalAiTokensTracked: store.institutionLicenses.reduce((a, l) => a + l.aiUsedThisPeriod, 0),
      },
    });
  } catch {
    return NextResponse.json({ error: "Accès réservé à l'administration." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["university_admin", "super_admin"]);
    const body = await request.json();
    const store = await ensureStoreHydrated();
    store.institutionalPlans ??= DEFAULT_INSTITUTIONAL_PLANS;
    store.institutionLicenses ??= [];
    store.institutionalQuotes ??= [];
    store.housingProviders ??= [];
    store.housingListings ??= [];
    store.educationalPartners ??= [];
    store.sponsorshipCampaigns ??= [];
    const now = new Date().toISOString();

    // University admin can request upgrades/seats/renewals or toggle sponsorships
    if (user.role === "university_admin") {
      const license = store.institutionLicenses.find((l) => l.institutionId === user.institutionId);
      if (body.action === "toggle_sponsorships" && license) {
        license.sponsorshipsEnabled = Boolean(body.sponsorshipsEnabled);
        license.updatedAt = now;
        await persistStore(store);
        return NextResponse.json({ license });
      }
      if (body.action === "request_license_change") {
        const planCode = (["university_plus", "university_pro", "university_ultra"].includes(body.planCode)
          ? body.planCode
          : license?.planCode || "university_pro") as InstitutionalPlanCode;
        const plan = store.institutionalPlans.find((p) => p.code === planCode) || store.institutionalPlans[1];
        const studentSeats = Math.max(10, Number(body.studentSeats || license?.maxStudentSeats || 500));
        const professorSeats = Math.max(1, Number(body.professorSeats || license?.maxProfessorSeats || 40));
        const calc = calculateInstitutionalQuote({ plan, studentSeats, professorSeats });
        store.institutionalQuotes.unshift({
          id: `quote-${Date.now()}`,
          institutionName: user.institutionName || "Université",
          institutionType: "iset",
          officialWebsite: "",
          contactName: user.fullName,
          contactEmail: user.email,
          planCode,
          studentSeats,
          professorSeats,
          onboardingServiceTnd: 0,
          discountPercent: 0,
          annualTotalTnd: calc.annualTotalTnd,
          monthlyEquivalentTnd: calc.monthlyEquivalentTnd,
          status: "requested",
          isSimulated: true,
          createdAt: now,
        });
        await persistStore(store);
        return NextResponse.json({ ok: true, message: "Demande commerciale envoyée au Super Admin." });
      }
      return NextResponse.json(
        { error: "Seul le Super Administrateur peut modifier ou activer un contrat commercial." },
        { status: 403 }
      );
    }

    // Super Admin actions
    if (body.action === "update_plan_pricing") {
      const plan = store.institutionalPlans.find((p) => p.code === body.code);
      if (!plan) return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });
      plan.studentSeatPriceTnd = Math.max(1, Number(body.studentSeatPriceTnd ?? plan.studentSeatPriceTnd));
      plan.professorSeatPriceTnd = Math.max(1, Number(body.professorSeatPriceTnd ?? plan.professorSeatPriceTnd));
      plan.aiMonthlyAllowancePerSeat = Math.max(
        1000,
        Number(body.aiMonthlyAllowancePerSeat ?? plan.aiMonthlyAllowancePerSeat)
      );
      await persistStore(store);
      return NextResponse.json({ plan });
    }

    if (body.action === "update_license") {
      const lic = store.institutionLicenses.find((l) => l.id === body.licenseId);
      if (!lic) return NextResponse.json({ error: "Licence introuvable." }, { status: 404 });
      if (["university_plus", "university_pro", "university_ultra"].includes(body.planCode)) {
        lic.planCode = body.planCode;
      }
      if (
        ["requested", "under_review", "quotation_issued", "contract_pending", "active", "renewal_pending", "expired", "suspended"].includes(
          body.status
        )
      ) {
        lic.status = body.status as InstitutionLicenseStatus;
      }
      if (body.maxStudentSeats) lic.maxStudentSeats = Math.max(1, Number(body.maxStudentSeats));
      if (body.maxProfessorSeats) lic.maxProfessorSeats = Math.max(1, Number(body.maxProfessorSeats));
      const plan = store.institutionalPlans.find((p) => p.code === lic.planCode) || store.institutionalPlans[1];
      lic.annualContractTnd = calculateInstitutionalQuote({
        plan,
        studentSeats: lic.maxStudentSeats,
        professorSeats: lic.maxProfessorSeats,
      }).annualTotalTnd;
      lic.updatedAt = now;
      addAuditLog({
        institutionId: lic.institutionId,
        actorId: user.id,
        actorName: user.fullName,
        action: "LICENSE_UPDATED",
        resourceType: "institution_license",
        resourceId: lic.id,
        details: `plan=${lic.planCode} status=${lic.status} seats=${lic.maxStudentSeats}/${lic.maxProfessorSeats}`,
      });
      await persistStore(store);
      return NextResponse.json({ license: lic });
    }

    if (body.action === "verify_housing_provider") {
      const prov = store.housingProviders.find((p) => p.id === body.providerId);
      if (!prov) return NextResponse.json({ error: "Prestataire introuvable." }, { status: 404 });
      prov.verificationStatus = body.decision === "rejected" ? "rejected" : "verified";
      await persistStore(store);
      return NextResponse.json({ provider: prov });
    }

    if (body.action === "moderate_housing_listing") {
      const listing = store.housingListings.find((l) => l.id === body.listingId);
      if (!listing) return NextResponse.json({ error: "Annonce introuvable." }, { status: 404 });
      listing.moderationStatus = body.decision === "rejected" ? "rejected" : "approved";
      await persistStore(store);
      return NextResponse.json({ listing });
    }

    if (body.action === "moderate_campaign") {
      const camp = store.sponsorshipCampaigns.find((c) => c.id === body.campaignId);
      if (!camp) return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });
      camp.status = body.decision === "rejected" ? "rejected" : "approved";
      await persistStore(store);
      return NextResponse.json({ campaign: camp });
    }

    if (body.action === "review_quote") {
      const quote = store.institutionalQuotes.find((q) => q.id === body.quoteId);
      if (!quote) return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
      quote.status = sanitizeText(String(body.status || "quotation_issued"), 40) as typeof quote.status;
      await persistStore(store);
      return NextResponse.json({ quote });
    }

    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
}
