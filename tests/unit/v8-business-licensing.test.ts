import { describe, expect, it } from "vitest";
import { buildInitialDemoState } from "@/lib/demo/seed";
import {
  assignInstitutionSeat,
  calculateInstitutionalQuote,
  checkFeatureEntitlement,
  consumeAiAllowance,
  DEFAULT_INSTITUTIONAL_PLANS,
  getInstitutionEntitlements,
  releaseInstitutionSeat,
} from "@/lib/licensing/engine";

describe("CampusMate V8 Institution-Funded SaaS, Entitlements & Seat Licensing", () => {
  it("calculates annual institutional quotes deterministically", () => {
    const proPlan = DEFAULT_INSTITUTIONAL_PLANS.find((p) => p.code === "university_pro")!;
    const calc = calculateInstitutionalQuote({
      plan: proPlan,
      studentSeats: 1500,
      professorSeats: 100,
      onboardingServiceTnd: 0,
      discountPercent: 0,
    });
    expect(calc.studentCostTnd).toBe(15000);
    expect(calc.professorCostTnd).toBe(2500);
    expect(calc.annualTotalTnd).toBe(17500);
    expect(calc.monthlyEquivalentTnd).toBe(1458);
  });

  it("inherits entitlements from institution license without charging students", () => {
    const store = buildInitialDemoState();
    const bejaStudent = store.users.find((u) => u.email === "amira.benali@isetb.rnu.tn")!;
    const radesStudent = store.users.find((u) => u.institutionId === "11111111-1111-1111-1111-111111111102")!;

    // ISET Béja is University Pro
    const bejaEnt = getInstitutionEntitlements(store, bejaStudent);
    expect(bejaEnt.planCode).toBe("university_pro");
    expect(bejaEnt.hasAgent).toBe(true);
    expect(bejaEnt.hasStudio).toBe(true);
    expect(bejaEnt.hasAutomations).toBe(false); // Ultra only

    // ISET Radès is University Plus
    const radesEnt = getInstitutionEntitlements(store, radesStudent);
    expect(radesEnt.planCode).toBe("university_plus");
    expect(radesEnt.hasAgent).toBe(false);

    const check = checkFeatureEntitlement(store, radesStudent, "university_pro");
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("University Pro");
    expect(check.reason).toContain("University Plus");
    expect(check.reason?.toLowerCase()).not.toContain("payer");
  });

  it("enforces institutional seat capacity and prevents duplicate seat consumption", () => {
    const store = buildInitialDemoState();
    const lic = store.institutionLicenses!.find((l) => l.institutionId === "11111111-1111-1111-1111-111111111102")!;
    lic.maxStudentSeats = 2;
    lic.assignedStudentSeats = 1;

    // Assign new student (2/2)
    const first = assignInstitutionSeat(store, {
      institutionId: lic.institutionId,
      userId: "usr-new-1",
      seatType: "student",
    });
    expect(first.ok).toBe(true);
    expect(lic.assignedStudentSeats).toBe(2);

    // Duplicate assignment for same user does not consume another seat
    const dup = assignInstitutionSeat(store, {
      institutionId: lic.institutionId,
      userId: "usr-new-1",
      seatType: "student",
    });
    expect(dup.ok).toBe(true);
    expect(lic.assignedStudentSeats).toBe(2);

    // Exceeding seat limit fails cleanly
    const over = assignInstitutionSeat(store, {
      institutionId: lic.institutionId,
      userId: "usr-new-2",
      seatType: "student",
    });
    expect(over.ok).toBe(false);
    expect(over.error).toContain("Capacité maximale");

    // Releasing frees capacity
    const rel = releaseInstitutionSeat(store, {
      institutionId: lic.institutionId,
      userId: "usr-new-1",
    });
    expect(rel.ok).toBe(true);
    expect(lic.assignedStudentSeats).toBe(1);
  });

  it("enforces AI allowance gracefully without student payment prompts", () => {
    const store = buildInitialDemoState();
    const lic = store.institutionLicenses!.find((l) => l.institutionId === "11111111-1111-1111-1111-111111111101")!;
    lic.aiMonthlyAllowance = 1000;
    lic.aiUsedThisPeriod = 900;

    const okRes = consumeAiAllowance(store, {
      institutionId: lic.institutionId,
      userId: "usr-student-amira",
      feature: "rag_query",
      estimatedTokens: 100,
    });
    expect(okRes.allowed).toBe(true);
    expect(okRes.remaining).toBe(0);

    const blockedRes = consumeAiAllowance(store, {
      institutionId: lic.institutionId,
      userId: "usr-student-amira",
      feature: "rag_query",
      estimatedTokens: 100,
    });
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.reason).toContain("restent accessibles");
  });
});
