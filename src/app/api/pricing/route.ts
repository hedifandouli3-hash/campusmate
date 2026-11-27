import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureStoreHydrated, persistStore } from "@/lib/data/store";
import { calculateInstitutionalQuote, DEFAULT_INSTITUTIONAL_PLANS } from "@/lib/licensing/engine";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";
import type { InstitutionalQuote } from "@/types/domain";

const QuoteSchema = z.object({
  institutionName: z.string().min(2).max(140),
  institutionType: z
    .enum(["public_university", "private_university", "iset", "training_center", "incubator"])
    .default("iset"),
  officialWebsite: z.string().max(200).optional().default(""),
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  planCode: z.enum(["university_plus", "university_pro", "university_ultra"]),
  studentSeats: z.number().int().min(10).max(100000),
  professorSeats: z.number().int().min(1).max(20000),
  onboardingServiceTnd: z.number().min(0).max(50000).optional().default(0),
  discountPercent: z.number().min(0).max(50).optional().default(0),
});

export async function GET() {
  const store = await ensureStoreHydrated();
  const plans = store.institutionalPlans ?? DEFAULT_INSTITUTIONAL_PLANS;
  return NextResponse.json({
    plans,
    pricingDisclaimer:
      "Tarifs indicatifs proposés dans le cadre de la présentation commerciale (devis non contractuel, sans taxe non vérifiée).",
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(`pricing:${ip}`, 20, 60_000).allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const parsed = QuoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Paramètres de devis invalides." },
      { status: 400 }
    );
  }

  const store = await ensureStoreHydrated();
  const plans = store.institutionalPlans ?? DEFAULT_INSTITUTIONAL_PLANS;
  const plan = plans.find((p) => p.code === parsed.data.planCode);
  if (!plan) {
    return NextResponse.json({ error: "Plan introuvable." }, { status: 404 });
  }

  // Server-side deterministic calculation (never trust client totals)
  const calc = calculateInstitutionalQuote({
    plan,
    studentSeats: parsed.data.studentSeats,
    professorSeats: parsed.data.professorSeats,
    onboardingServiceTnd: parsed.data.onboardingServiceTnd,
    discountPercent: 0, // public quote requests cannot self-apply arbitrary discounts
  });

  const quote: InstitutionalQuote = {
    id: `quote-${crypto.randomUUID()}`,
    institutionName: sanitizeText(parsed.data.institutionName, 140),
    institutionType: parsed.data.institutionType,
    officialWebsite: sanitizeText(parsed.data.officialWebsite || "", 200),
    contactName: sanitizeText(parsed.data.contactName, 120),
    contactEmail: parsed.data.contactEmail.trim().toLowerCase(),
    planCode: plan.code,
    studentSeats: parsed.data.studentSeats,
    professorSeats: parsed.data.professorSeats,
    onboardingServiceTnd: parsed.data.onboardingServiceTnd,
    discountPercent: 0,
    annualTotalTnd: calc.annualTotalTnd,
    monthlyEquivalentTnd: calc.monthlyEquivalentTnd,
    status: "requested",
    isSimulated: true,
    createdAt: new Date().toISOString(),
  };

  store.institutionalQuotes ??= [];
  store.institutionalQuotes.unshift(quote);
  await persistStore(store);

  return NextResponse.json({ quote, calculation: calc }, { status: 201 });
}
