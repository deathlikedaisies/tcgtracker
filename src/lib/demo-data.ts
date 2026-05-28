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
  versions: DemoDeckVersion[];
};

export type DemoMatch = {
  id: string;
  deckId: string;
  deckVersionId: string;
  opponentArchetype: string;
  result: "win" | "loss";
  wentFirst: boolean;
  eventType: string;
  playedAt: string;
  notes: string;
  tags: string[];
};

export type DemoMatchup = {
  archetype: string;
  games: DemoMatch[];
  wins: number;
  losses: number;
  winRate: number;
  firstWins: number;
  firstGames: number;
  secondWins: number;
  secondGames: number;
  tags: string[];
};

export type DemoConfidence = "Low confidence" | "Building signal" | "Reliable trend";

export type DemoInsightSummary = {
  currentMission: {
    archetype: string;
    title: string;
    progressLabel: string;
    explanation: string;
    why: string;
  };
  biggestStatisticalLeak: DemoMatchup;
  lowConfidenceWatchlist: DemoMatchup[];
  recommendedNextTest: {
    archetype: string;
    title: string;
    cta: string;
    why: string;
    steps: string[];
  };
};

export const demoDecks: DemoDeck[] = [
  {
    id: "dragapult-control",
    name: "Portland Prep Dragapult",
    archetype: "Dragapult ex",
    notes: "Primary testing deck. Tuned for Chaos Rising matchups.",
    versions: [
      {
        id: "dragapult-v1",
        name: "v1 - Dusknoir pressure",
        notes: "Higher knockout reach, weaker into hand disruption.",
        createdAt: "2026-05-13",
      },
      {
        id: "dragapult-v2",
        name: "v2 - Consistency build",
        notes: "Added draw stability and trimmed recovery cards.",
        createdAt: "2026-05-20",
        isActive: true,
      },
      {
        id: "dragapult-v3",
        name: "v3 - Greninja plan",
        notes: "Testing extra switch outs and cleaner early setup.",
        createdAt: "2026-05-27",
      },
    ],
  },
  {
    id: "lucario-box",
    name: "Mega Lucario League Build",
    archetype: "Mega Lucario",
    notes: "Aggressive alternate deck for local best-of-three testing.",
    versions: [
      {
        id: "lucario-v1",
        name: "v1 - Maximum pressure",
        notes: "Fast prize mapping, inconsistent recovery.",
        createdAt: "2026-05-16",
      },
      {
        id: "lucario-v2",
        name: "v2 - Recovery package",
        notes: "Improved late-game pivot lines.",
        createdAt: "2026-05-25",
        isActive: true,
      },
    ],
  },
  {
    id: "bolt-ogerpon",
    name: "Raging Bolt Lab",
    archetype: "Raging Bolt Ogerpon",
    notes: "Benchmark deck for speed and prize-race comparisons.",
    versions: [
      {
        id: "bolt-v1",
        name: "v1 - Turbo",
        notes: "Best opener, fragile into disruption.",
        createdAt: "2026-05-11",
      },
      {
        id: "bolt-v2",
        name: "v2 - Stamina",
        notes: "Added stability for longer games.",
        createdAt: "2026-05-24",
        isActive: true,
      },
    ],
  },
];

const matchupPlan = [
  { archetype: "Mega Greninja", games: 14, wins: 5, firstWins: 4, firstGames: 6, tags: ["missed setup", "bench pressure"] },
  { archetype: "Dragapult ex", games: 12, wins: 7, firstWins: 4, firstGames: 6, tags: ["prize map", "midgame trade"] },
  { archetype: "Ogerpon Meganium", games: 10, wins: 6, firstWins: 4, firstGames: 5, tags: ["tempo lead", "resource check"] },
  { archetype: "Mega Lucario", games: 9, wins: 5, firstWins: 3, firstGames: 5, tags: ["early pressure"] },
  { archetype: "Rocket's Mewtwo", games: 8, wins: 5, firstWins: 3, firstGames: 4, tags: ["hand disruption"] },
  { archetype: "Beedrill", games: 7, wins: 4, firstWins: 2, firstGames: 3, tags: ["gust timing"] },
  { archetype: "Festival Lead", games: 6, wins: 5, firstWins: 3, firstGames: 3, tags: ["favorable trade"] },
  { archetype: "Alakazam", games: 6, wins: 3, firstWins: 2, firstGames: 3, tags: ["awkward math"] },
  { archetype: "Mega Lopunny", games: 5, wins: 2, firstWins: 2, firstGames: 3, tags: ["pace mismatch"] },
  { archetype: "Raging Bolt", games: 5, wins: 4, firstWins: 2, firstGames: 2, tags: ["race plan"] },
];

const notesByTag: Record<string, string> = {
  "missed setup": "Opening was too slow; missed second attacker by turn three.",
  "bench pressure": "Opponent punished exposed support Pokemon.",
  "prize map": "Prize route was clear after the first two turns.",
  "midgame trade": "Midgame exchange decided the final prize swing.",
  "tempo lead": "Early board lead converted into cleaner trades.",
  "resource check": "Recovery cards mattered in the last two turns.",
  "early pressure": "Pressure started before the deck stabilized.",
  "hand disruption": "Late-game hand reset changed the line.",
  "gust timing": "Gust target changed the matchup math.",
  "favorable trade": "Opponent could not keep pace with prize trades.",
  "awkward math": "Damage math required extra setup pieces.",
  "pace mismatch": "Deck fell behind when going second.",
  "race plan": "Prize race plan stayed clean.",
};

function versionForDeck(deck: DemoDeck, index: number) {
  return deck.versions[index % deck.versions.length];
}

function buildDemoMatches() {
  const matches: DemoMatch[] = [];
  let matchNumber = 0;

  matchupPlan.forEach((plan, planIndex) => {
    for (let index = 0; index < plan.games; index += 1) {
      const deck = demoDecks[(planIndex + index) % demoDecks.length];
      const version = versionForDeck(deck, index);
      const wentFirst = index < plan.firstGames ? index % 2 === 0 : false;
      const firstLossCount = plan.firstGames - plan.firstWins;
      const isFirstLoss = wentFirst && index / 2 < firstLossCount;
      const secondWins = plan.wins - plan.firstWins;
      const secondIndex = Math.max(0, index - plan.firstGames);
      const isSecondWin = !wentFirst && secondIndex < secondWins;
      const result = isFirstLoss || (!wentFirst && !isSecondWin) ? "loss" : "win";
      const tag = plan.tags[index % plan.tags.length];
      const daysAgo = matchNumber;
      const playedAt = new Date(Date.UTC(2026, 4, 28 - daysAgo, 19 + (index % 4), 15));

      matches.push({
        id: `demo-match-${String(matchNumber + 1).padStart(2, "0")}`,
        deckId: deck.id,
        deckVersionId: version.id,
        opponentArchetype: plan.archetype,
        result,
        wentFirst,
        eventType: index % 5 === 0 ? "League night" : index % 3 === 0 ? "Best-of-three testing" : "Solo testing",
        playedAt: playedAt.toISOString(),
        notes: notesByTag[tag],
        tags: result === "loss" ? [tag, "review"] : [tag],
      });
      matchNumber += 1;
    }
  });

  return matches.sort((first, second) => second.playedAt.localeCompare(first.playedAt));
}

export const demoMatches = buildDemoMatches();

export function getDemoDeck(deckId: string) {
  return demoDecks.find((deck) => deck.id === deckId) ?? null;
}

export function getDeckMatchCount(deckId: string) {
  return demoMatches.filter((match) => match.deckId === deckId).length;
}

export function getWinRate(matches: DemoMatch[]) {
  if (!matches.length) {
    return 0;
  }

  return Math.round(
    (matches.filter((match) => match.result === "win").length / matches.length) * 100
  );
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

      return {
        archetype,
        games,
        wins: games.filter((match) => match.result === "win").length,
        losses: games.filter((match) => match.result === "loss").length,
        winRate: getWinRate(games),
        firstWins: firstGames.filter((match) => match.result === "win").length,
        firstGames: firstGames.length,
        secondWins: secondGames.filter((match) => match.result === "win").length,
        secondGames: secondGames.length,
        tags,
      };
    })
    .sort((first, second) => first.winRate - second.winRate);
}

export function getConfidenceLabel(gameCount: number): DemoConfidence {
  if (gameCount < 6) {
    return "Low confidence";
  }

  if (gameCount < 15) {
    return "Building signal";
  }

  return "Reliable trend";
}

export function getConfidenceTone(gameCount: number) {
  const label = getConfidenceLabel(gameCount);

  if (label === "Low confidence") {
    return "bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.22)]";
  }

  if (label === "Building signal") {
    return "bg-[#4F8CFF]/14 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]";
  }

  return "bg-[#22C55E]/12 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.22)]";
}

export function getBiggestStatisticalLeak() {
  return (
    getDemoMatchups()
      .filter((matchup) => matchup.games.length >= 6)
      .sort((first, second) => {
        if (first.winRate !== second.winRate) {
          return first.winRate - second.winRate;
        }

        return second.games.length - first.games.length;
      })[0] ?? getDemoMatchups()[0]
  );
}

export function getLowConfidenceWatchlist() {
  return getDemoMatchups()
    .filter((matchup) => matchup.games.length < 6 && matchup.winRate < 50)
    .sort((first, second) => first.winRate - second.winRate);
}

export function getDemoInsights(): DemoInsightSummary {
  const biggestStatisticalLeak = getBiggestStatisticalLeak();
  const lowConfidenceWatchlist = getLowConfidenceWatchlist();

  return {
    currentMission: {
      archetype: "Mega Greninja",
      title: "Stabilize Mega Greninja going second",
      progressLabel: "3/5 games",
      explanation:
        "Mega Greninja is the current mission because it has a meaningful sample and a repeated going-second setup pattern.",
      why:
        "Mega Lopunny looks scary at 2-3, but five games is still noisy. Mega Greninja has fourteen games, repeated missed-setup tags, and a clear first/second split, so it is the better next test.",
    },
    biggestStatisticalLeak,
    lowConfidenceWatchlist,
    recommendedNextTest: {
      archetype: "Mega Greninja",
      title: "Run five more Mega Greninja games going second",
      cta: "Test Mega Greninja",
      why:
        "This is a building signal, not a final verdict. More games will confirm whether the issue is opening setup, bench pressure, or the current Dragapult version.",
      steps: [
        "Keep one extra switching card in the active Dragapult build.",
        "Tag whether bench pressure or missed setup creates the first prize deficit.",
        "Compare Dragapult v2 against v3 after five more Mega Greninja games.",
      ],
    },
  };
}

export function getRecentSession() {
  return demoMatches.slice(0, 12);
}

export function formatDemoDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
