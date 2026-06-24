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
  { path: "/profile", heading: /Profile|Create your profile/i },
];

function getExpectedOrigin(page: import("@playwright/test").Page) {
  const configuredUrl =
    process.env.PLAYWRIGHT_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    page.url() ??
    "http://localhost:3000";

  return new URL(configuredUrl).origin;
}

async function setProfileVisibility(
  page: import("@playwright/test").Page,
  profileVisibility: "private" | "public" | "link_only",
  analyticsVisibility: "private" | "aggregate_only" | "detailed"
) {
  await page.goto("/profile");
  await expectHeadingVisible(page, /Profile|Create your profile/i);
  await page
    .locator(`input[name="profile_visibility"][value="${profileVisibility}"]`)
    .check({ force: true });
  await page
    .locator(
      `input[name="analytics_visibility"][value="${analyticsVisibility}"]`
    )
    .check({ force: true });
  await page.getByRole("button", { name: /Save profile/i }).first().click();
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

  test("/matches/new requires quality before reason and reason before save", async ({
    page,
  }) => {
    await page.goto("/matches/new");

    await expectHeadingVisible(page, "Log a game");
    await expect(page.locator("body")).toContainText(
      /Match[\s\S]*Result[\s\S]*Turn order[\s\S]*Quality[\s\S]*Reason[\s\S]*More context/i
    );

    const continueButton = page.getByRole("button", { name: "Continue" });
    await expect(continueButton).toBeDisabled();

    const opponentSearch = page.getByLabel("Opponent deck");
    await opponentSearch.fill("Mega");
    await page.getByRole("button", { name: /Mega/i }).first().click();
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    await page.getByRole("button", { name: "Win" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Can't remember" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.locator("body")).toContainText(/Rate how the game felt/i);
    const qualityContinue = page.getByRole("button", { name: "Continue" });
    await expect(qualityContinue).toBeDisabled();

    const startFieldset = page
      .locator("fieldset")
      .filter({ has: page.locator("legend", { hasText: /^Start$/ }) });
    const openingFieldset = page
      .locator("fieldset")
      .filter({ has: page.locator("legend", { hasText: /^Opening hand$/ }) });
    const sequencingFieldset = page
      .locator("fieldset")
      .filter({ has: page.locator("legend", { hasText: /^Sequencing$/ }) });

    await startFieldset.getByRole("button", { name: "Good" }).click();
    await openingFieldset.getByRole("button", { name: "Good" }).click();
    await sequencingFieldset.getByRole("button", { name: "Good" }).click();
    await expect(qualityContinue).toBeEnabled();
    await qualityContinue.click();

    await expect(page.locator("body")).toContainText(/What won you the game\?/i);
    const saveNowButton = page.getByRole("button", { name: "Save now" }).first();
    await expect(saveNowButton).toBeDisabled();

    await page.getByRole("button", { name: /strong setup/i }).first().click();
    await expect(saveNowButton).toBeEnabled();
    await saveNowButton.click();

    await page.waitForURL(/\/matches\/new\?success=1/, { timeout: 30000 });
    await expect(page.getByTestId("post-save-reward")).toContainText(/Logged\./i);
    await expectNoAppError(page);
  });

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

  test("/profile shows the public profile controls", async ({ page }) => {
    await page.goto("/profile");
    const expectedOrigin = getExpectedOrigin(page);

    await expectHeadingVisible(page, /Profile|Create your profile/i);
    await expect(page.getByLabel("Handle")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/^Handle$/m);
    await expect(page.locator("body")).toContainText(/Public profile URL/i);
    await expect(page.locator("body")).toContainText(/https?:\/\/[^\s]+\/u\/domz_test/i);
    await expect(page.locator("body")).toContainText(
      `${expectedOrigin}/u/domz_test`
    );
    const viewProfileLink = page.getByRole("link", { name: /View public profile/i });
    await expect(viewProfileLink).toBeVisible();
    await expect
      .poll(async () => {
        const href = await viewProfileLink.getAttribute("href");
        return href ? new URL(href, page.url()).toString() : null;
      })
      .toBe(`${expectedOrigin}/u/domz_test`);
    await expect(
      page.getByRole("button", { name: /Copy profile link/i })
    ).toBeVisible();
    await viewProfileLink.click();
    await page.waitForURL(/\/u\//, { timeout: 20000 });
    await expect(page.locator("body")).toContainText(/@domz_test/i);
    await expectNoAppError(page);
  });

  test("/review surfaces a specific seeded coaching signal", async ({ page }) => {
    await page.goto("/review");

    const coachHero = page
      .getByText(/Top coach read|What to do next/i)
      .first()
      .locator("xpath=ancestor::section[1]");

    await expect(coachHero).toContainText(/Item Lock|missed setup|Mega Greninja/i);
    await expect(coachHero).toContainText(/What to do next/i);
    await expect(page.locator("body")).toContainText(/wins tagged.*losses tagged|wins and .* losses/i);
    await expect(page.locator("body")).toContainText(
      /Strong enough to review|Worth testing next|Early signal|Needs more games/i
    );
    await expect(page.locator("body")).toContainText(/Supporting insights|Other patterns found/i);
    await expect(page.locator("body")).toContainText(/Matchup samples|Turn-order split|Tag pressure/i);
    await expect(page.locator("body")).toContainText(/Detailed analytics/i);
    await expect(page.locator("body")).toContainText(/Recent form|Trends|Matchups|Turn order|Tags|Deck versions/i);
    await expect(page.locator("body")).not.toContainText(/What to test next/i);
    await expect(page.locator("body")).not.toContainText(/this line|sample block|converts with/i);
    await expectNoAppError(page);
  });

  test("/dashboard stays focused on next action and review CTA", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.locator("body")).toContainText(/Next best action|Current focus/i);
    await expect(page.locator("body")).toContainText(/Review details|Review all insights/i);
    await expect(page.locator("body")).not.toContainText(/good prize plan.*positive pattern/i);
    await expect(page.locator("body")).not.toContainText(/wins tagged.*losses tagged|3 of 14 wins tagged/i);
    await expect(page.locator("body")).not.toContainText(/Detailed analytics|Recent form.*Deck versions|Turn-order split.*Tag pressure/i);
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
      await expect(anonymousPage.locator("body")).not.toContainText(/@gmail\.com/i);
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
