import { type Page } from "@playwright/test";
import os from "node:os";
import path from "node:path";

export function getMissingAuthEnvReason() {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    return "Authenticated E2E tests require PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD.";
  }

  return null;
}

type LoginState = {
  url: string;
  alertText: string | null;
  bodyText: string;
  emailVisible: boolean;
  passwordVisible: boolean;
  navVisible: boolean;
  overviewVisible: boolean;
  signOutVisible: boolean;
};

async function readLoginState(page: Page): Promise<LoginState> {
  const alert = page.getByRole("alert");
  const emailInput = page.getByLabel("Email");
  const passwordInput = page.getByLabel("Password");
  const bodyText =
    (await page.locator("body").textContent().catch(() => null)) ?? "";
  const alertVisible = await alert.isVisible().catch(() => false);

  return {
    url: page.url(),
    alertText: alertVisible ? (await alert.textContent())?.trim() ?? null : null,
    bodyText,
    emailVisible: await emailInput.isVisible().catch(() => false),
    passwordVisible: await passwordInput.isVisible().catch(() => false),
    navVisible: bodyText.includes("Decks"),
    overviewVisible: bodyText.includes("Overview"),
    signOutVisible: bodyText.includes("Sign out"),
  };
}

function isAuthenticatedState(state: LoginState) {
  const leftLoginRoute = !state.url.includes("/login");
  const hasAuthenticatedShell =
    state.navVisible || state.overviewVisible || state.signOutVisible;

  return leftLoginRoute && hasAuthenticatedShell;
}

export async function login(page: Page) {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD for login helper."
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 20000 }).catch(() => undefined);

  const timeoutMs = 45000;
  const startedAt = Date.now();
  let latestState = await readLoginState(page);

  while (Date.now() - startedAt < timeoutMs) {
    latestState = await readLoginState(page);

    if (latestState.alertText) {
      break;
    }

    if (isAuthenticatedState(latestState)) {
      return;
    }

    await page.waitForTimeout(250);
  }

  const screenshotPath = path.join(
    os.tmpdir(),
    "sixprizer-playwright",
    "login-failure.png"
  );

  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(
    () => undefined
  );

  throw new Error(
    [
      "Login did not reach an authenticated shell.",
      `url=${latestState.url}`,
      `alert=${latestState.alertText ?? "none"}`,
      `emailVisible=${latestState.emailVisible}`,
      `passwordVisible=${latestState.passwordVisible}`,
      `navVisible=${latestState.navVisible}`,
      `overviewVisible=${latestState.overviewVisible}`,
      `signOutVisible=${latestState.signOutVisible}`,
      `screenshot=${screenshotPath}`,
    ].join(" ")
  );
}
