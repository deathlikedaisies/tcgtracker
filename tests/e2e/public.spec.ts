import { expect, test } from "@playwright/test";
import { expectHeadingVisible, expectNoAppError } from "./helpers/assertions";

test.describe("public routes", () => {
  test.setTimeout(60000);

  test("landing page shows the main SixPrizer CTAs", async ({ page }) => {
    await page.goto("/");

    await expectHeadingVisible(page, /From testing games to/i);
    await expect(page.getByRole("link", { name: "Start tracking games" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Preview demo" }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expectNoAppError(page);
  });

  test("demo overview loads", async ({ page }) => {
    await page.goto("/demo");

    await expectHeadingVisible(page, "SixPrizer demo workspace");
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expectNoAppError(page);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");

    await expectHeadingVisible(page, "Log in to SixPrizer");
    await expectNoAppError(page);
  });

  test("login page shows the signup confirmation message", async ({ page }) => {
    await page.goto("/login?signup=success");

    await expectHeadingVisible(page, "Log in to SixPrizer");
    await expect(page.locator("body")).toContainText(
      "Account created. Check your inbox and spam folder for the SixPrizer confirmation email before logging in."
    );
    await expectNoAppError(page);
  });

  test("signup page loads", async ({ page }) => {
    await page.goto("/signup");

    await expectHeadingVisible(page, "Create your SixPrizer account");
    await expectNoAppError(page);
  });

  test("missing public profile shows the unavailable state", async ({ page }) => {
    await page.goto("/u/sixprizer-missing-profile");

    await expectHeadingVisible(page, "Profile unavailable");
    await expect(page.locator("body")).not.toContainText(/match_id|decklist|private notes/i);
    await expectNoAppError(page);
  });
});
