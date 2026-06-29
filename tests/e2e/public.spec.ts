import { expect, test } from "@playwright/test";
import { expectHeadingVisible, expectNoAppError } from "./helpers/assertions";
import {
  AUTH_ERROR_MESSAGES,
  normalizeAuthError,
} from "@/lib/auth-errors";

test.describe("auth error normalization", () => {
  test("maps common Supabase auth errors to clear beta-safe messages", async () => {
    expect(normalizeAuthError("over_email_send_rate_limit", "signup")).toBe(
      AUTH_ERROR_MESSAGES.signupRateLimit
    );
    expect(normalizeAuthError("Invalid login credentials", "login")).toBe(
      AUTH_ERROR_MESSAGES.invalidCredentials
    );
    expect(normalizeAuthError("Email not confirmed", "login")).toBe(
      AUTH_ERROR_MESSAGES.emailNotConfirmed
    );
    expect(normalizeAuthError("Token has expired or is invalid", "auth-link")).toBe(
      AUTH_ERROR_MESSAGES.expiredOrInvalidLink
    );
    expect(normalizeAuthError("Unexpected provider failure", "login")).toBe(
      AUTH_ERROR_MESSAGES.fallback
    );
  });
});

test.describe("public routes", () => {
  test.setTimeout(60000);

  test("landing page shows the main SixPrizer CTAs", async ({ page }) => {
    await page.goto("/");

    await expectHeadingVisible(page, "From testing games to six-prize turns.");
    await expect(page.getByRole("link", { name: "Start tracking games" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Preview demo" }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expect(page.locator("body")).toContainText(/Mega Greninja matchup/i);
    await expect(page.locator("body")).toContainText(/Current focus/i);
    await expect(page.locator("body")).toContainText(/Fast logging/i);
    await expect(page.locator("body")).toContainText(/Matchup signal/i);
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
      "Check your email to confirm your account. Check your spam folder if it does not arrive within a minute."
    );
    await expectNoAppError(page);
  });

  test("login page normalizes expired auth link errors", async ({ page }) => {
    await page.goto("/login?error=access_denied&error_description=Token%20has%20expired");

    await expectHeadingVisible(page, "Log in to SixPrizer");
    await expect(page.locator("body")).toContainText(
      "This login or confirmation link has expired. Please request a new one."
    );
    await expect(page.locator("body")).toContainText(
      "If this keeps happening, send a screenshot to the beta organiser."
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
