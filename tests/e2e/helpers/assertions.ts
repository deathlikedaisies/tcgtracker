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

export async function expectHeadingVisible(
  page: Page,
  name: string | RegExp
) {
  const heading = page.getByRole("heading", { name }).first();

  try {
    await expect(heading).toBeVisible();
  } catch (error) {
    const [url, title, headings, bodyText] = await Promise.all([
      page.url(),
      page.title().catch(() => ""),
      page
        .getByRole("heading")
        .allTextContents()
        .catch(() => [] as string[]),
      page
        .locator("body")
        .innerText()
        .catch(() => ""),
    ]);

    const diagnostic = [
      `url=${url}`,
      `title=${title || "n/a"}`,
      `headings=${JSON.stringify(headings)}`,
      `body=${JSON.stringify(bodyText.slice(0, 500))}`,
    ].join(" ");

    const originalMessage =
      error instanceof Error ? error.message : String(error);

    throw new Error(`${originalMessage}\n${diagnostic}`);
  }
}
