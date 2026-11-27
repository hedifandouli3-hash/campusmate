import crypto from "node:crypto";
import type { CampusMateStoreState } from "@/lib/demo/seed";
import type {
  InstitutionLicense,
  InstitutionalPlanCode,
  InstitutionalPlanConfig,
  UserProfile,
} from "@/types/domain";

export const DEFAULT_INSTITUTIONAL_PLANS: InstitutionalPlanConfig[] = [
  {
    code: "university_plus",
    name: "University Plus",
    tagline: "Socle académique complet pour digitaliser la vie universitaire.",
    studentSeatPriceTnd: 5,
    professorSeatPriceTnd: 15,
    aiMonthlyAllowancePerSeat: 20000,
    storageLimitGb: 50,
    automationLimit: 2,
    minContractTnd: 2500,
    isActive: true,
    features: [
      "Tableaux de bord Étudiant, Enseignant & Administration",
      "Assistant RAG officiel de l'établissement",
      "Gestion des cours & AI Learning Hub de base",
      "Groupes de discussion temps réel & Study Planner",
      "Demandes administratives, File digitale & Salles",
      "Marketplace étudiant, Objets trouvés, Transport & Logement",
      "Offres de stage & CV Builder de base",
    ],
  },
  {
    code: "university_pro",
    name: "University Pro",
    tagline: "Écosystème IA agentique complet, Launchpad & Creation Studio.",
    studentSeatPriceTnd: 10,
    professorSeatPriceTnd: 25,
    aiMonthlyAllowancePerSeat: 60000,
    storageLimitGb: 200,
    automationLimit: 10,
    minContractTnd: 5000,
    isActive: true,
    features: [
      "Tout University Plus inclus",
      "CampusMate Agent central & Création de sites sandboxés",
      "Studio Portfolio, Présentations PDF, Brand Kit & Posts sociaux",
      "CampusMate Launchpad (18 capacités) & Startup Builder",
      "Simulateurs Client Freelance, Jury Startup & Rentabilité TND",
      "Gestion de Projets Kanban & Outils IA avancés enseignants",
    ],
  },
  {
    code: "university_ultra",
    name: "University Ultra",
    tagline: "Automatisation avancée, marque blanche & pilotage incubateur.",
    studentSeatPriceTnd: 20,
    professorSeatPriceTnd: 40,
    aiMonthlyAllowancePerSeat: 150000,
    storageLimitGb: 1000,
    automationLimit: 50,
    minContractTnd: 10000,
    isActive: true,
    features: [
      "Tout University Pro inclus",
      "Centre d'Automatisation avancé, Cron & intégrations approuvées",
      "Identité visuelle dédiée par établissement",
      "Gestion avancée de la base RAG & workflows configurables",
      "Pilotage Incubateur & Entrepreneuriat multi-promotions",
      "Analytiques institutionnelles avancées & support prioritaire",
    ],
  },
];

export interface QuoteCalculationInput {
  plan: InstitutionalPlanConfig;
  studentSeats: number;
  professorSeats: number;
  onboardingServiceTnd?: number;
  discountPercent?: number;
}

export interface QuoteCalculationResult {
  studentCostTnd: number;
  professorCostTnd: number;
  subtotalTnd: number;
  discountTnd: number;
  annualTotalTnd: number;
  monthlyEquivalentTnd: number;
  aiMonthlyAllowance: number;
}

export function calculateInstitutionalQuote(input: QuoteCalculationInput): QuoteCalculationResult {
  const students = Math.max(0, Math.floor(input.studentSeats));
  const professors = Math.max(0, Math.floor(input.professorSeats));
  const onboarding = Math.max(0, Number(input.onboardingServiceTnd || 0));
  const discountPct = Math.min(50, Math.max(0, Number(input.discountPercent || 0)));

  const studentCostTnd = students * input.plan.studentSeatPriceTnd;
  const professorCostTnd = professors * input.plan.professorSeatPriceTnd;
  const subtotalTnd = studentCostTnd + professorCostTnd + onboarding;
  const discountTnd = Math.round((subtotalTnd * discountPct) / 100);
  const annualTotalTnd = Math.max(0, subtotalTnd - discountTnd);
  const monthlyEquivalentTnd = Math.round(annualTotalTnd / 12);
  const aiMonthlyAllowance = (students + professors) * input.plan.aiMonthlyAllowancePerSeat;

  return {
    studentCostTnd,
    professorCostTnd,
    subtotalTnd,
    discountTnd,
    annualTotalTnd,
    monthlyEquivalentTnd,
    aiMonthlyAllowance,
  };
}

export interface InheritedEntitlements {
  institutionId: string | null;
  planCode: InstitutionalPlanCode;
  planName: string;
  licenseStatus: string;
  hasAgent: boolean;
  hasStudio: boolean;
  hasLaunchpad: boolean;
  hasAutomations: boolean;
  hasAdvancedAnalytics: boolean;
  sponsorshipsEnabled: boolean;
  aiRemaining: number;
  aiAllowance: number;
  upgradeNotice?: string;
}

const PLAN_ORDER: Record<InstitutionalPlanCode, number> = {
  university_plus: 1,
  university_pro: 2,
  university_ultra: 3,
};

export function getInstitutionEntitlements(
  store: CampusMateStoreState,
  user: Pick<UserProfile, "id" | "role" | "institutionId">
): InheritedEntitlements {
  const plans = store.institutionalPlans ?? DEFAULT_INSTITUTIONAL_PLANS;
  const license = (store.institutionLicenses ?? []).find(
    (l) => l.institutionId === user.institutionId
  );

  const planCode: InstitutionalPlanCode = license?.planCode ?? "university_pro";
  const plan = plans.find((p) => p.code === planCode) ?? plans[1] ?? DEFAULT_INSTITUTIONAL_PLANS[1];
  const level = PLAN_ORDER[planCode];
  const isActive = !license || license.status === "active" || license.status === "renewal_pending";
  const aiAllowance = license?.aiMonthlyAllowance ?? 100000;
  const aiUsed = license?.aiUsedThisPeriod ?? 0;

  return {
    institutionId: user.institutionId,
    planCode,
    planName: plan.name,
    licenseStatus: license?.status ?? "active",
    hasAgent: isActive && level >= 2,
    hasStudio: isActive && level >= 2,
    hasLaunchpad: isActive && level >= 2,
    hasAutomations: isActive && level >= 3,
    hasAdvancedAnalytics: isActive && level >= 3,
    sponsorshipsEnabled: license?.sponsorshipsEnabled ?? true,
    aiRemaining: Math.max(0, aiAllowance - aiUsed),
    aiAllowance,
    upgradeNotice:
      level < 3
        ? `Votre établissement utilise actuellement le plan ${plan.name}. Aucun paiement n'est demandé aux étudiants ou enseignants.`
        : undefined,
  };
}

export function checkFeatureEntitlement(
  store: CampusMateStoreState,
  user: Pick<UserProfile, "id" | "role" | "institutionId">,
  requiredPlan: InstitutionalPlanCode
): { allowed: boolean; reason?: string; currentPlanName: string; requiredPlanName: string } {
  const ent = getInstitutionEntitlements(store, user);
  const plans = store.institutionalPlans ?? DEFAULT_INSTITUTIONAL_PLANS;
  const reqPlanName = plans.find((p) => p.code === requiredPlan)?.name ?? requiredPlan;

  if (user.role === "super_admin") {
    return { allowed: true, currentPlanName: ent.planName, requiredPlanName: reqPlanName };
  }
  if (ent.licenseStatus === "expired" || ent.licenseStatus === "suspended") {
    return {
      allowed: false,
      currentPlanName: ent.planName,
      requiredPlanName: reqPlanName,
      reason: `La licence de votre établissement est actuellement ${ent.licenseStatus}. Contactez votre administration universitaire.`,
    };
  }
  if (PLAN_ORDER[ent.planCode] < PLAN_ORDER[requiredPlan]) {
    return {
      allowed: false,
      currentPlanName: ent.planName,
      requiredPlanName: reqPlanName,
      reason: `Cette fonctionnalité est incluse avec le plan ${reqPlanName}. Votre établissement utilise actuellement ${ent.planName}.`,
    };
  }
  return { allowed: true, currentPlanName: ent.planName, requiredPlanName: reqPlanName };
}

export function assignInstitutionSeat(
  store: CampusMateStoreState,
  params: { institutionId: string; userId: string; seatType: "student" | "teacher" }
): { ok: boolean; error?: string; license?: InstitutionLicense } {
  store.institutionLicenses ??= [];
  store.licenseSeatAllocations ??= [];

  const license = store.institutionLicenses.find((l) => l.institutionId === params.institutionId);
  if (!license) {
    return { ok: false, error: "Aucune licence institutionnelle active pour cet établissement." };
  }
  if (license.status !== "active" && license.status !== "renewal_pending") {
    return { ok: false, error: `Licence institutionnelle non active (${license.status}).` };
  }

  // Prevent duplicate seat consumption
  const existing = store.licenseSeatAllocations.find(
    (s) => s.institutionId === params.institutionId && s.userId === params.userId && s.status === "assigned"
  );
  if (existing) {
    return { ok: true, license };
  }

  if (params.seatType === "student") {
    if (license.assignedStudentSeats >= license.maxStudentSeats) {
      return {
        ok: false,
        error: `Capacité maximale de sièges étudiants atteinte (${license.assignedStudentSeats}/${license.maxStudentSeats}).`,
      };
    }
    license.assignedStudentSeats += 1;
  } else {
    if (license.assignedProfessorSeats >= license.maxProfessorSeats) {
      return {
        ok: false,
        error: `Capacité maximale de sièges enseignants atteinte (${license.assignedProfessorSeats}/${license.maxProfessorSeats}).`,
      };
    }
    license.assignedProfessorSeats += 1;
  }

  store.licenseSeatAllocations.push({
    id: `seat-${crypto.randomUUID()}`,
    licenseId: license.id,
    institutionId: params.institutionId,
    userId: params.userId,
    seatType: params.seatType,
    status: "assigned",
    assignedAt: new Date().toISOString(),
  });
  license.updatedAt = new Date().toISOString();
  return { ok: true, license };
}

export function releaseInstitutionSeat(
  store: CampusMateStoreState,
  params: { institutionId: string; userId: string }
): { ok: boolean } {
  store.institutionLicenses ??= [];
  store.licenseSeatAllocations ??= [];

  const alloc = store.licenseSeatAllocations.find(
    (s) => s.institutionId === params.institutionId && s.userId === params.userId && s.status === "assigned"
  );
  if (!alloc) return { ok: false };

  alloc.status = "released";
  alloc.releasedAt = new Date().toISOString();

  const license = store.institutionLicenses.find((l) => l.id === alloc.licenseId);
  if (license) {
    if (alloc.seatType === "student" && license.assignedStudentSeats > 0) {
      license.assignedStudentSeats -= 1;
    } else if (alloc.seatType === "teacher" && license.assignedProfessorSeats > 0) {
      license.assignedProfessorSeats -= 1;
    }
    license.updatedAt = new Date().toISOString();
  }
  return { ok: true };
}

export function consumeAiAllowance(
  store: CampusMateStoreState,
  params: { institutionId: string | null; userId: string; feature: string; estimatedTokens: number }
): { allowed: boolean; remaining: number; reason?: string } {
  if (!params.institutionId) {
    return { allowed: true, remaining: 50000 };
  }
  store.institutionLicenses ??= [];
  store.institutionUsageEvents ??= [];

  const license = store.institutionLicenses.find((l) => l.institutionId === params.institutionId);
  if (!license) {
    return { allowed: true, remaining: 50000 };
  }
  if (license.aiUsedThisPeriod + params.estimatedTokens > license.aiMonthlyAllowance) {
    return {
      allowed: false,
      remaining: Math.max(0, license.aiMonthlyAllowance - license.aiUsedThisPeriod),
      reason:
        "Le quota IA mensuel de votre établissement est atteint. Vos documents, cours et services administratifs restent accessibles.",
    };
  }

  license.aiUsedThisPeriod += params.estimatedTokens;
  store.institutionUsageEvents.unshift({
    id: `usg-${crypto.randomUUID()}`,
    institutionId: params.institutionId,
    userId: params.userId,
    feature: params.feature,
    tokensUsed: params.estimatedTokens,
    estimatedCostUsd: Number(((params.estimatedTokens / 1000) * 0.00015).toFixed(5)),
    isActualProviderUsage: false,
    createdAt: new Date().toISOString(),
  });
  store.institutionUsageEvents = store.institutionUsageEvents.slice(0, 200);

  return {
    allowed: true,
    remaining: Math.max(0, license.aiMonthlyAllowance - license.aiUsedThisPeriod),
  };
}
