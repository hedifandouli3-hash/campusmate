import { NextResponse } from "next/server";
import { z } from "zod";
import { generateMotivationLetterWithAI } from "@/lib/ai/service";
import { getStore, persistToDisk, requireUser } from "@/lib/data/store";

export async function GET() {
  try {
    const user = await requireUser(["student"]);
    const store = getStore();
    const existing = store.cvProfiles.find((c) => c.studentId === user.id) || {
      studentId: user.id,
      fullName: user.fullName,
      email: user.email,
      headline: user.sectionName || "Étudiant(e) Universitaire",
      summary: user.bio || "",
      template: "modern" as const,
      education: [],
      experience: [],
      projects: [],
      certifications: [],
      skills: user.skills || [],
      languages: ["Français", "Arabe"],
    };
    return NextResponse.json({ cv: existing });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

const CvSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  headline: z.string().min(2),
  summary: z.string().default(""),
  template: z.enum(["modern", "classic", "minimal"]).default("modern"),
  education: z.array(z.object({ school: z.string(), degree: z.string(), period: z.string() })).default([]),
  experience: z
    .array(z.object({ role: z.string(), company: z.string(), period: z.string(), details: z.string() }))
    .default([]),
  projects: z.array(z.object({ name: z.string(), stack: z.string(), description: z.string() })).default([]),
  certifications: z.array(z.object({ name: z.string(), issuer: z.string(), year: z.string() })).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export async function PUT(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const parsed = CvSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "CV invalide." }, { status: 400 });
    }
    const store = getStore();
    const idx = store.cvProfiles.findIndex((c) => c.studentId === user.id);
    const record = { studentId: user.id, ...parsed.data };
    if (idx === -1) {
      store.cvProfiles.push(record);
    } else {
      store.cvProfiles[idx] = record;
    }
    persistToDisk(store);
    return NextResponse.json({ ok: true, cv: record });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const offerId = String(body.offerId || "");
    const locale = (body.locale === "en" || body.locale === "ar" ? body.locale : "fr") as "fr" | "en" | "ar";

    const store = getStore();
    const offer = store.internshipOffers.find((o) => o.id === offerId && o.status === "published");
    const cv = store.cvProfiles.find((c) => c.studentId === user.id);

    const result = await generateMotivationLetterWithAI({
      studentName: cv?.fullName || user.fullName,
      skills: cv?.skills || user.skills || [],
      headline: cv?.headline || user.sectionName || "Étudiant(e)",
      offerTitle: offer?.title || String(body.customTitle || "Stage Académique"),
      organizationName: offer?.organizationName || String(body.customOrg || "Entreprise Partenaire"),
      offerRequirements: offer?.requiredSkills || [],
      locale,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Erreur génération lettre." }, { status: 500 });
  }
}
