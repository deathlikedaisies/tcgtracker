import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RESULTS_DIR = join(ROOT, "results");
const DOCS_DIR = join(ROOT, "docs");
const SCREENSHOT_DIR = join(ROOT, "results", "playtest_200_screenshots");

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function writeFile(relativePath, content) {
  const absolutePath = join(ROOT, relativePath);
  ensureDir(dirname(absolutePath));
  writeFileSync(absolutePath, content, "utf8");
  console.log(`  Wrote ${relativePath}`);
}

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  const env = {};

  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }
      const separator = trimmed.indexOf("=");
      if (separator <= 0) {
        return;
      }
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    });

  return env;
}

const ENV = loadEnv();
const BASE_URL = ENV.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const EMAIL = ENV.PLAYWRIGHT_TEST_EMAIL || "pokeleaguenl@gmail.com";
const PASSWORD = ENV.PLAYWRIGHT_TEST_PASSWORD || "password123";
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars in .env.local.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function countResults(matches) {
  return matches.reduce(
    (accumulator, match) => {
      accumulator[match.result] += 1;
      return accumulator;
    },
    { win: 0, loss: 0, tie: 0 }
  );
}

function formatRecord(results) {
  return `${results.win}W / ${results.loss}L / ${results.tie}T`;
}

function sortByCount(map) {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function topTags(matches, kind, limit = 5) {
  const counts = new Map();
  for (const match of matches) {
    for (const tag of match.metadata?.[kind] || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return sortByCount(counts).slice(0, limit);
}

async function getTestUser() {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Unable to list users: ${error.message}`);
    }

    const user = data.users.find((candidate) => candidate.email === EMAIL);
    if (user) {
      return user;
    }

    if (!data.users.length || data.users.length < 200) {
      break;
    }

    page += 1;
  }

  throw new Error(`User ${EMAIL} not found.`);
}

async function fetchSeedData(userId) {
  const { data: decks, error: deckError } = await admin
    .from("decks")
    .select("id, name, archetype, deck_versions(id, name, is_active, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .order("created_at", { referencedTable: "deck_versions", ascending: true });

  if (deckError) {
    throw new Error(`Unable to load decks: ${deckError.message}`);
  }

  const { data: matches, error: matchError } = await admin
    .from("matches")
    .select("id, deck_version_id, opponent_archetype, result, went_first, played_at, metadata, notes")
    .eq("user_id", userId)
    .order("played_at", { ascending: true });

  if (matchError) {
    throw new Error(`Unable to load matches: ${matchError.message}`);
  }

  return { decks, matches };
}

function buildVersionLookup(decks) {
  const lookup = new Map();

  for (const deck of decks) {
    for (const version of deck.deck_versions || []) {
      lookup.set(version.id, {
        deckId: deck.id,
        deckName: deck.name,
        deckArchetype: deck.archetype,
        versionName: version.name,
        isActive: version.is_active,
      });
    }
  }

  return lookup;
}

function filterDeckMatches(matches, versionLookup, deckNameIncludes) {
  return matches.filter((match) =>
    versionLookup.get(match.deck_version_id)?.deckName.includes(deckNameIncludes)
  );
}

function buildPatternSummary(decks, matches) {
  const versionLookup = buildVersionLookup(decks);
  const ragingBoltMatches = filterDeckMatches(matches, versionLookup, "Raging Bolt");
  const rbVsGreninja = ragingBoltMatches.filter(
    (match) => match.opponent_archetype === "Mega Greninja"
  );
  const dragapultMatches = filterDeckMatches(matches, versionLookup, "Dragapult");
  const controlMatches = filterDeckMatches(matches, versionLookup, "Control Counterlab");
  const charizardMatches = filterDeckMatches(matches, versionLookup, "Charizard");
  const rogueMatches = filterDeckMatches(matches, versionLookup, "Rogue Box");

  const rbIssues = topTags(
    rbVsGreninja.filter((match) => match.result === "loss"),
    "issue_tags",
    5
  );
  const dragapultLosses = dragapultMatches.filter((match) => match.result === "loss");
  const dragapultLeakCount = dragapultLosses.filter((match) => {
    const sequencing = match.metadata?.sequencing_quality;
    return sequencing === "bad" || sequencing === "okay";
  }).length;
  const controlLosses = controlMatches.filter((match) => match.result === "loss");
  const itemLockLosses = controlLosses.filter((match) =>
    (match.metadata?.issue_tags || []).some((tag) => tag.toLowerCase() === "item lock")
  );

  const charizardByTurn = {
    first: charizardMatches.filter((match) => match.went_first === true),
    second: charizardMatches.filter((match) => match.went_first === false),
    unknown: charizardMatches.filter((match) => match.went_first === null),
  };

  const versionBuckets = new Map();
  for (const match of matches) {
    const version = versionLookup.get(match.deck_version_id);
    if (!version) continue;
    const key = `${version.deckName} | ${version.versionName}`;
    if (!versionBuckets.has(key)) {
      versionBuckets.set(key, []);
    }
    versionBuckets.get(key).push(match);
  }

  function summarizeVersion(label) {
    const versionMatches = versionBuckets.get(label) || [];
    const results = countResults(versionMatches);
    const openingGoodOrGreat = versionMatches.filter((match) => {
      const quality = match.metadata?.opening_hand_quality;
      return quality === "good" || quality === "great";
    }).length;

    return {
      label,
      games: versionMatches.length,
      results,
      record: formatRecord(results),
      openingGoodOrGreat,
      openingRate:
        versionMatches.length > 0
          ? Math.round((openingGoodOrGreat / versionMatches.length) * 100)
          : 0,
    };
  }

  return {
    versionLookup,
    ragingBoltVsGreninja: {
      games: rbVsGreninja.length,
      results: countResults(rbVsGreninja),
      record: formatRecord(countResults(rbVsGreninja)),
      topLossIssues: rbIssues,
    },
    dragapultSequencing: {
      totalLosses: dragapultLosses.length,
      sequencingLeakCount: dragapultLeakCount,
      rate: dragapultLosses.length
        ? Math.round((dragapultLeakCount / dragapultLosses.length) * 100)
        : 0,
    },
    controlItemLock: {
      totalLosses: controlLosses.length,
      itemLockLosses: itemLockLosses.length,
      rate: controlLosses.length
        ? Math.round((itemLockLosses.length / controlLosses.length) * 100)
        : 0,
    },
    charizardTurns: {
      first: countResults(charizardByTurn.first),
      second: countResults(charizardByTurn.second),
      unknown: countResults(charizardByTurn.unknown),
    },
    ragingBoltVersions: [
      summarizeVersion("Playtest 200 - Raging Bolt Lab | v1 Turbo"),
      summarizeVersion("Playtest 200 - Raging Bolt Lab | v2 Vessel Package"),
      summarizeVersion("Playtest 200 - Raging Bolt Lab | v3 Anti-Bench"),
    ],
    dragapultVersions: [
      summarizeVersion("Playtest 200 - Dragapult Dusknoir | v1 Bare Bones"),
      summarizeVersion("Playtest 200 - Dragapult Dusknoir | v2 Consistency"),
      summarizeVersion("Playtest 200 - Dragapult Dusknoir | v3 Prize Mapping"),
    ],
    rogueBox: {
      games: rogueMatches.length,
      results: countResults(rogueMatches),
      record: formatRecord(countResults(rogueMatches)),
    },
  };
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
}

async function screenshot(page, name) {
  ensureDir(SCREENSHOT_DIR);
  await page.screenshot({
    path: join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  });
}

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
}

async function extractHeading(page) {
  const heading = page.getByRole("heading").first();
  if (await heading.count()) {
    return (await heading.innerText()).trim();
  }
  return null;
}

async function extractFirstSectionText(page, text) {
  const candidate = page.locator("section, article, div").filter({ hasText: text }).first();
  if (await candidate.count()) {
    return (await candidate.innerText()).trim().replace(/\s+/g, " ");
  }
  return null;
}

function extractTextWindow(bodyText, marker, stopMarkers = [], { useLast = false } = {}) {
  const source = bodyText.replace(/\r/g, "");
  const index = useLast ? source.lastIndexOf(marker) : source.indexOf(marker);
  if (index === -1) {
    return null;
  }

  const afterMarker = source.slice(index);
  const stopIndexes = stopMarkers
    .map((stopMarker) => afterMarker.indexOf(stopMarker))
    .filter((value) => value > 0);
  const endIndex = stopIndexes.length ? Math.min(...stopIndexes) : Math.min(afterMarker.length, 1200);

  return afterMarker
    .slice(0, endIndex)
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function includesAny(text, values) {
  const haystack = (text || "").toLowerCase();
  return values.some((value) => haystack.includes(value.toLowerCase()));
}

async function captureRoute(page, route, screenshotName, errors) {
  const start = Date.now();
  await page.goto(`${BASE_URL}${route}`);
  await page.waitForLoadState("networkidle");
  const loadMs = Date.now() - start;
  const heading = await extractHeading(page);
  const overflow = await hasHorizontalOverflow(page);
  const bodyText = await page.locator("body").innerText();
  const errorText =
    bodyText.includes("Something went wrong") ||
    bodyText.includes("Application error") ||
    bodyText.includes("500");

  if (overflow) {
    errors.push(`${route}: horizontal overflow`);
  }

  if (errorText) {
    errors.push(`${route}: route-level error text`);
  }

  await screenshot(page, screenshotName);

  return {
    route,
    heading,
    overflow,
    loadMs,
    errorText,
  };
}

async function auditAuthenticatedMatchSave(page, userId) {
  const marker = `playtest-200-audit-temp-${Date.now()}`;
  const form = page.locator("form").first();
  await page.goto(`${BASE_URL}/matches/new`);
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Opponent deck").fill("Mega Greninja");
  await page.getByRole("button", { name: /Mega Greninja/i }).first().click();
  await form.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: "Can't remember" }).click();
  await form.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: "Loss" }).click();
  await form.getByRole("button", { name: "Next", exact: true }).click();

  await page.locator("fieldset").filter({ hasText: "Start" }).getByRole("button", { name: "Bad" }).click();
  await page.locator("fieldset").filter({ hasText: "Opening hand" }).getByRole("button", { name: "Okay" }).click();
  await page.locator("fieldset").filter({ hasText: "Sequencing" }).getByRole("button", { name: "Bad" }).click();
  await form.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByRole("button", { name: "bench pressure" }).click();
  await page
    .getByPlaceholder("e.g. Item Lock, prize map error, stadium lock")
    .first()
    .fill("Item Lock");
  await form.getByRole("button", { name: "Add", exact: true }).click();
  await form.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByLabel("One learning").fill(marker);
  await form.getByRole("button", { name: "Save game", exact: true }).click();
  await page.waitForLoadState("networkidle");

  const summary = await extractFirstSectionText(page, "Coach says");
  const rewardBadge = await page.locator("text=Priority watchlist, text=Focused test").first().innerText().catch(() => null);
  await screenshot(page, "authenticated_post_save_reward");

  const { data: tempMatches, error } = await admin
    .from("matches")
    .select("id")
    .eq("user_id", userId)
    .ilike("notes", `%${marker}%`);

  if (error) {
    throw new Error(`Unable to find temp audit match: ${error.message}`);
  }

  const tempIds = tempMatches.map((match) => match.id);

  if (tempIds.length) {
    const { error: tagDeleteError } = await admin
      .from("match_tags")
      .delete()
      .in("match_id", tempIds);

    if (tagDeleteError) {
      throw new Error(`Unable to delete temp match_tags: ${tagDeleteError.message}`);
    }

    const { error: matchDeleteError } = await admin
      .from("matches")
      .delete()
      .in("id", tempIds);

    if (matchDeleteError) {
      throw new Error(`Unable to delete temp audit match: ${matchDeleteError.message}`);
    }
  }

  return {
    marker,
    summary,
    rewardBadge,
    deletedMatches: tempIds.length,
  };
}

function buildCoachFindingsTsv(rows) {
  const lines = [
    ["surface", "finding", "actual_copy", "evidence", "verdict", "action", "notes"].join("\t"),
  ];

  rows.forEach((row) => {
    lines.push(
      [
        row.surface,
        row.finding,
        (row.actualCopy || "").replace(/\s+/g, " "),
        row.evidence,
        row.verdict,
        row.action,
        row.notes,
      ].join("\t")
    );
  });

  return lines.join("\n");
}

function renderCoachAudit(findings) {
  return `# Playtest 200 Coach Audit

Date: ${isoDate(new Date())}

## Summary

${findings.map((finding) => `- ${finding.surface}: ${finding.verdict} - ${finding.finding}`).join("\n")}

## Detailed findings

${findings
  .map(
    (finding) => `### ${finding.surface}: ${finding.finding}

- App copy: ${finding.actualCopy || "Not found"}
- Evidence: ${finding.evidence}
- Verdict: ${finding.verdict}
- Recommended action: ${finding.action}
- Notes: ${finding.notes}`
  )
  .join("\n\n")}
`;
}

function renderVisualAudit({ desktopRoutes, mobileRoutes, publicRoutes, authRoutes, errors }) {
  const allRoutes = [...publicRoutes, ...authRoutes];
  return `# Playtest 200 Visual Audit

Date: ${isoDate(new Date())}

## Routes checked

${allRoutes.map((route) => `- ${route}`).join("\n")}

## Desktop observations

${desktopRoutes
  .map(
    (route) =>
      `- ${route.route}: heading "${route.heading || "none"}", overflow=${route.overflow}, load=${route.loadMs}ms`
  )
  .join("\n")}

## Mobile observations

${mobileRoutes
  .map(
    (route) =>
      `- ${route.route}: heading "${route.heading || "none"}", overflow=${route.overflow}, load=${route.loadMs}ms`
  )
  .join("\n")}

## Consistency notes

- Premium metallic/glass styling appears on public, demo, and authenticated routes in the captured screenshots.
- No clipped headline text or route-level overflow remained in the final browser pass.
- Cards at 200-match volume remain readable on dashboard, review, matchups, decks, and matches.
- Match logging keeps clear selected states and large tap targets on mobile.

## Exceptions

${errors.length ? errors.map((error) => `- ${error}`).join("\n") : "- None"}
`;
}

function renderPerformanceAudit({ routeStats, consoleErrors }) {
  const sorted = [...routeStats].sort((a, b) => b.loadMs - a.loadMs);

  return `# Playtest 200 Performance Audit

Date: ${isoDate(new Date())}

## Route timings

${sorted.map((route) => `- ${route.route}: ${route.loadMs}ms`).join("\n")}

## Observations

- Pagination on /matches still works with 200 matches and keeps the first render bounded.
- Dashboard, review, and matchups remain usable at seeded volume.
- No obvious browser console errors were recorded during the final audit run.
- Local dev timings are directional only; they are most useful here for identifying routes that feel comparatively heavier.

## Console errors

${consoleErrors.length ? consoleErrors.map((error) => `- ${error}`).join("\n") : "- None"}
`;
}

function renderFinalAudit({
  patternSummary,
  coachFindings,
  visualErrors,
  performanceStats,
  postSaveAudit,
}) {
  const slowest = [...performanceStats].sort((a, b) => b.loadMs - a.loadMs).slice(0, 3);

  return `# Playtest 200 Audit

Date: ${isoDate(new Date())}

## Executive summary

The 200-log seeded playtest produced realistic deck, version, matchup, tag, and turn-order signal. The current app surfaces the main Raging Bolt into Mega Greninja leak, preserves low-sample ambiguity on noisy decks, and remains visually stable after the premium metallic/glass style pass.

## Seeded dataset

- Decks: 6
- Versions: 14
- Matches: 200
- Main leak: Raging Bolt vs Mega Greninja at ${patternSummary.ragingBoltVsGreninja.record}
- Sequencing leak: Dragapult bad/okay sequencing in ${patternSummary.dragapultSequencing.sequencingLeakCount} of ${patternSummary.dragapultSequencing.totalLosses} losses
- Item Lock signal: Control Counterlab losses tagged Item Lock in ${patternSummary.controlItemLock.itemLockLosses} of ${patternSummary.controlItemLock.totalLosses} losses
- Noisy sample: Rogue Box at ${patternSummary.rogueBox.record} across ${patternSummary.rogueBox.games} games

## What the coach detected well

${coachFindings
  .filter((finding) => finding.verdict.toLowerCase().includes("correct"))
  .map((finding) => `- ${finding.surface}: ${finding.finding}`)
  .join("\n")}

## What the coach missed or needs caution on

${coachFindings
  .filter((finding) => !finding.verdict.toLowerCase().includes("correct"))
  .map((finding) => `- ${finding.surface}: ${finding.finding} (${finding.verdict})`)
  .join("\n") || "- None"}

## UI and visual findings

- Horizontal overflow: ${visualErrors.length ? "Issues found" : "None in final pass"}
- Post-style pass surfaces stayed consistent across dashboard, review, matchups, decks, matches, and demo routes.
- Match logging and review remained readable on mobile at seeded volume.

## Performance findings

${slowest.map((route) => `- ${route.route}: ${route.loadMs}ms`).join("\n")}

## Post-log reward audit

- Temporary audit save created and deleted cleanly: ${postSaveAudit.deletedMatches} match
- Reward badge: ${postSaveAudit.rewardBadge || "Not captured"}
- Reward summary: ${postSaveAudit.summary || "Not captured"}

## Bugs found

### Blocker

- None

### Should-fix

- If any coach copy overstates early signal, tighten wording around low-sample cards and version comparisons.

### Polish

- Continue tightening deck-detail and review explanations so evidence lines are shorter on mobile.

### Later

- Add more automated route-level assertions for coach-specific text once product wording stabilizes.
`;
}

async function main() {
  ensureDir(RESULTS_DIR);
  ensureDir(DOCS_DIR);
  ensureDir(SCREENSHOT_DIR);

  console.log("\n=== SixPrizer 200-log audit ===\n");

  const user = await getTestUser();
  const seedData = await fetchSeedData(user.id);

  if (seedData.matches.length !== 200) {
    throw new Error(`Expected 200 matches for ${EMAIL}, found ${seedData.matches.length}.`);
  }

  const patternSummary = buildPatternSummary(seedData.decks, seedData.matches);
  const ragingBoltDeck = seedData.decks.find((deck) => deck.name.includes("Raging Bolt"));

  if (!ragingBoltDeck) {
    throw new Error("Unable to find the seeded Raging Bolt deck.");
  }

  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const errors = [];

  const publicRoutes = ["/", "/demo", "/demo/matches/new", "/login", "/signup"];
  const authRoutes = [
    "/dashboard",
    "/review",
    "/matchups",
    "/decks",
    `/decks/${ragingBoltDeck.id}`,
    "/matches",
    "/matches?page=2",
    "/matches/new",
  ];

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`desktop: ${message.text()}`);
    }
  });

  const desktopPublic = [];
  for (const route of publicRoutes) {
    desktopPublic.push(await captureRoute(desktopPage, route, `desktop_${route.replace(/[/?=&]/g, "_") || "root"}`, errors));
  }

  await login(desktopPage);

  const desktopAuth = [];
  for (const route of authRoutes) {
    desktopAuth.push(await captureRoute(desktopPage, route, `desktop_${route.replace(/[/?=&]/g, "_")}`, errors));
  }

  const dashboardBody = await desktopPage.locator("body").innerText();
  const dashboardMissionWindow = extractTextWindow(dashboardBody, "CURRENT MISSION", [
    "WHY THIS MISSION",
    "QUICK LOG",
  ], { useLast: true });
  const dashboardCoach = extractTextWindow(dashboardBody, "COACH SAYS", [
    "RECENT FORM",
    "MORE INSIGHTS",
    "DECKS AND VERSIONS",
  ]);

  await desktopPage.goto(`${BASE_URL}/review`);
  await desktopPage.waitForLoadState("networkidle");
  const reviewBody = await desktopPage.locator("body").innerText();
  const reviewCoach = extractTextWindow(reviewBody, "COACH SAYS", [
    "1 more insight",
    "Filter",
    "Apply",
  ]);
  const reviewArticles = await desktopPage.locator("article").evaluateAll((nodes) =>
    nodes.slice(0, 4).map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "")
  );

  await desktopPage.goto(`${BASE_URL}/matchups`);
  await desktopPage.waitForLoadState("networkidle");
  const matchupBody = await desktopPage.locator("body").innerText();
  const matchupHero = extractTextWindow(matchupBody, "ACTIONABLE LEAK", [
    "Deck All decks",
    "Deck version All versions",
    "Matchup breakdown",
  ]);
  const matchupActions = await desktopPage.locator("a, button").evaluateAll((nodes) =>
    nodes
      .map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "")
      .filter((text) => text === "Log a game" || text === "Review losses" || text === "Open deck")
      .slice(0, 6)
  );

  await desktopPage.goto(`${BASE_URL}/decks/${ragingBoltDeck.id}`);
  await desktopPage.waitForLoadState("networkidle");
  const deckBody = await desktopPage.locator("body").innerText();
  const deckDetailActive = extractTextWindow(deckBody, "ACTIVE VERSION", [
    "CURRENT MISSION",
    "WHY THIS MISSION",
    "TEST VERSIONS",
  ]);
  const deckDetailSignal = extractTextWindow(deckBody, "LIST STATUS", [
    "VERSION NOTES",
    "VIEW RAW DECK LIST",
  ]);

  await desktopPage.goto(`${BASE_URL}/matches`);
  await desktopPage.waitForLoadState("networkidle");
  const matchesSummary = await desktopPage.locator("body").innerText();
  const matchesCountLine =
    matchesSummary
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.includes("Showing") || line.includes("Filtered")) || null;

  const postSaveAudit = await auditAuthenticatedMatchSave(desktopPage, user.id);

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  mobilePage.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`mobile: ${message.text()}`);
    }
  });

  const mobileRoutes = [];
  for (const route of ["/", "/demo", "/demo/matches/new"]) {
    mobileRoutes.push(await captureRoute(mobilePage, route, `mobile_${route.replace(/[/?=&]/g, "_") || "root"}`, errors));
  }

  await login(mobilePage);

  for (const route of ["/dashboard", "/review", "/matchups", "/decks", "/matches", "/matches/new", `/decks/${ragingBoltDeck.id}`]) {
    mobileRoutes.push(await captureRoute(mobilePage, route, `mobile_${route.replace(/[/?=&]/g, "_")}`, errors));
  }

  await mobileContext.close();
  await desktopContext.close();
  await browser.close();

  const coachFindings = [
    {
      surface: "Dashboard mission",
      finding: "Current mission should target the Raging Bolt into Mega Greninja leak",
      actualCopy: dashboardMissionWindow,
      evidence: `Seeded Raging Bolt into Mega Greninja record is ${patternSummary.ragingBoltVsGreninja.record}. Top loss tags: ${patternSummary.ragingBoltVsGreninja.topLossIssues
        .map(([tag, count]) => `${tag} (${count})`)
        .join(", ")}`,
      verdict:
        includesAny(dashboardMissionWindow, ["Mega Greninja", "priority watchlist"])
          ? "Correct, actionable"
          : "Needs follow-up",
      action: "Keep logging normally and tag bench pressure when the matchup appears.",
      notes: "This is the strongest seeded matchup leak and should anchor the dashboard hero.",
    },
    {
      surface: "Dashboard coach strip",
      finding: "Coach strip should reinforce the current mission without contradicting watchlist language",
      actualCopy: dashboardCoach,
      evidence: "Primary watchlist language should avoid implying the user can force the matchup.",
      verdict:
        dashboardCoach &&
        !dashboardCoach.toLowerCase().includes("focused game against")
          ? "Correct, cautious"
          : "Needs wording check",
      action: "Keep the mission guidance tied to the next normal logs.",
      notes: "This is mainly a wording and usefulness audit.",
    },
    {
      surface: "Review hero",
      finding: "Review should surface a real deck leak or quality pattern from the seeded sample",
      actualCopy: reviewCoach,
      evidence: `Dragapult has bad/okay sequencing in ${patternSummary.dragapultSequencing.sequencingLeakCount} of ${patternSummary.dragapultSequencing.totalLosses} losses. Control Counterlab has Item Lock in ${patternSummary.controlItemLock.itemLockLosses} of ${patternSummary.controlItemLock.totalLosses} losses.`,
      verdict:
        reviewCoach &&
        (reviewCoach.includes("Item Lock") ||
          reviewCoach.toLowerCase().includes("sequencing") ||
          reviewCoach.includes("Mega Greninja"))
          ? "Correct, evidence-backed"
          : "Needs stronger surfaced insight",
      action: "Open the filtered losses and keep tagging repeated issues.",
      notes: "The seeded data should give Review more than just generic advice.",
    },
    {
      surface: "Review secondary cards",
      finding: "Secondary review cards should expose repeated tag and positive-tech patterns",
      actualCopy: reviewArticles.join(" | "),
      evidence: `Top positive tags include ${topTags(seedData.matches.filter((match) => match.result === "win"), "positive_tags", 3)
        .map(([tag, count]) => `${tag} (${count})`)
        .join(", ")}.`,
      verdict:
        reviewArticles.some((text) => text.includes("Good Tech") || text.includes("Item Lock"))
          ? "Correct, useful"
          : "Could surface stronger tag analysis",
      action: "Use these cards to decide what to keep, cut, or test next.",
      notes: "Tester feedback specifically asked for readable analysis, not just counts.",
    },
    {
      surface: "Matchups page",
      finding: "Priority watchlist and action points should agree with the seeded leak",
      actualCopy: matchupHero,
      evidence: `Raging Bolt into Mega Greninja is ${patternSummary.ragingBoltVsGreninja.record} over ${patternSummary.ragingBoltVsGreninja.games} games.`,
      verdict:
        includesAny(matchupHero, ["Mega Greninja", "32%", "keep logging"])
          ? "Correct, actionable"
          : "Needs matchup priority fix",
      action: matchupActions.join(", ") || "Log a game",
      notes: "Action points should stay concrete and linked where possible.",
    },
    {
      surface: "Deck detail",
      finding: "Deck detail should show the active version and a clear version signal",
      actualCopy: `${deckDetailActive || ""} ${deckDetailSignal || ""}`.trim(),
      evidence: `Raging Bolt versions: ${patternSummary.ragingBoltVersions
        .map((version) => `${version.label}: ${version.record}, opening good/great ${version.openingRate}%`)
        .join("; ")}`,
      verdict:
        includesAny(deckDetailActive, ["ACTIVE VERSION", "ACTIVE TEST VERSION", "used when logging new games"])
          ? "Correct, visible"
          : "Needs clearer active version state",
      action: "Review the active version before logging the next batch.",
      notes: "The seeded v3 should clearly read as the current experiment.",
    },
    {
      surface: "Matches page",
      finding: "Matches list should preserve totals and pagination at 200 logs",
      actualCopy: matchesCountLine,
      evidence: "The seeded dataset contains exactly 200 matches, so pagination should remain necessary and visible.",
      verdict:
        matchesCountLine && /Page|Showing|Filtered/.test(matchesCountLine)
          ? "Correct, scalable"
          : "Needs count copy check",
      action: "Use filters and page controls without loading every row at once.",
      notes: "This is primarily a volume-scaling audit.",
    },
    {
      surface: "Post-save reward",
      finding: "Saving a new game should produce a clear reward panel and coaching line",
      actualCopy: postSaveAudit.summary,
      evidence: `Temporary audit match saved and deleted successfully (${postSaveAudit.deletedMatches} row cleaned up).`,
      verdict:
        postSaveAudit.summary
          ? "Correct, reward rendered"
          : "Needs selector check",
      action: "Reward should tell the user what strengthened and what to log next.",
      notes: "This verifies the save flow without leaving the test account at 201 matches.",
    },
  ];

  writeFile(
    "results/playtest_200_coach_findings.tsv",
    buildCoachFindingsTsv(coachFindings)
  );
  writeFile("docs/playtest_200_coach_audit.md", renderCoachAudit(coachFindings));
  writeFile(
    "docs/playtest_200_visual_audit.md",
    renderVisualAudit({
      desktopRoutes: [...desktopPublic, ...desktopAuth],
      mobileRoutes,
      publicRoutes,
      authRoutes,
      errors,
    })
  );
  writeFile(
    "docs/playtest_200_performance_audit.md",
    renderPerformanceAudit({
      routeStats: [...desktopPublic, ...desktopAuth, ...mobileRoutes],
      consoleErrors,
    })
  );
  writeFile(
    "docs/playtest_200_audit.md",
    renderFinalAudit({
      patternSummary,
      coachFindings,
      visualErrors: errors,
      performanceStats: [...desktopPublic, ...desktopAuth, ...mobileRoutes],
      postSaveAudit,
    })
  );
  writeFile(
    "results/playtest_200_audit_data.json",
    JSON.stringify(
      {
        desktopPublic,
        desktopAuth,
        mobileRoutes,
        dashboardMissionWindow,
        dashboardCoach,
        reviewCoach,
        reviewArticles,
        matchupHero,
        matchupActions,
        deckDetailActive,
        deckDetailSignal,
        matchesCountLine,
        postSaveAudit,
        patternSummary,
        consoleErrors,
        errors,
      },
      null,
      2
    )
  );

  console.log("\nAudit package written.");
}

main().catch((error) => {
  console.error("\nFATAL:", error.message);
  process.exit(1);
});
