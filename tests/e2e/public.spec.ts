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

    await expectHeadingVisible(
      page,
      "A testing tracker for players who want to know what to test next."
    );
    await expect(page.getByRole("link", { name: "Start tracking games" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Preview demo" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Start demo with sample data/i })).toHaveAttribute(
      "href",
      "/demo"
    );
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expect(page.locator("body")).toContainText(/TCG Live/i);
    await expect(page.locator("body")).toContainText(/Built for testing, not just records/i);
    await expect(page.locator("body")).toContainText(/Compare deck versions/i);
    await expect(page.locator("body")).toContainText(/Review event rounds/i);
    await expect(page.locator("body")).toContainText(/Private by default/i);
    await expect(page.getByRole("contentinfo")).toContainText("SixPrizer");
    await expect(page.getByRole("contentinfo")).toContainText(
      /Fan-made testing tool\. Not affiliated/i
    );
    await expect(page.getByRole("contentinfo")).toContainText(
      /The Pokémon Company/i
    );
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Demo" })
    ).toHaveAttribute("href", "/demo");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Feedback" })
    ).toHaveAttribute("href", "/feedback");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Match logging" })
    ).toHaveAttribute("href", "/demo/matches/new");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "TCG Live import" })
    ).toHaveAttribute("href", "/demo/matches/new");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Event review" })
    ).toHaveAttribute("href", "/demo/events");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Deck versions" })
    ).toHaveAttribute("href", "/demo");
    await expect(
      page.getByRole("contentinfo").getByRole("link", { name: "Matchup insights" })
    ).toHaveAttribute("href", "/demo/matchups");
    await expect(
      page.getByRole("link", { name: /Limitless TCG/i })
    ).toHaveAttribute("href", "https://limitlesstcg.com");
    await expectNoAppError(page);
  });

  test("privacy and terms pages load from footer links", async ({ page }) => {
    await page.goto("/privacy");
    await expectHeadingVisible(page, "SixPrizer privacy notes");
    await expect(page.getByRole("contentinfo")).toContainText(/Fan-made testing tool/i);
    await expectNoAppError(page);

    await page.goto("/terms");
    await expectHeadingVisible(page, "SixPrizer beta terms");
    await expect(page.getByRole("contentinfo")).toContainText(/Fan-made testing tool/i);
    await expectNoAppError(page);
  });

  test("demo overview loads", async ({ page }) => {
    await page.goto("/demo");

    await expectHeadingVisible(page, "Explore a realistic testing workspace.");
    await expect(page.locator("body")).toContainText(
      "You are viewing sample SixPrizer testing data"
    );
    await expect(page.locator("body")).toContainText("SixPrizer");
    await expect(page.locator("body")).toContainText(/Current test deck/i);
    await expect(page.locator("body")).toContainText(/Deck Lab/i);
    await expect(page.locator("body")).toContainText(/Guided demo loop/i);
    await expect(page.getByTestId("beta-feedback-prompt")).toContainText(
      "Help improve SixPrizer"
    );
    await expect(
      page.getByRole("link", { name: /Send demo feedback/i })
    ).toHaveAttribute("href", "/feedback");
    await expect(
      page.getByRole("link", { name: /^Create your workspace$/ }).first()
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(/Match history/i);
    await expect(page.getByRole("link", { name: /Exit demo/i }).first()).toHaveAttribute(
      "href",
      "/"
    );
    await expect(page.locator("body")).not.toContainText(/^Logs$/m);
    await expectNoAppError(page);
  });

  test("demo review route loads", async ({ page }) => {
    await page.goto("/demo/review");

    await expectHeadingVisible(page, "Demo review");
    await expect(page.locator("body")).toContainText(/Current deck signal|Review queue/i);
    await expect(page.locator("body")).toContainText(/Recommended focused testing block/i);
    await expect(page.locator("body")).toContainText(/Play 5 focused games into Mega Greninja/i);
    await expect(page.getByRole("link", { name: /Open demo testing block/i })).toBeVisible();
    await expect(page.getByTestId("beta-feedback-prompt")).toContainText(
      "Help improve SixPrizer"
    );
    await expectNoAppError(page);
  });

  test("demo testing block route shows the focused testing plan", async ({ page }) => {
    await page.goto("/demo/testing");

    await expectHeadingVisible(page, "Focused testing demo");
    await expect(page.locator("body")).toContainText(/Active demo block/i);
    await expect(page.locator("body")).toContainText(/Mega Greninja/i);
    await expect(page.locator("body")).toContainText(/3 \/ 5 games/i);
    await expect(page.locator("body")).toContainText(/0W \/ 3L/i);
    await expect(page.locator("body")).toContainText(/bench pressure/i);
    await expect(page.locator("body")).not.toContainText(/PROGRE\.\.\.|b\.\.\./i);
    await expect(page.getByTestId("beta-feedback-prompt")).toContainText(
      "Help improve SixPrizer"
    );
    await expectNoAppError(page);
  });

  test("demo event route shows event review and next test", async ({ page }) => {
    await page.goto("/demo/events");

    await expectHeadingVisible(page, "Sample event run");
    await expect(page.locator("body")).toContainText(/League Cup Prep Night/i);
    await expect(page.locator("body")).toContainText(/Event Review/i);
    await expect(page.locator("body")).toContainText(/Suggested next test/i);
    await expect(page.locator("body")).toContainText(/Mega Greninja/i);
    await expect(page.getByTestId("beta-feedback-prompt")).toContainText(
      "Help improve SixPrizer"
    );
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

  test("signup beta gate shows invite field and rejects invalid codes when enabled", async ({ page }) => {
    test.skip(
      !process.env.BETA_INVITE_CODE && process.env.NODE_ENV !== "production",
      "Beta invite gate is not enabled in this test environment."
    );

    await page.goto("/signup");

    await expectHeadingVisible(page, "Create your SixPrizer account");
    await expect(page.getByLabel("Beta invite code")).toBeVisible();

    await page.getByLabel("Email").fill(`invalid-code-${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("password123");
    await page.getByLabel("Confirm password").fill("password123");
    await page.getByLabel("Beta invite code").fill("WRONG-CODE");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "This beta is invite-only right now. Please check the code and try again."
    );
    await expect(page).toHaveURL(/\/signup/);
    await expectNoAppError(page);
  });

  test("missing public profile shows the unavailable state", async ({ page }) => {
    await page.goto("/u/sixprizer-missing-profile");

    await expectHeadingVisible(page, "Profile unavailable");
    await expect(page.locator("body")).not.toContainText(/match_id|decklist|private notes/i);
    await expectNoAppError(page);
  });
});
