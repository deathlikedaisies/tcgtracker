import { expect, test } from "@playwright/test";
import { getMissingAuthEnvReason, login } from "./helpers/auth";
import { expectNoAppError, expectNoHorizontalOverflow } from "./helpers/assertions";

const publicRoutes = [
  { path: "/", assertion: () => ({ role: "heading" as const, name: /From testing games to/i }) },
  { path: "/demo", assertion: () => ({ role: "heading" as const, name: "SixPrizer demo workspace" }) },
  { path: "/login", assertion: () => ({ role: "heading" as const, name: "Log in to SixPrizer" }) },
  { path: "/signup", assertion: () => ({ role: "heading" as const, name: "Create your SixPrizer account" }) },
  { path: "/demo/matches/new", assertion: () => ({ role: "heading" as const, name: "Log a demo game" }) },
  { path: "/u/sixprizer-missing-profile", assertion: () => ({ role: "heading" as const, name: "Profile unavailable" }) },
];

const authenticatedRoutes = [
  { path: "/dashboard", heading: "Overview" },
  { path: "/matches/new", heading: "Log a game" },
  { path: "/review", heading: "Review" },
  { path: "/matches", heading: "Matches" },
  { path: "/decks", heading: "Deck Experiments" },
  { path: "/matchups", heading: "Matchup Intelligence" },
  { path: "/settings/profile", heading: /Profile|Create your profile/i },
];

test.describe("mobile layout", () => {
  test.setTimeout(60000);

  for (const route of publicRoutes) {
    test(`${route.path} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route.path);

      const target = route.assertion();
      await expect(page.getByRole(target.role, { name: target.name })).toBeVisible();
      await expectNoAppError(page);
      await expectNoHorizontalOverflow(page);
    });
  }

  test.describe("authenticated mobile layout", () => {
    test.describe.configure({ mode: "serial" });
    test.setTimeout(60000);

    const missingAuthEnvReason = getMissingAuthEnvReason();

    test.beforeEach(async ({ page }) => {
      test.skip(Boolean(missingAuthEnvReason), missingAuthEnvReason || "");
      await login(page);
    });

    for (const route of authenticatedRoutes) {
      test(`${route.path} is readable on mobile`, async ({ page }) => {
        await page.goto(route.path);

        await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible();
        await expect(page.getByLabel("Email")).toHaveCount(0);
        await expectNoAppError(page);
        await expectNoHorizontalOverflow(page);
      });
    }
  });
});
