import { expect, test } from "@playwright/test";
import { expectHeadingVisible, expectNoAppError } from "./helpers/assertions";

test.describe("public routes", () => {
  test.setTimeout(60000);

  test("landing page shows the main SixPrizer CTAs", async ({ page }) => {
    await page.goto("/");

    await expectHeadingVisible(
      page,
      "Track your Pokemon TCG testing and find what is costing wins."
    );
    await expect(page.getByRole("link", { name: "Start tracking games" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Preview demo" }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expect(page.locator("body")).toContainText(/Fast match logging/i);
    await expect(page.locator("body")).toContainText(/Matchup tracking/i);
    await expect(page.locator("body")).toContainText(/Review and improve/i);
    await expect(page.locator("body")).toContainText(/Deck Lab turns your logs into deck decisions/i);
    await expect(page.locator("body")).toContainText(/Your testing data stays private by default/i);
    await expectNoAppError(page);
  });

  test("demo overview loads", async ({ page }) => {
    await page.goto("/demo");

    await expectHeadingVisible(page, "Explore a realistic testing workspace.");
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expect(page.locator("body")).toContainText(/Current test deck/i);
    await expect(page.locator("body")).toContainText(/Deck Lab/i);
    await expect(
      page.getByRole("link", { name: /^Create your workspace$/ }).first()
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(/Match history/i);
    await expect(page.locator("body")).not.toContainText(/^Logs$/m);
    await expectNoAppError(page);
  });

  test("demo review route loads", async ({ page }) => {
    await page.goto("/demo/review");

    await expectHeadingVisible(page, "Demo review");
    await expect(page.locator("body")).toContainText(/Current deck signal|Review queue/i);
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
