import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";
import { spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "results", "playtest_1000_audit");
const SCREENSHOT_DIR = join(OUT_DIR, "screenshots");
const AUDIT_RUN_ID = `playtest_1000_logging_${new Date()
  .toISOString()
  .replace(/[:.]/g, "-")}`;
const PRIOR_AUDIT_PREFIX = "playtest_1000_logging_";
const AUDIT_NAME_PREFIX = "[Audit 1000]";

function ensureDir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function writeJson(name, value) {
  ensureDir(OUT_DIR);
  writeFileSync(join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(name, value) {
  ensureDir(OUT_DIR);
  writeFileSync(join(OUT_DIR, name), value, "utf8");
}

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  const env = {};

  readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separator = trimmed.indexOf("=");
      if (separator <= 0) return;

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
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = ENV.PLAYWRIGHT_TEST_EMAIL || "pokeleaguenl@gmail.com";
const TEST_PASSWORD = ENV.PLAYWRIGHT_TEST_PASSWORD || "password123";
let BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "";
let localAuditServer = null;
let localAuditServerLogs = "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabaseHost = (() => {
  try {
    return new URL(SUPABASE_URL).host;
  } catch {
    return "invalid-url";
  }
})();

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const decks = [
  {
    name: `${AUDIT_NAME_PREFIX} Dragapult ex`,
    archetype: "Dragapult",
    versions: [
      {
        name: "Baseline",
        decklist: `Pokémon (18)
4 Dragapult ex
4 Drakloak
4 Dreepy
2 Pidgeot ex
2 Pidgey
1 Fezandipiti ex
1 Radiant Greninja

Trainer (32)
4 Rare Candy
4 Buddy-Buddy Poffin
4 Ultra Ball
3 Iono
3 Arven
2 Boss's Orders
2 Counter Catcher
2 Technical Machine: Evolution
2 Night Stretcher
2 Super Rod
2 Nest Ball
1 Forest Seal Stone
1 Prime Catcher

Energy (10)
6 Psychic Energy
4 Fire Energy`,
      },
      {
        name: "Bench pressure test",
        decklist: `Pokémon (18)
4 Dragapult ex
4 Drakloak
4 Dreepy
2 Pidgeot ex
2 Pidgey
1 Fezandipiti ex
1 Manaphy

Trainer (32)
4 Rare Candy
4 Buddy-Buddy Poffin
4 Ultra Ball
3 Iono
3 Arven
2 Boss's Orders
2 Counter Catcher
2 Technical Machine: Evolution
2 Night Stretcher
2 Super Rod
2 Nest Ball
1 Lost Vacuum
1 Prime Catcher

Energy (10)
6 Psychic Energy
4 Fire Energy`,
      },
      {
        name: "v3 consistency",
        decklist: `Pokémon (18)
4 Dragapult ex
4 Drakloak
4 Dreepy
2 Pidgeot ex
2 Pidgey
1 Fezandipiti ex
1 Manaphy

Trainer (33)
4 Rare Candy
4 Buddy-Buddy Poffin
4 Ultra Ball
4 Arven
3 Iono
2 Boss's Orders
2 Counter Catcher
2 Technical Machine: Evolution
2 Night Stretcher
2 Super Rod
2 Nest Ball
1 Lost Vacuum
1 Prime Catcher

Energy (9)
5 Psychic Energy
4 Fire Energy`,
      },
    ],
  },
  {
    name: `${AUDIT_NAME_PREFIX} Charizard ex`,
    archetype: "Charizard",
    versions: [
      {
        name: "Baseline",
        decklist: `Pokémon (18)
4 Charizard ex
4 Charmander
2 Charmeleon
2 Pidgeot ex
2 Pidgey
1 Rotom V
1 Lumineon V
1 Fezandipiti ex
1 Radiant Charizard

Trainer (34)
4 Rare Candy
4 Ultra Ball
4 Buddy-Buddy Poffin
4 Arven
3 Iono
2 Boss's Orders
2 Super Rod
2 Counter Catcher
2 Nest Ball
2 Night Stretcher
1 Forest Seal Stone
1 Prime Catcher
1 Collapsed Stadium
2 Defiance Band

Energy (8)
8 Fire Energy`,
      },
      {
        name: "Cup list",
        decklist: `Pokémon (18)
4 Charizard ex
4 Charmander
2 Charmeleon
2 Pidgeot ex
2 Pidgey
1 Rotom V
1 Lumineon V
1 Fezandipiti ex
1 Cleffa

Trainer (34)
4 Rare Candy
4 Ultra Ball
4 Buddy-Buddy Poffin
4 Arven
3 Iono
2 Boss's Orders
2 Super Rod
2 Counter Catcher
2 Nest Ball
2 Night Stretcher
1 Forest Seal Stone
1 Prime Catcher
1 Collapsed Stadium
2 Defiance Band

Energy (8)
8 Fire Energy`,
      },
    ],
  },
  {
    name: `${AUDIT_NAME_PREFIX} Gardevoir`,
    archetype: "Gardevoir",
    versions: [
      {
        name: "Baseline",
        decklist: `Pokémon (20)
4 Gardevoir ex
4 Kirlia
4 Ralts
2 Drifloon
2 Munkidori
1 Scream Tail
1 Fezandipiti ex
1 Radiant Greninja
1 Flutter Mane

Trainer (30)
4 Buddy-Buddy Poffin
4 Ultra Ball
4 Iono
3 Arven
3 Earthen Vessel
2 Boss's Orders
2 Super Rod
2 Counter Catcher
2 Night Stretcher
2 Nest Ball
1 Prime Catcher
1 Artazon

Energy (10)
8 Psychic Energy
2 Darkness Energy`,
      },
      {
        name: "Consistency",
        decklist: `Pokémon (20)
4 Gardevoir ex
4 Kirlia
4 Ralts
2 Drifloon
2 Munkidori
1 Scream Tail
1 Fezandipiti ex
1 Radiant Greninja
1 Klefki

Trainer (31)
4 Buddy-Buddy Poffin
4 Ultra Ball
4 Iono
4 Arven
3 Earthen Vessel
2 Boss's Orders
2 Super Rod
2 Counter Catcher
2 Night Stretcher
2 Nest Ball
1 Prime Catcher
1 Artazon

Energy (9)
7 Psychic Energy
2 Darkness Energy`,
      },
    ],
  },
];

const opponentPlan = [
  { name: "Mega Greninja", weight: 260, targetWinRate: 0.27, issue: "bench pressure" },
  { name: "Raging Bolt", weight: 150, targetWinRate: 0.47, issue: "Poor prizes" },
  { name: "Gholdengo", weight: 120, targetWinRate: 0.64, issue: "Slow start" },
  { name: "Dragapult Dusknoir", weight: 100, targetWinRate: 0.52, issue: "Behind early" },
  { name: "Charizard", weight: 90, targetWinRate: 0.55, issue: "Dead drew" },
  { name: "Gardevoir", weight: 70, targetWinRate: 0.61, issue: "Slow start" },
  { name: "Miraidon", weight: 55, targetWinRate: 0.43, issue: "Behind early" },
  { name: "Starmie", weight: 45, targetWinRate: 0.58, issue: "Poor prizes" },
  { name: "Lugia", weight: 35, targetWinRate: 0.5, issue: "Quick game" },
  { name: "Terapagos", weight: 30, targetWinRate: 0.49, issue: "Dead drew" },
  { name: "Chien-Pao", weight: 20, targetWinRate: 0.68, issue: "Slow start" },
  { name: "Roaring Moon", weight: 15, targetWinRate: 0.39, issue: "Donked" },
  { name: "Mega Lucario Dudunsparce", weight: 10, targetWinRate: 0.51, issue: "Poor prizes" },
];

const issueTags = [
  "Slow start",
  "Dead drew",
  "Poor prizes",
  "Behind early",
  "bench pressure",
  "Was donked",
];
const positiveTags = ["Ahead early", "Lucky", "Donked", "Quick game", "clean setup"];

function makeRng(seed = 1000) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRng(6112026);

function pick(values) {
  return values[Math.floor(random() * values.length)];
}

function pickWeighted(options) {
  const total = options.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of options) {
    cursor -= item.weight;
    if (cursor <= 0) return item;
  }
  return options.at(-1);
}

function isoDateTime(index) {
  const base = new Date("2026-07-01T09:00:00.000Z");
  const date = new Date(base);
  date.setUTCMinutes(base.getUTCMinutes() + index * 19);
  return date.toISOString();
}

function recordString(counts) {
  return `${counts.win}-${counts.loss}-${counts.tie}`;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getConfidenceLabel(total) {
  if (total === 0) return "No data";
  if (total <= 4) return "Low sample";
  if (total <= 9) return "Developing read";
  if (total <= 19) return "Useful sample";
  return "Strong read";
}

function getInterpretation({ wins, total }) {
  if (!total) return "No data";
  const confidence = getConfidenceLabel(total);
  const winRate = wins / total;
  if (total < 10) return `${confidence} · Do not overreact yet`;
  if (winRate < 0.4) return `${confidence} · Problem matchup`;
  if (winRate > 0.6) return `${confidence} · Favored read`;
  return `${confidence} · Even read`;
}

function prizeRaceFor(index, result) {
  if (index % 10 === 0) {
    return undefined;
  }

  if (index % 13 === 0) {
    return {
      events: [],
      userTotal: result === "win" ? 4 : 2,
      opponentTotal: result === "loss" ? 4 : 2,
      endedByConcession: true,
      summary:
        result === "win"
          ? "You were ahead before the concession."
          : "Opponent was ahead before the concession.",
    };
  }

  const userEvents =
    result === "win"
      ? [
          { actor: "user", prizesTaken: 2, userTotal: 2, opponentTotal: 1 },
          { actor: "opponent", prizesTaken: 2, userTotal: 2, opponentTotal: 3 },
          { actor: "user", prizesTaken: 2, userTotal: 4, opponentTotal: 3 },
          { actor: "user", prizesTaken: 2, userTotal: 6, opponentTotal: 3 },
        ]
      : [
          { actor: "opponent", prizesTaken: 1, userTotal: 0, opponentTotal: 1 },
          { actor: "user", prizesTaken: 2, userTotal: 2, opponentTotal: 1 },
          { actor: "opponent", prizesTaken: 2, userTotal: 2, opponentTotal: 3 },
          { actor: "opponent", prizesTaken: 3, userTotal: 2, opponentTotal: 6 },
        ];

  return {
    events: userEvents.map((event, eventIndex) => ({
      ...event,
      rawText: `${event.actor === "user" ? "DommitronNL" : "Opponent"} took ${
        event.prizesTaken
      } Prize card${event.prizesTaken === 1 ? "" : "s"}.`,
      index: eventIndex,
    })),
    userTotal: userEvents.at(-1).userTotal,
    opponentTotal: userEvents.at(-1).opponentTotal,
    summary:
      result === "win"
        ? "You pulled ahead during the final prize exchange."
        : "You fell behind after the second prize exchange.",
  };
}

function cardActivityFor(deckArchetype, opponentName, result, index) {
  const base =
    deckArchetype === "Dragapult"
      ? ["Dragapult ex", "Drakloak", "Dreepy", "Buddy-Buddy Poffin", "Rare Candy"]
      : deckArchetype === "Charizard"
        ? ["Charizard ex", "Pidgeot ex", "Charmander", "Rare Candy", "Arven"]
        : ["Gardevoir ex", "Kirlia", "Ralts", "Drifloon", "Buddy-Buddy Poffin"];
  const used =
    result === "win"
      ? base.slice(0, 4)
      : index % 4 === 0
        ? base.slice(2)
        : base.slice(0, 3);
  const discarded = index % 5 === 0 ? [base.at(-1), "Iono"] : ["Ultra Ball"];

  return {
    seen: unique([...base, opponentName === "Mega Greninja" ? "Manaphy" : "Nest Ball"]),
    used: unique(used),
    discarded: unique(discarded),
  };
}

function resultFor(opponent) {
  const roll = random();
  if (roll < 0.06) return "tie";
  if (roll < opponent.targetWinRate + 0.06) return "win";
  return "loss";
}

function buildMetadata({
  source,
  result,
  opponent,
  deck,
  index,
  testingBlockId,
  eventName,
  roundNumber,
}) {
  const negative = result === "loss" || result === "tie";
  const issue = negative ? [opponent.issue, pick(issueTags)] : [];
  const positive = result === "win" ? [pick(positiveTags)] : [];
  const metadata = {
    audit_run_id: AUDIT_RUN_ID,
    source,
    game_context: source === "event_round" ? "competitive" : "testing",
    start_quality: negative ? pick(["okay", "bad", "good"]) : pick(["great", "good"]),
    opening_hand_quality: negative ? pick(["okay", "bad"]) : pick(["great", "good", "okay"]),
    sequencing_quality: negative ? pick(["okay", "bad", "good"]) : pick(["great", "good"]),
    issue_tags: unique(issue),
    positive_tags: unique(positive),
    focus_matchup: testingBlockId ? opponent.name : undefined,
    event_name: eventName,
    round_number: roundNumber ? String(roundNumber) : undefined,
  };

  if (source === "tcg_live_import") {
    const activity = cardActivityFor(deck.archetype, opponent.name, result, index);
    metadata.tcg_live_cards_seen = activity.seen;
    metadata.tcg_live_cards_used = activity.used;
    metadata.tcg_live_cards_discarded = activity.discarded;
    const prizeRace = prizeRaceFor(index, result);
    if (prizeRace) metadata.prizeRace = prizeRace;
    if (index % 10 === 0) metadata.ambiguous_prize_reference_fixture = true;
  }

  Object.keys(metadata).forEach((key) => {
    if (metadata[key] === undefined) delete metadata[key];
  });

  return metadata;
}

async function getTestUser() {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`Unable to list users: ${error.message}`);
    const user = data.users.find((entry) => entry.email === TEST_EMAIL);
    if (user) return user;
    if (!data.users.length || data.users.length < 200) break;
    page += 1;
  }
  throw new Error(`Test account ${TEST_EMAIL} was not found.`);
}

async function deleteRows(table, ids) {
  for (let index = 0; index < ids.length; index += 200) {
    const batch = ids.slice(index, index + 200);
    if (!batch.length) continue;
    const { error } = await admin.from(table).delete().in("id", batch);
    if (error) throw new Error(`Unable to delete ${table}: ${error.message}`);
  }
}

async function cleanupPriorAuditRows(userId) {
  const cleanup = {
    matches: 0,
    events: 0,
    testingBlocks: 0,
    decks: 0,
  };

  const { data: matchRows, error: matchError } = await admin
    .from("matches")
    .select("id, metadata")
    .eq("user_id", userId)
    .like("notes", `${PRIOR_AUDIT_PREFIX}%`);
  if (matchError) throw new Error(`Unable to inspect matches: ${matchError.message}`);

  const matchIds = (matchRows ?? [])
    .filter((match) => String(match.metadata?.audit_run_id ?? "").startsWith(PRIOR_AUDIT_PREFIX))
    .map((match) => match.id);
  if (matchIds.length) {
    for (let index = 0; index < matchIds.length; index += 200) {
      const batch = matchIds.slice(index, index + 200);
      const { error } = await admin.from("match_tags").delete().in("match_id", batch);
      if (error) throw new Error(`Unable to delete audit match_tags: ${error.message}`);
    }
    await deleteRows("matches", matchIds);
  }
  cleanup.matches = matchIds.length;

  const { data: eventRows, error: eventError } = await admin
    .from("events")
    .select("id, name, notes")
    .eq("user_id", userId);
  if (eventError) throw new Error(`Unable to inspect events: ${eventError.message}`);
  const eventIds = (eventRows ?? [])
    .filter(
      (event) =>
        String(event.name ?? "").startsWith(AUDIT_NAME_PREFIX) ||
        String(event.notes ?? "").includes(PRIOR_AUDIT_PREFIX)
    )
    .map((event) => event.id);
  await deleteRows("events", eventIds);
  cleanup.events = eventIds.length;

  const { data: blockRows, error: blockError } = await admin
    .from("testing_blocks")
    .select("id, notes, source_review_reason")
    .eq("user_id", userId);
  if (blockError) {
    cleanup.testingBlocks = `skipped: ${blockError.message}`;
  } else {
    const blockIds = (blockRows ?? [])
      .filter(
        (block) =>
          String(block.notes ?? "").includes(PRIOR_AUDIT_PREFIX) ||
          String(block.source_review_reason ?? "").includes(PRIOR_AUDIT_PREFIX)
      )
      .map((block) => block.id);
    await deleteRows("testing_blocks", blockIds);
    cleanup.testingBlocks = blockIds.length;
  }

  const { data: deckRows, error: deckError } = await admin
    .from("decks")
    .select("id, name")
    .eq("user_id", userId);
  if (deckError) throw new Error(`Unable to inspect decks: ${deckError.message}`);
  const deckIds = (deckRows ?? [])
    .filter((deck) => String(deck.name ?? "").startsWith(AUDIT_NAME_PREFIX))
    .map((deck) => deck.id);
  await deleteRows("decks", deckIds);
  cleanup.decks = deckIds.length;

  return cleanup;
}

async function insertDecks(userId) {
  const deckRows = decks.map((deck) => ({
    user_id: userId,
    name: deck.name,
    archetype: deck.archetype,
    format: "Standard",
    notes: `${AUDIT_RUN_ID} generated test deck`,
  }));
  const { data: insertedDecks, error: deckError } = await admin
    .from("decks")
    .insert(deckRows)
    .select("id, name, archetype");
  if (deckError) throw new Error(`Unable to insert decks: ${deckError.message}`);

  const versions = [];
  insertedDecks.forEach((deck, deckIndex) => {
    decks[deckIndex].versions.forEach((version, versionIndex) => {
      versions.push({
        deck_id: deck.id,
        name: version.name,
        decklist: version.decklist,
        notes: `${AUDIT_RUN_ID} version ${versionIndex + 1}`,
        is_active: versionIndex === decks[deckIndex].versions.length - 1,
      });
    });
  });

  const { data: insertedVersions, error: versionError } = await admin
    .from("deck_versions")
    .insert(versions)
    .select("id, deck_id, name, decklist, is_active");
  if (versionError) throw new Error(`Unable to insert deck versions: ${versionError.message}`);

  return insertedDecks.map((deck) => ({
    ...deck,
    versions: insertedVersions.filter((version) => version.deck_id === deck.id),
  }));
}

async function insertTestingBlock(userId, deckRows) {
  const deck = deckRows[0];
  const activeVersion = deck.versions.find((version) => version.is_active) ?? deck.versions.at(-1);
  const { data, error } = await admin
    .from("testing_blocks")
    .insert({
      user_id: userId,
      deck_id: deck.id,
      deck_version_id: activeVersion.id,
      target_matchup: "Mega Greninja",
      focus_tags: ["bench pressure", "Slow start"],
      target_games: 5,
      notes: `${AUDIT_RUN_ID}: focused test created by the 1000-match logging audit.`,
      status: "active",
      source_review_reason: `${AUDIT_RUN_ID}: Mega Greninja is the seeded problem matchup.`,
    })
    .select("id, target_matchup, target_games")
    .single();
  if (error) {
    if (/testing_blocks|schema cache|does not exist/i.test(error.message)) {
      console.warn(`Skipping testing block seed: ${error.message}`);
      return null;
    }
    throw new Error(`Unable to insert testing block: ${error.message}`);
  }
  return data;
}

function buildMatchPlan(deckRows, testingBlock) {
  const plan = [];
  const sourceBuckets = [
    ...Array.from({ length: 600 }, () => "tcg_live_import"),
    ...Array.from({ length: 300 }, () => "manual"),
    ...Array.from({ length: 100 }, () => "event_round"),
  ];

  sourceBuckets.forEach((source, index) => {
    const deck = deckRows[index % deckRows.length];
    const version = deck.versions[index % deck.versions.length];
    const opponent = pickWeighted(opponentPlan);
    const forceBlock = index < 5;
    const result = forceBlock ? "loss" : resultFor(opponent);
    const wentFirst = index % 7 === 0 ? null : index % 2 === 0;
    const testingBlockId =
      forceBlock || (source !== "event_round" && opponent.name === "Mega Greninja" && index % 17 === 0)
      ? testingBlock?.id
      : null;

    plan.push({
      source,
      index,
      deck,
      version,
      opponent,
      result,
      wentFirst,
      testingBlockId,
    });
  });

  return plan;
}

async function insertMatches(userId, matchPlan) {
  const hasTestingBlockLinks = matchPlan.some((entry) => Boolean(entry.testingBlockId));
  const selectColumns = hasTestingBlockLinks
    ? "id, deck_version_id, opponent_archetype, result, went_first, event_type, metadata, testing_block_id"
    : "id, deck_version_id, opponent_archetype, result, went_first, event_type, metadata";
  const matchRows = matchPlan.map((entry) => ({
    ...{
      user_id: userId,
      deck_version_id: entry.version.id,
      opponent_archetype: entry.opponent.name,
      opponent_variant: null,
      result: entry.result,
      went_first: entry.wentFirst,
      event_type: entry.source === "event_round" ? "tournament" : "testing",
      format: "SVI-MEG",
      notes:
        entry.source === "tcg_live_import"
          ? `${AUDIT_RUN_ID} imported TCG Live fixture ${entry.index + 1}`
          : `${AUDIT_RUN_ID} ${entry.source} fixture ${entry.index + 1}`,
      played_at: isoDateTime(entry.index),
      metadata: buildMetadata({
        source: entry.source,
        result: entry.result,
        opponent: entry.opponent,
        deck: entry.deck,
        index: entry.index,
        testingBlockId: entry.testingBlockId,
      }),
    },
    ...(entry.testingBlockId ? { testing_block_id: entry.testingBlockId } : {}),
  }));

  const inserted = [];
  for (let index = 0; index < matchRows.length; index += 200) {
    const batch = matchRows.slice(index, index + 200);
    const { data, error } = await admin
      .from("matches")
      .insert(batch)
      .select(selectColumns);
    if (error) throw new Error(`Unable to insert matches batch ${index}: ${error.message}`);
    inserted.push(...data);
  }

  const tagRows = [];
  inserted.forEach((match) => {
    const tags = unique([
      ...(match.metadata?.issue_tags ?? []),
      ...(match.metadata?.positive_tags ?? []),
    ]);
    tags.forEach((tag) => tagRows.push({ match_id: match.id, tag }));
  });

  for (let index = 0; index < tagRows.length; index += 500) {
    const batch = tagRows.slice(index, index + 500);
    if (!batch.length) continue;
    const { error } = await admin.from("match_tags").insert(batch);
    if (error) throw new Error(`Unable to insert match_tags: ${error.message}`);
  }

  return inserted;
}

async function insertEvents(userId, deckRows, eventMatches) {
  const events = [];
  for (let eventIndex = 0; eventIndex < 20; eventIndex += 1) {
    const deck = deckRows[eventIndex % deckRows.length];
    const version = deck.versions[eventIndex % deck.versions.length];
    const { data, error } = await admin
      .from("events")
      .insert({
        user_id: userId,
        name: `${AUDIT_NAME_PREFIX} Event ${String(eventIndex + 1).padStart(2, "0")}`,
        event_date: `2026-07-${String((eventIndex % 20) + 1).padStart(2, "0")}`,
        event_type: eventIndex % 4 === 0 ? "League Cup" : eventIndex % 3 === 0 ? "Testing block" : "Local",
        format: "Standard",
        deck_id: deck.id,
        deck_version_id: version.id,
        match_structure: eventIndex % 4 === 0 ? "bo3" : "bo1",
        placement: eventIndex % 4 === 0 ? "Top 8" : null,
        notes: `${AUDIT_RUN_ID}: event-linked match audit fixture.`,
      })
      .select("id, name, match_structure")
      .single();
    if (error) throw new Error(`Unable to insert event ${eventIndex + 1}: ${error.message}`);
    events.push(data);
  }

  const rounds = eventMatches.map((match, index) => {
    const event = events[Math.floor(index / 5)];
    const tags = unique([
      ...(match.metadata?.issue_tags ?? []),
      ...(match.metadata?.positive_tags ?? []),
    ]);
    return {
      event_id: event.id,
      user_id: userId,
      round_number: (index % 5) + 1,
      opponent_deck_name: match.opponent_archetype,
      result: match.result,
      match_score:
        event.match_structure === "bo3"
          ? match.result === "win"
            ? pick(["2-0", "2-1"])
            : match.result === "loss"
              ? pick(["1-2", "0-2"])
              : pick(["1-1", "1-1-1"])
          : "BO1",
      went_first: match.went_first,
      tags,
      notes: `${AUDIT_RUN_ID}: linked event round ${index + 1}`,
      match_id: match.id,
    };
  });

  for (let index = 0; index < rounds.length; index += 100) {
    const batch = rounds.slice(index, index + 100);
    const { error } = await admin.from("event_rounds").insert(batch);
    if (error) throw new Error(`Unable to insert event rounds: ${error.message}`);
  }

  return events;
}

async function fetchAuditRows(userId, hasTestingBlocks) {
  const matchSelect = hasTestingBlocks
    ? "id, deck_version_id, opponent_archetype, result, went_first, event_type, metadata, testing_block_id, played_at"
    : "id, deck_version_id, opponent_archetype, result, went_first, event_type, metadata, played_at";
  const { data: matches, error: matchError } = await admin
    .from("matches")
    .select(matchSelect)
    .eq("user_id", userId)
    .like("notes", `${AUDIT_RUN_ID}%`)
    .order("played_at", { ascending: true });
  if (matchError) throw new Error(`Unable to fetch matches: ${matchError.message}`);

  const auditMatches = (matches ?? []).filter(
    (match) => match.metadata?.audit_run_id === AUDIT_RUN_ID
  );
  const matchIds = auditMatches.map((match) => match.id);
  const eventRounds = [];
  for (let index = 0; index < matchIds.length; index += 200) {
    const batch = matchIds.slice(index, index + 200);
    if (!batch.length) continue;
    const { data, error } = await admin
      .from("event_rounds")
      .select("id, event_id, match_id, round_number, opponent_deck_name, result, match_score, tags")
      .in("match_id", batch);
    if (error) throw new Error(`Unable to fetch event rounds: ${error.message}`);
    eventRounds.push(...data);
  }

  return { matches: auditMatches, eventRounds };
}

function buildAnalyticsAudit(matches, eventRounds, testingBlock) {
  const failures = [];
  const warnings = [];
  const bySource = new Map();
  const byOpponent = new Map();
  const ids = new Set();
  let duplicateIds = 0;

  for (const match of matches) {
    const source = match.metadata?.source ?? "unknown";
    bySource.set(source, (bySource.get(source) ?? 0) + 1);

    if (ids.has(match.id)) duplicateIds += 1;
    ids.add(match.id);

    const opponent = match.opponent_archetype;
    const current = byOpponent.get(opponent) ?? { win: 0, loss: 0, tie: 0, total: 0 };
    current[match.result] += 1;
    current.total += 1;
    byOpponent.set(opponent, current);
  }

  const breakdown = Object.fromEntries(bySource.entries());
  const imported = matches.filter((match) => match.metadata?.source === "tcg_live_import");
  const manual = matches.filter((match) => match.metadata?.source === "manual");
  const importedWithCards = imported.filter(
    (match) =>
      match.metadata?.tcg_live_cards_seen?.length ||
      match.metadata?.tcg_live_cards_used?.length ||
      match.metadata?.tcg_live_cards_discarded?.length
  );
  const importedWithPrizeRace = imported.filter((match) => match.metadata?.prizeRace);
  const ambiguousPrizeFixtures = imported.filter(
    (match) => match.metadata?.ambiguous_prize_reference_fixture
  );
  const ambiguousWithPrizeRace = ambiguousPrizeFixtures.filter((match) => match.metadata?.prizeRace);

  if (matches.length !== 1000) failures.push("Expected 1000 audit matches.");
  if ((breakdown.tcg_live_import ?? 0) !== 600) failures.push("Expected 600 imported matches.");
  if ((breakdown.manual ?? 0) !== 300) failures.push("Expected 300 manual matches.");
  if ((breakdown.event_round ?? 0) !== 100) failures.push("Expected 100 event-linked matches.");
  if (duplicateIds) failures.push(`Unexpected duplicate match ids: ${duplicateIds}`);
  if (eventRounds.length !== 100) failures.push("Expected 100 linked event rounds.");
  if (importedWithCards.length < 590) failures.push("Imported card activity metadata missing.");
  if (manual.some((match) => match.metadata?.tcg_live_cards_seen?.length)) {
    failures.push("Manual matches should not include imported card activity metadata.");
  }
  if (importedWithPrizeRace.length < 500) failures.push("Expected reliable prizeRace metadata on most imported logs.");
  if (ambiguousWithPrizeRace.length) {
    failures.push("Ambiguous prize fixtures generated prizeRace metadata.");
  }

  const blockMatches = testingBlock
    ? matches.filter((match) => match.testing_block_id === testingBlock.id)
    : [];
  if (testingBlock && blockMatches.length < 5) {
    failures.push("Focused testing block did not receive linked matches.");
  }
  if (!testingBlock) {
    warnings.push("Focused testing block checks skipped because testing_blocks is unavailable in this database.");
  }

  const matchupSummaries = Array.from(byOpponent.entries())
    .map(([opponent, counts]) => ({
      opponent,
      record: recordString(counts),
      games: counts.total,
      winRate: counts.win / counts.total,
      confidence: getConfidenceLabel(counts.total),
      interpretation: getInterpretation({ wins: counts.win, total: counts.total }),
    }))
    .sort((left, right) => right.games - left.games || left.opponent.localeCompare(right.opponent));

  const nearEvenHighSample = matchupSummaries.find(
    (summary) => summary.games >= 20 && summary.winRate >= 0.45 && summary.winRate <= 0.6
  );
  if (nearEvenHighSample?.interpretation.includes("Do not overreact")) {
    failures.push("High-sample near-even matchup was treated like low sample.");
  }
  if (!matchupSummaries.some((summary) => summary.interpretation.includes("Problem matchup"))) {
    failures.push("No useful/strong problem matchup surfaced from seeded data.");
  }

  if (matchupSummaries.length < 10) warnings.push("Expected at least 10 opponent archetypes.");

  return {
    failures,
    warnings,
    breakdown,
    importedWithCards: importedWithCards.length,
    importedWithPrizeRace: importedWithPrizeRace.length,
    ambiguousPrizeFixtures: ambiguousPrizeFixtures.length,
    ambiguousWithPrizeRace: ambiguousWithPrizeRace.length,
    testingBlockMatches: blockMatches.length,
    eventRoundsLinked: eventRounds.length,
    matchupSummaries,
  };
}

async function canReach(url) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 90000) {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(
    `Timed out waiting for audit server at ${url}${
      lastError instanceof Error ? ` (${lastError.message})` : ""
    }${localAuditServerLogs ? `\nServer logs:\n${localAuditServerLogs}` : ""}`
  );
}

async function ensureAuditServer() {
  if (BASE_URL) return;

  const existingDevUrl = "http://127.0.0.1:3000";
  if (await canReach(`${existingDevUrl}/login`)) {
    BASE_URL = existingDevUrl;
    return;
  }

  const port = 3100;
  BASE_URL = `http://127.0.0.1:${port}`;
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
          { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] }
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
  if (!localAuditServer?.pid) return;
  const pid = localAuditServer.pid;
  localAuditServer = null;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const taskkill = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
        stdio: "ignore",
      });
      taskkill.on("close", resolve);
      taskkill.on("error", resolve);
    });
    return;
  }
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    // ignore
  }
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL(/\/dashboard|\/onboarding|\/decks|\/matches/, { timeout: 60000 });
}

async function auditRoutes(deckId) {
  await ensureAuditServer();
  ensureDir(SCREENSHOT_DIR);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const page = await context.newPage();
  const consoleMessages = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/_next\/webpack-hmr|WebSocket connection to .*webpack-hmr/i.test(text)) {
      return;
    }
    if (message.type() === "error" || /hydration|supabase|permission|rls|key/i.test(text)) {
      consoleMessages.push({ type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    consoleMessages.push({ type: "pageerror", text: error.message });
  });

  const routeTimings = [];
  try {
    await login(page);
    const routes = [
      "/dashboard",
      "/matches",
      "/matches/new",
      "/matchups",
      "/review",
      "/testing",
      "/events",
      "/decks",
      `/decks/${deckId}`,
    ];

    for (const route of routes) {
      const startedAt = Date.now();
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "load", timeout: 90000 });
      const elapsedMs = Date.now() - startedAt;
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 2
      );
      const bodyText = await page.locator("body").innerText({ timeout: 10000 });
      routeTimings.push({
        route,
        elapsedMs,
        horizontalOverflow: overflow,
        hasAppError: /Application error|Unhandled Runtime Error|Hydration failed/i.test(bodyText),
      });
      if (overflow || /Application error|Unhandled Runtime Error|Hydration failed/i.test(bodyText)) {
        await page.screenshot({
          path: join(SCREENSHOT_DIR, `${route.replace(/[^a-z0-9]+/gi, "_")}.png`),
          fullPage: true,
        });
      }
    }
  } finally {
    await context.close();
    await browser.close();
    await stopAuditServer();
  }

  return { routeTimings, consoleMessages };
}

function buildReport({
  elapsedMs,
  userId,
  cleanup,
  analytics,
  ui,
  seedSummary,
  failures,
  warnings,
}) {
  const status = failures.length ? "FAILED" : "PASSED";
  const lines = [
    `# 1000-Match Logging Playtest Audit`,
    "",
    `Status: **${status}**`,
    `Run id: \`${AUDIT_RUN_ID}\``,
    `Supabase host: \`${supabaseHost}\``,
    `Test account: \`${TEST_EMAIL}\``,
    `User id: \`${userId}\``,
    `Elapsed: ${(elapsedMs / 1000).toFixed(1)}s`,
    "",
    "## Safety",
    "",
    "- Audit rows were written only for the configured Playwright test account.",
    "- Prior cleanup only removed rows tagged with the `playtest_1000_logging_` audit prefix or decks/events with the audit prefix.",
    "- No production/beta user rows outside that test account were queried for deletion.",
    "",
    "## Seed Result",
    "",
    `- Attempted matches: ${seedSummary.attemptedMatches}`,
    `- Saved matches: ${seedSummary.savedMatches}`,
    `- Imported logs: ${analytics.breakdown.tcg_live_import ?? 0}`,
    `- Manual matches: ${analytics.breakdown.manual ?? 0}`,
    `- Event-linked matches: ${analytics.breakdown.event_round ?? 0}`,
    `- Events created: ${seedSummary.eventsCreated}`,
    `- Decks created: ${seedSummary.decksCreated}`,
    `- Versions created: ${seedSummary.versionsCreated}`,
    `- Focused testing block linked matches: ${analytics.testingBlockMatches}`,
    "",
    "## Parser / Metadata Checks",
    "",
    `- Imported matches with card activity metadata: ${analytics.importedWithCards}`,
    `- Imported matches with prize race metadata: ${analytics.importedWithPrizeRace}`,
    `- Ambiguous prize fixtures: ${analytics.ambiguousPrizeFixtures}`,
    `- Ambiguous prize fixtures incorrectly creating prizeRace: ${analytics.ambiguousWithPrizeRace}`,
    "- Product parser regression coverage is also exercised by the full E2E parser tests run after this audit.",
    "",
    "## Analytics Checks",
    "",
    `- Event rounds linked: ${analytics.eventRoundsLinked}`,
    `- Opponent archetypes: ${analytics.matchupSummaries.length}`,
    "",
    "| Matchup | Record | Games | Win rate | Label |",
    "| --- | ---: | ---: | ---: | --- |",
    ...analytics.matchupSummaries.slice(0, 12).map((summary) => {
      return `| ${summary.opponent} | ${summary.record} | ${summary.games} | ${Math.round(
        summary.winRate * 100
      )}% | ${summary.interpretation} |`;
    }),
    "",
    "## UI / Route Timings",
    "",
    "| Route | Load ms | Horizontal overflow | App error |",
    "| --- | ---: | --- | --- |",
    ...ui.routeTimings.map(
      (route) =>
        `| ${route.route} | ${route.elapsedMs} | ${route.horizontalOverflow ? "yes" : "no"} | ${
          route.hasAppError ? "yes" : "no"
        } |`
    ),
    "",
    "## Console / Runtime",
    "",
    ui.consoleMessages.length
      ? ui.consoleMessages.map((message) => `- ${message.type}: ${message.text}`).join("\n")
      : "- No product console/page errors captured during route checks.",
    "",
    "## Cleanup Before Run",
    "",
    `- Matches removed: ${cleanup.matches}`,
    `- Events removed: ${cleanup.events}`,
    `- Testing blocks removed: ${cleanup.testingBlocks}`,
    `- Decks removed: ${cleanup.decks}`,
    "",
    "## Failures",
    "",
    failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None",
    "",
    "## Warnings",
    "",
    warnings.length ? warnings.map((warning) => `- ${warning}`).join("\n") : "- None",
    "",
    "## Recommended Next Action",
    "",
    failures.length
      ? "Fix blocker/major failures above, then rerun this audit and the standard validation suite."
      : "Proceed with standard validation and keep this report as an uncommitted generated artifact unless you explicitly want to commit audit results.",
    "",
  ];

  return `${lines.join("\n")}\n`;
}

async function main() {
  const startedAt = Date.now();
  const failures = [];
  const warnings = [];
  let user;
  let cleanup;
  let seedSummary;
  let analytics;
  let ui;

  try {
    user = await getTestUser();
    cleanup = await cleanupPriorAuditRows(user.id);
    const deckRows = await insertDecks(user.id);
    const testingBlock = await insertTestingBlock(user.id, deckRows);
    const matchPlan = buildMatchPlan(deckRows, testingBlock);
    const savedMatches = await insertMatches(user.id, matchPlan);
    const eventMatches = savedMatches.filter((match) => match.metadata?.source === "event_round");
    const events = await insertEvents(user.id, deckRows, eventMatches);
    const { matches, eventRounds } = await fetchAuditRows(user.id, Boolean(testingBlock));
    analytics = buildAnalyticsAudit(matches, eventRounds, testingBlock);
    failures.push(...analytics.failures);
    warnings.push(...analytics.warnings);

    ui = await auditRoutes(deckRows[0].id);
    const uiFailures = ui.routeTimings
      .filter((route) => route.horizontalOverflow || route.hasAppError)
      .map((route) => `${route.route} layout/runtime failure`);
    failures.push(...uiFailures);
    if (ui.consoleMessages.length) {
      failures.push("Console/page errors were captured during route checks.");
    }

    seedSummary = {
      attemptedMatches: matchPlan.length,
      savedMatches: matches.length,
      eventsCreated: events.length,
      decksCreated: deckRows.length,
      versionsCreated: deckRows.reduce((count, deck) => count + deck.versions.length, 0),
    };

    if (seedSummary.savedMatches !== seedSummary.attemptedMatches) {
      failures.push("Saved match count did not match attempted match count.");
    }

    writeJson("audit-data.json", {
      runId: AUDIT_RUN_ID,
      supabaseHost,
      testEmail: TEST_EMAIL,
      userId: user.id,
      cleanup,
      seedSummary,
      analytics,
      ui,
      elapsedMs: Date.now() - startedAt,
    });
    writeJson("parser-summary.json", {
      importedLogs: analytics.breakdown.tcg_live_import ?? 0,
      importedWithCards: analytics.importedWithCards,
      importedWithPrizeRace: analytics.importedWithPrizeRace,
      ambiguousPrizeFixtures: analytics.ambiguousPrizeFixtures,
      ambiguousWithPrizeRace: analytics.ambiguousWithPrizeRace,
    });
    writeJson("failures.json", failures.map((message) => ({ message })));
    writeText(
      "report.md",
      buildReport({
        elapsedMs: Date.now() - startedAt,
        userId: user.id,
        cleanup,
        analytics,
        ui,
        seedSummary,
        failures,
        warnings,
      })
    );

    console.log(`1000-match logging audit ${failures.length ? "FAILED" : "PASSED"}`);
    console.log(`Report: results/playtest_1000_audit/report.md`);
    if (failures.length) {
      failures.forEach((failure) => console.error(`- ${failure}`));
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack || error.message : String(error);
    ensureDir(OUT_DIR);
    writeJson("failures.json", [{ message }]);
    writeText(
      "report.md",
      `# 1000-Match Logging Playtest Audit\n\nStatus: **FAILED**\n\n${message}\n`
    );
    console.error(message);
    process.exitCode = 1;
  } finally {
    await stopAuditServer();
  }
}

await main();
