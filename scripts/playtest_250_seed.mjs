import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const RESULTS_DIR = join(ROOT, "results");
const DOCS_DIR = join(ROOT, "docs");

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
const SUPABASE_URL = ENV.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = ENV.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = ENV.PLAYWRIGHT_TEST_EMAIL || "pokeleaguenl@gmail.com";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function isoDateTime(value) {
  return value.toISOString();
}

function makeRng(seed = 200) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = makeRng(200);

function pick(values) {
  return values[Math.floor(random() * values.length)];
}

function pickWeighted(pairs) {
  const total = pairs.reduce((sum, [, weight]) => sum + weight, 0);
  let cursor = random() * total;

  for (const [value, weight] of pairs) {
    cursor -= weight;
    if (cursor <= 0) {
      return value;
    }
  }

  return pairs[pairs.length - 1][0];
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function lower(value) {
  return value.trim().toLowerCase();
}

function asTurnOrder(value) {
  if (value === true) return "first";
  if (value === false) return "second";
  return "unknown";
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

function playedAtFor(index) {
  const base = new Date("2026-04-18T10:00:00.000Z");
  const dayOffset = index % 56;
  const hour = 9 + (index % 11);
  const minute = (index * 13) % 60;
  const date = new Date(base);
  date.setUTCDate(base.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, 0, 0);
  return isoDateTime(date);
}

async function getTestUser() {
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(`Unable to list users: ${error.message}`);
    }

    const match = data.users.find((user) => user.email === TEST_EMAIL);
    if (match) {
      return match;
    }

    if (!data.users.length || data.users.length < 200) {
      break;
    }

    page += 1;
  }

  throw new Error(`Test account ${TEST_EMAIL} was not found.`);
}

async function inspectCounts(userId) {
  const counts = {};

  for (const table of ["decks", "matches", "matchup_notes", "shared_reports"]) {
    const { count, error } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      counts[table] = `error: ${error.message}`;
    } else {
      counts[table] = count ?? 0;
    }
  }

  const { data: deckRows, error: deckError } = await admin
    .from("decks")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (deckError) {
    throw new Error(`Unable to inspect decks: ${deckError.message}`);
  }

  const deckIds = deckRows.map((deck) => deck.id);
  if (deckIds.length) {
    const { count: versionCount, error: versionError } = await admin
      .from("deck_versions")
      .select("*", { count: "exact", head: true })
      .in("deck_id", deckIds);

    if (versionError) {
      throw new Error(`Unable to inspect deck versions: ${versionError.message}`);
    }

    counts.deck_versions = versionCount ?? 0;
  } else {
    counts.deck_versions = 0;
  }

  const { data: matchRows, error: matchError } = await admin
    .from("matches")
    .select("id")
    .eq("user_id", userId);

  if (matchError) {
    throw new Error(`Unable to inspect matches: ${matchError.message}`);
  }

  const matchIds = matchRows.map((match) => match.id);
  if (matchIds.length) {
    const { count: tagCount, error: tagError } = await admin
      .from("match_tags")
      .select("*", { count: "exact", head: true })
      .in("match_id", matchIds);

    if (tagError) {
      throw new Error(`Unable to inspect match_tags: ${tagError.message}`);
    }

    counts.match_tags = tagCount ?? 0;
  } else {
    counts.match_tags = 0;
  }

  return {
    counts,
    decks: deckRows,
    matchIds,
    deckIds,
  };
}

async function cleanUserData(userId) {
  const pre = await inspectCounts(userId);

  const { error: reportDeleteError } = await admin
    .from("shared_reports")
    .delete()
    .eq("user_id", userId);

  if (reportDeleteError) {
    throw new Error(`Unable to delete shared_reports: ${reportDeleteError.message}`);
  }

  if (pre.matchIds.length) {
    const { error: tagDeleteError } = await admin
      .from("match_tags")
      .delete()
      .in("match_id", pre.matchIds);

    if (tagDeleteError) {
      throw new Error(`Unable to delete match_tags: ${tagDeleteError.message}`);
    }
  }

  const { error: matchesDeleteError } = await admin
    .from("matches")
    .delete()
    .eq("user_id", userId);

  if (matchesDeleteError) {
    throw new Error(`Unable to delete matches: ${matchesDeleteError.message}`);
  }

  if (pre.deckIds.length) {
    const { error: versionDeleteError } = await admin
      .from("deck_versions")
      .delete()
      .in("deck_id", pre.deckIds);

    if (versionDeleteError) {
      throw new Error(`Unable to delete deck_versions: ${versionDeleteError.message}`);
    }
  }

  const { error: deckDeleteError } = await admin
    .from("decks")
    .delete()
    .eq("user_id", userId);

  if (deckDeleteError) {
    throw new Error(`Unable to delete decks: ${deckDeleteError.message}`);
  }

  const { error: matchupNotesError } = await admin
    .from("matchup_notes")
    .delete()
    .eq("user_id", userId);

  if (matchupNotesError) {
    console.warn(`  matchup_notes cleanup warning: ${matchupNotesError.message}`);
  }

  const { error: profileStatsError } = await admin
    .from("profile_public_stats")
    .delete()
    .eq("user_id", userId);

  if (profileStatsError) {
    console.warn(`  profile_public_stats cleanup warning: ${profileStatsError.message}`);
  }

  return pre;
}

const CLEAN_RAGING_BOLT_LIST = `Pokemon (18)
4 Raging Bolt ex
4 Teal Mask Ogerpon ex
2 Fezandipiti ex
2 Munkidori
1 Radiant Greninja
1 Lumineon V
1 Manaphy
1 Squawkabilly ex
1 Mew ex
1 Iron Bundle

Trainer (31)
4 Nest Ball
4 Ultra Ball
4 Earthen Vessel
3 Professor Sada's Vitality
3 Iono
2 Boss's Orders
2 Trekking Shoes
2 Night Stretcher
2 Counter Catcher
2 Pokestop
1 Switch Cart
1 Prime Catcher
1 Super Rod

Energy (11)
7 Lightning Energy
4 Fighting Energy`;

const CLEAN_RAGING_BOLT_V2 = `${CLEAN_RAGING_BOLT_LIST}

# Trimmed one flex slot into another Vessel package`;

const CLEAN_RAGING_BOLT_V3 = `${CLEAN_RAGING_BOLT_LIST}

# Added bench protection and cleaner recovery lines`;

const INCOMPLETE_DRAGAPULT_LIST = `Pokemon (15)
4 Dreepy
3 Drakloak
2 Dragapult ex
2 Duskull
2 Dusclops
1 Dusknoir
1 Fezandipiti ex

Trainer (20)
4 Nest Ball
4 Ultra Ball
3 Rare Candy
2 Iono
2 Boss's Orders
2 Buddy-Buddy Poffin
2 Night Stretcher
1 Artazon

Energy (8)
8 Psychic Energy`;

const CLEAN_DRAGAPULT_LIST = `Pokemon (18)
4 Dreepy
4 Drakloak
3 Dragapult ex
2 Duskull
2 Dusclops
1 Dusknoir
1 Fezandipiti ex
1 Mew ex

Trainer (32)
4 Buddy-Buddy Poffin
4 Nest Ball
4 Ultra Ball
3 Rare Candy
3 Iono
2 Boss's Orders
2 Night Stretcher
2 Counter Catcher
2 Artazon
2 Professor's Research
1 Prime Catcher
1 Switch
1 Super Rod
1 Temple of Sinnoh

Energy (10)
10 Psychic Energy`;

const DRAGAPULT_PRIZE_LIST = `${CLEAN_DRAGAPULT_LIST}

# Prize map oriented list with a narrower flex package`;

const CLEAN_GRENINJA_LIST = `Pokemon (17)
4 Froakie
3 Frogadier
3 Greninja ex
2 Pidgey
2 Pidgeot ex
1 Radiant Greninja
1 Manaphy
1 Lumineon V

Trainer (32)
4 Buddy-Buddy Poffin
4 Nest Ball
4 Ultra Ball
3 Iono
3 Irida
2 Boss's Orders
2 Night Stretcher
2 Rare Candy
2 Switch
2 Counter Catcher
2 Artazon
1 Prime Catcher
1 Lost Vacuum

Energy (11)
7 Water Energy
4 Double Turbo Energy`;

const CLEAN_CHARIZARD_LIST = `Pokemon (17)
4 Charmander
2 Charmeleon
3 Charizard ex
2 Pidgey
2 Pidgeot ex
1 Lumineon V
1 Manaphy
1 Mew ex
1 Rotom V

Trainer (33)
4 Buddy-Buddy Poffin
4 Nest Ball
4 Ultra Ball
3 Rare Candy
3 Iono
3 Boss's Orders
2 Arven
2 Counter Catcher
2 Super Rod
2 Artazon
1 Defiance Band
1 Prime Catcher
1 Canceling Cologne
1 Lost Vacuum

Energy (10)
7 Fire Energy
3 Double Turbo Energy`;

const CLEAN_GARDEVOIR_LIST = `Pokemon (19)
4 Ralts
3 Kirlia
2 Gardevoir ex
2 Drifloon
2 Scream Tail
1 Cresselia
1 Munkidori
1 Radiant Greninja
1 Manaphy
1 Flutter Mane
1 Lumineon V

Trainer (31)
4 Buddy-Buddy Poffin
4 Nest Ball
4 Ultra Ball
3 Rare Candy
3 Iono
2 Boss's Orders
2 Night Stretcher
2 Counter Catcher
2 Artazon
1 Super Rod
1 Prime Catcher
1 Secret Box
1 Pal Pad
1 Bravery Charm

Energy (10)
7 Psychic Energy
3 Reversal Energy`;

const CLEAN_GARDEVOIR_V2 = `${CLEAN_GARDEVOIR_LIST}

# Slightly cleaner recovery counts for longer control games`;

const ROGUE_UNRESOLVED_LIST = `Pokemon (19)
4 Iron Valiant ex
3 Mimikyu
2 Snorlax
2 Fezandipiti ex
2 Hawlucha
2 ??? fringe attacker
1 Lumineon V
1 Radiant Alakazam
1 Manaphy
1 Klefki

Trainer (25)
4 Nest Ball
4 Ultra Ball
3 Counter Catcher
3 Iono
2 Boss's Orders
2 Lost Vacuum
2 Switch
2 Buddy-Buddy Poffin
1 Town Store
1 Prime Catcher
1 Judge

Energy (13)
7 Psychic Energy
6 Darkness Energy`;

const ROGUE_TRIMMED_LIST = `Pokemon (18)
4 Iron Valiant ex
3 Mimikyu
2 Snorlax
2 Fezandipiti ex
2 Hawlucha
1 Lumineon V
1 Radiant Alakazam
1 Manaphy
1 Klefki
1 Spiritomb

Trainer (31)
4 Nest Ball
4 Ultra Ball
4 Buddy-Buddy Poffin
3 Counter Catcher
3 Iono
2 Boss's Orders
2 Lost Vacuum
2 Switch
2 Judge
2 Town Store
1 Prime Catcher
1 Rescue Board
1 Super Rod

Energy (11)
7 Psychic Energy
4 Double Turbo Energy`;

const CONTROL_LIST = `Pokemon (18)
3 Gholdengo ex
3 Gimmighoul
2 Mimikyu
2 Cornerstone Mask Ogerpon ex
2 Fezandipiti ex
1 Rotom V
1 Lumineon V
1 Manaphy
1 Klefki
1 Radiant Greninja
1 Iron Bundle

Trainer (31)
4 Buddy-Buddy Poffin
4 Nest Ball
4 Ultra Ball
3 Iono
3 Arven
2 Boss's Orders
2 Counter Catcher
2 Superior Energy Retrieval
2 Night Stretcher
1 Prime Catcher
1 Lost Vacuum
1 Temple of Sinnoh
1 Switch
1 Super Rod

Energy (11)
7 Metal Energy
4 Basic Psychic Energy`;

const EXPERIMENTAL_LIST = `Pokemon (18)
4 Miraidon ex
3 Iron Hands ex
2 Regieleki VMAX
2 Regieleki V
2 Fezandipiti ex
1 Lumineon V
1 Manaphy
1 Mew ex
1 Squawkabilly ex
1 Iron Bundle

Trainer (31)
4 Nest Ball
4 Ultra Ball
4 Electric Generator
3 Boss's Orders
3 Iono
2 Counter Catcher
2 Night Stretcher
2 Switch Cart
2 Beach Court
1 Prime Catcher
1 Lost Vacuum
1 Super Rod
1 Professor's Research
1 Rescue Board

Energy (11)
11 Lightning Energy`;

const EXPERIMENTAL_TRIMMED = `${EXPERIMENTAL_LIST}

# Testing a thinner Regieleki package for shorter races`;

const DECK_BLUEPRINTS = [
  {
    key: "ragingBolt",
    name: "Playtest 250 - Raging Bolt Lab",
    archetype: "Raging Bolt",
    versions: [
      {
        key: "v1_turbo",
        name: "v1 Turbo",
        decklist: CLEAN_RAGING_BOLT_LIST,
        notes: "Fast baseline list that still bricks too often into Greninja pressure.",
        is_active: false,
      },
      {
        key: "v2_vessel",
        name: "v2 Vessel Package",
        decklist: CLEAN_RAGING_BOLT_V2,
        notes: "Added extra vessel access to stabilize opening turns.",
        is_active: false,
      },
      {
        key: "v3_antibench",
        name: "v3 Anti-Bench",
        decklist: CLEAN_RAGING_BOLT_V3,
        notes: "Current active test version for the Mega Greninja leak.",
        is_active: true,
      },
    ],
  },
  {
    key: "dragapult",
    name: "Playtest 250 - Dragapult Dusknoir",
    archetype: "Dragapult",
    versions: [
      {
        key: "v1_bare",
        name: "v1 Bare Bones",
        decklist: INCOMPLETE_DRAGAPULT_LIST,
        notes: "Intentional 43-card incomplete list to test health warnings.",
        is_active: false,
      },
      {
        key: "v2_consistency",
        name: "v2 Consistency",
        decklist: CLEAN_DRAGAPULT_LIST,
        notes: "Cleaner Drakloak counts and better opening stability.",
        is_active: true,
      },
      {
        key: "v3_prize",
        name: "v3 Prize Mapping",
        decklist: DRAGAPULT_PRIZE_LIST,
        notes: "Testing a greedier package for prizing lines.",
        is_active: false,
      },
    ],
  },
  {
    key: "greninja",
    name: "Playtest 250 - Mega Greninja Tempo",
    archetype: "Mega Greninja",
    versions: [
      {
        key: "v1_raw",
        name: "v1 Raw Tempo",
        decklist: CLEAN_GRENINJA_LIST,
        notes: "Initial tempo shell with rough sequencing.",
        is_active: false,
      },
      {
        key: "v2_clean",
        name: "v2 Cleaner Counts",
        decklist: `${CLEAN_GRENINJA_LIST}

# Cleaner support counts around the Frogadier stage`,
        notes: "Refined build with better support counts and stronger tech retention.",
        is_active: true,
      },
    ],
  },
  {
    key: "charizard",
    name: "Playtest 250 - Charizard Pressure",
    archetype: "Charizard",
    versions: [
      {
        key: "v1_straight",
        name: "v1 Straight",
        decklist: CLEAN_CHARIZARD_LIST,
        notes: "Straight list used before adjusting the control answers.",
        is_active: false,
      },
      {
        key: "v2_itemlock",
        name: "v2 Item Lock Prep",
        decklist: `${CLEAN_CHARIZARD_LIST}

# Slightly more respect for Item Lock and going-first races`,
        notes: "Current active version with extra Item Lock respect.",
        is_active: true,
      },
    ],
  },
  {
    key: "rogueBox",
    name: "Playtest 250 - Rogue Box",
    archetype: "Unknown",
    versions: [
      {
        key: "v1_meta",
        name: "v1 Meta Soup",
        decklist: ROGUE_UNRESOLVED_LIST,
        notes: "Intentional unresolved list to test edit-and-fix flows.",
        is_active: false,
      },
      {
        key: "v2_trimmed",
        name: "v2 Trimmed Soup",
        decklist: ROGUE_TRIMMED_LIST,
        notes: "Still noisy, but at least parseable and usable.",
        is_active: true,
      },
    ],
  },
  {
    key: "controlLab",
    name: "Playtest 250 - Control Counterlab",
    archetype: "Gholdengo",
    versions: [
      {
        key: "v1_counter",
        name: "v1 Counter Package",
        decklist: CONTROL_LIST,
        notes: "Trying to survive Item Lock without giving up the mirror.",
        is_active: false,
      },
      {
        key: "v2_ladder",
        name: "v2 Ladder Tech",
        decklist: `${CONTROL_LIST}

# Slightly softer control package for ladder and locals`,
        notes: "Experimental list for softer queues and weird locals.",
        is_active: true,
      },
    ],
  },
  {
    key: "gardevoir",
    name: "Playtest 250 - Gardevoir Refinement",
    archetype: "Gardevoir",
    versions: [
      {
        key: "v1_baseline",
        name: "v1 Baseline",
        decklist: CLEAN_GARDEVOIR_LIST,
        notes: "Baseline Gardevoir list before the recovery cleanup.",
        is_active: false,
      },
      {
        key: "v2_recovery",
        name: "v2 Recovery",
        decklist: CLEAN_GARDEVOIR_V2,
        notes: "Current list with cleaner recovery and tech retention.",
        is_active: true,
      },
    ],
  },
  {
    key: "experimental",
    name: "Playtest 250 - Experimental Turbo",
    archetype: "Miraidon",
    versions: [
      {
        key: "v1_fullsend",
        name: "v1 Full Send",
        decklist: EXPERIMENTAL_LIST,
        notes: "High-variance electric shell with too many moving parts.",
        is_active: false,
      },
      {
        key: "v2_trimmed",
        name: "v2 Trimmed",
        decklist: EXPERIMENTAL_TRIMMED,
        notes: "Still noisy, but cleaner for short race testing.",
        is_active: true,
      },
    ],
  },
];

async function createDecksAndVersions(userId) {
  const created = {};

  for (const deck of DECK_BLUEPRINTS) {
    const { data: createdDeck, error: deckError } = await admin
      .from("decks")
      .insert({
        user_id: userId,
        name: deck.name,
        archetype: deck.archetype,
      })
      .select("id")
      .single();

    if (deckError) {
      throw new Error(`Unable to create deck "${deck.name}": ${deckError.message}`);
    }

    created[deck.key] = {
      deckId: createdDeck.id,
      name: deck.name,
      archetype: deck.archetype,
      versions: {},
    };

    for (const version of deck.versions) {
      const { data: createdVersion, error: versionError } = await admin
        .from("deck_versions")
        .insert({
          deck_id: createdDeck.id,
          name: version.name,
          decklist: version.decklist,
          notes: version.notes,
          is_active: version.is_active,
        })
        .select("id")
        .single();

      if (versionError) {
        throw new Error(
          `Unable to create version "${version.name}": ${versionError.message}`
        );
      }

      created[deck.key].versions[version.key] = {
        id: createdVersion.id,
        name: version.name,
        is_active: version.is_active,
      };
    }
  }

  return created;
}

function buildMatch({
  userId,
  deckKey,
  deckName,
  versionKey,
  versionName,
  deckVersionId,
  opponent,
  result,
  wentFirst,
  startQuality,
  openingHandQuality,
  sequencingQuality,
  issueTags,
  positiveTags,
  cardsShined,
  cardsFailed,
  notes,
  playedAt,
  gameContext = "testing",
  testingSessionName = null,
  focusMatchup = null,
  eventName = null,
  roundNumber = null,
}) {
  return {
    deckKey,
    deckName,
    versionKey,
    versionName,
    insert: {
      user_id: userId,
      deck_version_id: deckVersionId,
      opponent_archetype: opponent,
      result,
      went_first: wentFirst,
      event_type: gameContext === "competitive" ? "tournament" : "testing",
      played_at: playedAt,
      metadata: {
        game_context: gameContext,
        testing_session_name: testingSessionName,
        focus_matchup: focusMatchup,
        event_name: eventName,
        round_number: roundNumber,
        start_quality: startQuality,
        opening_hand_quality: openingHandQuality,
        sequencing_quality: sequencingQuality,
        issue_tags: issueTags,
        positive_tags: positiveTags,
        cards_shined: cardsShined,
        cards_failed: cardsFailed,
      },
      notes,
    },
  };
}

function makeNotes({ result, opponent, issueTags, positiveTags, versionName, deckName, sequence }) {
  const lossTemplates = [
    `Lost to ${opponent}. ${issueTags[0] || "Setup pressure"} snowballed before ${deckName} stabilized.`,
    `${versionName} dropped a game to ${opponent}. ${issueTags.slice(0, 2).join(" and ")} showed up again.`,
    `Another ${opponent} loss. Need to review ${issueTags[0] || "turn two sequencing"} before the next sample.`,
  ];

  const winTemplates = [
    `Beat ${opponent}. ${positiveTags[0] || "Clean setup"} carried the middle turns.`,
    `${versionName} held together into ${opponent}. ${positiveTags.slice(0, 2).join(" and ")} were real.`,
    `Win vs ${opponent}. ${positiveTags[0] || "The tech package"} mattered more than expected.`,
  ];

  const tieTemplates = [
    `Timed tie vs ${opponent}. Game stayed close but the prize race never broke open.`,
    `${opponent} tie. Need one cleaner turn to convert this sample into a read.`,
  ];

  if (result === "loss") {
    return lossTemplates[sequence % lossTemplates.length];
  }

  if (result === "win") {
    return winTemplates[sequence % winTemplates.length];
  }

  return tieTemplates[sequence % tieTemplates.length];
}

function generateSeedMatches(userId, created) {
  const records = [];
  let index = 0;

  function pushMatch(deckKey, versionKey, config) {
    const deck = created[deckKey];
    const version = deck.versions[versionKey];
    const record = buildMatch({
      userId,
      deckKey,
      deckName: deck.name,
      versionKey,
      versionName: version.name,
      deckVersionId: version.id,
      ...config,
      playedAt: playedAtFor(index),
    });
    records.push(record);
    index += 1;
  }

  function tagSet(result, baseIssues = [], basePositives = []) {
    const issues = [...baseIssues];
    const positives = [...basePositives];

    if (result === "loss") {
      if (issues.length < 2) {
        issues.push(pick(["missed setup", "poor prize trade", "supporter drought", "tempo loss"]));
      }
      if (issues.length < 2) {
        issues.push(pick(["bench pressure", "matchup knowledge", "bad sequencing", "energy issue"]));
      }
    }

    if (result === "win") {
      if (!positives.length) {
        positives.push(pick(["strong setup", "clean sequencing", "good prize plan"]));
      }
      if (positives.length < 2) {
        positives.push(pick(["key tech mattered", "strong recovery", "favorable matchup"]));
      }
    }

    if (result === "tie") {
      if (!issues.length && random() > 0.5) {
        issues.push(pick(["tempo loss", "supporter drought"]));
      }
      if (!positives.length && random() > 0.5) {
        positives.push(pick(["good prize plan", "strong recovery"]));
      }
    }

    return {
      issueTags: unique(issues),
      positiveTags: unique(positives),
    };
  }

  function buildSeries({
    deckKey,
    versionKey,
    opponent,
    games,
    resultPattern,
    turnPattern,
    qualityProfile,
    forcedIssueFn,
    forcedPositiveFn,
    cardsFn,
    contextFn,
  }) {
    for (let gameIndex = 0; gameIndex < games; gameIndex += 1) {
      const result = resultPattern(gameIndex);
      const wentFirst = turnPattern(gameIndex);
      const startQuality = qualityProfile.start(result, gameIndex);
      const openingHandQuality = qualityProfile.opening(result, gameIndex);
      const sequencingQuality = qualityProfile.sequencing(result, gameIndex);
      const forcedIssues = forcedIssueFn ? forcedIssueFn(result, gameIndex) : [];
      const forcedPositives = forcedPositiveFn ? forcedPositiveFn(result, gameIndex) : [];
      const { issueTags, positiveTags } = tagSet(result, forcedIssues, forcedPositives);
      const cards = cardsFn ? cardsFn(result, gameIndex) : { cardsShined: [], cardsFailed: [] };
      const extraContext = contextFn ? contextFn(result, gameIndex) : {};
      const deckName = created[deckKey].name;
      const versionName = created[deckKey].versions[versionKey].name;
      const notes = makeNotes({
        result,
        opponent,
        issueTags,
        positiveTags,
        versionName,
        deckName,
        sequence: gameIndex,
      });

      pushMatch(deckKey, versionKey, {
        opponent,
        result,
        wentFirst,
        startQuality,
        openingHandQuality,
        sequencingQuality,
        issueTags,
        positiveTags,
        cardsShined: cards.cardsShined,
        cardsFailed: cards.cardsFailed,
        notes,
        ...extraContext,
      });
    }
  }

  const badStartProfile = {
    start: (result) =>
      result === "loss"
        ? pickWeighted([
            ["bad", 4],
            ["okay", 4],
            ["good", 2],
            ["great", 1],
          ])
        : pickWeighted([
            ["great", 3],
            ["good", 4],
            ["okay", 2],
            ["bad", 1],
          ]),
    opening: (result) =>
      result === "loss"
        ? pickWeighted([
            ["bad", 3],
            ["okay", 4],
            ["good", 2],
            ["great", 1],
          ])
        : pickWeighted([
            ["great", 3],
            ["good", 4],
            ["okay", 2],
            ["bad", 1],
          ]),
    sequencing: () => pickWeighted([["great", 1], ["good", 4], ["okay", 3], ["bad", 2]]),
  };

  const stableProfile = {
    start: (result) =>
      result === "loss"
        ? pickWeighted([
            ["bad", 2],
            ["okay", 3],
            ["good", 3],
            ["great", 1],
          ])
        : pickWeighted([
            ["great", 3],
            ["good", 5],
            ["okay", 2],
            ["bad", 1],
          ]),
    opening: (result) =>
      result === "loss"
        ? pickWeighted([
            ["bad", 2],
            ["okay", 3],
            ["good", 3],
            ["great", 1],
          ])
        : pickWeighted([
            ["great", 2],
            ["good", 5],
            ["okay", 2],
            ["bad", 1],
          ]),
    sequencing: (result) =>
      result === "loss"
        ? pickWeighted([
            ["bad", 1],
            ["okay", 3],
            ["good", 4],
            ["great", 1],
          ])
        : pickWeighted([
            ["great", 2],
            ["good", 5],
            ["okay", 2],
            ["bad", 1],
          ]),
  };

  const sequencingLeakProfile = {
    start: () => pickWeighted([["great", 1], ["good", 4], ["okay", 3], ["bad", 2]]),
    opening: () => pickWeighted([["great", 1], ["good", 4], ["okay", 3], ["bad", 2]]),
    sequencing: (result) =>
      result === "loss"
        ? pickWeighted([
            ["bad", 5],
            ["okay", 4],
            ["good", 1],
          ])
        : pickWeighted([
            ["great", 2],
            ["good", 4],
            ["okay", 2],
            ["bad", 1],
          ]),
  };

  const evenProfile = {
    start: () => pick(QUALITY_VALUES),
    opening: () => pick(QUALITY_VALUES),
    sequencing: () => pick(QUALITY_VALUES),
  };

  const QUALITY_VALUES = ["great", "good", "okay", "bad"];

  // Raging Bolt - 80 matches total
  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v1_turbo",
    opponent: "Mega Greninja",
    games: 14,
    resultPattern: (i) => (i < 2 ? "win" : i < 12 ? "loss" : "tie"),
    turnPattern: (i) => (i % 4 === 0 ? null : i % 2 === 0),
    qualityProfile: badStartProfile,
    forcedIssueFn: (result) =>
      result === "loss" ? ["bench pressure", "missed setup", "poor prize trade"] : [],
    forcedPositiveFn: (result) => (result === "win" ? ["strong setup"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Raging Bolt ex"] : [],
      cardsFailed: result === "loss" ? ["Battle VIP Pass"] : [],
    }),
    contextFn: (_result, i) => ({
      gameContext: i % 5 === 0 ? "competitive" : "testing",
      eventName: i % 5 === 0 ? "Midweek cup" : null,
      roundNumber: i % 5 === 0 ? String((i % 4) + 1) : null,
      testingSessionName: i % 5 === 0 ? null : "RB baseline week 1",
      focusMatchup: "Mega Greninja",
    }),
  });

  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v2_vessel",
    opponent: "Mega Greninja",
    games: 12,
    resultPattern: (i) => (i < 3 ? "win" : i < 11 ? "loss" : "tie"),
    turnPattern: (i) => (i % 3 === 0 ? false : i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) =>
      result === "loss" ? ["bench pressure", "missed setup"] : [],
    forcedPositiveFn: (result) => (result === "win" ? ["strong recovery"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Earthen Vessel"] : [],
      cardsFailed: result === "loss" ? ["Counter Catcher"] : [],
    }),
    contextFn: () => ({
      gameContext: "testing",
      testingSessionName: "RB vessel check",
      focusMatchup: "Mega Greninja",
    }),
  });

  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v3_antibench",
    opponent: "Mega Greninja",
    games: 14,
    resultPattern: (i) => (i < 4 ? "win" : i < 12 ? "loss" : "tie"),
    turnPattern: (i) => (i === 1 ? null : i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) =>
      result === "loss" ? ["bench pressure", "missed setup"] : [],
    forcedPositiveFn: (result) => (result === "win" ? ["key tech mattered"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Mimikyu"] : [],
      cardsFailed: result === "loss" ? ["Switch Cart"] : [],
    }),
    contextFn: () => ({
      gameContext: "testing",
      testingSessionName: "RB anti-bench mission",
      focusMatchup: "Mega Greninja",
    }),
  });

  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v2_vessel",
    opponent: "Dragapult Dusknoir",
    games: 12,
    resultPattern: (i) => (i < 4 ? "loss" : i === 4 ? "tie" : "win"),
    turnPattern: (i) => (i % 3 === 0 ? null : i % 2 === 0),
    qualityProfile: badStartProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["missed setup"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["good prize plan"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Teal Mask Ogerpon ex"] : [],
      cardsFailed: result === "loss" ? ["Lumineon V"] : [],
    }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "RB spread check" }),
  });

  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v2_vessel",
    opponent: "Charizard ex",
    games: 10,
    resultPattern: (i) => (i < 6 ? "win" : i < 9 ? "loss" : "tie"),
    turnPattern: (i) => (i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["poor prize trade"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["Good Tech"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Munkidori"] : [],
      cardsFailed: result === "loss" ? ["Boss's Orders"] : [],
    }),
    contextFn: (_result, i) => ({
      gameContext: i % 4 === 0 ? "competitive" : "testing",
      eventName: i % 4 === 0 ? "League challenge" : null,
      roundNumber: i % 4 === 0 ? String((i % 3) + 1) : null,
      testingSessionName: i % 4 === 0 ? null : "RB charizard reps",
    }),
  });

  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v3_antibench",
    opponent: "Gardevoir",
    games: 10,
    resultPattern: (i) => (i < 5 ? "win" : i < 9 ? "loss" : "tie"),
    turnPattern: (i) => (i % 3 === 0 ? false : i % 2 === 0),
    qualityProfile: evenProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["tempo loss"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["good prize plan"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "RB gardevoir testing" }),
  });

  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v3_antibench",
    opponent: "Raging Bolt",
    games: 4,
    resultPattern: (i) => (i < 2 ? "win" : i === 2 ? "loss" : "tie"),
    turnPattern: (i) => (i % 3 === 0 ? false : true),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["prize map error"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["clean sequencing"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "RB mirror work" }),
  });

  buildSeries({
    deckKey: "ragingBolt",
    versionKey: "v3_antibench",
    opponent: "Rogue decks",
    games: 4,
    resultPattern: (i) => (i < 2 ? "win" : i === 2 ? "loss" : "tie"),
    turnPattern: () => null,
    qualityProfile: evenProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["matchup knowledge"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["favorable matchup"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "RB rogue sweep" }),
  });

  // Dragapult - 45 matches total
  buildSeries({
    deckKey: "dragapult",
    versionKey: "v1_bare",
    opponent: "Raging Bolt",
    games: 15,
    resultPattern: (i) => (i < 9 ? "loss" : i === 9 ? "tie" : "win"),
    turnPattern: (i) => (i % 3 === 0 ? null : i % 2 === 0),
    qualityProfile: sequencingLeakProfile,
    forcedIssueFn: (result) =>
      result === "loss" ? ["bad sequencing", "tempo loss"] : [],
    forcedPositiveFn: (result) => (result === "win" ? ["Good Tech"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Dusknoir"] : [],
      cardsFailed: result === "loss" ? ["Rare Candy"] : [],
    }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Dragapult shell audit" }),
  });

  buildSeries({
    deckKey: "dragapult",
    versionKey: "v2_consistency",
    opponent: "Mega Greninja",
    games: 10,
    resultPattern: (i) => (i < 4 ? "loss" : i === 4 ? "tie" : i < 8 ? "win" : "loss"),
    turnPattern: (i) => (i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["missed setup", "bad sequencing"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["Good Tech", "clean sequencing"] : []),
    cardsFn: () => ({ cardsShined: ["Dusknoir"], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Dragapult consistency check" }),
  });

  buildSeries({
    deckKey: "dragapult",
    versionKey: "v2_consistency",
    opponent: "Charizard ex",
    games: 10,
    resultPattern: (i) => (i < 5 ? "win" : i < 8 ? "loss" : i === 8 ? "tie" : "win"),
    turnPattern: (i) => (i % 2 === 0 ? false : true),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["poor prize trade"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["good prize plan"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Dragapult vs zard" }),
  });

  buildSeries({
    deckKey: "dragapult",
    versionKey: "v3_prize",
    opponent: "Gardevoir",
    games: 10,
    resultPattern: (i) => (i < 4 ? "win" : i < 8 ? "loss" : i === 8 ? "tie" : "win"),
    turnPattern: (i) => (i % 4 === 0 ? null : i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["prize map error"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["Good Tech"] : []),
    cardsFn: () => ({ cardsShined: ["Dragapult ex"], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Prize map reps" }),
  });

  // Mega Greninja - 20 matches total
  buildSeries({
    deckKey: "greninja",
    versionKey: "v1_raw",
    opponent: "Raging Bolt",
    games: 10,
    resultPattern: (i) => (i < 6 ? "win" : i < 8 ? "loss" : i === 8 ? "tie" : "win"),
    turnPattern: (i) => (i % 5 === 0 ? null : i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["supporter drought"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["key tech mattered", "strong setup"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Greninja ex"] : [],
      cardsFailed: result === "loss" ? ["Pidgeot ex"] : [],
    }),
    contextFn: (_result, i) => ({
      gameContext: i % 4 === 0 ? "competitive" : "testing",
      eventName: i % 4 === 0 ? "Sunday locals" : null,
      roundNumber: i % 4 === 0 ? String((i % 3) + 1) : null,
      testingSessionName: i % 4 === 0 ? null : "Greninja tempo week 1",
      focusMatchup: "Raging Bolt",
    }),
  });

  buildSeries({
    deckKey: "greninja",
    versionKey: "v2_clean",
    opponent: "Charizard ex",
    games: 10,
    resultPattern: (i) => (i < 6 ? "win" : i < 8 ? "loss" : i === 8 ? "tie" : "win"),
    turnPattern: (i) => (i % 3 === 0 ? null : i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["stadium lock"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["key tech mattered", "strong recovery"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Pidgeot ex"] : [],
      cardsFailed: result === "loss" ? ["Counter Catcher"] : [],
    }),
    contextFn: () => ({
      gameContext: "testing",
      testingSessionName: "Greninja refined reps",
      focusMatchup: "Charizard ex",
    }),
  });

  // Charizard - 35 matches total with visible turn-order signal
  buildSeries({
    deckKey: "charizard",
    versionKey: "v1_straight",
    opponent: "Mega Greninja",
    games: 12,
    resultPattern: (i) => (i < 4 ? "win" : i < 9 ? "loss" : i === 9 ? "tie" : "win"),
    turnPattern: (i) => (i < 7 ? true : i === 7 ? null : false),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["Item Lock", "missed setup"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["strong setup"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Charizard ex"] : [],
      cardsFailed: result === "loss" ? ["Rare Candy"] : [],
    }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Zard into frogs" }),
  });

  buildSeries({
    deckKey: "charizard",
    versionKey: "v2_itemlock",
    opponent: "Dragapult Dusknoir",
    games: 12,
    resultPattern: (i) => (i < 7 ? "win" : i < 10 ? "loss" : i === 10 ? "tie" : "win"),
    turnPattern: (i) => (i < 7 ? true : i === 7 ? null : false),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["Item Lock"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["Good Tech"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Canceling Cologne"] : [],
      cardsFailed: result === "loss" ? ["Buddy-Buddy Poffin"] : [],
    }),
    contextFn: () => ({ gameContext: "competitive", eventName: "League cup", roundNumber: "3" }),
  });

  buildSeries({
    deckKey: "charizard",
    versionKey: "v2_itemlock",
    opponent: "Control / Item Lock",
    games: 11,
    resultPattern: (i) => (i < 4 ? "win" : i < 9 ? "loss" : i === 9 ? "tie" : "win"),
    turnPattern: (i) => (i < 6 ? true : i % 3 === 0 ? null : false),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["Item Lock", "supporter drought"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["good prize plan"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Zard lock cleanup" }),
  });

  // Rogue Box - 10 matches total, intentionally noisy
  buildSeries({
    deckKey: "rogueBox",
    versionKey: "v1_meta",
    opponent: "Charizard ex",
    games: 5,
    resultPattern: (i) => (i === 0 ? "win" : i === 1 ? "loss" : i === 2 ? "tie" : i === 3 ? "loss" : "win"),
    turnPattern: (i) => (i % 2 === 0 ? null : i % 3 === 0),
    qualityProfile: evenProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["matchup knowledge"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["key tech mattered"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Rogue chaos" }),
  });

  buildSeries({
    deckKey: "rogueBox",
    versionKey: "v2_trimmed",
    opponent: "Mega Greninja",
    games: 5,
    resultPattern: (i) => (i === 0 ? "loss" : i === 1 ? "tie" : i === 2 ? "win" : i === 3 ? "loss" : "tie"),
    turnPattern: (i) => (i % 3 === 0 ? false : null),
    qualityProfile: evenProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["prize map error"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["strong recovery"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Rogue trimmed sample" }),
  });

  // Control Counterlab - 15 matches total, strong Item Lock loss tag signal
  buildSeries({
    deckKey: "controlLab",
    versionKey: "v1_counter",
    opponent: "Charizard ex",
    games: 9,
    resultPattern: (i) => (i < 1 ? "win" : i < 6 ? "loss" : i === 6 ? "tie" : "loss"),
    turnPattern: (i) => (i % 2 === 0 ? false : true),
    qualityProfile: stableProfile,
    forcedIssueFn: (result, i) =>
      result === "loss"
        ? i < 6
          ? ["Item Lock", "supporter drought"]
          : ["Item Lock"]
        : [],
    forcedPositiveFn: (result) => (result === "win" ? ["good prize plan"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Temple of Sinnoh"] : [],
      cardsFailed: result === "loss" ? ["Gholdengo ex"] : [],
    }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Counterlab lock reps" }),
  });

  buildSeries({
    deckKey: "controlLab",
    versionKey: "v2_ladder",
    opponent: "Raging Bolt",
    games: 6,
    resultPattern: (i) => (i < 2 ? "win" : i < 5 ? "loss" : "tie"),
    turnPattern: (i) => (i % 3 === 0 ? null : false),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["Item Lock"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["strong recovery"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Counterlab ladder mix" }),
  });

  // Gardevoir - 30 matches total with a strong positive tech pattern and visible version improvement
  buildSeries({
    deckKey: "gardevoir",
    versionKey: "v1_baseline",
    opponent: "Charizard ex",
    games: 12,
    resultPattern: (i) => (i < 4 ? "win" : i < 10 ? "loss" : "tie"),
    turnPattern: (i) => (i % 4 === 0 ? null : i % 2 === 0),
    qualityProfile: badStartProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["supporter drought", "poor prize trade"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["strong recovery"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Drifloon"] : [],
      cardsFailed: result === "loss" ? ["Rare Candy"] : [],
    }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Gardy baseline audit" }),
  });

  buildSeries({
    deckKey: "gardevoir",
    versionKey: "v2_recovery",
    opponent: "Mega Greninja",
    games: 10,
    resultPattern: (i) => (i < 6 ? "win" : i < 8 ? "loss" : i === 8 ? "tie" : "win"),
    turnPattern: (i) => (i % 3 === 0 ? false : i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["tempo loss"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["key tech mattered", "strong recovery"] : []),
    cardsFn: (result) => ({
      cardsShined: result === "win" ? ["Munkidori"] : [],
      cardsFailed: result === "loss" ? ["Counter Catcher"] : [],
    }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Gardy greninja plan", focusMatchup: "Mega Greninja" }),
  });

  buildSeries({
    deckKey: "gardevoir",
    versionKey: "v2_recovery",
    opponent: "Raging Bolt",
    games: 8,
    resultPattern: (i) => (i < 4 ? "win" : i < 7 ? "loss" : "tie"),
    turnPattern: (i) => (i % 5 === 0 ? null : i % 2 === 0),
    qualityProfile: stableProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["bench pressure"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["key tech mattered"] : []),
    cardsFn: () => ({ cardsShined: ["Bravery Charm"], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Gardy bolt cleanup" }),
  });

  // Experimental Turbo - 15 matches total, intentionally mixed and low-confidence
  buildSeries({
    deckKey: "experimental",
    versionKey: "v1_fullsend",
    opponent: "Charizard ex",
    games: 8,
    resultPattern: (i) => (i === 0 || i === 4 ? "win" : i === 2 || i === 6 ? "tie" : "loss"),
    turnPattern: (i) => (i % 4 === 0 ? null : i % 2 === 0),
    qualityProfile: evenProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["matchup knowledge"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["strong setup"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Experimental full send" }),
  });

  buildSeries({
    deckKey: "experimental",
    versionKey: "v2_trimmed",
    opponent: "Mega Greninja",
    games: 7,
    resultPattern: (i) => (i === 0 || i === 5 ? "win" : i === 3 ? "tie" : "loss"),
    turnPattern: (i) => (i % 3 === 0 ? false : null),
    qualityProfile: evenProfile,
    forcedIssueFn: (result) => (result === "loss" ? ["tempo loss"] : []),
    forcedPositiveFn: (result) => (result === "win" ? ["key tech mattered"] : []),
    cardsFn: () => ({ cardsShined: [], cardsFailed: [] }),
    contextFn: () => ({ gameContext: "testing", testingSessionName: "Experimental trimmed" }),
  });

  if (records.length !== 250) {
    throw new Error(`Expected 250 generated matches, received ${records.length}.`);
  }

  return records;
}

async function insertMatches(userId, records) {
  const insertedRows = [];

  for (let index = 0; index < records.length; index += 25) {
    const batch = records.slice(index, index + 25);
    const { data, error } = await admin
      .from("matches")
      .insert(batch.map((record) => record.insert))
      .select("id, notes, played_at");

    if (error) {
      throw new Error(`Unable to insert matches batch ${index}: ${error.message}`);
    }

    const tagRows = [];

    data.forEach((row, batchIndex) => {
      const record = batch[batchIndex];
      const issueTags = record.insert.metadata.issue_tags || [];
      const positiveTags = record.insert.metadata.positive_tags || [];

      for (const tag of unique([...issueTags, ...positiveTags])) {
        tagRows.push({ match_id: row.id, tag });
      }

      insertedRows.push({
        ...record,
        matchId: row.id,
      });
    });

    if (tagRows.length) {
      const { error: tagError } = await admin.from("match_tags").insert(tagRows);
      if (tagError) {
        throw new Error(`Unable to insert match_tags batch ${index}: ${tagError.message}`);
      }
    }
  }

  return insertedRows;
}

async function fetchSeededData(userId) {
  const { data: decks, error: deckError } = await admin
    .from("decks")
    .select("id, name, archetype, created_at, deck_versions(id, name, is_active, created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .order("created_at", {
      referencedTable: "deck_versions",
      ascending: true,
    });

  if (deckError) {
    throw new Error(`Unable to fetch decks: ${deckError.message}`);
  }

  const { data: matches, error: matchError } = await admin
    .from("matches")
    .select("id, deck_version_id, opponent_archetype, result, went_first, played_at, metadata, notes")
    .eq("user_id", userId)
    .order("played_at", { ascending: true });

  if (matchError) {
    throw new Error(`Unable to fetch matches: ${matchError.message}`);
  }

  const { count: tagCount, error: tagError } = await admin
    .from("match_tags")
    .select("*", { count: "exact", head: true })
    .in(
      "match_id",
      matches.length ? matches.map((match) => match.id) : ["00000000-0000-0000-0000-000000000000"]
    );

  if (tagError) {
    throw new Error(`Unable to count match tags: ${tagError.message}`);
  }

  return {
    decks,
    matches,
    tagCount: tagCount ?? 0,
  };
}

function summarizeSeedData(seedData) {
  const versionById = new Map();
  const deckById = new Map();

  for (const deck of seedData.decks) {
    deckById.set(deck.id, deck);
    for (const version of deck.deck_versions || []) {
      versionById.set(version.id, {
        deckId: deck.id,
        deckName: deck.name,
        versionName: version.name,
        isActive: version.is_active,
        createdAt: version.created_at,
      });
    }
  }

  const resultTotals = { win: 0, loss: 0, tie: 0 };
  const turnOrderTotals = { first: 0, second: 0, unknown: 0 };
  const matchesPerDeck = new Map();
  const matchesPerVersion = new Map();
  const issueTagCounts = new Map();
  const positiveTagCounts = new Map();
  const matchupCounts = new Map();
  const versionTimeline = [];

  for (const match of seedData.matches) {
    resultTotals[match.result] += 1;
    turnOrderTotals[asTurnOrder(match.went_first)] += 1;
    matchupCounts.set(
      match.opponent_archetype,
      (matchupCounts.get(match.opponent_archetype) || 0) + 1
    );

    const version = versionById.get(match.deck_version_id);
    if (!version) {
      continue;
    }

    matchesPerDeck.set(
      version.deckName,
      (matchesPerDeck.get(version.deckName) || 0) + 1
    );

    const versionLabel = `${version.deckName} | ${version.versionName}`;
    matchesPerVersion.set(
      versionLabel,
      (matchesPerVersion.get(versionLabel) || 0) + 1
    );

    const issueTags = match.metadata?.issue_tags || [];
    const positiveTags = match.metadata?.positive_tags || [];

    issueTags.forEach((tag) => {
      issueTagCounts.set(tag, (issueTagCounts.get(tag) || 0) + 1);
    });
    positiveTags.forEach((tag) => {
      positiveTagCounts.set(tag, (positiveTagCounts.get(tag) || 0) + 1);
    });
  }

  for (const deck of seedData.decks) {
    for (const version of deck.deck_versions || []) {
      const matchingDates = seedData.matches
        .filter((match) => match.deck_version_id === version.id)
        .map((match) => match.played_at)
        .sort();

      versionTimeline.push({
        deckName: deck.name,
        versionName: version.name,
        isActive: version.is_active,
        createdAt: version.created_at,
        firstPlayedAt: matchingDates[0] || null,
        lastPlayedAt: matchingDates[matchingDates.length - 1] || null,
        games: matchingDates.length,
      });
    }
  }

  return {
    totalDecks: seedData.decks.length,
    totalVersions: Array.from(versionById.values()).length,
    totalMatches: seedData.matches.length,
    totalTags: seedData.tagCount,
    resultTotals,
    turnOrderTotals,
    matchesPerDeck,
    matchesPerVersion,
    issueTagCounts,
    positiveTagCounts,
    matchupCounts,
    versionTimeline,
  };
}

function buildPatternSummary(seedData) {
  const versionById = new Map();
  for (const deck of seedData.decks) {
    for (const version of deck.deck_versions || []) {
      versionById.set(version.id, deck.name);
    }
  }

  const rbVsGreninja = seedData.matches.filter(
    (match) =>
      versionById.get(match.deck_version_id)?.includes("Raging Bolt") &&
      match.opponent_archetype === "Mega Greninja"
  );
  const controlLosses = seedData.matches.filter(
    (match) =>
      versionById.get(match.deck_version_id)?.includes("Control Counterlab") &&
      match.result === "loss"
  );
  const itemLockLosses = controlLosses.filter((match) =>
    (match.metadata?.issue_tags || []).some((tag) => lower(tag) === "item lock")
  );
  const rogueMatches = seedData.matches.filter((match) =>
    versionById.get(match.deck_version_id)?.includes("Rogue Box")
  );

  return {
    rbVsGreninjaResults: countResults(rbVsGreninja),
    controlLossCount: controlLosses.length,
    controlItemLockLossCount: itemLockLosses.length,
    rogueResults: countResults(rogueMatches),
    rogueMatchCount: rogueMatches.length,
  };
}

function mapToSortedRows(map, topN = null) {
  const rows = Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return topN ? rows.slice(0, topN) : rows;
}

function buildSeededGamesTsv(insertedRows) {
  const lines = [
    [
      "match_id",
      "deck",
      "version",
      "played_at",
      "opponent",
      "result",
      "turn_order",
      "start_quality",
      "opening_hand_quality",
      "sequencing_quality",
      "issue_tags",
      "positive_tags",
      "cards_shined",
      "cards_failed",
      "game_context",
      "session_or_event",
      "focus_matchup",
      "notes",
    ].join("\t"),
  ];

  insertedRows.forEach((row) => {
    const metadata = row.insert.metadata || {};
    const contextLabel =
      metadata.game_context === "competitive"
        ? metadata.event_name || "competitive"
        : metadata.testing_session_name || "testing";

    lines.push(
      [
        row.matchId,
        row.deckName,
        row.versionName,
        row.insert.played_at,
        row.insert.opponent_archetype,
        row.insert.result,
        asTurnOrder(row.insert.went_first),
        metadata.start_quality || "",
        metadata.opening_hand_quality || "",
        metadata.sequencing_quality || "",
        (metadata.issue_tags || []).join("|"),
        (metadata.positive_tags || []).join("|"),
        (metadata.cards_shined || []).join("|"),
        (metadata.cards_failed || []).join("|"),
        metadata.game_context || "",
        contextLabel,
        metadata.focus_matchup || "",
        row.insert.notes || "",
      ].join("\t")
    );
  });

  return lines.join("\n");
}

function buildSummaryTsv(summary) {
  const lines = [["section", "label", "detail", "value"].join("\t")];

  [
    ["overview", "total_decks", "", summary.totalDecks],
    ["overview", "total_versions", "", summary.totalVersions],
    ["overview", "total_matches", "", summary.totalMatches],
    ["overview", "total_tags", "", summary.totalTags],
    ["results", "wins", "", summary.resultTotals.win],
    ["results", "losses", "", summary.resultTotals.loss],
    ["results", "ties", "", summary.resultTotals.tie],
    ["turn_order", "first", "", summary.turnOrderTotals.first],
    ["turn_order", "second", "", summary.turnOrderTotals.second],
    ["turn_order", "unknown", "", summary.turnOrderTotals.unknown],
  ].forEach((row) => lines.push(row.join("\t")));

  mapToSortedRows(summary.matchesPerDeck).forEach(([name, count]) => {
    lines.push(["matches_per_deck", name, "", count].join("\t"));
  });

  mapToSortedRows(summary.matchesPerVersion).forEach(([name, count]) => {
    lines.push(["matches_per_version", name, "", count].join("\t"));
  });

  mapToSortedRows(summary.issueTagCounts).forEach(([name, count]) => {
    lines.push(["issue_tags", name, "", count].join("\t"));
  });

  mapToSortedRows(summary.positiveTagCounts).forEach(([name, count]) => {
    lines.push(["positive_tags", name, "", count].join("\t"));
  });

  mapToSortedRows(summary.matchupCounts).forEach(([name, count]) => {
    lines.push(["matchups", name, "", count].join("\t"));
  });

  summary.versionTimeline
    .sort((a, b) => a.deckName.localeCompare(b.deckName) || a.versionName.localeCompare(b.versionName))
    .forEach((row) => {
      lines.push(
        [
          "version_timeline",
          row.deckName,
          `${row.versionName} | active=${row.isActive} | first=${row.firstPlayedAt || "-"} | last=${row.lastPlayedAt || "-"}`,
          row.games,
        ].join("\t")
      );
    });

  return lines.join("\n");
}

function buildIntegrityReport({
  userId,
  summary,
  precleanCounts,
  postcleanCounts,
  patternSummary,
}) {
  const topIssueTags = mapToSortedRows(summary.issueTagCounts, 5);
  const topPositiveTags = mapToSortedRows(summary.positiveTagCounts, 5);
  const topMatchups = mapToSortedRows(summary.matchupCounts, 8);

  return `# Playtest 250 Integrity Report

Date: ${isoDate(new Date())}
Test user: ${TEST_EMAIL}
User id: ${userId}

## Cleanup scope

- Pre-clean decks: ${precleanCounts.decks}
- Pre-clean versions: ${precleanCounts.deck_versions}
- Pre-clean matches: ${precleanCounts.matches}
- Pre-clean match_tags: ${precleanCounts.match_tags}
- Pre-clean shared_reports: ${precleanCounts.shared_reports}
- Post-clean decks: ${postcleanCounts.decks}
- Post-clean versions: ${postcleanCounts.deck_versions}
- Post-clean matches: ${postcleanCounts.matches}
- Post-clean match_tags: ${postcleanCounts.match_tags}
- Post-clean shared_reports: ${postcleanCounts.shared_reports}

## Seed totals

- Decks: ${summary.totalDecks}
- Versions: ${summary.totalVersions}
- Matches: ${summary.totalMatches}
- Match tags: ${summary.totalTags}
- Results: ${summary.resultTotals.win} wins / ${summary.resultTotals.loss} losses / ${summary.resultTotals.tie} ties
- Turn order: ${summary.turnOrderTotals.first} first / ${summary.turnOrderTotals.second} second / ${summary.turnOrderTotals.unknown} unknown

## Matches per deck

${mapToSortedRows(summary.matchesPerDeck)
  .map(([name, count]) => `- ${name}: ${count}`)
  .join("\n")}

## Top matchup counts

${topMatchups.map(([name, count]) => `- ${name}: ${count}`).join("\n")}

## Most common issue tags

${topIssueTags.map(([name, count]) => `- ${name}: ${count}`).join("\n")}

## Most common positive tags

${topPositiveTags.map(([name, count]) => `- ${name}: ${count}`).join("\n")}

## Intentional seeded patterns

- Raging Bolt vs Mega Greninja is a real leak with a ${patternSummary.rbVsGreninjaResults.win}-${patternSummary.rbVsGreninjaResults.loss}-${patternSummary.rbVsGreninjaResults.tie} record across ${patternSummary.rbVsGreninjaResults.total} games.
- Raging Bolt losses versus Mega Greninja repeatedly include bench pressure, missed setup, and poor prize trade.
- Dragapult has a sequencing problem in losses, especially on the incomplete v1 list.
- Control Counterlab has repeated Item Lock losses that should surface in Review (${patternSummary.controlItemLockLossCount} of ${patternSummary.controlLossCount} losses).
- Gardevoir has a positive tech pattern and should not read only as a problem surface.
- Charizard has a visible going-first advantage.
- Rogue Box stays noisy and low-sample so the app should avoid overclaiming (${patternSummary.rogueResults.win}-${patternSummary.rogueResults.loss}-${patternSummary.rogueResults.tie} across ${patternSummary.rogueMatchCount} games).
- Multiple versions should show meaningful version signal, especially Raging Bolt v3, Dragapult v2, and Gardevoir v2.
`;
}

async function main() {
  ensureDir(RESULTS_DIR);
  ensureDir(DOCS_DIR);

  console.log("\n=== SixPrizer 250-log playtest seed ===\n");

  const user = await getTestUser();
  console.log(`Test user: ${user.email}`);
  console.log(`User id: ${user.id}`);

  const preclean = await inspectCounts(user.id);

  writeFile(
    "docs/playtest_250_seed_summary.md",
    `# Playtest 250 Seed Summary

Date: ${isoDate(new Date())}
User id: ${user.id}
Email: ${TEST_EMAIL}

## Pre-clean scoped counts

- Decks: ${preclean.counts.decks}
- Deck versions: ${preclean.counts.deck_versions}
- Matches: ${preclean.counts.matches}
- Match tags: ${preclean.counts.match_tags}
- Matchup notes: ${preclean.counts.matchup_notes}
- Shared reports: ${preclean.counts.shared_reports}

## Existing decks

${preclean.decks.length ? preclean.decks.map((deck) => `- ${deck.name} (${deck.id})`).join("\n") : "- None"}

## Planned seeded shape

- Matches: 250
- Decks: 8
- Versions: 18
- Key matchup leak: Raging Bolt into Mega Greninja
- Positive deck pattern: Gardevoir v2 recovery plan
- Low-signal deck: Rogue Box
`
  );

  const cleanupScope = await cleanUserData(user.id);
  const postclean = await inspectCounts(user.id);

  writeFile(
    "docs/playtest_250_cleanup_report.md",
    `# Playtest 250 Cleanup Report

Date: ${isoDate(new Date())}
User id: ${user.id}

## Deleted rows

- Matches deleted: ${cleanupScope.counts.matches}
- Match tags deleted: ${cleanupScope.counts.match_tags}
- Deck versions deleted: ${cleanupScope.counts.deck_versions}
- Decks deleted: ${cleanupScope.counts.decks}
- Matchup notes deleted: ${cleanupScope.counts.matchup_notes}
- Shared reports deleted: ${cleanupScope.counts.shared_reports}

## Post-clean scoped counts

- Decks: ${postclean.counts.decks}
- Deck versions: ${postclean.counts.deck_versions}
- Matches: ${postclean.counts.matches}
- Match tags: ${postclean.counts.match_tags}
- Matchup notes: ${postclean.counts.matchup_notes}
- Shared reports: ${postclean.counts.shared_reports}

## Scope note

All deletes were scoped to user_id ${user.id}. The auth user and all non-test-user rows were left untouched.
`
  );

  const created = await createDecksAndVersions(user.id);
  const generated = generateSeedMatches(user.id, created);
  const insertedRows = await insertMatches(user.id, generated);
  const seeded = await fetchSeededData(user.id);
  const summary = summarizeSeedData(seeded);
  const patternSummary = buildPatternSummary(seeded);

  writeFile(
    "results/playtest_250_seeded_games.tsv",
    buildSeededGamesTsv(insertedRows)
  );
  writeFile("results/playtest_250_summary.tsv", buildSummaryTsv(summary));
  writeFile(
    "results/playtest_250_integrity_report.md",
    buildIntegrityReport({
      userId: user.id,
      summary,
      precleanCounts: cleanupScope.counts,
      postcleanCounts: postclean.counts,
      patternSummary,
    })
  );

  console.log("\nSeed complete:");
  console.log(`  decks: ${summary.totalDecks}`);
  console.log(`  versions: ${summary.totalVersions}`);
  console.log(`  matches: ${summary.totalMatches}`);
  console.log(`  tags: ${summary.totalTags}`);
  console.log(
    `  results: ${summary.resultTotals.win}W / ${summary.resultTotals.loss}L / ${summary.resultTotals.tie}T`
  );
}

main().catch((error) => {
  console.error("\nFATAL:", error.message);
  process.exit(1);
});
