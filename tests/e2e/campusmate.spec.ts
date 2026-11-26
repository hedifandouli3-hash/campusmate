import { expect, test } from "@playwright/test";

test.describe("CampusMate V2 End-to-End Journeys & Security Verification", () => {
  test("Landing page loads, switches to Arabic RTL, and returns to French", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("CampusMate").first()).toBeVisible();

    await page.getByRole("button", { name: "ar", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.getByRole("button", { name: "fr", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("Student portal isolation, AI Assistant, Courses, Encrypted Chat persistence, and CV Studio", async ({ page }) => {
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

    // Encrypted Chat persistence across page reload
    await page.goto("/student/chats");
    const uniqueMsg = `Test E2E chiffré ${Date.now()}`;
    await page.getByPlaceholder("Écrire un message au groupe...").fill(uniqueMsg);
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText(uniqueMsg)).toBeVisible();
    await page.reload();
    await expect(page.getByText(uniqueMsg)).toBeVisible();

    // CV Builder Studio & 5 templates
    await page.goto("/student/cv-builder");
    await expect(page.getByRole("heading", { name: /Studio CV/i })).toBeVisible();
    await page.getByRole("button", { name: /Exporter PDF A4/i }).click();
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

  test("Responsive breakpoints 360px, 768px, and 1440px have zero horizontal overflow", async ({ page }) => {
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow).toBe(false);
    }
  });
});
