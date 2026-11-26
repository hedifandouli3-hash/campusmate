import { expect, test } from "@playwright/test";

test.describe("CampusMate End-to-End Hackathon Journeys", () => {
  test("Landing page loads, switches to Arabic RTL, and returns to French", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("CampusMate").first()).toBeVisible();

    await page.getByRole("button", { name: "ar", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.getByRole("button", { name: "fr", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("Student demo quick-login -> AI Assistant -> Digital Administration -> Courses", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Étudiant/i }).click();
    await page.waitForURL("**/student/dashboard");
    await expect(page.getByRole("heading", { name: /Amira Ben Ali/i })).toBeVisible();

    // Navigate to University AI Assistant and ask Scenario 3 question
    await page.goto("/student/ai-assistant");
    await page.getByRole("button", { name: /attestation d'inscription/i }).click();
    await expect(page.getByText(/Demander un document administratif/i)).toBeVisible({ timeout: 15_000 });

    // Navigate to Courses and open Chapter 1
    await page.goto("/student/courses");
    await expect(page.getByText(/Architectures Web Modernes/i).first()).toBeVisible();
  });

  test("Teacher demo login & protected route authorization", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Enseignant/i }).click();
    await page.waitForURL("**/teacher/dashboard");
    await expect(page.getByRole("heading", { name: /Espace Enseignant/i })).toBeVisible();

    // Student cannot access admin routes -> redirected to student dashboard if logged in as student,
    // Teacher trying to access /administration/dashboard gets redirected to /teacher/dashboard
    await page.goto("/administration/dashboard");
    await page.waitForURL("**/teacher/dashboard");
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
