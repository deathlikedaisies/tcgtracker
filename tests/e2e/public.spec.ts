import { expect, test } from "@playwright/test";
import { expectNoAppError } from "./helpers/assertions";

test.describe("public routes", () => {
  test.setTimeout(60000);

  test("landing page shows the main SixPrizer CTAs", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /From testing games to/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Start tracking games" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Preview demo" }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expectNoAppError(page);
  });

  test("demo overview loads", async ({ page }) => {
    await page.goto("/demo");

    await expect(page.getByRole("heading", { name: "SixPrizer demo workspace" })).toBeVisible();
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expectNoAppError(page);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Log in to SixPrizer" })).toBeVisible();
    await expectNoAppError(page);
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: "Create your SixPrizer account" })).toBeVisible();
    await expectNoAppError(page);
  });

  test("missing public profile shows the unavailable state", async ({ page }) => {
    await page.goto("/u/sixprizer-missing-profile");

    await expect(page.getByRole("heading", { name: "Profile unavailable" })).toBeVisible();
    await expectNoAppError(page);
  });
});
