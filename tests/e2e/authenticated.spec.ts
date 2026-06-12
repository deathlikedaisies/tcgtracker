import { expect, test } from "@playwright/test";
import { login, getMissingAuthEnvReason } from "./helpers/auth";
import { expectHeadingVisible, expectNoAppError } from "./helpers/assertions";

const authRoutes = [
  { path: "/dashboard", heading: "Overview" },
  { path: "/matches/new", heading: "Log a game" },
  { path: "/review", heading: "Review" },
  { path: "/matches", heading: "Matches" },
  { path: "/decks", heading: "Deck Experiments" },
  { path: "/matchups", heading: "Matchup Intelligence" },
  { path: "/settings/profile", heading: /Profile|Create your profile/i },
];

async function setProfileVisibility(
  page: import("@playwright/test").Page,
  profileVisibility: "private" | "public" | "link_only",
  analyticsVisibility: "private" | "aggregate_only" | "detailed"
) {
  await page.goto("/settings/profile");
  await expectHeadingVisible(page, /Profile|Create your profile/i);
  await page
    .locator(`input[name="profile_visibility"][value="${profileVisibility}"]`)
    .check({ force: true });
  await page
    .locator(
      `input[name="analytics_visibility"][value="${analyticsVisibility}"]`
    )
    .check({ force: true });
  await page.getByRole("button", { name: /Save profile/i }).click();
  await expect(page.locator("body")).toContainText("Profile saved.");
}

test.describe("authenticated routes", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90000);

  const missingAuthEnvReason = getMissingAuthEnvReason();

  test.beforeEach(async ({ page }) => {
    test.skip(Boolean(missingAuthEnvReason), missingAuthEnvReason || "");
    await login(page);
  });

  for (const route of authRoutes) {
    test(`${route.path} loads in the authenticated shell`, async ({ page }) => {
      await page.goto(route.path);

      await expectHeadingVisible(page, route.heading);
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
    await expect(page.locator("body")).toContainText(/Record/i);
    await expect(page.locator("body")).toContainText(/Win rate/i);
    await expect(page.locator("body")).toContainText(/Summary/i);
    await expect(page.locator("body")).toContainText(/Recommendation/i);
    await expect(page.locator("body")).not.toContainText(/match_id|4 Nest Ball|4 Professor's Research/i);
    await expect(page.locator("body")).not.toContainText(
      /c9c7565b-9587-4e54-9d0b-a0c32e568d36|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
    );
    await expectNoAppError(page);
  });

  test("/review surfaces a specific seeded coaching signal", async ({ page }) => {
    await page.goto("/review");

    const coachHero = page
      .getByText("Coach says")
      .locator("xpath=ancestor::section[1]");

    await expect(coachHero).toContainText(/Item Lock|Sequencing|Mega Greninja/i);
    await expect(coachHero).toContainText(/What to do next/i);
    await expect(page.locator("body")).toContainText(/wins tagged.*losses tagged|wins and .* losses/i);
    await expect(page.locator("body")).toContainText(
      /Strong signal|Building signal|Early signal|Needs more games/i
    );
    await expect(page.locator("body")).not.toContainText(/What to test next/i);
    await expect(page.locator("body")).not.toContainText(/this line|sample block|converts with/i);
    await expectNoAppError(page);
  });

  test("/decks detail shows version evidence for seeded deck versions", async ({
    page,
  }) => {
    await page.goto("/decks");
    await page
      .locator('a[href^="/decks/"]:not([href="/decks"])')
      .first()
      .click();
    await page.waitForURL(/\/decks\//, { timeout: 20000 });

    await expect(page.locator("body")).toContainText(/Version evidence|Version signal/i);
    await expect(page.locator("body")).toContainText(/v1|v2|v3/i);
    await expect(page.locator("body")).toContainText(
      /Opening quality|Sequencing quality|Best current signal/i
    );
    await expectNoAppError(page);
  });

  test("public aggregate-only profile shows safe summary stats", async ({
    page,
    browser,
  }) => {
    const handle = "domz_test";

    await setProfileVisibility(page, "public", "aggregate_only");

    try {
      const anonymousContext = await browser.newContext();
      const anonymousPage = await anonymousContext.newPage();

      await anonymousPage.goto(`/u/${handle}`);
      await expectHeadingVisible(anonymousPage, "Dom Zimmerman Test");
      await expect(anonymousPage.locator("body")).toContainText(/games logged/i);
      await expect(anonymousPage.locator("body")).toContainText(/record/i);
      await expect(anonymousPage.locator("body")).toContainText(/win rate/i);
      await expect(anonymousPage.locator("body")).toContainText(/summary only|aggregate/i);
      await expect(anonymousPage.locator("body")).not.toContainText(
        /4 Nest Ball|4 Professor's Research|match_id/i
      );
      await expect(anonymousPage.locator("body")).not.toContainText(
        /c9c7565b-9587-4e54-9d0b-a0c32e568d36|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      );
      await expectNoAppError(anonymousPage);

      await anonymousContext.close();
    } finally {
      await setProfileVisibility(page, "private", "private");
    }
  });
});
