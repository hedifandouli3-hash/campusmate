import { expect, test } from "@playwright/test";

test.describe("CampusMate End-to-End Journeys (Separate Role Portals)", () => {
  test("Landing page loads, switches to Arabic RTL, and returns to French", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("CampusMate").first()).toBeVisible();

    await page.getByRole("button", { name: "ar", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.getByRole("button", { name: "fr", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("Student logs in via /login/student -> AI Assistant -> Courses, and cannot use /login/teacher", async ({ page }) => {
    // Rejects student credentials on teacher portal
    await page.goto("/login/teacher");
    await page.getByLabel("Adresse e-mail").fill("amira.benali@isetb.rnu.tn");
    await page.getByLabel("Mot de passe").fill("Student@2026!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await expect(page.getByText(/Ce portail est réservé aux comptes/i)).toBeVisible();

    // Logs in cleanly on dedicated student portal
    await page.goto("/login/student");
    await page.getByLabel("Adresse e-mail").fill("amira.benali@isetb.rnu.tn");
    await page.getByLabel("Mot de passe").fill("Student@2026!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await page.waitForURL("**/student/dashboard");
    await expect(page.getByRole("heading", { name: /Amira Ben Ali/i })).toBeVisible();

    // University AI Assistant RAG
    await page.goto("/student/ai-assistant");
    await page.getByRole("button", { name: /attestation d'inscription/i }).click();
    await expect(page.getByText(/Demander un document administratif/i)).toBeVisible({ timeout: 15_000 });

    // Student Courses
    await page.goto("/student/courses");
    await expect(page.getByText(/Architectures Web Modernes/i).first()).toBeVisible();
  });

  test("Teacher logs in via /login/teacher and cannot access /administration/dashboard", async ({ page }) => {
    await page.goto("/login/teacher");
    await page.getByLabel("Adresse e-mail").fill("karim.trabelsi@isetb.rnu.tn");
    await page.getByLabel("Mot de passe").fill("Teacher@2026!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await page.waitForURL("**/teacher/dashboard");
    await expect(page.getByRole("heading", { name: /Espace Enseignant/i })).toBeVisible();

    await page.goto("/administration/dashboard");
    await page.waitForURL("**/teacher/dashboard");
  });

  test("Administration, Organization, and Super Admin dedicated portals authenticate cleanly", async ({ page }) => {
    await page.goto("/login/administration");
    await page.getByLabel("Adresse e-mail").fill("administration@isetb.rnu.tn");
    await page.getByLabel("Mot de passe").fill("AdminIset@2026!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await page.waitForURL("**/administration/dashboard");
    await expect(page.getByRole("heading", { name: /Administration Universitaire/i })).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/login/organization");
    await page.getByLabel("Adresse e-mail").fill("rh@techbeja.tn");
    await page.getByLabel("Mot de passe").fill("OrgPartner@2026!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await page.waitForURL("**/organization/dashboard");
    await expect(page.locator("h1").first()).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/login/admin");
    await page.getByLabel("Adresse e-mail").fill("superadmin@campusmate.tn");
    await page.getByLabel("Mot de passe").fill("SuperAdmin@2026!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await page.waitForURL("**/admin/dashboard");
    await expect(page.getByRole("heading", { name: /Super Administration CampusMate/i })).toBeVisible();
  });

  test("Mobile responsiveness check has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  });
});
