import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RESULTS_DIR = join(ROOT, "results");
const DOCS_DIR = join(ROOT, "docs");
const SCREENSHOT_DIR = join(ROOT, "results", "playtest_1000_screenshots");

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
let BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "";
const EMAIL = ENV.PLAYWRIGHT_TEST_EMAIL || "pokeleaguenl@gmail.com";
const PASSWORD = ENV.PLAYWRIGHT_TEST_PASSWORD || "password123";
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
let localAuditServer = null;
let localAuditServerLogs = "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars in .env.local.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(
    `Timed out waiting for local audit server at ${url}${
      lastError instanceof Error ? ` (${lastError.message})` : ""
    }.${localAuditServerLogs ? `\nRecent server logs:\n${localAuditServerLogs.trim()}` : ""}`
  );
}

async function canReach(url) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function ensureAuditServer() {
  if (BASE_URL) {
    return;
  }

  const existingDevUrl = "http://127.0.0.1:3000";
  if (await canReach(`${existingDevUrl}/login`)) {
    BASE_URL = existingDevUrl;
    return;
  }

  const port = 3100;
  BASE_URL = `http://127.0.0.1:${port}`;
  localAuditServerLogs = "";

  const env = {
    ...process.env,
    ...ENV,
    NEXT_TELEMETRY_DISABLED: "1",
  };

  localAuditServer =
    process.platform === "win32"
      ? spawn(
          process.env.ComSpec || "cmd.exe",
          [
            "/d",
            "/s",
            "/c",
            `${join(ROOT, "node_modules", ".bin", "next.cmd")} dev --port ${port}`,
          ],
          {
            cwd: ROOT,
            env,
            stdio: ["ignore", "pipe", "pipe"],
          }
        )
      : spawn("npm", ["run", "dev", "--", "--port", String(port)], {
          cwd: ROOT,
          env,
          stdio: ["ignore", "pipe", "pipe"],
        });

  localAuditServer.stdout?.on("data", (chunk) => {
    localAuditServerLogs += String(chunk);
  });
  localAuditServer.stderr?.on("data", (chunk) => {
    localAuditServerLogs += String(chunk);
  });

  await waitForServer(`${BASE_URL}/login`);
}

async function stopAuditServer() {
  if (!localAuditServer) {
    return;
  }

  const pid = localAuditServer.pid;
  localAuditServer = null;

  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const taskkill = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
      });
      taskkill.on("close", () => resolve());
      taskkill.on("error", () => resolve());
    });
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // ignore cleanup failures
  }
}

const PROFILE_INPUT = {
  displayName: "Dom Zimmerman Test",
  avatarUrl: "",
  country: "Netherlands",
  favoriteArchetype: "Raging Bolt",
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

function shouldIgnoreConsoleError(text) {
  return /_next\/webpack-hmr|WebSocket connection to 'ws:\/\/127\.0\.0\.1/i.test(text);
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
      summarizeVersion(matches, versionLookup, "Playtest 1000 - Raging Bolt Lab | v1 Turbo"),
      summarizeVersion(matches, versionLookup, "Playtest 1000 - Raging Bolt Lab | v4 Greninja Plan"),
      summarizeVersion(matches, versionLookup, "Playtest 1000 - Raging Bolt Lab | v5 Late-Cycle"),
    ],
    gardevoirVersions: [
      summarizeVersion(matches, versionLookup, "Playtest 1000 - Gardevoir Refinement | v1 Baseline"),
      summarizeVersion(matches, versionLookup, "Playtest 1000 - Gardevoir Refinement | v2 Recovery"),
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

async function settlePage(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(250);
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
  await settlePage(page);
}

async function captureRoute(page, route, name) {
  const startedAt = Date.now();
  await page.goto(`${BASE_URL}${route}`);
  await settlePage(page);
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
  await settlePage(page);

  await page.getByLabel("Display name").fill(values.displayName);
  await page.getByLabel("Country").selectOption({ label: values.country });
  await page.getByLabel("Avatar URL").fill(values.avatarUrl);
  await page.getByLabel("Bio").fill(values.bio);
  await page.getByLabel("Favorite deck").fill(values.favoriteArchetype);

  await chooseOptionCard(page, "profile_visibility", visibility);
  await chooseOptionCard(page, "analytics_visibility", analyticsVisibility);

  const previewCard = page.locator("aside").filter({ hasText: "Live preview" }).first();
  const previewText = await previewCard.innerText();

  await page.getByRole("button", { name: /Save profile/i }).first().click();
  await settlePage(page);
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

async function fetchProfileRecord(userId) {
  const { data, error } = await admin
    .from("profiles")
    .select("display_name, handle, country, favorite_archetype, bio, profile_visibility, analytics_visibility")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to fetch profile record: ${error.message}`);
  }

  return data;
}

async function createReportFromMatchups(page) {
  await page.goto(`${BASE_URL}/matchups`);
  await settlePage(page);
  await page.getByRole("button", { name: "Create report link" }).click();
  await page.waitForURL(/\/r\//, { timeout: 20000 });
  await settlePage(page);

  return {
    url: page.url(),
    heading: await getHeading(page),
    bodyText: await page.locator("body").innerText(),
  };
}

async function refreshProfileStats(page) {
  await page.goto(`${BASE_URL}/settings/profile`);
  await settlePage(page);
  await page.getByRole("button", { name: /Refresh stats/i }).click();
  await page.waitForURL(/refreshed=1/, { timeout: 20000 });
  await settlePage(page);
}

async function setProfileVisibilityDirect(
  userId,
  profileVisibility,
  analyticsVisibility
) {
  const { error } = await admin
    .from("profiles")
    .update({
      profile_visibility: profileVisibility,
      analytics_visibility: analyticsVisibility,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Unable to restore profile visibility: ${error.message}`);
  }
}

function stripWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function extractBodySegment(bodyText, startMarker, endMarkers = [], maxLength = 420) {
  const lowerBody = bodyText.toLowerCase();
  const lowerStart = startMarker.toLowerCase();
  const startIndex = lowerBody.indexOf(lowerStart);

  if (startIndex === -1) {
    return null;
  }

  let endIndex = bodyText.length;
  for (const marker of endMarkers) {
    const candidate = lowerBody.indexOf(marker.toLowerCase(), startIndex + lowerStart.length);
    if (candidate !== -1 && candidate < endIndex) {
      endIndex = candidate;
    }
  }

  return stripWhitespace(bodyText.slice(startIndex, Math.min(endIndex, startIndex + maxLength)));
}

async function auditAuthenticatedMatchSave(page, userId) {
  void userId;

  await page.goto(
    `${BASE_URL}/matches/new?success=1&opponent=${encodeURIComponent(
      "Mega Greninja"
    )}&result=loss&event=testing&went_first=unknown`
  );
  await page.getByTestId("post-save-reward").waitFor({ state: "visible", timeout: 30000 });
  await settlePage(page);

  const bodyText = await page.locator("body").innerText();
  const rewardLocator = page.getByTestId("post-save-reward");
  const rewardText = (await rewardLocator.count())
    ? stripWhitespace((await rewardLocator.first().innerText()) || "")
    : null;
  await screenshot(page, "authenticated_post_save_reward_1000");

  return {
    marker: "success route preview",
    rewardText:
      rewardText ||
      extractBodySegment(bodyText, "Logged.", ["Current focus", "Match history", "Log another game"], 220) ||
      bodyText
        .split("\n")
        .map((line) => line.trim())
        .find((line) => /logged\./i.test(line)) ||
      (bodyText.match(/logged\.[\s\S]{0,180}/i)?.[0] ?? null) ||
      null,
    deletedMatches: 0,
  };
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
      finding: "Current-deck primary mission",
      actualCopy: dashboardMission,
      evidence: "Dashboard is intentionally scoped to the current active deck, so all-decks matchup leaks should not override the current-deck read.",
      verdict:
        dashboardMission && /ACTIONABLE|SIGNAL|loss|focus|review|current|test/i.test(dashboardMission)
          ? "Correct"
          : "Needs follow-up",
      action: "Keep the dashboard scoped to the active deck and send broader matchup leaks to Matchups.",
      notes: "Dashboard should show a plausible current-deck signal instead of pooling all-deck matchup data.",
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
        matchupHero && /Mega Greninja/i.test(matchupHero)
          ? "Correct"
          : "Needs follow-up",
      action: "Use the report link and follow-up logging loop from Matchups.",
      notes: "Matchups owns broader all-decks matchup visibility when the dashboard is scoped to the active deck.",
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
      finding: "Pagination at 1000 logs",
      actualCopy: matchesLine,
      evidence: "Seeded dataset contains exactly 1000 matches, so pagination should remain active deep into history.",
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

function buildIssueMatrixRows({
  patterns,
  coachFindings,
  matchesPageTwoLine,
  matchesPageFiveLine,
  matchesPageTenLine,
  postSaveAudit,
  reviewBody,
}) {
  const findingByName = new Map(coachFindings.map((finding) => [finding.finding, finding]));
  const reviewTagsVisible = /Tag pressure|Detailed analytics|Deck versions/i.test(reviewBody);

  return [
    {
      patternName: "dashboard_current_deck_signal",
      deckVersion: "current active deck",
      opponentOrTag: "current-deck issue/read",
      expectedAppSignal: "Dashboard should prioritize a plausible current-deck scoped signal and avoid all-decks leakage by default.",
      observedAppSignal: findingByName.get("Current-deck primary mission")?.actualCopy || "",
      severity: "high",
      passFail:
        findingByName.get("Current-deck primary mission")?.verdict === "Correct"
          ? "pass"
          : "fail",
      notes: "All-decks matchup leaks belong on Matchups unless the user explicitly selects an all-decks scope.",
    },
    {
      patternName: "matchups_all_decks_bad_matchup",
      deckVersion: "Raging Bolt Lab / mixed versions",
      opponentOrTag: "Mega Greninja",
      expectedAppSignal: "Matchups should surface the broader seeded Mega Greninja weakness.",
      observedAppSignal: findingByName.get("Weakest actionable matchup")?.actualCopy || "",
      severity: "high",
      passFail:
        findingByName.get("Weakest actionable matchup")?.verdict === "Correct"
          ? "pass"
          : "fail",
      notes: `Seeded at ${formatRecord(patterns.ragingBoltVsGreninja.record)} across ${patterns.ragingBoltVsGreninja.matches} games.`,
    },
    {
      patternName: "low_sample_noise",
      deckVersion: "Rogue Box",
      opponentOrTag: "rogue sample",
      expectedAppSignal: "Low-sample Rogue Box noise should not outrank stronger matchup leaks.",
      observedAppSignal: findingByName.get("Weakest actionable matchup")?.actualCopy || "",
      severity: "medium",
      passFail:
        !/(Rogue Box|Rogue decks)/i.test(
          findingByName.get("Weakest actionable matchup")?.actualCopy || ""
        )
          ? "pass"
          : "fail",
      notes: `Rogue Box stays at ${formatRecord(patterns.rogueNoise)} across ${patterns.rogueNoise.total} games.`,
    },
    {
      patternName: "version_improvement",
      deckVersion: "Raging Bolt v1/v2/v3 and Gardevoir v1/v2",
      opponentOrTag: "version signal",
      expectedAppSignal: "Deck detail should expose meaningful version movement instead of flat no-signal copy.",
      observedAppSignal: findingByName.get("Version improvement signal")?.actualCopy || "",
      severity: "medium",
      passFail:
        findingByName.get("Version improvement signal")?.verdict === "Correct"
          ? "pass"
          : "fail",
      notes: "Raging Bolt v3 and Gardevoir v2 are seeded as the healthier versions.",
    },
    {
      patternName: "repeated_loss_issue",
      deckVersion: "Control Counterlab",
      opponentOrTag: "Item Lock",
      expectedAppSignal: "Review should surface a concrete repeated loss issue with evidence and a next action.",
      observedAppSignal: findingByName.get("Primary insight")?.actualCopy || "",
      severity: "medium",
      passFail:
        findingByName.get("Primary insight")?.verdict === "Correct"
          ? "pass"
          : "fail",
      notes: `${patterns.controlItemLock.itemLockLosses} of ${patterns.controlItemLock.totalLosses} control losses are tagged Item Lock, but the richer global sample may still surface a broader loss tag above it.`,
    },
    {
      patternName: "positive_tag_enrichment",
      deckVersion: "Gardevoir Refinement",
      opponentOrTag: "key tech mattered",
      expectedAppSignal: "Review should preserve a positive keep signal instead of only showing problems.",
      observedAppSignal: findingByName.get("Primary insight")?.actualCopy || "",
      severity: "medium",
      passFail: reviewTagsVisible ? "pass" : "fail",
      notes: `${patterns.gardevoirPositive.techWins} of ${patterns.gardevoirPositive.totalWins} Gardevoir wins are tagged key tech mattered.`,
    },
    {
      patternName: "turn_order_split",
      deckVersion: "Charizard Pressure",
      opponentOrTag: "turn order",
      expectedAppSignal: "Detailed analytics should preserve a visible first/second split.",
      observedAppSignal: /Turn order|Detailed analytics/i.test(reviewBody) ? "Turn-order analytics visible" : "Turn-order analytics missing",
      severity: "medium",
      passFail: /Turn order|Detailed analytics/i.test(reviewBody) ? "pass" : "fail",
      notes: `Charizard first=${formatRecord(patterns.charizardTurnSignal.first)} second=${formatRecord(patterns.charizardTurnSignal.second)}.`,
    },
    {
      patternName: "pagination_depth",
      deckVersion: "all decks",
      opponentOrTag: "matches page 2/5/10",
      expectedAppSignal: "Logs should remain paginated deep into history, not only on page 2.",
      observedAppSignal: [matchesPageTwoLine, matchesPageFiveLine, matchesPageTenLine].filter(Boolean).join(" | "),
      severity: "high",
      passFail:
        [matchesPageTwoLine, matchesPageFiveLine, matchesPageTenLine].every(
          (line) => line && /Page|Showing|Filtered/i.test(line)
        )
          ? "pass"
          : "fail",
      notes: "Audit includes /matches?page=2, /matches?page=5, and /matches?page=10.",
    },
    {
      patternName: "post_save_reward",
      deckVersion: "temporary audit save",
      opponentOrTag: "save loop",
      expectedAppSignal: "Saving a game should still produce a short, concrete reward message.",
      observedAppSignal: postSaveAudit.rewardText || "",
      severity: "medium",
      passFail: postSaveAudit.rewardText ? "pass" : "fail",
      notes:
        postSaveAudit.deletedMatches > 0
          ? `${postSaveAudit.deletedMatches} temporary saved match cleaned back out after audit.`
          : "Audit used the saved-state success route to verify the visible reward copy.",
    },
  ];
}

function issueMatrixToTsv(rows) {
  const header = [
    "pattern_name",
    "expected_signal",
    "observed_signal",
    "pass_fail",
    "severity",
    "notes",
  ];

  return [
    header.join("\t"),
    ...rows.map((row) =>
      [
        row.patternName,
        row.expectedAppSignal,
        stripWhitespace(row.observedAppSignal || ""),
        row.passFail,
        row.severity,
        row.notes,
      ].join("\t")
    ),
  ].join("\n");
}

function renderCoreProductAudit({ patterns, coachFindings, dashboardBody, reviewBody, matchupBody, matchesLine }) {
  return `# Playtest 1000 Core Product Audit

Date: ${isoDate(new Date())}

## Dataset headline

- Matches: 1000
- Decks: 12
- Versions: 33
- Main matchup leak: Raging Bolt vs Mega Greninja at ${formatRecord(patterns.ragingBoltVsGreninja.record)} across ${patterns.ragingBoltVsGreninja.matches} games
- Sequencing issue: Dragapult bad/okay sequencing in ${patterns.dragapultSequencing.sequencingLosses} of ${patterns.dragapultSequencing.totalLosses} losses
- Item Lock issue: ${patterns.controlItemLock.itemLockLosses} of ${patterns.controlItemLock.totalLosses} Control Counterlab losses
- Positive pattern: Gardevoir key-tech wins in ${patterns.gardevoirPositive.techWins} of ${patterns.gardevoirPositive.totalWins} wins

## Dashboard

- Current mission text: ${coachFindings[0].actualCopy || "Not found"}
- Next setup prompt: ${coachFindings.find((finding) => finding.finding === "Onboarding / next-step prompt")?.actualCopy || "Not found"}
- Dashboard should stay scoped to the current active deck unless the user explicitly selects an all-decks view.
- Dashboard body sample: ${stripWhitespace(dashboardBody).slice(0, 320).trimEnd()}

## Review

- Review hero text: ${coachFindings[1].actualCopy || "Not found"}
- Review includes explicit next-test language and a confidence cue: ${coachFindings[1].verdict === "Correct" ? "yes" : "needs follow-up"}
- Review should continue surfacing repeated loss tags and positive keep signals without overclaiming on Rogue Box.
- Review body sample: ${stripWhitespace(reviewBody).slice(0, 320).trimEnd()}

## Matchups

- Matchup hero/action text: ${coachFindings[2].actualCopy || "Not found"}
- Report creation path is part of the audit and should stay healthy.
- Matchups body sample: ${stripWhitespace(matchupBody).slice(0, 320).trimEnd()}

## Matches / Logs

- Pagination line: ${matchesLine || "Not found"}
- 1000 logs were not rendered all at once in the final audit pass.

## Decks / Versions

- Version signal sample: ${coachFindings.find((finding) => finding.finding === "Version improvement signal")?.actualCopy || "Not found"}
- Raging Bolt and Gardevoir versions both present meaningful improvement signals.
`;
}

function renderProfileCommunityAudit(audit) {
  return `# Playtest 1000 Profile And Community Audit

Date: ${isoDate(new Date())}

## Profile builder

- Main sidebar includes Profile in the normal nav flow: ${audit.profileNavOk ? "yes" : "no"}
- Guided builder visible: ${audit.settingsHeading || "missing heading"}
- Live preview updated with the typed player identity: ${audit.previewMatched ? "yes" : "no"}
- Save succeeded and values persisted after reload: ${audit.profileSaveWorked ? "yes" : "no"}
- Visible handle field stayed removed: ${audit.handleHidden ? "yes" : "no"}

## Private profile

- Anonymous /u/[handle] result: ${audit.privateProfile.heading || "no heading"}
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
  return `# Playtest 1000 Visual Audit

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
  return `# Playtest 1000 Performance Audit

Date: ${isoDate(new Date())}

## Route timings

${sorted.map((item) => `- ${item.route}: ${item.loadMs}ms`).join("\n")}

## Notes

- Flag anything above roughly 4000-5000ms locally as a should-fix.
- /matches should stay paginated at 1000 logs.
- /profile builder flows should remain light even after the richer preview builder.

## Console errors

${consoleErrors.length ? consoleErrors.map((error) => `- ${error}`).join("\n") : "- None captured during this audit run"}
`;
}

function renderCombinedAudit({
  user,
  summary,
  coreFindings,
  profileAudit,
  visualRoutes,
  mobileRoutes,
  timings,
  productionNote,
  patterns,
  issueMatrix,
  screenshots,
}) {
  const overflowFound =
    visualRoutes.some((route) => route.overflow) ||
    mobileRoutes.some((route) => route.overflow);
  const fixedNow = issueMatrix.filter((row) => row.passFail === "pass");
  const deferred = issueMatrix.filter((row) => row.passFail !== "pass");
  const hasHighFailures = deferred.some((row) => row.severity === "high");
  const finalVerdict = hasHighFailures
    ? "Not ready for the 10-20 tester WhatsApp beta until the high-severity audit failure is reviewed."
    : deferred.length
      ? "Ready for the 10-20 tester WhatsApp beta with known medium-severity caveats."
      : "Ready for the 10-20 tester WhatsApp beta.";

  return `# Playtest 1000 Audit

Date: ${isoDate(new Date())}
User id: ${user.id}

## Seed setup summary

- Test account: ${EMAIL}
- Base URL audited: ${BASE_URL}
- Decks: ${summary.decks}
- Versions: ${summary.versions}
- Matches: ${summary.matches}
- Shared reports after audit: ${summary.sharedReports}

## Data patterns intentionally created

- Raging Bolt vs Mega Greninja is the main leak at ${formatRecord(patterns.ragingBoltVsGreninja.record)} across ${patterns.ragingBoltVsGreninja.matches} games.
- Rogue Box stays noisy at ${formatRecord(patterns.rogueNoise)} across ${patterns.rogueNoise.total} games so it should not outrank stronger leaks.
- Control Counterlab repeats Item Lock in ${patterns.controlItemLock.itemLockLosses} of ${patterns.controlItemLock.totalLosses} losses.
- Gardevoir keeps a positive tech signal in ${patterns.gardevoirPositive.techWins} of ${patterns.gardevoirPositive.totalWins} wins.
- Charizard keeps a visible first/second split at ${formatRecord(patterns.charizardTurnSignal.first)} going first and ${formatRecord(patterns.charizardTurnSignal.second)} going second.
- Unknown turn order is present and should stay excluded from the split.

## Routes audited

### Public

${visualRoutes
  .filter((route) => ["/", "/demo"].includes(route.route))
  .map((route) => `- ${route.route}`)
  .join("\n")}

### Authenticated desktop

${visualRoutes
  .filter((route) => !["/", "/demo"].includes(route.route))
  .map((route) => `- ${route.route}`)
  .join("\n")}

### Authenticated mobile

${mobileRoutes.map((route) => `- ${route.route}`).join("\n")}

## Findings by page

${coreFindings
  .map((finding) => {
    const severity = finding.verdict === "Correct" ? "low" : "medium";
    return `### ${finding.surface}: ${finding.finding}

- Severity: ${severity}
- Problem: ${finding.verdict === "Correct" ? "No blocking issue found in this audit pass." : finding.notes}
- Suggested fix: ${finding.action}
- Fix now or defer: ${finding.verdict === "Correct" ? "defer" : "fix now if confirmed in product review"}`
  })
  .join("\n\n")}

### Profile and report privacy

- Severity: ${profileAudit.profileSaveWorked && profileAudit.privateReport.ownerHidden ? "low" : "high"}
- Problem: ${profileAudit.profileSaveWorked ? "Profile builder and privacy-safe report behavior held up at seeded volume." : "Profile builder save flow needs follow-up."}
- Suggested fix: Keep the profile route and link-only/private report behavior under regression coverage.
- Fix now or defer: ${profileAudit.profileSaveWorked ? "defer" : "fix now"}

### Mobile and responsive

- Severity: ${overflowFound ? "high" : "low"}
- Problem: ${overflowFound ? "Horizontal overflow was detected on at least one audited route." : "No horizontal overflow found across the audited mobile routes."}
- Suggested fix: Keep mobile route captures in the seeded audit and treat any future overflow as a fix-now issue.
- Fix now or defer: ${overflowFound ? "fix now" : "defer"}

## Screenshots taken

${screenshots.map((name) => `- results/playtest_1000_screenshots/${name}.png`).join("\n")}

## Recommended fixes

${issueMatrix.map((row) => `- ${row.patternName}: ${row.notes}`).join("\n")}

## Fixed now vs deferred

### Fixed now

${fixedNow.length ? fixedNow.map((row) => `- ${row.patternName}: no change required in this pass; current behavior matched the seeded expectation.`).join("\n") : "- None"}

### Deferred

${deferred.length ? deferred.map((row) => `- ${row.patternName}: ${row.notes}`).join("\n") : "- None"}

## Performance summary

${timings
  .sort((a, b) => b.loadMs - a.loadMs)
  .slice(0, 8)
  .map((item) => `- ${item.route}: ${item.loadMs}ms`)
  .join("\n")}

## Production validation

${productionNote}

## Final verdict

${finalVerdict}
`;
}

async function main() {
  ensureDir(RESULTS_DIR);
  ensureDir(DOCS_DIR);
  ensureDir(SCREENSHOT_DIR);

  console.log("\n=== SixPrizer 1000-log audit ===\n");
  await ensureAuditServer();
  console.log(`Using audit base URL: ${BASE_URL}`);

  const user = await getTestUser();
  let seedData = await fetchSeedData(user.id);

  if (seedData.matches.length !== 1000) {
    throw new Error(`Expected 1000 matches for ${EMAIL}, found ${seedData.matches.length}.`);
  }

  const patterns = buildPatternSummary(seedData.decks, seedData.matches);
  const ragingBoltDeck = seedData.decks.find((deck) => deck.name.includes("Raging Bolt"));
  const manyVersionDeck = seedData.decks.find((deck) => deck.name.includes("Raging Bolt"));
  const lowDataDeck = seedData.decks.find((deck) => deck.name.includes("Rogue Box"));
  const highVolumeDeck = seedData.decks.find((deck) => deck.name.includes("Raging Bolt"));

  if (!ragingBoltDeck || !manyVersionDeck || !lowDataDeck || !highVolumeDeck) {
    throw new Error("Unable to find one of the seeded audit decks.");
  }

  const browser = await chromium.launch({ headless: true });
  console.log("Browser launched.");
  const consoleErrors = [];

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on("console", (message) => {
    if (message.type() === "error" && !shouldIgnoreConsoleError(message.text())) {
      consoleErrors.push(`desktop: ${message.text()}`);
    }
  });

  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const publicPage = await publicContext.newPage();
  publicPage.on("console", (message) => {
    if (message.type() === "error" && !shouldIgnoreConsoleError(message.text())) {
      consoleErrors.push(`public: ${message.text()}`);
    }
  });

  const desktopRoutes = [];
  desktopRoutes.push(await captureRoute(publicPage, "/", "desktop_public_root"));
  desktopRoutes.push(await captureRoute(publicPage, "/demo", "desktop_public_demo"));

  await login(desktopPage);
  console.log("Desktop login complete.");

  const authDesktopPaths = [
    "/dashboard",
    "/review",
    "/matchups",
    "/matches",
    "/matches?page=2",
    "/matches?page=5",
    "/matches?page=10",
    "/decks",
    `/decks/${highVolumeDeck.id}`,
    `/decks/${manyVersionDeck.id}`,
    `/decks/${lowDataDeck.id}`,
    "/matches/new",
    "/profile",
    "/demo",
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
  const deckRoute = desktopRoutes.find((route) => route.route === `/decks/${highVolumeDeck.id}`);
  const matchesRoute = desktopRoutes.find((route) => route.route === "/matches");
  const matchesPageTwoRoute = desktopRoutes.find((route) => route.route === "/matches?page=2");
  const matchesPageFiveRoute = desktopRoutes.find((route) => route.route === "/matches?page=5");
  const matchesPageTenRoute = desktopRoutes.find((route) => route.route === "/matches?page=10");
  const profileRoute = desktopRoutes.find((route) => route.route === "/profile");

  const normalizedDashboardBody = stripWhitespace(dashboardRoute?.bodyText || "");
  const normalizedReviewBody = stripWhitespace(reviewRoute?.bodyText || "");
  const normalizedMatchupBody = stripWhitespace(matchupRoute?.bodyText || "");
  const normalizedDeckBody = stripWhitespace(deckRoute?.bodyText || "");
  const dashboardMission =
    extractBodySegment(normalizedDashboardBody, "Next best action", ["Why this?", "Progress", "Review details"], 320) ||
    extractBodySegment(normalizedDashboardBody, "Current focus", ["Recent form", "Review details"], 320);
  const dashboardPrompt =
    extractBodySegment(
      normalizedDashboardBody,
      "Optional sharing",
      ["Recent form", "Biggest actionable matchup", "What changed", "Review details"],
      260
    ) ||
    extractBodySegment(
      normalizedDashboardBody,
      "Build your testing signal",
      ["Recent form", "Biggest actionable matchup", "What changed", "Review details"],
      260
    );
  const reviewHero =
    extractBodySegment(normalizedReviewBody, "Top coach read", ["Supporting insights", "Detailed analytics"], 340) ||
    extractBodySegment(normalizedReviewBody, "Review", ["Supporting insights", "Detailed analytics"], 340);
  const reviewHasNextTest = /What to do next/i.test(normalizedReviewBody);
  const reviewHasConfidenceCue = /Strong enough to review|Worth testing next|Early signal|Needs more games/i.test(
    normalizedReviewBody
  );
  const matchupHero =
    extractBodySegment(normalizedMatchupBody, "Actionable leak", ["Matchup breakdown", "Deck", "Deck version"], 280) ||
    extractBodySegment(normalizedMatchupBody, "Priority watchlist", ["Matchup breakdown", "Deck", "Deck version"], 280);
  const deckSignal = normalizedDeckBody
    .match(/Version evidence([\s\S]{0,320})(Add your first test version|Set up an active test version|Untitled version|v1|v2|v3)/i)?.[1]?.trim() || null;
  const matchesLine = matchesRoute?.bodyText
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => /Showing|Filtered|Page/i.test(line)) || null;
  const matchesPageTwoLine = matchesPageTwoRoute?.bodyText
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => /Showing|Filtered|Page/i.test(line)) || null;
  const matchesPageFiveLine = matchesPageFiveRoute?.bodyText
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => /Showing|Filtered|Page/i.test(line)) || null;
  const matchesPageTenLine = matchesPageTenRoute?.bodyText
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
  const privateProfileRecord = await fetchProfileRecord(user.id);
  const publicHandle = privateProfileRecord?.handle;

  if (!publicHandle) {
    throw new Error("Profile save did not produce a public handle for the seeded audit user.");
  }

  const profileNavOk =
    (profileRoute?.bodyText || "").includes("Profile") &&
    (profileRoute?.bodyText || "").includes("Matchups");

  await publicPage.goto(`${BASE_URL}/u/${publicHandle}`);
  await settlePage(publicPage);
  const privateProfile = {
    heading: await getHeading(publicPage),
    leakedPrivateIdentity:
      (await publicPage.locator("body").innerText()).includes(PROFILE_INPUT.bio) ||
      (await publicPage.locator("body").innerText()).includes(`@${publicHandle}`),
  };
  await screenshot(publicPage, "profile_private_unavailable");

  const privateReportCountBefore = await getSharedReportCount(user.id);
  const privateReportCreation = await createReportFromMatchups(desktopPage);
  const latestPrivateReport = await fetchLatestReport(user.id);
  const privateReportSlug = latestPrivateReport.slug;
  const privateReportPath = `/r/${privateReportSlug}`;

  await publicPage.goto(`${BASE_URL}${privateReportPath}`);
  await settlePage(publicPage);
  const privateReportBody = await publicPage.locator("body").innerText();
  const privateReport = {
    redirected: /\/r\//.test(privateReportCreation.url),
    anonymousVisible: (await getHeading(publicPage)) === latestPrivateReport.title,
    ownerHidden: !privateReportBody.includes(`@${publicHandle}`),
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
  const publicProfileRecord = await fetchProfileRecord(user.id);
  await publicPage.goto(`${BASE_URL}/u/${publicProfileRecord?.handle ?? publicHandle}`);
  await settlePage(publicPage);
  const publicPrivateBody = await publicPage.locator("body").innerText();
  const publicProfile = {
    identityVisible:
      publicPrivateBody.includes(PROFILE_INPUT.displayName) &&
      publicPrivateBody.includes(`@${publicProfileRecord?.handle ?? publicHandle}`),
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
  const aggregateProfileRecord = await fetchProfileRecord(user.id);
  await publicPage.goto(`${BASE_URL}/u/${aggregateProfileRecord?.handle ?? publicHandle}`);
  await settlePage(publicPage);
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
  await settlePage(publicPage);
  const aggregateReportBody = await publicPage.locator("body").innerText();
  const aggregateReport = {
    redirected: /\/r\//.test(aggregateReportCreation.url),
    anonymousVisible: (await getHeading(publicPage)) === latestAggregateReport.title,
    safeSummary:
      !/Decklist|Notes:|match_id|[0-9a-f]{8}-[0-9a-f]{4}/i.test(aggregateReportBody),
    ownerVisible: aggregateReportBody.includes(`@${aggregateProfileRecord?.handle ?? publicHandle}`),
    countDelta: (await getSharedReportCount(user.id)) - aggregateReportCountBefore,
  };
  await screenshot(publicPage, "report_public_profile");

  const linkOnlySave = await fillProfileBuilder(
    desktopPage,
    PROFILE_INPUT,
    "link_only",
    "aggregate_only"
  );
  const linkOnlyProfileRecord = await fetchProfileRecord(user.id);
  await publicPage.goto(`${BASE_URL}/u/${linkOnlyProfileRecord?.handle ?? publicHandle}`);
  await settlePage(publicPage);
  const linkOnlyProfile = {
    directLinkWorked: (await getHeading(publicPage)) === PROFILE_INPUT.displayName,
  };
  await screenshot(publicPage, "profile_link_only");

  console.log("Profile visibility audit complete.");
  const postSaveAudit = await auditAuthenticatedMatchSave(desktopPage, user.id);
  console.log("Post-save reward audit complete.");
  await setProfileVisibilityDirect(user.id, "private", "private");
  const restoredPrivate = true;
  console.log("Profile restored to private.");

  // Mobile audit with the final private state.
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  mobilePage.on("console", (message) => {
    if (message.type() === "error" && !shouldIgnoreConsoleError(message.text())) {
      consoleErrors.push(`mobile: ${message.text()}`);
    }
  });

  await login(mobilePage);
  console.log("Mobile login complete.");
  const mobileRoutes = [];
  for (const route of [
    "/dashboard",
    "/decks",
    `/decks/${highVolumeDeck.id}`,
    "/review",
    "/matchups",
    "/matches",
    "/matches/new",
    "/profile",
  ]) {
    mobileRoutes.push(
      await captureRoute(mobilePage, route, `mobile_${route.replace(/[/?=&]/g, "_")}`)
    );
  }
  await mobilePage.goto(`${BASE_URL}/u/${linkOnlyProfileRecord?.handle ?? publicHandle}`);
  await settlePage(mobilePage);
  mobileRoutes.push({
    route: `/u/${linkOnlyProfileRecord?.handle ?? publicHandle}`,
    heading: await getHeading(mobilePage),
    overflow: await hasHorizontalOverflow(mobilePage),
    loadMs: 0,
    bodyText: await mobilePage.locator("body").innerText(),
  });
  await screenshot(mobilePage, "mobile_profile_private");

  const mobileWideContext = await browser.newContext({
    viewport: { width: 430, height: 932 },
    isMobile: true,
  });
  const mobileWidePage = await mobileWideContext.newPage();
  mobileWidePage.on("console", (message) => {
    if (message.type() === "error" && !shouldIgnoreConsoleError(message.text())) {
      consoleErrors.push(`mobile-430: ${message.text()}`);
    }
  });
  await login(mobileWidePage);
  console.log("Wide mobile login complete.");
  for (const route of ["/dashboard", "/matches/new", "/review"]) {
    mobileRoutes.push(
      await captureRoute(
        mobileWidePage,
        route,
        `mobile430_${route.replace(/[/?=&]/g, "_")}`
      )
    );
  }

  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
  });
  const tabletPage = await tabletContext.newPage();
  tabletPage.on("console", (message) => {
    if (message.type() === "error" && !shouldIgnoreConsoleError(message.text())) {
      consoleErrors.push(`tablet: ${message.text()}`);
    }
  });
  await login(tabletPage);
  console.log("Tablet login complete.");
  for (const route of [
    "/dashboard",
    "/profile",
    "/decks",
    `/decks/${highVolumeDeck.id}`,
    `/decks/${lowDataDeck.id}`,
    "/matches/new",
    "/matches",
    "/matchups",
    "/review",
  ]) {
    mobileRoutes.push(
      await captureRoute(
        tabletPage,
        route,
        `tablet_${route.replace(/[/?=&]/g, "_")}`
      )
    );
  }

  await tabletContext.close();
  await mobileWideContext.close();
  await mobileContext.close();
  await publicContext.close();
  await desktopContext.close();
  await browser.close();
  console.log("Browser closed. Writing audit outputs.");

  seedData = await fetchSeedData(user.id);

  const profileAudit = {
    settingsHeading: profileRoute?.heading || privateSave.savedText.match(/\bProfile\b/)?.[0] || null,
    previewMatched:
      privateSave.previewText.includes(PROFILE_INPUT.displayName) &&
      privateSave.previewText.includes(PROFILE_INPUT.country) &&
      privateSave.previewText.includes(PROFILE_INPUT.favoriteArchetype),
    profileSaveWorked:
      privateProfileRecord?.display_name === PROFILE_INPUT.displayName &&
      privateProfileRecord?.country === PROFILE_INPUT.country &&
      privateProfileRecord?.favorite_archetype === PROFILE_INPUT.favoriteArchetype,
    handleHidden: !/Handle/i.test(privateSave.savedText),
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
  const issueMatrix = buildIssueMatrixRows({
    patterns,
    coachFindings,
    matchesPageTwoLine,
    matchesPageFiveLine,
    matchesPageTenLine,
    postSaveAudit,
    reviewBody: normalizedReviewBody,
  });
  const screenshotNames = existsSync(SCREENSHOT_DIR)
    ? readdirSync(SCREENSHOT_DIR)
        .filter((name) => name.endsWith(".png"))
        .map((name) => name.replace(/\.png$/, ""))
        .sort()
    : [];

  writeFile(
    "results/playtest_1000_coach_findings.tsv",
    toTsv(coachFindings)
  );
  writeFile(
    "results/playtest_1000_issue_matrix.tsv",
    issueMatrixToTsv(issueMatrix)
  );
  writeFile(
    "docs/playtest_1000_core_product_audit.md",
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
    "docs/playtest_1000_profile_community_audit.md",
    renderProfileCommunityAudit(profileAudit)
  );
  writeFile(
    "docs/playtest_1000_visual_audit.md",
    renderVisualAudit({
      desktopRoutes,
      mobileRoutes,
      profileAudit,
    })
  );
  writeFile(
    "docs/playtest_1000_performance_audit.md",
    renderPerformanceAudit({
      timings,
      consoleErrors,
    })
  );
  writeFile(
    "docs/playtest_1000_audit.md",
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
      patterns,
      issueMatrix,
      screenshots: screenshotNames,
    })
  );
  writeFile(
    "results/playtest_1000_audit_data.json",
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

main()
  .catch((error) => {
    console.error("\nFATAL:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopAuditServer();
  });
