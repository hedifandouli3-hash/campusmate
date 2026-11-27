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

  test("Marketplace and Lost & Found display seeded photos and allow posting new items", async ({ page }) => {
    await page.goto("/login/student");
    await page.getByLabel("Adresse e-mail").fill("amira.benali@isetb.rnu.tn");
    await page.getByLabel("Mot de passe").fill("Student@2026!");
    await page.getByRole("button", { name: /Se connecter/i }).click();
    await page.waitForURL("**/student/dashboard");

    // Marketplace: seeded photo items + post new listing
    await page.goto("/student/marketplace");
    await expect(page.getByText(/Calculatrice de Bureau Rose/i)).toBeVisible();
    await expect(page.locator('img[src="/images/community/hp-laptop.png"]')).toBeVisible();
    const mktTitle = `Cahier TP Réseaux ${Date.now()}`;
    await page.getByPlaceholder("Titre de l'article...").fill(mktTitle);
    await page.getByPlaceholder("État, édition et point de remise sur le campus...").fill("Neuf, remise Bloc TI.");
    await page.getByRole("button", { name: /Publier l'annonce/i }).click();
    await expect(page.getByText(mktTitle)).toBeVisible();
    await page.reload();
    await expect(page.getByText(mktTitle)).toBeVisible();

    // Lost & Found: seeded photo reports + post new report
    await page.goto("/student/lost-found");
    await expect(page.getByText(/Trousseau de 2 clés/i)).toBeVisible();
    await expect(page.locator('img[src="/images/community/keys-keychain.png"]')).toBeVisible();
    const lfTitle = `Chargeur USB-C ${Date.now()}`;
    await page.getByPlaceholder("Nom de l'objet...").fill(lfTitle);
    await page.getByPlaceholder("Lieu général (ex: Bloc TI)").fill("Bibliothèque");
    await page.getByPlaceholder("Description générale sans données personnelles...").fill("Trouvé sur la table 4.");
    await page.getByRole("button", { name: /Publier le signalement/i }).click();
    await expect(page.getByText(lfTitle)).toBeVisible();
    await page.reload();
    await expect(page.getByText(lfTitle)).toBeVisible();
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
