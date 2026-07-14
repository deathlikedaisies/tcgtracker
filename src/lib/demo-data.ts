import { POST_ROTATION_2026_ARCHETYPES } from "@/lib/archetypes";
import {
  buildDeckLabSummary,
  type DeckLabSummary,
} from "@/lib/deck-lab";
import {
  countMatchResults,
  formatMatchRecord,
  type MatchMetadata,
  type MatchResult,
} from "@/lib/match-types";

export type DemoDeckVersion = {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
  isActive?: boolean;
};

export type DemoDeck = {
  id: string;
  name: string;
  archetype: string;
  notes: string;
  isCurrentTest?: boolean;
  versions: DemoDeckVersion[];
};

export type DemoMatch = {
  id: string;
  deckId: string;
  deckVersionId: string;
  opponentArchetype: string;
  result: MatchResult;
  wentFirst: boolean;
  eventType: string;
  playedAt: string;
  notes: string;
  tags: string[];
  metadata: MatchMetadata;
};

export type DemoTestingBlock = {
  id: string;
  deckId: string;
  deckVersionId: string;
  targetMatchup: string;
  focusTags: string[];
  targetGames: number;
  notes: string;
  status: "active" | "completed" | "archived";
  linkedMatchIds: string[];
  sourceReviewReason: string;
};

export type DemoEventRound = {
  id: string;
  roundNumber: number;
  opponentDeck: string;
  result: MatchResult;
  matchScore: string;
  wentFirst: boolean | null;
  tags: string[];
  notes: string;
  matchId: string | null;
};

export type DemoEvent = {
  id: string;
  name: string;
  eventDate: string;
  eventType: string;
  format: string;
  matchStructure: "bo1" | "bo3";
  deckId: string;
  deckVersionId: string;
  placement: string;
  notes: string;
  rounds: DemoEventRound[];
};

export type DemoMatchup = {
  archetype: string;
  games: DemoMatch[];
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  firstWins: number;
  firstGames: number;
  secondWins: number;
  secondGames: number;
  tags: string[];
  record: string;
};

export type DemoConfidence =
  | "Needs games"
  | "Building signal"
  | "Actionable signal";

type DemoSeed = Omit<DemoMatch, "id" | "playedAt"> & {
  playedAt: string;
};

export const demoDecks: DemoDeck[] = [
  {
    id: "dragapult-lab",
    name: "Portland Prep PultBlaziken",
    archetype: "Dragapult Blaziken",
    notes:
      "Current test deck. The latest version is testing cleaner setup into Greninja and Dragapult mirrors.",
    isCurrentTest: true,
    versions: [
      {
        id: "dragapult-v1",
        name: "v1 - Dusknoir pressure",
        notes: "First pass at the list. Higher knockout reach, rougher setup floor.",
        createdAt: "2026-05-13",
      },
      {
        id: "dragapult-v2",
        name: "v2 - Consistency core",
        notes: "Better opening hands, still soft going second into pressure decks.",
        createdAt: "2026-05-20",
      },
      {
        id: "dragapult-v3",
        name: "v3 - Greninja plan",
        notes: "Current version. Testing extra mobility and cleaner early setup.",
        createdAt: "2026-05-27",
        isActive: true,
      },
    ],
  },
  {
    id: "zoroark-lab",
    name: "N's Zoroark Tempo",
    archetype: "N's Zoroark",
    notes: "Secondary ladder deck for tempo and disruption checks.",
    versions: [
      {
        id: "zoroark-v1",
        name: "v1 - Fast draw",
        notes: "Higher speed, weaker comeback turns.",
        createdAt: "2026-05-16",
      },
      {
        id: "zoroark-v2",
        name: "v2 - Recovery slots",
        notes: "Current internal build with steadier late-game pivots.",
        createdAt: "2026-05-30",
        isActive: true,
      },
    ],
  },
  {
    id: "lucario-box",
    name: "Mega Lucario League Build",
    archetype: "Mega Lucario",
    notes: "Alternate best-of-three deck for league night prep.",
    versions: [
      {
        id: "lucario-v1",
        name: "v1 - Maximum pressure",
        notes: "Explosive starts, fragile into bench damage.",
        createdAt: "2026-05-18",
      },
      {
        id: "lucario-v2",
        name: "v2 - Recovery package",
        notes: "Current local version with steadier comeback turns.",
        createdAt: "2026-06-01",
        isActive: true,
      },
    ],
  },
];

function iso(daysAgo: number) {
  return new Date(Date.UTC(2026, 5, 27 - daysAgo, 19, 30)).toISOString();
}

function buildMetadata({
  start,
  opening,
  sequencing,
  issueTags = [],
  positiveTags = [],
}: {
  start?: MatchMetadata["start_quality"];
  opening?: MatchMetadata["opening_hand_quality"];
  sequencing?: MatchMetadata["sequencing_quality"];
  issueTags?: string[];
  positiveTags?: string[];
}) {
  const metadata: MatchMetadata = {
    game_context: "testing",
  };

  if (start) {
    metadata.start_quality = start;
  }

  if (opening) {
    metadata.opening_hand_quality = opening;
  }

  if (sequencing) {
    metadata.sequencing_quality = sequencing;
  }

  if (issueTags.length) {
    metadata.issue_tags = issueTags;
  }

  if (positiveTags.length) {
    metadata.positive_tags = positiveTags;
  }

  return metadata;
}

const demoMatchSeeds: DemoSeed[] = [
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Mega Greninja",
    result: "loss",
    wentFirst: false,
    eventType: "Solo testing",
    playedAt: iso(24),
    notes: "Missed second attacker and lost the race immediately.",
    tags: ["missed setup", "bench pressure", "review"],
    metadata: buildMetadata({
      start: "bad",
      opening: "okay",
      sequencing: "bad",
      issueTags: ["missed setup", "bench pressure"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Mega Greninja",
    result: "loss",
    wentFirst: false,
    eventType: "Solo testing",
    playedAt: iso(23),
    notes: "Opening hand stalled and the board never stabilized.",
    tags: ["missed setup", "review"],
    metadata: buildMetadata({
      start: "bad",
      opening: "bad",
      sequencing: "okay",
      issueTags: ["missed setup"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Mega Greninja",
    result: "win",
    wentFirst: true,
    eventType: "Best-of-three testing",
    playedAt: iso(22),
    notes: "Strong setup let the list keep pace all game.",
    tags: ["strong setup"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["strong setup"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Ogerpon Meganium Hydrapple",
    result: "win",
    wentFirst: true,
    eventType: "Solo testing",
    playedAt: iso(21),
    notes: "Prize route stayed clean once the lead was established.",
    tags: ["good prize plan"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["good prize plan"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Ogerpon Meganium Hydrapple",
    result: "loss",
    wentFirst: false,
    eventType: "Solo testing",
    playedAt: iso(20),
    notes: "Fell behind on the prize trade after a slow middle turn.",
    tags: ["poor prize trade", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "okay",
      sequencing: "bad",
      issueTags: ["poor prize trade"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Ogerpon Meganium Hydrapple",
    result: "win",
    wentFirst: true,
    eventType: "Solo testing",
    playedAt: iso(19),
    notes: "Sequencing stayed clean through the last two turns.",
    tags: ["clean sequencing"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "great",
      positiveTags: ["clean sequencing"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Dragapult Dusknoir",
    result: "loss",
    wentFirst: false,
    eventType: "League night",
    playedAt: iso(18),
    notes: "Sequencing slip opened the mirror for an easy return KO.",
    tags: ["bad sequencing", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "good",
      sequencing: "bad",
      issueTags: ["bad sequencing"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Dragapult Dusknoir",
    result: "win",
    wentFirst: true,
    eventType: "League night",
    playedAt: iso(17),
    notes: "Recovered well after the first exchange.",
    tags: ["strong recovery"],
    metadata: buildMetadata({
      start: "good",
      opening: "okay",
      sequencing: "good",
      positiveTags: ["strong recovery"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Mega Lucario",
    result: "win",
    wentFirst: true,
    eventType: "Best-of-three testing",
    playedAt: iso(16),
    notes: "Prize plan was clear from turn two.",
    tags: ["good prize plan"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["good prize plan"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v2",
    opponentArchetype: "Mega Lucario",
    result: "loss",
    wentFirst: false,
    eventType: "Best-of-three testing",
    playedAt: iso(15),
    notes: "Bench pressure turned one missed pivot into a loss.",
    tags: ["bench pressure", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "okay",
      sequencing: "bad",
      issueTags: ["bench pressure"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Mega Greninja",
    result: "loss",
    wentFirst: false,
    eventType: "Solo testing",
    playedAt: iso(12),
    notes: "Bench pressure still showed up, but the list felt closer.",
    tags: ["bench pressure", "review"],
    metadata: buildMetadata({
      start: "bad",
      issueTags: ["bench pressure"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Mega Greninja",
    result: "win",
    wentFirst: true,
    eventType: "Solo testing",
    playedAt: iso(11),
    notes: "The updated setup plan let the deck stabilize immediately.",
    tags: ["strong setup"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["strong setup"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Ogerpon Meganium Hydrapple",
    result: "win",
    wentFirst: true,
    eventType: "Solo testing",
    playedAt: iso(10),
    notes: "Pressure stayed clean once the first setup landed.",
    tags: ["strong setup"],
    metadata: buildMetadata({
      start: "great",
      opening: "good",
      sequencing: "good",
      positiveTags: ["strong setup"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Ogerpon Meganium Hydrapple",
    result: "win",
    wentFirst: false,
    eventType: "Solo testing",
    playedAt: iso(9),
    notes: "Going second still held together with a cleaner pivot line.",
    tags: ["strong recovery"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "great",
      positiveTags: ["strong recovery"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Ogerpon Meganium Hydrapple",
    result: "loss",
    wentFirst: false,
    eventType: "Solo testing",
    playedAt: iso(8),
    notes: "Prize trade still slipped when the second attacker was delayed.",
    tags: ["poor prize trade", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "okay",
      sequencing: "bad",
      issueTags: ["poor prize trade"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Ogerpon Meganium Hydrapple",
    result: "win",
    wentFirst: true,
    eventType: "Best-of-three testing",
    playedAt: iso(7),
    notes: "Opening hand quality stayed cleaner than the older version.",
    tags: ["strong setup"],
    metadata: buildMetadata({
      start: "good",
      opening: "great",
      sequencing: "good",
      positiveTags: ["strong setup"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Dragapult Dusknoir",
    result: "win",
    wentFirst: true,
    eventType: "League night",
    playedAt: iso(6),
    notes: "Mirror sequencing looked much cleaner than the older list.",
    tags: ["clean sequencing"],
    metadata: buildMetadata({
      start: "great",
      opening: "good",
      sequencing: "great",
      positiveTags: ["clean sequencing"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Dragapult Dusknoir",
    result: "loss",
    wentFirst: false,
    eventType: "League night",
    playedAt: iso(5),
    notes: "Going second still punishes small sequencing slips.",
    tags: ["bad sequencing", "review"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "bad",
      issueTags: ["bad sequencing"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Dragapult Dusknoir",
    result: "win",
    wentFirst: true,
    eventType: "League night",
    playedAt: iso(4),
    notes: "Prize plan stayed ahead through the mirror trade.",
    tags: ["good prize plan"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["good prize plan"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Dragapult Dusknoir",
    result: "win",
    wentFirst: false,
    eventType: "League night",
    playedAt: iso(3),
    notes: "The recovery package kept a close game alive.",
    tags: ["strong recovery"],
    metadata: buildMetadata({
      start: "good",
      opening: "okay",
      sequencing: "good",
      positiveTags: ["strong recovery"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Dragapult Dusknoir",
    result: "loss",
    wentFirst: false,
    eventType: "League night",
    playedAt: iso(2),
    notes: "Sequencing still decides the tightest mirror games.",
    tags: ["bad sequencing", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "bad",
      sequencing: "bad",
      issueTags: ["bad sequencing"],
    }),
  },
  {
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    opponentArchetype: "Mega Lucario",
    result: "win",
    wentFirst: true,
    eventType: "Best-of-three testing",
    playedAt: iso(1),
    notes: "The matchup felt cleaner once setup landed on time.",
    tags: ["favorable matchup"],
    metadata: buildMetadata({
      start: "great",
      opening: "good",
      sequencing: "good",
      positiveTags: ["favorable matchup"],
    }),
  },
  {
    deckId: "zoroark-lab",
    deckVersionId: "zoroark-v1",
    opponentArchetype: "Mega Greninja",
    result: "loss",
    wentFirst: false,
    eventType: "Solo testing",
    playedAt: iso(14),
    notes: "The fast build ran out of recovery too quickly.",
    tags: ["poor prize trade", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "bad",
      sequencing: "bad",
      issueTags: ["poor prize trade"],
    }),
  },
  {
    deckId: "zoroark-lab",
    deckVersionId: "zoroark-v1",
    opponentArchetype: "Slowking",
    result: "win",
    wentFirst: true,
    eventType: "Solo testing",
    playedAt: iso(13),
    notes: "Early pressure kept the tempo deck ahead.",
    tags: ["strong setup"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["strong setup"],
    }),
  },
  {
    deckId: "zoroark-lab",
    deckVersionId: "zoroark-v2",
    opponentArchetype: "Dragapult Dusknoir",
    result: "loss",
    wentFirst: false,
    eventType: "Best-of-three testing",
    playedAt: iso(6.5),
    notes: "Recovery helped, but the mirror pace still felt rough.",
    tags: ["pace mismatch", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "okay",
      sequencing: "bad",
      issueTags: ["pace mismatch"],
    }),
  },
  {
    deckId: "zoroark-lab",
    deckVersionId: "zoroark-v2",
    opponentArchetype: "Rocket's Mewtwo",
    result: "win",
    wentFirst: true,
    eventType: "Best-of-three testing",
    playedAt: iso(5.5),
    notes: "Late-game recovery package mattered immediately.",
    tags: ["strong recovery"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["strong recovery"],
    }),
  },
  {
    deckId: "zoroark-lab",
    deckVersionId: "zoroark-v2",
    opponentArchetype: "Mega Lucario",
    result: "win",
    wentFirst: true,
    eventType: "League night",
    playedAt: iso(4.5),
    notes: "Tempo line stayed clean all match.",
    tags: ["clean sequencing"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "great",
      positiveTags: ["clean sequencing"],
    }),
  },
  {
    deckId: "lucario-box",
    deckVersionId: "lucario-v1",
    opponentArchetype: "Raging Bolt",
    result: "loss",
    wentFirst: false,
    eventType: "League night",
    playedAt: iso(10.5),
    notes: "Bench pressure turned one weak opener into a loss.",
    tags: ["bench pressure", "review"],
    metadata: buildMetadata({
      start: "bad",
      opening: "okay",
      sequencing: "bad",
      issueTags: ["bench pressure"],
    }),
  },
  {
    deckId: "lucario-box",
    deckVersionId: "lucario-v1",
    opponentArchetype: "Mega Greninja",
    result: "win",
    wentFirst: true,
    eventType: "League night",
    playedAt: iso(9.5),
    notes: "The aggressive route stole the game early.",
    tags: ["good prize plan"],
    metadata: buildMetadata({
      start: "great",
      opening: "good",
      sequencing: "good",
      positiveTags: ["good prize plan"],
    }),
  },
  {
    deckId: "lucario-box",
    deckVersionId: "lucario-v2",
    opponentArchetype: "Raging Bolt",
    result: "win",
    wentFirst: true,
    eventType: "Best-of-three testing",
    playedAt: iso(3.5),
    notes: "Recovery package mattered in the final prize trade.",
    tags: ["strong recovery"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["strong recovery"],
    }),
  },
  {
    deckId: "lucario-box",
    deckVersionId: "lucario-v2",
    opponentArchetype: "Mega Greninja",
    result: "loss",
    wentFirst: false,
    eventType: "Best-of-three testing",
    playedAt: iso(2.5),
    notes: "Still needs cleaner going-second openings.",
    tags: ["missed setup", "review"],
    metadata: buildMetadata({
      start: "okay",
      opening: "bad",
      sequencing: "okay",
      issueTags: ["missed setup"],
    }),
  },
  {
    deckId: "lucario-box",
    deckVersionId: "lucario-v2",
    opponentArchetype: "Slowking",
    result: "win",
    wentFirst: true,
    eventType: "Best-of-three testing",
    playedAt: iso(1.5),
    notes: "Current build stayed stable through the slower games.",
    tags: ["strong setup"],
    metadata: buildMetadata({
      start: "good",
      opening: "good",
      sequencing: "good",
      positiveTags: ["strong setup"],
    }),
  },
];

export const demoMatches: DemoMatch[] = demoMatchSeeds
  .map((seed, index) => ({
    ...seed,
    id: `demo-match-${String(index + 1).padStart(2, "0")}`,
  }))
  .sort((left, right) => right.playedAt.localeCompare(left.playedAt));

export const demoTestingBlocks: DemoTestingBlock[] = [
  {
    id: "demo-block-greninja",
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    targetMatchup: "Mega Greninja",
    focusTags: ["bench pressure", "slow start", "opening hands"],
    targetGames: 5,
    notes:
      "Play 5 focused games into Mega Greninja. Track bench pressure and opening hands before changing the list again.",
    status: "active",
    linkedMatchIds: ["demo-match-01", "demo-match-02", "demo-match-11"],
    sourceReviewReason:
      "Review found repeated going-second losses into Mega Greninja with setup and bench-pressure tags.",
  },
];

export const demoEvents: DemoEvent[] = [
  {
    id: "demo-event-weekly",
    name: "League Cup Prep Night",
    eventDate: "2026-06-23",
    eventType: "Local",
    format: "Standard",
    matchStructure: "bo1",
    deckId: "dragapult-lab",
    deckVersionId: "dragapult-v3",
    placement: "2nd of 12",
    notes:
      "A compact local run used to check whether the current version is ready for a larger event.",
    rounds: [
      {
        id: "demo-event-round-1",
        roundNumber: 1,
        opponentDeck: "Ogerpon Meganium Hydrapple",
        result: "win",
        matchScore: "BO1",
        wentFirst: true,
        tags: ["ahead early", "strong setup"],
        notes: "Opened cleanly and stayed ahead after the first prize.",
        matchId: "demo-match-14",
      },
      {
        id: "demo-event-round-2",
        roundNumber: 2,
        opponentDeck: "Mega Greninja",
        result: "loss",
        matchScore: "BO1",
        wentFirst: false,
        tags: ["bench pressure", "slow start"],
        notes: "Fell behind after a slow start and exposed bench damage.",
        matchId: "demo-match-11",
      },
      {
        id: "demo-event-round-3",
        roundNumber: 3,
        opponentDeck: "Dragapult Dusknoir",
        result: "win",
        matchScore: "BO1",
        wentFirst: true,
        tags: ["clean sequencing"],
        notes: "Sequenced the mirror cleanly and protected the second attacker.",
        matchId: "demo-match-16",
      },
      {
        id: "demo-event-round-4",
        roundNumber: 4,
        opponentDeck: "Mega Lucario",
        result: "tie",
        matchScore: "BO1",
        wentFirst: null,
        tags: ["quick game", "poor prizes"],
        notes: "Prize map got awkward and the game ended without a clear read.",
        matchId: null,
      },
    ],
  },
];

export function getDemoDeck(deckId: string) {
  return demoDecks.find((deck) => deck.id === deckId) ?? null;
}

export function getDemoCurrentDeck() {
  return demoDecks.find((deck) => deck.isCurrentTest) ?? demoDecks[0] ?? null;
}

export function getDemoActiveVersion(deck: DemoDeck | null) {
  if (!deck) {
    return null;
  }

  return deck.versions.find((version) => version.isActive) ?? deck.versions[0] ?? null;
}

export function getDemoDeckMatches(deckId: string) {
  return demoMatches.filter((match) => match.deckId === deckId);
}

export function getDemoVersionMatches(deckVersionId: string) {
  return demoMatches.filter((match) => match.deckVersionId === deckVersionId);
}

export function getDeckMatchCount(deckId: string) {
  return getDemoDeckMatches(deckId).length;
}

export function getWinRate(matches: DemoMatch[]) {
  if (!matches.length) {
    return 0;
  }

  return Math.round((countMatchResults(matches).wins / matches.length) * 100);
}

export function getDemoMatchups(matches: DemoMatch[] = demoMatches): DemoMatchup[] {
  const grouped = new Map<string, DemoMatch[]>();
  matches.forEach((match) => {
    grouped.set(match.opponentArchetype, [
      ...(grouped.get(match.opponentArchetype) ?? []),
      match,
    ]);
  });

  return Array.from(grouped.entries())
    .map(([archetype, games]) => {
      const firstGames = games.filter((match) => match.wentFirst);
      const secondGames = games.filter((match) => !match.wentFirst);
      const tags = Array.from(new Set(games.flatMap((match) => match.tags)));
      const { wins, losses, ties } = countMatchResults(games);

      return {
        archetype,
        games,
        wins,
        losses,
        ties,
        winRate: getWinRate(games),
        firstWins: firstGames.filter((match) => match.result === "win").length,
        firstGames: firstGames.length,
        secondWins: secondGames.filter((match) => match.result === "win").length,
        secondGames: secondGames.length,
        tags,
        record: formatMatchRecord(wins, losses, ties),
      };
    })
    .sort((left, right) => {
      if (left.winRate !== right.winRate) {
        return left.winRate - right.winRate;
      }

      return right.games.length - left.games.length;
    });
}

export function getConfidenceLabel(gameCount: number): DemoConfidence {
  if (gameCount < 3) {
    return "Needs games";
  }

  if (gameCount < 8) {
    return "Building signal";
  }

  return "Actionable signal";
}

export function getConfidenceTone(gameCount: number) {
  const label = getConfidenceLabel(gameCount);

  if (label === "Needs games") {
    return "bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.22)]";
  }

  if (label === "Building signal") {
    return "bg-[#4F8CFF]/14 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]";
  }

  return "bg-[#22C55E]/12 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.22)]";
}

export function getDemoDeckLab(deckId: string): DeckLabSummary | null {
  const deck = getDemoDeck(deckId);

  if (!deck) {
    return null;
  }

  const activeVersion = getDemoActiveVersion(deck);

  return buildDeckLabSummary({
    deckArchetype: deck.archetype,
    versions: deck.versions.map((version) => ({
      id: version.id,
      name: version.name,
      created_at: version.createdAt,
      is_active: Boolean(version.isActive),
    })),
    activeVersionId: activeVersion?.id ?? null,
    matches: getDemoDeckMatches(deck.id).map((match) => ({
      deck_version_id: match.deckVersionId,
      opponent_archetype: match.opponentArchetype,
      result: match.result,
      went_first: match.wentFirst,
      played_at: match.playedAt,
      metadata: match.metadata,
      match_tags: match.tags.map((tag) => ({ tag })),
    })),
    archetypes: POST_ROTATION_2026_ARCHETYPES as unknown as string[],
  });
}

export function getDemoCurrentDeckLab() {
  const deck = getDemoCurrentDeck();
  return deck ? getDemoDeckLab(deck.id) : null;
}

export function getRecentSession(deckId?: string) {
  const source = deckId ? getDemoDeckMatches(deckId) : demoMatches;
  return source.slice(0, 12);
}

export function formatDemoDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getDemoTestingBlock(blockId = "demo-block-greninja") {
  return demoTestingBlocks.find((block) => block.id === blockId) ?? null;
}

export function getDemoTestingBlockMatches(block: DemoTestingBlock) {
  const linked = new Set(block.linkedMatchIds);

  return demoMatches.filter((match) => linked.has(match.id));
}

export function getDemoEvent(eventId = "demo-event-weekly") {
  return demoEvents.find((event) => event.id === eventId) ?? null;
}
