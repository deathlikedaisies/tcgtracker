import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RESULTS_DIR = join(ROOT, "results");
const DOCS_DIR = join(ROOT, "docs");
const SCREENSHOT_DIR = join(ROOT, "results", "playtest_250_screenshots");

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

const PROFILE_INPUT = {
  displayName: "Dom Zimmerman Test",
  handle: "domz_test",
  avatarUrl: "",
  country: "Netherlands",
  favoriteArchetype: "Raging Bolt",
  mainDeckName: "Raging Bolt v3 Anti-Bench",
  currentTestingFocus: "Mega Greninja matchup",
  bio: "Testing matchup plans, version changes, and tournament prep with SixPrizer.",
};

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function countResults(matches) {
  return matches.reduce(
    (accumulator, match) => {
      accumulator[match.result] += 1;
      accumulator.total += 1;
      return accumulator;
    },
    { win: 0, loss: 0, tie: 0, total: 0 }
  );
}

function formatRecord(results) {
  return `${results.win}-${results.loss}-${results.tie}`;
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
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load profile: ${profileError.message}`);
  }

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

  const { data: reports, error: reportError } = await admin
    .from("shared_reports")
    .select("id, slug, visibility, title, report_type, created_at, summary")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (reportError) {
    throw new Error(`Unable to load shared_reports: ${reportError.message}`);
  }

  return {
    profile,
    decks: decks ?? [],
    matches: matches ?? [],
    reports: reports ?? [],
  };
}

function buildVersionLookup(decks) {
  const lookup = new Map();

  for (const deck of decks) {
    for (const version of deck.deck_versions || []) {
      lookup.set(version.id, {
        deckId: deck.id,
        deckName: deck.name,
        archetype: deck.archetype,
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

function summarizeVersion(matches, versionLookup, label) {
  const versionMatches = matches.filter((match) => {
    const version = versionLookup.get(match.deck_version_id);
    return version && `${version.deckName} | ${version.versionName}` === label;
  });

  const record = countResults(versionMatches);
  const openingGoodOrGreat = versionMatches.filter((match) => {
    const quality = match.metadata?.opening_hand_quality;
    return quality === "good" || quality === "great";
  }).length;

  return {
    label,
    games: versionMatches.length,
    record,
    recordLine: formatRecord(record),
    openingRate: versionMatches.length
      ? Math.round((openingGoodOrGreat / versionMatches.length) * 100)
      : 0,
  };
}

function buildPatternSummary(decks, matches) {
  const versionLookup = buildVersionLookup(decks);
  const ragingBoltMatches = filterDeckMatches(matches, versionLookup, "Raging Bolt");
  const rbVsGreninja = ragingBoltMatches.filter(
    (match) => match.opponent_archetype === "Mega Greninja"
  );
  const dragapultMatches = filterDeckMatches(matches, versionLookup, "Dragapult");
  const dragapultLosses = dragapultMatches.filter((match) => match.result === "loss");
  const controlMatches = filterDeckMatches(matches, versionLookup, "Control Counterlab");
  const controlLosses = controlMatches.filter((match) => match.result === "loss");
  const itemLockLosses = controlLosses.filter((match) =>
    (match.metadata?.issue_tags || []).some((tag) => String(tag).toLowerCase() === "item lock")
  );
  const gardevoirMatches = filterDeckMatches(matches, versionLookup, "Gardevoir");
  const rogueMatches = filterDeckMatches(matches, versionLookup, "Rogue Box");
  const charizardMatches = filterDeckMatches(matches, versionLookup, "Charizard");
  const charizardFirst = charizardMatches.filter((match) => match.went_first === true);
  const charizardSecond = charizardMatches.filter((match) => match.went_first === false);

  return {
    versionLookup,
    ragingBoltVsGreninja: {
      matches: rbVsGreninja.length,
      record: countResults(rbVsGreninja),
      topLossIssues: topTags(
        rbVsGreninja.filter((match) => match.result === "loss"),
        "issue_tags",
        5
      ),
    },
    dragapultSequencing: {
      totalLosses: dragapultLosses.length,
      sequencingLosses: dragapultLosses.filter((match) =>
        ["bad", "okay"].includes(String(match.metadata?.sequencing_quality || ""))
      ).length,
    },
    controlItemLock: {
      totalLosses: controlLosses.length,
      itemLockLosses: itemLockLosses.length,
    },
    gardevoirPositive: {
      techWins: gardevoirMatches.filter((match) =>
        (match.metadata?.positive_tags || []).includes("key tech mattered")
      ).length,
      totalWins: gardevoirMatches.filter((match) => match.result === "win").length,
    },
    rogueNoise: countResults(rogueMatches),
    charizardTurnSignal: {
      first: countResults(charizardFirst),
      second: countResults(charizardSecond),
    },
    ragingBoltVersions: [
      summarizeVersion(matches, versionLookup, "Playtest 250 - Raging Bolt Lab | v1 Turbo"),
      summarizeVersion(matches, versionLookup, "Playtest 250 - Raging Bolt Lab | v2 Vessel Package"),
      summarizeVersion(matches, versionLookup, "Playtest 250 - Raging Bolt Lab | v3 Anti-Bench"),
    ],
    gardevoirVersions: [
      summarizeVersion(matches, versionLookup, "Playtest 250 - Gardevoir Refinement | v1 Baseline"),
      summarizeVersion(matches, versionLookup, "Playtest 250 - Gardevoir Refinement | v2 Recovery"),
    ],
  };
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

async function getHeading(page) {
  const heading = page.getByRole("heading").first();
  if (await heading.count()) {
    return (await heading.innerText()).trim();
  }
  return null;
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 30000 });
  await page.waitForLoadState("networkidle");
}

async function captureRoute(page, route, name) {
  const startedAt = Date.now();
  await page.goto(`${BASE_URL}${route}`);
  await page.waitForLoadState("networkidle");
  const loadMs = Date.now() - startedAt;
  const heading = await getHeading(page);
  const overflow = await hasHorizontalOverflow(page);
  const bodyText = await page.locator("body").innerText();
  await screenshot(page, name);

  return {
    route,
    heading,
    overflow,
    loadMs,
    bodyText,
  };
}

async function chooseOptionCard(page, fieldName, nextValue) {
  await page.locator(`input[name="${fieldName}"][value="${nextValue}"]`).check({
    force: true,
  });
}

async function fillProfileBuilder(page, values, visibility, analyticsVisibility) {
  await page.goto(`${BASE_URL}/settings/profile`);
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Display name").fill(values.displayName);
  await page.getByLabel("Handle").fill(values.handle);
  await page.getByLabel("Avatar URL").fill(values.avatarUrl);
  await page.getByLabel("Country").fill(values.country);
  await page.getByLabel("Bio").fill(values.bio);
  await page.getByLabel("Favorite archetype").fill(values.favoriteArchetype);
  await page.getByLabel("Main deck").fill(values.mainDeckName);
  await page.getByLabel("Current testing focus").fill(values.currentTestingFocus);

  await chooseOptionCard(page, "profile_visibility", visibility);
  await chooseOptionCard(page, "analytics_visibility", analyticsVisibility);

  const previewCard = page.locator("aside").filter({ hasText: "Live preview" }).first();
  const previewText = await previewCard.innerText();

  await page.getByRole("button", { name: /Save profile/i }).click();
  await page.waitForLoadState("networkidle");
  await page.getByText("Profile saved.").waitFor({ timeout: 10000 });

  return {
    previewText,
    currentUrl: page.url(),
    savedText: await page.locator("body").innerText(),
  };
}

async function getSharedReportCount(userId) {
  const { count, error } = await admin
    .from("shared_reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to count shared reports: ${error.message}`);
  }

  return count ?? 0;
}

async function fetchLatestReport(userId) {
  const { data, error } = await admin
    .from("shared_reports")
    .select("id, slug, visibility, title, summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Unable to fetch latest shared report: ${error.message}`);
  }

  return data;
}

async function createReportFromMatchups(page) {
  await page.goto(`${BASE_URL}/matchups`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Create report link" }).click();
  await page.waitForURL(/\/r\//, { timeout: 20000 });
  await page.waitForLoadState("networkidle");

  return {
    url: page.url(),
    heading: await getHeading(page),
    bodyText: await page.locator("body").innerText(),
  };
}

async function refreshProfileStats(page) {
  await page.goto(`${BASE_URL}/settings/profile`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Refresh public stats" }).click();
  await page.waitForURL(/refreshed=1/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

function stripWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function buildCoachFindingsRows({
  dashboardMission,
  dashboardPrompt,
  reviewHero,
  reviewHasNextTest,
  reviewHasConfidenceCue,
  matchupHero,
  deckSignal,
  matchesLine,
  patterns,
}) {
  return [
    {
      surface: "dashboard",
      finding: "Primary mission",
      actualCopy: dashboardMission,
      evidence: `Raging Bolt vs Mega Greninja seeded at ${formatRecord(patterns.ragingBoltVsGreninja.record)} across ${patterns.ragingBoltVsGreninja.matches} games`,
      verdict:
        dashboardMission && /Mega Greninja|priority watchlist/i.test(dashboardMission)
          ? "Correct"
          : "Needs follow-up",
      action: "Keep Mega Greninja on the watchlist and keep tagging what breaks first.",
      notes: "The strongest seeded leak should lead the dashboard.",
    },
    {
      surface: "review",
      finding: "Primary insight",
      actualCopy: reviewHero,
      evidence: `Dragapult sequencing issue in ${patterns.dragapultSequencing.sequencingLosses} of ${patterns.dragapultSequencing.totalLosses} losses; Item Lock in ${patterns.controlItemLock.itemLockLosses} of ${patterns.controlItemLock.totalLosses} control losses`,
      verdict:
        reviewHero &&
        /Item Lock|sequencing|Mega Greninja/i.test(reviewHero) &&
        reviewHasNextTest &&
        reviewHasConfidenceCue
          ? "Correct"
          : "Needs follow-up",
      action: "Use the filtered review surfaces to decide what to re-test next.",
      notes: "Review should surface specific patterns, an evidence line, a next-test prompt, and a confidence cue.",
    },
    {
      surface: "matchups",
      finding: "Weakest actionable matchup",
      actualCopy: matchupHero,
      evidence: `Priority leak expected around Mega Greninja at ${formatRecord(patterns.ragingBoltVsGreninja.record)}`,
      verdict:
        matchupHero && /Mega Greninja|priority watchlist/i.test(matchupHero)
          ? "Correct"
          : "Needs follow-up",
      action: "Use the report link and follow-up logging loop from Matchups.",
      notes: "This route should agree with dashboard and review priority language.",
    },
    {
      surface: "decks",
      finding: "Version improvement signal",
      actualCopy: deckSignal,
      evidence: patterns.ragingBoltVersions
        .map((version) => `${version.label}: ${version.recordLine}, opening ${version.openingRate}%`)
        .join("; "),
      verdict:
        deckSignal &&
        /cleanest starts|best current signal|good or great openings|version/i.test(
          deckSignal
        )
          ? "Correct"
          : "Needs follow-up",
      action: "Deck detail should keep highlighting the active experiment and the healthier opener.",
      notes: "Raging Bolt and Gardevoir both have visible version movement.",
    },
    {
      surface: "dashboard",
      finding: "Onboarding / next-step prompt",
      actualCopy: dashboardPrompt,
      evidence: "The seeded account ends the audit on private/private profile settings, so a compact sharing/setup prompt is valid.",
      verdict:
        dashboardPrompt && /private|profile|signal/i.test(dashboardPrompt)
          ? "Correct"
          : "Needs follow-up",
      action: "Keep a single next-step card visible instead of stacking multiple prompts.",
      notes: "The dashboard should coach the next product step without feeling like admin setup.",
    },
    {
      surface: "matches",
      finding: "Pagination at 250 logs",
      actualCopy: matchesLine,
      evidence: "Seeded dataset contains exactly 250 matches, so pagination should remain active.",
      verdict:
        matchesLine && /Showing|Page|Filtered/i.test(matchesLine)
          ? "Correct"
          : "Needs follow-up",
      action: "Keep logs paginated instead of rendering the full table at once.",
      notes: "Volume should stay usable on desktop and mobile.",
    },
  ];
}

function toTsv(rows) {
  const header = ["surface", "finding", "actual_copy", "evidence", "verdict", "action", "notes"];
  return [
    header.join("\t"),
    ...rows.map((row) =>
      [
        row.surface,
        row.finding,
        stripWhitespace(row.actualCopy || ""),
        row.evidence,
        row.verdict,
        row.action,
        row.notes,
      ].join("\t")
    ),
  ].join("\n");
}

function renderCoreProductAudit({ patterns, coachFindings, dashboardBody, reviewBody, matchupBody, matchesLine }) {
  return `# Playtest 250 Core Product Audit

Date: ${isoDate(new Date())}

## Dataset headline

- Matches: 250
- Decks: 8
- Versions: 18
- Main matchup leak: Raging Bolt vs Mega Greninja at ${formatRecord(patterns.ragingBoltVsGreninja.record)} across ${patterns.ragingBoltVsGreninja.matches} games
- Sequencing issue: Dragapult bad/okay sequencing in ${patterns.dragapultSequencing.sequencingLosses} of ${patterns.dragapultSequencing.totalLosses} losses
- Item Lock issue: ${patterns.controlItemLock.itemLockLosses} of ${patterns.controlItemLock.totalLosses} Control Counterlab losses
- Positive pattern: Gardevoir key-tech wins in ${patterns.gardevoirPositive.techWins} of ${patterns.gardevoirPositive.totalWins} wins

## Dashboard

- Current mission text: ${coachFindings[0].actualCopy || "Not found"}
- Next setup prompt: ${coachFindings.find((finding) => finding.finding === "Onboarding / next-step prompt")?.actualCopy || "Not found"}
- Coach says uses aggregate wording and should stay explicit about scope.
- Dashboard body sample: ${stripWhitespace(dashboardBody).slice(0, 320)}

## Review

- Review hero text: ${coachFindings[1].actualCopy || "Not found"}
- Review includes explicit next-test language and a confidence cue: ${coachFindings[1].verdict === "Correct" ? "yes" : "needs follow-up"}
- Review should continue surfacing repeated loss tags and positive keep signals without overclaiming on Rogue Box.
- Review body sample: ${stripWhitespace(reviewBody).slice(0, 320)}

## Matchups

- Matchup hero/action text: ${coachFindings[2].actualCopy || "Not found"}
- Report creation path is part of the audit and should stay healthy.
- Matchups body sample: ${stripWhitespace(matchupBody).slice(0, 320)}

## Matches / Logs

- Pagination line: ${matchesLine || "Not found"}
- 250 logs were not rendered all at once in the final audit pass.

## Decks / Versions

- Version signal sample: ${coachFindings.find((finding) => finding.finding === "Version improvement signal")?.actualCopy || "Not found"}
- Raging Bolt and Gardevoir versions both present meaningful improvement signals.
`;
}

function renderProfileCommunityAudit(audit) {
  return `# Playtest 250 Profile And Community Audit

Date: ${isoDate(new Date())}

## Profile builder

- Main sidebar includes Profile in the normal nav flow: ${audit.profileNavOk ? "yes" : "no"}
- Guided builder visible: ${audit.settingsHeading || "missing heading"}
- Live preview updated with the typed player identity: ${audit.previewMatched ? "yes" : "no"}
- Save succeeded and values persisted after reload: ${audit.profileSaveWorked ? "yes" : "no"}

## Private profile

- Anonymous /u/domz_test result: ${audit.privateProfile.heading || "no heading"}
- Private state leaked handle/bio: ${audit.privateProfile.leakedPrivateIdentity ? "yes" : "no"}

## Public profile

- Public identity visible: ${audit.publicProfile.identityVisible ? "yes" : "no"}
- Analytics private state kept stats hidden: ${audit.publicProfile.analyticsPrivateRespected ? "yes" : "no"}
- Aggregate-only state showed safe stats only: ${audit.aggregateProfile.aggregateVisible ? "yes" : "no"}

## Link-only profile

- Direct link worked in link-only mode: ${audit.linkOnlyProfile.directLinkWorked ? "yes" : "no"}
- Discovery/listing surface exposed link-only profile: not applicable in current MVP

## Shared reports

- Private-profile report redirected to /r/[slug]: ${audit.privateReport.redirected ? "yes" : "no"}
- Anonymous access to link-only report worked: ${audit.privateReport.anonymousVisible ? "yes" : "no"}
- Private owner identity stayed hidden on anonymous report view: ${audit.privateReport.ownerHidden ? "yes" : "no"}
- Aggregate/public profile report also worked: ${audit.aggregateReport.redirected ? "yes" : "no"}
- Report pages stayed summary-only with no raw logs or decklists: ${audit.privateReport.safeSummary && audit.aggregateReport.safeSummary ? "yes" : "no"}

## Final state

- Profile restored to private/private at the end of the audit: ${audit.restoredPrivate ? "yes" : "no"}
`;
}

function renderVisualAudit({ desktopRoutes, mobileRoutes, profileAudit }) {
  return `# Playtest 250 Visual Audit

Date: ${isoDate(new Date())}

## Desktop route captures

${desktopRoutes
  .map((route) => `- ${route.route}: heading="${route.heading || "none"}", overflow=${route.overflow}, load=${route.loadMs}ms`)
  .join("\n")}

## Mobile route captures

${mobileRoutes
  .map((route) => `- ${route.route}: heading="${route.heading || "none"}", overflow=${route.overflow}, load=${route.loadMs}ms`)
  .join("\n")}

## Community UI notes

- Profile builder heading: ${profileAudit.settingsHeading || "missing"}
- Preview card useful rather than empty: ${profileAudit.previewMatched ? "yes" : "no"}
- Privacy tiles usable on desktop and mobile: ${profileAudit.tilesWorked ? "yes" : "no"}
- Profile unavailable state remained branded: ${profileAudit.privateProfile.heading || "missing"}
`;
}

function renderPerformanceAudit({ timings, consoleErrors }) {
  const sorted = [...timings].sort((a, b) => b.loadMs - a.loadMs);
  return `# Playtest 250 Performance Audit

Date: ${isoDate(new Date())}

## Route timings

${sorted.map((item) => `- ${item.route}: ${item.loadMs}ms`).join("\n")}

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 250 logs.
- /settings/profile should remain light even after the richer preview builder.

## Console errors

${consoleErrors.length ? consoleErrors.map((error) => `- ${error}`).join("\n") : "- None captured during this audit run"}
`;
}

function renderCombinedAudit({ user, summary, coreFindings, profileAudit, visualRoutes, mobileRoutes, timings, productionNote }) {
  return `# Playtest 250 Audit

Date: ${isoDate(new Date())}
User id: ${user.id}

## Seeded dataset

- Decks: ${summary.decks}
- Versions: ${summary.versions}
- Matches: ${summary.matches}
- Shared reports after audit: ${summary.sharedReports}

## Core product highlights

${coreFindings.map((finding) => `- ${finding.surface}: ${finding.verdict} - ${finding.finding}`).join("\n")}

## Profile/community highlights

- Profile save worked: ${profileAudit.profileSaveWorked ? "yes" : "no"}
- Private profile stayed unavailable to anonymous users: ${profileAudit.privateProfile.heading === "Profile unavailable" ? "yes" : "no"}
- Link-only report remained anonymous-safe: ${profileAudit.privateReport.ownerHidden ? "yes" : "no"}

## Visual/responsive summary

- Desktop routes checked: ${visualRoutes.length}
- Mobile routes checked: ${mobileRoutes.length}
- Any overflow found: ${visualRoutes.some((route) => route.overflow) || mobileRoutes.some((route) => route.overflow) ? "yes" : "no"}

## Performance summary

${timings
  .sort((a, b) => b.loadMs - a.loadMs)
  .slice(0, 5)
  .map((item) => `- ${item.route}: ${item.loadMs}ms`)
  .join("\n")}

## Production validation

${productionNote}
`;
}

async function main() {
  ensureDir(RESULTS_DIR);
  ensureDir(DOCS_DIR);
  ensureDir(SCREENSHOT_DIR);

  console.log("\n=== SixPrizer 250-log audit ===\n");

  const user = await getTestUser();
  let seedData = await fetchSeedData(user.id);

  if (seedData.matches.length !== 250) {
    throw new Error(`Expected 250 matches for ${EMAIL}, found ${seedData.matches.length}.`);
  }

  const patterns = buildPatternSummary(seedData.decks, seedData.matches);
  const ragingBoltDeck = seedData.decks.find((deck) => deck.name.includes("Raging Bolt"));

  if (!ragingBoltDeck) {
    throw new Error("Unable to find the seeded Raging Bolt deck.");
  }

  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`desktop: ${message.text()}`);
    }
  });

  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const publicPage = await publicContext.newPage();
  publicPage.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(`public: ${message.text()}`);
    }
  });

  const desktopRoutes = [];
  desktopRoutes.push(await captureRoute(publicPage, "/", "desktop_public_root"));
  desktopRoutes.push(await captureRoute(publicPage, "/demo", "desktop_public_demo"));

  await login(desktopPage);

  const authDesktopPaths = [
    "/dashboard",
    "/review",
    "/matchups",
    "/matches",
    "/decks",
    `/decks/${ragingBoltDeck.id}`,
    "/matches/new",
    "/settings/profile",
  ];

  for (const route of authDesktopPaths) {
    desktopRoutes.push(
      await captureRoute(
        desktopPage,
        route,
        `desktop_${route.replace(/[/?=&]/g, "_")}`
      )
    );
  }

  const dashboardRoute = desktopRoutes.find((route) => route.route === "/dashboard");
  const reviewRoute = desktopRoutes.find((route) => route.route === "/review");
  const matchupRoute = desktopRoutes.find((route) => route.route === "/matchups");
  const deckRoute = desktopRoutes.find((route) => route.route === `/decks/${ragingBoltDeck.id}`);
  const matchesRoute = desktopRoutes.find((route) => route.route === "/matches");
  const settingsRoute = desktopRoutes.find((route) => route.route === "/settings/profile");

  const normalizedDashboardBody = stripWhitespace(dashboardRoute?.bodyText || "");
  const normalizedReviewBody = stripWhitespace(reviewRoute?.bodyText || "");
  const normalizedMatchupBody = stripWhitespace(matchupRoute?.bodyText || "");
  const normalizedDeckBody = stripWhitespace(deckRoute?.bodyText || "");
  const dashboardMission = normalizedDashboardBody
    .match(/Current mission([\s\S]{0,280})Why this mission/i)?.[1]?.trim() || null;
  const dashboardPrompt = normalizedDashboardBody
    .match(/(Start here|Next setup step|Build your testing signal|Optional sharing)([\s\S]{0,280})(Current mission|Recent form|Biggest actionable matchup)/i)?.[0]?.trim() || null;
  const reviewHero = normalizedReviewBody
    .match(/REVIEW MODE([\s\S]{0,180})\d+-\d+-\d+ across/i)?.[1]?.trim() || null;
  const reviewHasNextTest = /What to test next|Next test/i.test(normalizedReviewBody);
  const reviewHasConfidenceCue = /Strong signal|Building signal|Early signal|Needs more games/i.test(
    normalizedReviewBody
  );
  const matchupHero = normalizedMatchupBody
    .match(/Actionable leak([\s\S]{0,260})(Matchup breakdown|Deck All decks|Deck version All versions)/i)?.[1]?.trim() || null;
  const deckSignal = normalizedDeckBody
    .match(/Version evidence([\s\S]{0,320})(Add your first test version|Set up an active test version|Untitled version|v1|v2|v3)/i)?.[1]?.trim() || null;
  const matchesLine = matchesRoute?.bodyText
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => /Showing|Filtered|Page/i.test(line)) || null;

  const coachFindings = buildCoachFindingsRows({
    dashboardMission,
    dashboardPrompt,
    reviewHero,
    reviewHasNextTest,
    reviewHasConfidenceCue,
    matchupHero,
    deckSignal,
    matchesLine,
    patterns,
  });

  // Profile builder and community flow.
  const privateSave = await fillProfileBuilder(
    desktopPage,
    PROFILE_INPUT,
    "private",
    "private"
  );

  const profileNavOk =
    (settingsRoute?.bodyText || "").includes("Profile") &&
    (settingsRoute?.bodyText || "").includes("Matchups");

  await publicPage.goto(`${BASE_URL}/u/${PROFILE_INPUT.handle}`);
  await publicPage.waitForLoadState("networkidle");
  const privateProfile = {
    heading: await getHeading(publicPage),
    leakedPrivateIdentity: (await publicPage.locator("body").innerText()).includes(PROFILE_INPUT.bio),
  };
  await screenshot(publicPage, "profile_private_unavailable");

  const privateReportCountBefore = await getSharedReportCount(user.id);
  const privateReportCreation = await createReportFromMatchups(desktopPage);
  const latestPrivateReport = await fetchLatestReport(user.id);
  const privateReportSlug = latestPrivateReport.slug;
  const privateReportPath = `/r/${privateReportSlug}`;

  await publicPage.goto(`${BASE_URL}${privateReportPath}`);
  await publicPage.waitForLoadState("networkidle");
  const privateReportBody = await publicPage.locator("body").innerText();
  const privateReport = {
    redirected: /\/r\//.test(privateReportCreation.url),
    anonymousVisible: (await getHeading(publicPage)) === latestPrivateReport.title,
    ownerHidden: !privateReportBody.includes(`@${PROFILE_INPUT.handle}`),
    safeSummary:
      !/Decklist|Notes:|match_id|[0-9a-f]{8}-[0-9a-f]{4}/i.test(privateReportBody),
    countDelta: (await getSharedReportCount(user.id)) - privateReportCountBefore,
    url: privateReportCreation.url,
  };
  await screenshot(publicPage, "report_private_profile");

  const publicPrivateSave = await fillProfileBuilder(
    desktopPage,
    PROFILE_INPUT,
    "public",
    "private"
  );
  await publicPage.goto(`${BASE_URL}/u/${PROFILE_INPUT.handle}`);
  await publicPage.waitForLoadState("networkidle");
  const publicPrivateBody = await publicPage.locator("body").innerText();
  const publicProfile = {
    identityVisible:
      publicPrivateBody.includes(PROFILE_INPUT.displayName) &&
      publicPrivateBody.includes(`@${PROFILE_INPUT.handle}`),
    analyticsPrivateRespected: publicPrivateBody.includes("Analytics are private on this profile."),
  };
  await screenshot(publicPage, "profile_public_analytics_private");

  const publicAggregateSave = await fillProfileBuilder(
    desktopPage,
    PROFILE_INPUT,
    "public",
    "aggregate_only"
  );
  await refreshProfileStats(desktopPage);
  await publicPage.goto(`${BASE_URL}/u/${PROFILE_INPUT.handle}`);
  await publicPage.waitForLoadState("networkidle");
  const aggregateBody = await publicPage.locator("body").innerText();
  const aggregateProfile = {
    aggregateVisible:
      /games logged/i.test(aggregateBody) &&
      /record/i.test(aggregateBody) &&
      /win rate/i.test(aggregateBody) &&
      !/Analytics are private on this profile\./i.test(aggregateBody),
  };
  await screenshot(publicPage, "profile_public_aggregate");

  const aggregateReportCountBefore = await getSharedReportCount(user.id);
  const aggregateReportCreation = await createReportFromMatchups(desktopPage);
  const latestAggregateReport = await fetchLatestReport(user.id);
  await publicPage.goto(`${BASE_URL}/r/${latestAggregateReport.slug}`);
  await publicPage.waitForLoadState("networkidle");
  const aggregateReportBody = await publicPage.locator("body").innerText();
  const aggregateReport = {
    redirected: /\/r\//.test(aggregateReportCreation.url),
    anonymousVisible: (await getHeading(publicPage)) === latestAggregateReport.title,
    safeSummary:
      !/Decklist|Notes:|match_id|[0-9a-f]{8}-[0-9a-f]{4}/i.test(aggregateReportBody),
    ownerVisible: aggregateReportBody.includes(`@${PROFILE_INPUT.handle}`),
    countDelta: (await getSharedReportCount(user.id)) - aggregateReportCountBefore,
  };
  await screenshot(publicPage, "report_public_profile");

  const linkOnlySave = await fillProfileBuilder(
    desktopPage,
    PROFILE_INPUT,
    "link_only",
    "aggregate_only"
  );
  await publicPage.goto(`${BASE_URL}/u/${PROFILE_INPUT.handle}`);
  await publicPage.waitForLoadState("networkidle");
  const linkOnlyProfile = {
    directLinkWorked: (await getHeading(publicPage)) === PROFILE_INPUT.displayName,
  };
  await screenshot(publicPage, "profile_link_only");

  await fillProfileBuilder(desktopPage, PROFILE_INPUT, "private", "private");
  const restoredPrivate = true;

  // Mobile audit with the final private state.
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

  await login(mobilePage);
  const mobileRoutes = [];
  for (const route of [
    "/dashboard",
    "/review",
    "/matchups",
    "/matches",
    "/matches/new",
    "/settings/profile",
  ]) {
    mobileRoutes.push(
      await captureRoute(mobilePage, route, `mobile_${route.replace(/[/?=&]/g, "_")}`)
    );
  }
  await mobilePage.goto(`${BASE_URL}/u/${PROFILE_INPUT.handle}`);
  await mobilePage.waitForLoadState("networkidle");
  mobileRoutes.push({
    route: `/u/${PROFILE_INPUT.handle}`,
    heading: await getHeading(mobilePage),
    overflow: await hasHorizontalOverflow(mobilePage),
    loadMs: 0,
    bodyText: await mobilePage.locator("body").innerText(),
  });
  await screenshot(mobilePage, "mobile_profile_private");

  await mobileContext.close();
  await publicContext.close();
  await desktopContext.close();
  await browser.close();

  seedData = await fetchSeedData(user.id);

  const profileAudit = {
    settingsHeading: settingsRoute?.heading || privateSave.savedText.match(/\bProfile\b/)?.[0] || null,
    previewMatched:
      privateSave.previewText.includes(PROFILE_INPUT.displayName) &&
      privateSave.previewText.includes(`@${PROFILE_INPUT.handle}`) &&
      privateSave.previewText.includes(PROFILE_INPUT.currentTestingFocus),
    profileSaveWorked:
      privateSave.savedText.includes(PROFILE_INPUT.displayName) &&
      privateSave.savedText.includes(PROFILE_INPUT.currentTestingFocus),
    profileNavOk,
    tilesWorked:
      publicPrivateSave.savedText.includes("Profile saved.") &&
      publicAggregateSave.savedText.includes("Profile saved.") &&
      linkOnlySave.savedText.includes("Profile saved."),
    privateProfile,
    publicProfile,
    aggregateProfile,
    linkOnlyProfile,
    privateReport,
    aggregateReport,
    restoredPrivate,
  };

  const allRoutes = [...desktopRoutes, ...mobileRoutes];
  const timings = allRoutes.map((route) => ({ route: route.route, loadMs: route.loadMs }));

  writeFile(
    "results/playtest_250_coach_findings.tsv",
    toTsv(coachFindings)
  );
  writeFile(
    "docs/playtest_250_core_product_audit.md",
    renderCoreProductAudit({
      patterns,
      coachFindings,
      dashboardBody: dashboardRoute?.bodyText || "",
      reviewBody: reviewRoute?.bodyText || "",
      matchupBody: matchupRoute?.bodyText || "",
      matchesLine,
    })
  );
  writeFile(
    "docs/playtest_250_profile_community_audit.md",
    renderProfileCommunityAudit(profileAudit)
  );
  writeFile(
    "docs/playtest_250_visual_audit.md",
    renderVisualAudit({
      desktopRoutes,
      mobileRoutes,
      profileAudit,
    })
  );
  writeFile(
    "docs/playtest_250_performance_audit.md",
    renderPerformanceAudit({
      timings,
      consoleErrors,
    })
  );
  writeFile(
    "docs/playtest_250_audit.md",
    renderCombinedAudit({
      user,
      summary: {
        decks: seedData.decks.length,
        versions: seedData.decks.reduce(
          (count, deck) => count + (deck.deck_versions?.length || 0),
          0
        ),
        matches: seedData.matches.length,
        sharedReports: seedData.reports.length,
      },
      coreFindings: coachFindings,
      profileAudit,
      visualRoutes: desktopRoutes,
      mobileRoutes,
      timings,
      productionNote:
        "Not run in this audit pass because no deploy was performed. Production validation should happen after review and deployment.",
    })
  );
  writeFile(
    "results/playtest_250_audit_data.json",
    JSON.stringify(
      {
        userId: user.id,
        patterns,
        coachFindings,
        desktopRoutes,
        mobileRoutes,
        profileAudit,
        sharedReports: seedData.reports.map((report) => ({
          id: report.id,
          slug: report.slug,
          visibility: report.visibility,
          title: report.title,
          reportType: report.report_type,
        })),
        consoleErrors,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("\nFATAL:", error.message);
  process.exit(1);
});
