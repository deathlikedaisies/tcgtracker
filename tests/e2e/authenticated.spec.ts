import { expect, test } from "@playwright/test";
import { login, getMissingAuthEnvReason } from "./helpers/auth";
import { expectNoAppError } from "./helpers/assertions";

const authRoutes = [
  { path: "/dashboard", heading: "Overview" },
  { path: "/matches/new", heading: "Log a game" },
  { path: "/review", heading: "Review" },
  { path: "/matches", heading: "Matches" },
  { path: "/decks", heading: "Deck Experiments" },
  { path: "/matchups", heading: "Matchup Intelligence" },
  { path: "/settings/profile", heading: /Profile|Create your profile/i },
];

test.describe("authenticated routes", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60000);

  const missingAuthEnvReason = getMissingAuthEnvReason();

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(missingAuthEnvReason), missingAuthEnvReason || "");
    await login(page);
  });

  for (const route of authRoutes) {
    test(`${route.path} loads in the authenticated shell`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
      await expect(page.locator("body")).toContainText("SixPrizer");
      await expect(page.getByRole("link", { name: "Decks" }).first()).toBeVisible();
      await expect(page.getByLabel("Email")).toHaveCount(0);
      await expectNoAppError(page);
    });
  }

  test("/matchups can create a persisted matchup report", async ({ page }) => {
    await page.goto("/matchups");

    const createReportButton = page.getByRole("button", { name: "Create report link" });
    await expect(createReportButton).toBeVisible();
    await createReportButton.click();

    await page.waitForURL(/\/r\//, { timeout: 30000 });
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Shared from SixPrizer");
    await expectNoAppError(page);
  });
});
