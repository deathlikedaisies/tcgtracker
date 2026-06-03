import { expect, type Page } from "@playwright/test";

const appErrorPatterns = [
  "Application error",
  "Something went wrong",
  "Unhandled Runtime Error",
  "Server Error",
  "Functions cannot be passed directly to Client Components",
  "Cannot read properties of undefined",
  "Decks could not load",
  "An error occurred in the Server Components render",
];

export async function expectNoAppError(page: Page) {
  const body = page.locator("body");

  for (const pattern of appErrorPatterns) {
    await expect(body).not.toContainText(pattern);
  }
}

export async function expectNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 2
  );

  expect(hasOverflow).toBe(false);
}
