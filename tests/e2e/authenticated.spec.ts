import { expect, test } from "@playwright/test";
import { login, getMissingAuthEnvReason } from "./helpers/auth";
import { expectHeadingVisible, expectNoAppError } from "./helpers/assertions";
import { buildPostSaveFocusSummary } from "@/lib/match-log-reward";
import { resolveCurrentDeckScope } from "@/lib/current-deck-scope";
import { buildDeckLabSummary } from "@/lib/deck-lab";
import type { SessionCoachInsight } from "@/lib/session-coach";
import { parseTcgLiveLog } from "@/lib/tcg-live-log-parser";

const authRoutes = [
  { path: "/dashboard", heading: "Overview" },
  { path: "/matches/new", heading: "Log a game" },
  { path: "/review", heading: "Review" },
  { path: "/matches", heading: "Match history" },
  { path: "/decks", heading: "Deck Experiments" },
  { path: "/matchups", heading: "Matchup Intelligence" },
  { path: "/profile", heading: /Profile|Create your profile/i },
  { path: "/feedback", heading: "Send feedback" },
];

function makeFocusInsight(progressCompleted: number): SessionCoachInsight {
  return {
    archetype: "Mega Greninja",
    confidence: "Needs games",
    ctaLabel: "Log next game",
    completionStatus: null,
    completionSummary: null,
    whyThisMatters: "Watch the matchup.",
    rewardLabel: "Unlock first coach read",
    completionLesson: null,
    commonIssue: null,
    criteria: "Counts focused games.",
    duringRecord: "0-0-0",
    evidence: "Focused sample: 1 game.",
    headline: "Mega Greninja is your priority watchlist.",
    improvementDelta: null,
    issueTrend: null,
    missionState: "active",
    missionType: "matchup",
    missionTypeLabel: "Priority watchlist",
    missionGuidanceMode: "focused_test",
    missionGuidanceLabel: "Focused test",
    missionStatus: "needs_games",
    missionStatusLabel: "Needs games",
    missionStatusReason: "Keep logging.",
    missionTitle: "Mega Greninja is your priority watchlist.",
    missionSkill: "Mega Greninja is your priority watchlist.",
    missionProgress: progressCompleted,
    missionTargetCount: 5,
    missionContextLabel: "Logged games",
    missionContextSeenCount: progressCompleted,
    missionContextTargetCount: 5,
    missionFocusOpponent: "Mega Greninja",
    missionFocusTurnContext: null,
    missionFocusTag: null,
    missionFocusDeckVersionIds: [],
    missionReason: "Mega Greninja is the clearest problem.",
    missionConfidence: "Needs games",
    missionNextAction: "Log next game",
    missionResults: [],
    nextAction: "Keep logging.",
    previousRecord: null,
    weakMatchup: "Mega Greninja",
    condition: "Record: 0-1",
    context: "Focus sample.",
    exactTest: "Log the next game.",
    nextTest: "After 5 games, review again.",
    progressCompleted,
    progressGoal: 5,
    progressFeedback: "Counts toward your focused test.",
    reasoning: "Focused sample.",
    focus: "Keep logging.",
    record: "0-1-0",
    eventType: "testing",
    continueHref: "/review",
  };
}

test.describe("match log reward helpers", () => {
  test("post-save focus progress counts the saved game exactly once", async () => {
    const firstGame = buildPostSaveFocusSummary(makeFocusInsight(1), true, true);
    expect(firstGame.missionProgress).toBe(1);
    expect(firstGame.remaining).toBe(4);
    expect(firstGame.missionCopy).toContain("4 more games");
    expect(firstGame.signalLine).toContain("1/5 games logged");
    expect(firstGame.signalLine).not.toContain("Logged games: 1/5");

    const secondGame = buildPostSaveFocusSummary(makeFocusInsight(2), true, true);
    expect(secondGame.missionProgress).toBe(2);
    expect(secondGame.remaining).toBe(3);
    expect(secondGame.missionCopy).toContain("3 more games");
    expect(secondGame.signalLine).toContain("2/5 games logged");
    expect(secondGame.signalLine).not.toContain("Logged games: 2/5");
  });
});

test.describe("TCG Live log parser", () => {
  const realStyleLog = [
    "DommitronNL chose heads for the opening coin flip.",
    "DommitronNL won the coin toss.",
    "DommitronNL decided to go first.",
    "DommitronNL played Dreepy to the Active Spot.",
    "DommitronNL played Dragapult ex to the Bench.",
    "DommitronNL played Blaziken ex to the Bench.",
    "AlfonsoLarsen played Budew to the Active Spot.",
    "AlfonsoLarsen played Chikorita to the Bench.",
    "AlfonsoLarsen played Applin to the Bench.",
    "AlfonsoLarsen evolved Chikorita to Bayleef on the Bench.",
    "AlfonsoLarsen evolved Bayleef to Meganium on the Bench.",
    "AlfonsoLarsen played Teal Mask Ogerpon ex to the Bench.",
    "AlfonsoLarsen evolved Applin to Dipplin on the Bench.",
    "AlfonsoLarsen played Tapu Bulu to the Bench.",
    "AlfonsoLarsen played Fezandipiti ex to the Bench.",
    "AlfonsoLarsen played Bug Catching Set.",
    "AlfonsoLarsen played Forest of Vitality.",
    "All Prize cards taken. DommitronNL wins.",
  ].join("\n");

  test("extracts result, turn order, and opponent deck from named-player logs", async () => {
    const parsed = parseTcgLiveLog(
      realStyleLog,
      {
        archetypeOptions: [
          "Mega Greninja",
          "Raging Bolt",
          "Dragapult Blaziken",
          "Ogerpon Meganium Hydrapple",
          "Ogerpon Meganium",
        ],
        playerName: "DommitronNL",
      }
    );

    expect(parsed.result).toBe("win");
    expect(parsed.turnOrder).toBe("first");
    expect(parsed.opponentName).toBe("AlfonsoLarsen");
    expect(parsed.opponentDeckGuess).not.toBe("Dragapult Blaziken");
    expect(parsed.confidence).toBeTruthy();
    expect(parsed.notes).toContain("Detected result: win");
    expect(parsed.notes).toContain("Detected turn order: first");
    expect(parsed.notes).toContain("Detected opponent: AlfonsoLarsen");
  });

  test("resolves named-player logs from the other side too", async () => {
    const parsed = parseTcgLiveLog(realStyleLog, {
      archetypeOptions: [
        "Dragapult Blaziken",
        "Ogerpon Meganium Hydrapple",
        "Ogerpon Meganium",
      ],
      playerName: "AlfonsoLarsen",
    });

    expect(parsed.result).toBe("loss");
    expect(parsed.turnOrder).toBe("second");
    expect(parsed.opponentName).toBe("DommitronNL");
  });

  test("does not force win-loss or turn order without the user TCG Live name", async () => {
    const parsed = parseTcgLiveLog(realStyleLog, {
      archetypeOptions: [
        "Dragapult Blaziken",
        "Ogerpon Meganium Hydrapple",
        "Ogerpon Meganium",
      ],
    });

    expect(parsed.result).toBeUndefined();
    expect(parsed.turnOrder).toBeUndefined();
    expect(parsed.winnerName).toBe("DommitronNL");
    expect(parsed.decidingPlayerName).toBe("DommitronNL");
    expect(parsed.notes.join(" ")).toMatch(/Add your TCG Live name/i);
  });
});

test.describe("current deck scope resolver", () => {
  test("defaults dashboard and review to the active deck instead of pooling old logs", async () => {
    const resolved = resolveCurrentDeckScope({
      decks: [
        {
          id: "deck-a",
          name: "Deck A",
          created_at: "2026-06-20T10:00:00.000Z",
          deck_versions: [{ id: "version-a", is_active: false }],
        },
        {
          id: "deck-b",
          name: "Deck B",
          created_at: "2026-06-24T10:00:00.000Z",
          deck_versions: [{ id: "version-b", is_active: true }],
        },
      ],
      matches: [
        {
          deck_version_id: "version-b",
          played_at: "2026-06-24T11:00:00.000Z",
        },
        {
          deck_version_id: "version-a",
          played_at: "2026-06-22T11:00:00.000Z",
        },
      ],
    });

    expect(resolved.deckId).toBe("deck-b");
    expect(resolved.deckName).toBe("Deck B");
    expect(resolved.showAllDecks).toBe(false);
    expect(resolved.source).toBe("active_version");
  });

  test("keeps all decks explicit instead of the implicit default", async () => {
    const resolved = resolveCurrentDeckScope({
      decks: [
        {
          id: "deck-a",
          name: "Deck A",
          created_at: "2026-06-20T10:00:00.000Z",
          deck_versions: [{ id: "version-a", is_active: true }],
        },
      ],
      matches: [],
      explicitDeckId: "all",
    });

    expect(resolved.deckId).toBeNull();
    expect(resolved.showAllDecks).toBe(true);
    expect(resolved.source).toBe("all_decks");
  });
});

test.describe("deck lab summary", () => {
  test("keeps a low-sample first version in build-sample mode", async () => {
    const summary = buildDeckLabSummary({
      deckArchetype: "Dragapult Blaziken",
      versions: [
        {
          id: "v1",
          name: "v1",
          created_at: "2026-06-20T10:00:00.000Z",
          is_active: true,
        },
      ],
      activeVersionId: "v1",
      matches: [
        {
          deck_version_id: "v1",
          opponent_archetype: "Mega Greninja",
          result: "loss",
          went_first: false,
          played_at: "2026-06-20T10:00:00.000Z",
          metadata: {
            start_quality: "bad",
            opening_hand_quality: "bad",
            sequencing_quality: "okay",
            issue_tags: ["missed setup"],
          },
        },
        {
          deck_version_id: "v1",
          opponent_archetype: "Raging Bolt",
          result: "win",
          went_first: true,
          played_at: "2026-06-21T10:00:00.000Z",
          metadata: {
            start_quality: "good",
            opening_hand_quality: "good",
            sequencing_quality: "good",
            positive_tags: ["strong setup"],
          },
        },
        {
          deck_version_id: "v1",
          opponent_archetype: "N's Zoroark",
          result: "loss",
          went_first: true,
          played_at: "2026-06-22T10:00:00.000Z",
          metadata: {
            start_quality: "okay",
            opening_hand_quality: "bad",
            sequencing_quality: "okay",
            issue_tags: ["tempo loss"],
          },
        },
      ],
    });

    expect(summary.versionReadStatus).toBe("first_version");
    expect(summary.currentVersionSampleDisplay).toBe("3/10 games");
    expect(summary.versionReadSummary).toMatch(/first version/i);
    expect(summary.recommendation).toMatch(/Log 7 more games before making your first change\./i);
    expect(summary.currentVersionSampleSummary).toMatch(/Keep testing before changing the list\./i);
    expect(summary.versionReadSummary).not.toMatch(/baseline ready/i);
  });

  test("treats a high-sample first version as a usable baseline", async () => {
    const summary = buildDeckLabSummary({
      deckArchetype: "Dragapult Blaziken",
      versions: [
        {
          id: "v1",
          name: "v1",
          created_at: "2026-06-20T10:00:00.000Z",
          is_active: true,
        },
      ],
      activeVersionId: "v1",
      matches: Array.from({ length: 20 }, (_, index) => ({
        deck_version_id: "v1",
        opponent_archetype:
          index % 2 === 0 ? "Mega Greninja" : "Ogerpon Meganium",
        result: index % 3 === 0 ? ("loss" as const) : ("win" as const),
        went_first: index % 4 === 0 ? false : true,
        played_at: new Date(Date.UTC(2026, 5, 1 + index)).toISOString(),
        metadata: {
          start_quality: index % 3 === 0 ? "okay" : "good",
          opening_hand_quality: index % 4 === 0 ? "okay" : "good",
          sequencing_quality: index % 5 === 0 ? "okay" : "good",
          issue_tags: index % 3 === 0 ? ["tempo loss"] : [],
          positive_tags: index % 3 === 0 ? [] : ["strong setup"],
        },
      })),
    });

    expect(summary.versionReadStatus).toBe("baseline_ready");
    expect(summary.versionReadLabel).toBe("Baseline ready");
    expect(summary.currentVersionSampleDisplay).toBe("20 games");
    expect(summary.currentVersionSampleSummary).toBe("Baseline ready.");
    expect(summary.cleanLogDisplay).toBe("20 of 20");
    expect(summary.cleanLogSummary).toBe("20-game clean streak");
    expect(summary.versionReadSummary).toMatch(/enough games to use as a baseline/i);
    expect(summary.versionPatienceSummary).toMatch(
      /Good baseline\. Future versions can be compared against this sample\./i
    );
    expect(summary.sampleCaution).toMatch(/Future versions can now be compared against this sample\./i);
    expect(summary.recommendation).toBe(
      "Create a new version when you have a specific list change to test."
    );
    expect(summary.versionReadSummary).not.toMatch(/build a clean sample/i);
    expect(summary.versionPatienceSummary).not.toMatch(/keep testing before changing the list/i);
  });

  test("keeps low-sample compares conservative", async () => {
    const summary = buildDeckLabSummary({
      deckArchetype: "Dragapult Blaziken",
      versions: [
        {
          id: "v1",
          name: "v1",
          created_at: "2026-06-20T10:00:00.000Z",
          is_active: false,
        },
        {
          id: "v2",
          name: "v2",
          created_at: "2026-06-24T10:00:00.000Z",
          is_active: true,
        },
      ],
      activeVersionId: "v2",
      matches: [
        {
          deck_version_id: "v1",
          opponent_archetype: "Mega Greninja",
          result: "loss",
          went_first: false,
          played_at: "2026-06-21T10:00:00.000Z",
          metadata: {
            start_quality: "bad",
            opening_hand_quality: "bad",
            sequencing_quality: "okay",
            issue_tags: ["missed setup"],
          },
        },
        {
          deck_version_id: "v2",
          opponent_archetype: "Mega Greninja",
          result: "win",
          went_first: true,
          played_at: "2026-06-25T10:00:00.000Z",
          metadata: {
            start_quality: "great",
            opening_hand_quality: "good",
            sequencing_quality: "good",
            positive_tags: ["strong setup"],
          },
        },
      ],
    });

    expect(summary.versionReadStatus).toBe("needs_games");
    expect(summary.versionReadSummary).toMatch(/not enough games/i);
  });

  test("detects setup improvement and excludes the active archetype from the watchlist", async () => {
    const summary = buildDeckLabSummary({
      deckArchetype: "Dragapult Blaziken",
      versions: [
        {
          id: "v1",
          name: "v1",
          created_at: "2026-06-20T10:00:00.000Z",
          is_active: false,
        },
        {
          id: "v2",
          name: "v2",
          created_at: "2026-06-24T10:00:00.000Z",
          is_active: true,
        },
      ],
      activeVersionId: "v2",
      matches: [
        {
          deck_version_id: "v1",
          opponent_archetype: "Mega Greninja",
          result: "loss",
          went_first: false,
          played_at: "2026-06-20T10:00:00.000Z",
          metadata: {
            start_quality: "bad",
            opening_hand_quality: "bad",
            sequencing_quality: "bad",
            issue_tags: ["missed setup"],
          },
        },
        {
          deck_version_id: "v1",
          opponent_archetype: "N's Zoroark",
          result: "loss",
          went_first: false,
          played_at: "2026-06-21T10:00:00.000Z",
          metadata: {
            start_quality: "okay",
            opening_hand_quality: "bad",
            sequencing_quality: "okay",
            issue_tags: ["missed setup"],
          },
        },
        {
          deck_version_id: "v1",
          opponent_archetype: "Mega Greninja",
          result: "win",
          went_first: true,
          played_at: "2026-06-22T10:00:00.000Z",
          metadata: {
            start_quality: "good",
            opening_hand_quality: "okay",
            sequencing_quality: "good",
            positive_tags: ["strong setup"],
          },
        },
        {
          deck_version_id: "v2",
          opponent_archetype: "Mega Greninja",
          result: "win",
          went_first: true,
          played_at: "2026-06-24T10:00:00.000Z",
          metadata: {
            start_quality: "great",
            opening_hand_quality: "good",
            sequencing_quality: "good",
            positive_tags: ["strong setup"],
          },
        },
        {
          deck_version_id: "v2",
          opponent_archetype: "Ogerpon Meganium",
          result: "win",
          went_first: true,
          played_at: "2026-06-25T10:00:00.000Z",
          metadata: {
            start_quality: "great",
            opening_hand_quality: "good",
            sequencing_quality: "great",
            positive_tags: ["strong setup"],
          },
        },
        {
          deck_version_id: "v2",
          opponent_archetype: "Raging Bolt",
          result: "loss",
          went_first: false,
          played_at: "2026-06-26T10:00:00.000Z",
          metadata: {
            start_quality: "good",
            opening_hand_quality: "good",
            sequencing_quality: "good",
            issue_tags: ["poor prize trade"],
          },
        },
      ],
    });

    expect(
      summary.improvements.some((signal) =>
        signal.label.toLowerCase().includes("starts look cleaner")
      )
    ).toBe(true);
    expect(
      summary.metaWatchlist.some(
        (item) => item.archetype === "Dragapult Blaziken"
      )
    ).toBe(false);
    expect(summary.versionReadStatus).toBe("early_read");
  });
});

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
      await expect(
        page.getByRole("link", { name: /^Match history$/ }).first()
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /^Log game$/ }).first()
      ).toBeVisible();
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

  test("/matches/new can autofill from a TCG Live log near the top of the flow", async ({
    page,
  }) => {
    await page.goto("/matches/new");

    await expectHeadingVisible(page, "Log a game");
    await page.getByRole("button", { name: /Import from TCG Live log/i }).click();
    await page.getByLabel("Your TCG Live name").fill("DommitronNL");
    await page
      .getByLabel("TCG Live battle log")
      .fill(
        [
          "DommitronNL chose heads for the opening coin flip.",
          "DommitronNL won the coin toss.",
          "DommitronNL decided to go first.",
          "DommitronNL played Dreepy to the Active Spot.",
          "DommitronNL played Dragapult ex to the Bench.",
          "DommitronNL played Blaziken ex to the Bench.",
          "AlfonsoLarsen played Budew to the Active Spot.",
          "AlfonsoLarsen played Chikorita to the Bench.",
          "AlfonsoLarsen evolved Chikorita to Bayleef on the Bench.",
          "AlfonsoLarsen evolved Bayleef to Meganium on the Bench.",
          "AlfonsoLarsen played Teal Mask Ogerpon ex to the Bench.",
          "AlfonsoLarsen evolved Applin to Dipplin on the Bench.",
          "All Prize cards taken. DommitronNL wins.",
        ].join("\n")
      );
    await page.getByRole("button", { name: "Autofill from log" }).click();

    await expect(page.locator('input[name="result"]')).toHaveValue("win");
    await expect(page.locator('input[name="went_first"]')).toHaveValue("true");
    await expect(page.locator('input[name="opponent_archetype"]')).not.toHaveValue(
      "Dragapult Blaziken"
    );
    await expect(page.locator("body")).toContainText(/Detected result: win/i);
    await expect(page.locator("body")).toContainText(/Detected turn order: first/i);
    await expect(page.locator("body")).toContainText(/Detected opponent: AlfonsoLarsen/i);
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
    await expect(
      startFieldset.getByRole("button", { pressed: true })
    ).toHaveCount(0);
    await expect(
      openingFieldset.getByRole("button", { pressed: true })
    ).toHaveCount(0);
    await expect(
      sequencingFieldset.getByRole("button", { pressed: true })
    ).toHaveCount(0);
    await startFieldset.getByRole("button", { name: "Good" }).click();
    await openingFieldset.getByRole("button", { name: "Good" }).click();
    await sequencingFieldset.getByRole("button", { name: "Good" }).click();
    await expect(qualityContinue).toBeEnabled();
    await expect(page.getByRole("button", { name: "Autofill from log" })).toBeVisible();

    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("button", { name: "Back" }).click();

    const opponentSearch = page.getByLabel("Opponent deck");
    await opponentSearch.fill("Raging");
    await page.getByRole("button", { name: /Raging Bolt/i }).first().click();
    await expect(page.locator('input[name="opponent_archetype"]')).toHaveValue(
      "Raging Bolt"
    );
    await expectNoAppError(page);
  });

  test("/matches/new requires a TCG Live name before autofill on named-player logs", async ({
    page,
  }) => {
    await page.goto("/matches/new");

    await page.getByRole("button", { name: /Import from TCG Live log/i }).click();
    await page
      .getByLabel("TCG Live battle log")
      .fill(
        [
          "DommitronNL decided to go first.",
          "All Prize cards taken. DommitronNL wins.",
        ].join("\n")
      );
    await page.getByRole("button", { name: "Autofill from log" }).click();

    await expect(page.locator("body")).toContainText(
      "Add your TCG Live name to autofill this log."
    );
    await expect(page.locator('input[name="result"]')).toHaveValue("");
    await expect(page.locator('input[name="went_first"]')).toHaveValue("");
    await expect(page.locator("body")).not.toContainText(/Detected winner:/i);
    await expect(page.locator("body")).not.toContainText(
      /Detected turn choice:/i
    );
    await expectNoAppError(page);
  });

  test("/matches/new requires a pasted log before autofill", async ({ page }) => {
    await page.goto("/matches/new");

    await page.getByRole("button", { name: /Import from TCG Live log/i }).click();
    await page.getByLabel("Your TCG Live name").fill("DommitronNL");
    await page.getByRole("button", { name: "Autofill from log" }).click();

    await expect(page.locator("body")).toContainText(
      "Paste a TCG Live log first."
    );
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
    await expect(page.getByLabel("Main deck")).toHaveCount(0);
    await expect(page.getByLabel("Current testing focus")).toHaveCount(0);
    await expect(page.getByLabel("Country")).toHaveCount(1);
    await expect(page.getByLabel("Favorite deck")).toHaveCount(1);
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

  test("/feedback saves beta feedback in-app", async ({ page }) => {
    await page.goto("/feedback");

    await expectHeadingVisible(page, "Send feedback");
    await page.getByLabel("Type").selectOption("Bug");
    await page.getByLabel("Page or area").selectOption("Review");
    await page.getByLabel("Severity").selectOption("Annoying");
    await page
      .getByRole("textbox", { name: "Message" })
      .fill("Review felt unclear after the first few games.");
    await page
      .getByLabel(/You can contact me about this if needed\./i)
      .check();
    await page.getByRole("button", { name: "Save feedback" }).click();

    await expect(page.locator("body")).toContainText(
      "Thanks. Your feedback was saved."
    );
    await expect(page.getByRole("textbox", { name: "Message" })).toHaveValue("");
    await expectNoAppError(page);
  });

  test("/review surfaces a specific seeded coaching signal", async ({ page }) => {
    await page.goto("/review");

    const coachHero = page
      .getByText(/Top coach read|What to do next/i)
      .first()
      .locator("xpath=ancestor::section[1]");
    const deckFilter = page.getByLabel("Deck");

    await expect(deckFilter).not.toHaveValue("all");
    await expect(page.locator("body")).toContainText(/Showing insights for:/i);
    await expect(coachHero).toContainText(
      /Item Lock|missed setup|Mega Greninja|supporter drought|version|stronger so far/i
    );
    await expect(coachHero).toContainText(/What to do next/i);
    await expect(coachHero).toContainText(/Evidence|Confidence/i);
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

    await expect(page.getByRole("link", { name: /^Log game$/ }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^Match history$/ }).first()
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/^Logs$/m);
    await expect(page.locator("body")).toContainText(/Next best action|Current focus/i);
    await expect(page.locator("body")).toContainText(
      /Showing insights for this deck|Showing combined insights across all decks/i
    );
    await expect(page.locator("body")).toContainText(/Current test deck|Combined scope/i);
    await expect(page.locator("body")).toContainText(/Testing:|Combined testing scope|Archetype not set yet/i);
    await expect(page.locator("body")).toContainText(/Review details|Open review/i);
    await expect(page.locator("body")).not.toContainText(/good prize plan.*positive pattern/i);
    await expect(page.locator("body")).not.toContainText(/wins tagged.*losses tagged|3 of 14 wins tagged/i);
    await expect(page.locator("body")).not.toContainText(/Detailed analytics|Recent form.*Deck versions|Turn-order split.*Tag pressure/i);
    await expectNoAppError(page);
  });

  test("/dashboard opens Review with the same current-deck scope", async ({ page }) => {
    await page.goto("/dashboard");

    const reviewLink = page
      .locator('a[href^="/review"]')
      .filter({ hasText: "Open review" })
      .first();
    const href = await reviewLink.getAttribute("href");

    expect(href).toBeTruthy();
    expect(href).toMatch(/^\/review(\?deck_id=.+)?$/);

    await reviewLink.click();
    await page.waitForURL(/\/review/, { timeout: 20000 });

    const url = new URL(page.url());
    const deckIdFromUrl = url.searchParams.get("deck_id");
    const deckFilter = page.getByLabel("Deck");

    if (deckIdFromUrl) {
      await expect(deckFilter).toHaveValue(deckIdFromUrl);
      await expect(page.locator("body")).toContainText(/Showing insights for:/i);
    } else {
      await expect(deckFilter).not.toHaveValue("all");
      await expect(page.locator("body")).toContainText(/Showing insights for:/i);
    }

    await deckFilter.selectOption("all");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/deck_id=all/);
    await expect(page.locator("body")).toContainText(
      /Showing combined insights across all decks/i
    );
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

    await expect(page.locator("body")).toContainText(/Deck Lab/i);
    await expect(page.locator("body")).toContainText(
      /Version read|Testing discipline|Meta watchlist/i
    );
    await expect(page.locator("body")).toContainText(/Version evidence|Version signal/i);
    await expect(page.locator("body")).toContainText(/v1|v2|v3/i);
    await expect(page.locator("body")).toContainText(
      /Opening quality|Sequencing quality|Best current signal/i
    );
    await expectNoAppError(page);
  });

  test("/decks can switch the active deck and dashboard-review follow it", async ({
    page,
  }) => {
    await page.goto("/decks");

    const inactiveCard = page
      .locator("article")
      .filter({ has: page.getByRole("button", { name: "Make active" }) })
      .first();
    await expect(inactiveCard).toBeVisible();

    const deckName = (await inactiveCard
      .getByRole("heading", { level: 3 })
      .textContent())?.trim();
    expect(deckName).toBeTruthy();

    const detailHref = await inactiveCard
      .getByRole("link")
      .first()
      .getAttribute("href");
    const deckId = detailHref?.match(/\/decks\/([^#?]+)/)?.[1];
    expect(deckId).toBeTruthy();

    await inactiveCard.getByRole("button", { name: "Make active" }).click();
    await page.waitForURL(/\/decks/, { timeout: 20000 });

    const activeCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: deckName! }) })
      .first();
    await expect(activeCard).toContainText(/Current test deck/i);
    await expect(
      activeCard.getByRole("button", { name: "Make active" })
    ).toHaveCount(0);

    await page.goto("/dashboard");
    await expect(page.locator("body")).toContainText(deckName!);

    await page.goto("/review");
    await expect(page.getByLabel("Deck")).toHaveValue(deckId!);
    await expect(page.locator("body")).toContainText(deckName!);
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
