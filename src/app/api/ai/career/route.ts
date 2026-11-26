import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  evaluateCvHeuristically,
  generateMotivationLetterWithAI,
  improveCvContentWithAI,
} from "@/lib/ai/service";
import { getStore, persistToDisk, requireUser } from "@/lib/data/store";
import { isSafeHttpUrl } from "@/lib/security/crypto";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { sanitizeText } from "@/lib/utils";
import type { CVProfile, UserProfile } from "@/types/domain";

const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "internships",
  "projects",
  "education",
  "skills",
  "certifications",
  "languages",
  "awards",
  "volunteer",
];

function buildDefaultCv(user: UserProfile): CVProfile {
  return {
    id: `cv-${user.id}-default`,
    studentId: user.id,
    title: "CV Principal",
    fullName: user.fullName,
    email: user.email,
    phone: "",
    city: "Béja, Tunisie",
    website: "",
    linkedin: "",
    github: "",
    headline: user.sectionName || "Étudiant(e) Universitaire",
    summary: user.bio || "",
    template: "modern",
    accentColor: "#2563eb",
    fontStyle: "sans",
    language: user.preferredLanguage || "fr",
    isDefault: true,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    education: [],
    experience: [],
    internships: [],
    projects: [],
    certifications: [],
    awards: [],
    volunteer: [],
    skills: user.skills || [],
    softSkills: ["Travail en équipe", "Esprit analytique"],
    languages: ["Français", "Arabe", "Anglais"],
    updatedAt: new Date().toISOString(),
  };
}

function getStudentCvs(user: UserProfile): CVProfile[] {
  const store = getStore();
  let changed = false;
  const studentCvs = store.cvProfiles.filter((c) => c.studentId === user.id);
  studentCvs.forEach((c, idx) => {
    if (!c.id) {
      c.id = idx === 0 ? `cv-${user.id}-default` : `cv-${crypto.randomUUID()}`;
      changed = true;
    }
    if (!c.title) {
      c.title = idx === 0 ? "CV Principal" : `CV Version ${idx + 1}`;
      changed = true;
    }
    if (!c.sectionOrder || c.sectionOrder.length === 0) {
      c.sectionOrder = [...DEFAULT_SECTION_ORDER];
      changed = true;
    }
  });
  if (studentCvs.length === 0) {
    const fresh = buildDefaultCv(user);
    store.cvProfiles.push(fresh);
    persistToDisk(store);
    return [fresh];
  }
  if (changed) {
    persistToDisk(store);
  }
  return studentCvs;
}

export async function GET() {
  try {
    const user = await requireUser(["student"]);
    const store = getStore();
    const cvs = getStudentCvs(user);
    const activeCv = cvs.find((c) => c.isDefault) || cvs[0];
    const verifiedOrgIds = new Set(
      store.organizations.filter((o) => o.verificationStatus === "verified").map((o) => o.id)
    );
    const offers = store.internshipOffers
      .filter((o) => o.status === "published" && verifiedOrgIds.has(o.organizationId))
      .map((o) => ({
        id: o.id,
        title: o.title,
        organizationName: o.organizationName,
        requiredSkills: o.requiredSkills,
      }));
    return NextResponse.json({ cv: activeCv, cvs, offers });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

const CvSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(80).default("CV Principal"),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  city: z.string().max(80).optional(),
  website: z.string().max(200).optional(),
  linkedin: z.string().max(200).optional(),
  github: z.string().max(200).optional(),
  photoDataUrl: z.string().max(350_000).optional(),
  headline: z.string().min(2).max(160),
  summary: z.string().max(2000).default(""),
  template: z.enum(["classic", "modern", "ats", "technical", "academic", "minimal"]).default("modern"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontStyle: z.enum(["sans", "serif", "mono"]).optional(),
  language: z.enum(["fr", "en", "ar"]).optional(),
  isDefault: z.boolean().optional(),
  tailoredOfferId: z.string().optional(),
  sectionOrder: z.array(z.string()).optional(),
  hiddenSections: z.array(z.string()).optional(),
  education: z
    .array(z.object({ school: z.string(), degree: z.string(), period: z.string(), details: z.string().optional() }))
    .default([]),
  experience: z
    .array(z.object({ role: z.string(), company: z.string(), period: z.string(), details: z.string() }))
    .default([]),
  internships: z
    .array(z.object({ role: z.string(), organization: z.string(), period: z.string(), details: z.string() }))
    .default([]),
  projects: z
    .array(z.object({ name: z.string(), stack: z.string(), description: z.string(), link: z.string().optional() }))
    .default([]),
  certifications: z.array(z.object({ name: z.string(), issuer: z.string(), year: z.string() })).default([]),
  awards: z.array(z.object({ title: z.string(), issuer: z.string(), year: z.string() })).default([]),
  volunteer: z
    .array(z.object({ role: z.string(), organization: z.string(), period: z.string(), details: z.string() }))
    .default([]),
  skills: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export async function PUT(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const parsed = CvSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Informations CV invalides." }, { status: 400 });
    }
    const { website, linkedin, github, photoDataUrl } = parsed.data;
    if (!isSafeHttpUrl(website) || !isSafeHttpUrl(linkedin) || !isSafeHttpUrl(github)) {
      return NextResponse.json({ error: "Les liens doivent utiliser http:// ou https://." }, { status: 400 });
    }
    if (
      photoDataUrl &&
      !photoDataUrl.startsWith("data:image/png;base64,") &&
      !photoDataUrl.startsWith("data:image/jpeg;base64,")
    ) {
      return NextResponse.json({ error: "Format photo invalide (PNG ou JPEG uniquement)." }, { status: 400 });
    }

    const store = getStore();
    getStudentCvs(user);
    const cvId = parsed.data.id || `cv-${crypto.randomUUID()}`;
    const record: CVProfile = {
      ...parsed.data,
      id: cvId,
      studentId: user.id,
      title: sanitizeText(parsed.data.title, 80),
      fullName: sanitizeText(parsed.data.fullName, 120),
      headline: sanitizeText(parsed.data.headline, 160),
      summary: sanitizeText(parsed.data.summary, 2000),
      sectionOrder: parsed.data.sectionOrder?.length ? parsed.data.sectionOrder : [...DEFAULT_SECTION_ORDER],
      updatedAt: new Date().toISOString(),
    };

    const idx = store.cvProfiles.findIndex((c) => c.studentId === user.id && c.id === cvId);
    if (idx === -1) {
      store.cvProfiles.push(record);
    } else {
      store.cvProfiles[idx] = record;
    }

    persistToDisk(store);
    const cvs = store.cvProfiles.filter((c) => c.studentId === user.id);
    return NextResponse.json({ ok: true, cv: record, cvs });
  } catch {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(["student"]);
    const body = await request.json();
    const store = getStore();
    const cvs = getStudentCvs(user);

    if (body?.action === "duplicate") {
      const source = cvs.find((c) => c.id === body.cvId) || cvs[0];
      const copy: CVProfile = {
        ...JSON.parse(JSON.stringify(source)),
        id: `cv-${crypto.randomUUID()}`,
        title: sanitizeText(String(body.newTitle || `${source.title || "CV"} (Copie)`), 80),
        isDefault: false,
        updatedAt: new Date().toISOString(),
      };
      store.cvProfiles.push(copy);
      persistToDisk(store);
      return NextResponse.json({ cv: copy, cvs: store.cvProfiles.filter((c) => c.studentId === user.id) }, { status: 201 });
    }

    if (body?.action === "delete") {
      if (cvs.length <= 1) {
        return NextResponse.json({ error: "Vous devez conserver au moins un CV." }, { status: 400 });
      }
      store.cvProfiles = store.cvProfiles.filter((c) => !(c.studentId === user.id && c.id === body.cvId));
      const remaining = store.cvProfiles.filter((c) => c.studentId === user.id);
      if (remaining[0] && !remaining.some((c) => c.isDefault)) {
        remaining[0].isDefault = true;
      }
      persistToDisk(store);
      return NextResponse.json({ cvs: remaining, cv: remaining[0] });
    }

    if (body?.action === "evaluate") {
      const targetCv = cvs.find((c) => c.id === body.cvId) || cvs[0];
      const offer = body.offerId ? store.internshipOffers.find((o) => o.id === body.offerId) : null;
      const evaluation = evaluateCvHeuristically(targetCv, offer?.requiredSkills || []);
      return NextResponse.json({ evaluation });
    }

    if (body?.action === "ai_assist") {
      if (!checkRateLimit(`ai-cv:${user.id}`, 20, 60_000).allowed) {
        return NextResponse.json({ error: "Limite de requêtes IA atteinte." }, { status: 429 });
      }
      const schema = z.object({
        task: z.enum(["improve_summary", "improve_experience", "translate", "interview_prep", "tailor_offer"]),
        cvId: z.string().optional(),
        offerId: z.string().optional(),
        experienceText: z.string().max(1200).optional(),
        targetLocale: z.enum(["fr", "en", "ar"]).optional(),
      });
      const parsedAi = schema.safeParse(body);
      if (!parsedAi.success) {
        return NextResponse.json({ error: "Paramètres IA invalides." }, { status: 400 });
      }
      const targetCv = cvs.find((c) => c.id === parsedAi.data.cvId) || cvs[0];
      const offer = parsedAi.data.offerId
        ? store.internshipOffers.find((o) => o.id === parsedAi.data.offerId && o.status === "published")
        : null;
      const res = await improveCvContentWithAI({
        task: parsedAi.data.task,
        headline: targetCv.headline,
        summary: targetCv.summary,
        skills: targetCv.skills,
        experienceText: parsedAi.data.experienceText,
        targetOfferTitle: offer?.title,
        targetOfferSkills: offer?.requiredSkills,
        targetLocale: parsedAi.data.targetLocale || user.preferredLanguage || "fr",
      });
      return NextResponse.json(res);
    }

    // Default: motivation letter generation
    const offerId = String(body.offerId || "");
    const locale = (body.locale === "en" || body.locale === "ar" ? body.locale : "fr") as "fr" | "en" | "ar";
    const offer = store.internshipOffers.find((o) => o.id === offerId && o.status === "published");
    const cv = cvs.find((c) => c.id === body.cvId) || cvs[0];

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
    return NextResponse.json({ error: "Erreur assistant CV." }, { status: 500 });
  }
}
