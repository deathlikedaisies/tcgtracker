import { OTHER_ARCHETYPE } from "@/lib/archetypes";
import { suggestArchetypeFromLogText } from "@/lib/decklist";
import type { MatchPrizeRace } from "@/lib/match-types";

export type TcgLiveLogParseResult = {
  result?: "win" | "loss" | "tie";
  turnOrder?: "first" | "second" | "unknown";
  userPlayerName?: string;
  opponentName?: string;
  winnerName?: string;
  firstPlayerName?: string;
  opponentDeckGuess?: string;
  opponentEvidenceCards?: string[];
  cardReview?: {
    cardsSeen: string[];
    cardsUsed: string[];
    cardsDiscarded: string[];
  };
  prizeRace?: MatchPrizeRace;
  confidence?: "high" | "medium" | "low";
  notes: string[];
};

type ParseOptions = {
  archetypeOptions?: string[];
  playerName?: string;
};

type ResultResolution = {
  result?: "win" | "loss" | "tie";
  winnerName?: string;
  note: string;
};

type TurnOrderResolution = {
  turnOrder?: "first" | "second" | "unknown";
  firstPlayerName?: string;
  note: string;
};

type ResolvedPlayers = {
  userPlayerName?: string;
  opponentPlayerName?: string;
};

type SegmentOwner = "user" | "opponent" | "neutral";

const playerTokenPattern = "[A-Za-z0-9_]{2,32}";
const playerActionPattern =
  "(?:chose|won|decided|drew|played|attached|evolved|used|discarded|shuffled|put|took)";
const reservedPlayerTokens = new Set([
  "all",
  "and",
  "active",
  "attached",
  "basic",
  "bench",
  "card",
  "cards",
  "deck",
  "discard",
  "discarded",
  "drew",
  "energy",
  "evolved",
  "ex",
  "gx",
  "hand",
  "knocked",
  "loss",
  "lost",
  "out",
  "opponent",
  "played",
  "pokemon",
  "pokémon",
  "prize",
  "prizes",
  "setup",
  "the",
  "their",
  "turn",
  "used",
  "v",
  "vmax",
  "vstar",
  "win",
  "wins",
  "you",
  "your",
]);

function normalize(value: string) {
  return value
    .trim()
    .replace(/[\u2018\u2019'`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sortByOccurrence(lines: string[], candidates: string[]) {
  return candidates
    .map((candidate) => {
      const normalizedCandidate = normalize(candidate);
      const firstIndex = lines.findIndex((line) =>
        normalize(line).includes(normalizedCandidate)
      );

      return {
        candidate,
        firstIndex: firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex,
      };
    })
    .sort((left, right) => left.firstIndex - right.firstIndex)
    .map((entry) => entry.candidate);
}

// Kept temporarily as a reference for the older one-pass segmentation behavior.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeTcgLiveLogText(value: string) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019`]/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(
      new RegExp(
        `([.!?])\\s*(?=(?:${playerTokenPattern}|Opponent|You|Your opponent)\\s+${playerActionPattern}\\b|${playerTokenPattern}'s\\b)`,
        "gi"
      ),
      "$1\n"
    )
    .replace(
      new RegExp(
        `\\b(Setup|Active Pok(?:e|é)mon|Bench|Prize cards|Cards in hand)(?=(?:${playerTokenPattern}|Opponent|You|Your opponent)\\s+${playerActionPattern}\\b|${playerTokenPattern}'s\\b)`,
        "gi"
      ),
      "$1\n"
    );
}

function segmentTcgLiveLogText(value: string) {
  let normalized = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2018\u2019`]/g, "'")
    .replace(/[ \t]+/g, " ");

  for (let index = 0; index < 3; index += 1) {
    normalized = normalized
      .replace(
        new RegExp(
          `([.!?])\\s*(?=(?:${playerTokenPattern}|Opponent|You|Your opponent)\\s+${playerActionPattern}\\b|${playerTokenPattern}'s\\b)`,
          "gi"
        ),
        "$1\n"
      )
      .replace(
        new RegExp(
          `\\b(Setup|Active Pok(?:e|é|Ã©)mon|Bench|Prize cards|Cards in hand)(?=(?:${playerTokenPattern}|Opponent|You|Your opponent)\\s+${playerActionPattern}\\b|${playerTokenPattern}'s\\b)`,
          "gi"
        ),
        "$1\n"
      );
  }

  return normalized;
}

function isCleanPlayerToken(value: string | undefined): value is string {
  return Boolean(value && new RegExp(`^${playerTokenPattern}$`).test(value));
}

function isGenericPlayerReference(value: string) {
  return /^(you|your opponent|opponent)$/i.test(value);
}

export function isValidTcgLivePlayerName(value: string | undefined): value is string {
  return Boolean(
    isCleanPlayerToken(value) &&
      value &&
      !reservedPlayerTokens.has(normalize(value)) &&
      !isGenericPlayerReference(value)
  );
}

function isLikelyCompressedUserFragment(candidate: string, userPlayerName: string | undefined) {
  if (!userPlayerName) {
    return false;
  }

  const normalizedCandidate = normalize(candidate);
  const normalizedUser = normalize(userPlayerName);

  return normalizedCandidate !== normalizedUser && normalizedCandidate.endsWith(normalizedUser);
}

function cleanPlayerName(value: string) {
  return value.trim().replace(/[.!?]+$/g, "").trim();
}

function parseWinnerNameFromLine(line: string) {
  const trimmed = line.trim();
  if (!/\bwins\.?$/i.test(trimmed)) {
    return undefined;
  }

  const finalClauseMatch = trimmed.match(
    new RegExp(`(?:^|[.!?]\\s+)(${playerTokenPattern})\\s+wins\\.?$`, "i")
  );
  const fallbackMatch = trimmed.match(
    new RegExp(`^(${playerTokenPattern})\\s+wins\\.?$`, "i")
  );
  const winnerName = cleanPlayerName(finalClauseMatch?.[1] ?? fallbackMatch?.[1] ?? "");

  if (
    !winnerName ||
    !isValidTcgLivePlayerName(winnerName) ||
    /^(opponent took all of their prize cards|you took all of your prize cards|all prize cards taken|opponent conceded)$/i.test(
      winnerName
    )
  ) {
    return undefined;
  }

  return winnerName;
}

function addTokenMatches(candidates: Set<string>, text: string, pattern: RegExp) {
  for (const match of text.matchAll(pattern)) {
    const playerName = match[1]?.trim();

    if (
      isValidTcgLivePlayerName(playerName)
    ) {
      candidates.add(playerName);
    }
  }
}

function getOpeningHandPlayers(lines: string[]) {
  const candidates = new Set<string>();
  const pattern = new RegExp(
    `(?:^|\\n)(${playerTokenPattern})\\s+drew 7 cards for the opening hand\\.`,
    "gi"
  );

  addTokenMatches(candidates, lines.join("\n"), pattern);

  return sortByOccurrence(lines, Array.from(candidates));
}

function getKnownPlayerNames(lines: string[], rawPlayerName?: string) {
  const candidates = new Set<string>();
  const fullText = lines.join("\n");

  if (isValidTcgLivePlayerName(rawPlayerName)) {
    candidates.add(rawPlayerName.trim());
  }

  for (const line of lines) {
    const trimmed = line.trim();
    const winnerName = parseWinnerNameFromLine(trimmed);
    if (
      isValidTcgLivePlayerName(winnerName)
    ) {
      candidates.add(winnerName);
    }
  }

  [
    new RegExp(`(?:^|\\n)(${playerTokenPattern})\\s+chose (?:heads|tails) for the opening coin flip\\.`, "gi"),
    new RegExp(`(?:^|\\n)(${playerTokenPattern})\\s+won the coin toss\\.`, "gi"),
    new RegExp(`(?:^|\\n)(${playerTokenPattern})\\s+decided to go (?:first|second)\\.`, "gi"),
    new RegExp(`(?:^|\\n)(${playerTokenPattern})'s Turn\\b`, "gi"),
    new RegExp(`(?:^|\\n)(${playerTokenPattern})\\s+drew 7 cards for the opening hand\\.`, "gi"),
    new RegExp(`(?:^|\\n)(${playerTokenPattern})\\s+took (?:a|\\d+) Prize cards?\\.`, "gi"),
    new RegExp(`(?:^|\\n)(${playerTokenPattern})\\s+(?:played|attached|evolved)\\b`, "gi"),
    new RegExp(`(?:^|\\n)(${playerTokenPattern})'s\\s+.*?\\bused\\b`, "gi"),
  ].forEach((pattern) => addTokenMatches(candidates, fullText, pattern));

  if (rawPlayerName) {
    for (const candidate of Array.from(candidates)) {
      if (isLikelyCompressedUserFragment(candidate, rawPlayerName)) {
        candidates.delete(candidate);
      }
    }
  }

  return sortByOccurrence(lines, Array.from(candidates));
}

function detectWinner(lines: string[]) {
  for (const line of lines.slice().reverse()) {
    const winnerName = parseWinnerNameFromLine(line);

    if (winnerName && !/^you$/i.test(winnerName)) {
      return winnerName;
    }
  }

  return undefined;
}

function detectDecidingPlayer(lines: string[]) {
  const fullText = lines.join("\n");
  const namedPattern = new RegExp(
    `\\b(${playerTokenPattern})\\s+decided to go (first|second)\\.`,
    "gi"
  );
  const namedMatch = namedPattern.exec(fullText);

  if (namedMatch?.[1] && namedMatch?.[2]) {
    return {
      playerName: namedMatch[1].trim(),
      choice: namedMatch[2].toLowerCase() as "first" | "second",
    };
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (/you chose to go first|you went first|you are going first/i.test(trimmed)) {
      return {
        playerName: "you",
        choice: "first" as const,
      };
    }

    if (/you chose to go second|you went second|you are going second/i.test(trimmed)) {
      return {
        playerName: "you",
        choice: "second" as const,
      };
    }

    if (/your opponent chose to go first|opponent chose to go first|your opponent went first/i.test(trimmed)) {
      return {
        playerName: "opponent",
        choice: "first" as const,
      };
    }

    if (/your opponent chose to go second|opponent chose to go second|your opponent went second/i.test(trimmed)) {
      return {
        playerName: "opponent",
        choice: "second" as const,
      };
    }
  }

  return null;
}

function resolvePlayers(
  rawPlayerName: string | undefined,
  knownPlayers: string[],
  winnerName?: string,
  openingHandPlayers: string[] = []
): ResolvedPlayers {
  const normalizedPlayer = rawPlayerName ? normalize(rawPlayerName) : "";
  const userPlayerName =
    knownPlayers.find((name) => normalize(name) === normalizedPlayer) ??
    rawPlayerName;
  const openingHandOpponentName =
    userPlayerName && openingHandPlayers.length === 2
      ? openingHandPlayers.find(
          (name) => normalize(name) !== normalize(userPlayerName)
        )
      : undefined;
  const winnerOpponentName =
    userPlayerName &&
      isValidTcgLivePlayerName(winnerName) &&
    winnerName &&
    normalize(winnerName) !== normalize(userPlayerName)
      ? winnerName
      : undefined;
  const opponentPlayerName = userPlayerName
    ? openingHandOpponentName ??
      knownPlayers.find(
        (name) =>
          normalize(name) !== normalize(userPlayerName) &&
          !isLikelyCompressedUserFragment(name, userPlayerName)
      ) ?? winnerOpponentName
    : undefined;

  return {
    userPlayerName,
    opponentPlayerName,
  };
}

function resolveResult(
  lines: string[],
  resolvedPlayers: ResolvedPlayers
): ResultResolution {
  const fullLog = normalize(lines.join("\n"));

  if (
    /\b(match ended in a tie|match ended in draw|the match was a draw|the game was a draw|the game ended in a tie|it was a tie)\b/.test(
      fullLog
    )
  ) {
    return {
      result: "tie" as const,
      winnerName: undefined,
      note: "Detected result: tie",
    };
  }

  if (
    /\b(you won the match|you won the game|you won|you win|victory)\b/.test(fullLog) &&
    !/\b(you lost the match|you lost the game|you lost|defeat|opponent won|opponent wins)\b/.test(fullLog)
  ) {
    return {
      result: "win" as const,
      winnerName: resolvedPlayers.userPlayerName,
      note: "Detected result: win",
    };
  }

  if (
    /\b(you lost the match|you lost the game|you lost|defeat|opponent won|opponent wins)\b/.test(fullLog)
  ) {
    return {
      result: "loss" as const,
      winnerName: resolvedPlayers.opponentPlayerName,
      note: "Detected result: loss",
    };
  }

  const winnerName = detectWinner(lines);

  if (!winnerName) {
    return {
      result: undefined,
      winnerName: undefined,
      note: "Could not detect the result from this log.",
    };
  }

  if (!resolvedPlayers.userPlayerName) {
    return {
      result: undefined,
      winnerName,
      note: `Detected winner: ${winnerName}. Add your TCG Live name to autofill win/loss.`,
    };
  }

  if (
    resolvedPlayers.opponentPlayerName &&
    normalize(winnerName) !== normalize(resolvedPlayers.userPlayerName) &&
    normalize(winnerName) !== normalize(resolvedPlayers.opponentPlayerName)
  ) {
    return {
      result: undefined,
      winnerName,
      note: `Detected winner: ${winnerName}. Could not map that name to either player cleanly.`,
    };
  }

  return {
    result:
      normalize(winnerName) === normalize(resolvedPlayers.userPlayerName)
        ? ("win" as const)
        : ("loss" as const),
    winnerName,
    note:
      normalize(winnerName) === normalize(resolvedPlayers.userPlayerName)
        ? "Detected result: win"
        : resolvedPlayers.opponentPlayerName &&
            normalize(winnerName) === normalize(resolvedPlayers.opponentPlayerName)
          ? "Detected result: loss"
          : "Detected result: loss. Mapped winner to opponent from final winner line.",
  };
}

function resolveTurnOrder(
  lines: string[],
  resolvedPlayers: ResolvedPlayers
): TurnOrderResolution {
  const decidingPlayer = detectDecidingPlayer(lines);

  if (!decidingPlayer) {
    return {
      turnOrder: undefined,
      firstPlayerName: undefined,
      note: "Could not detect turn order from this log.",
    };
  }

  if (decidingPlayer.playerName === "you") {
    return {
      turnOrder: decidingPlayer.choice,
      firstPlayerName: resolvedPlayers.userPlayerName,
      note: `Detected turn order: ${decidingPlayer.choice}`,
    };
  }

  if (decidingPlayer.playerName === "opponent") {
    return {
      turnOrder: decidingPlayer.choice === "first" ? "second" : "first",
      firstPlayerName: decidingPlayer.choice === "first"
        ? resolvedPlayers.opponentPlayerName
        : resolvedPlayers.userPlayerName,
      note: `Detected turn order: ${
        decidingPlayer.choice === "first" ? "second" : "first"
      }`,
    };
  }

  if (!resolvedPlayers.userPlayerName) {
    return {
      turnOrder: undefined,
      firstPlayerName: decidingPlayer.choice === "first" ? decidingPlayer.playerName : undefined,
      note: `Detected turn choice: ${decidingPlayer.playerName} decided to go ${decidingPlayer.choice}. Add your TCG Live name to autofill turn order.`,
    };
  }

  const isUser =
    resolvedPlayers.userPlayerName &&
    normalize(decidingPlayer.playerName) === normalize(resolvedPlayers.userPlayerName);
  const userTurnOrder = isUser
    ? decidingPlayer.choice
    : decidingPlayer.choice === "first"
      ? "second"
      : "first";

  return {
    turnOrder: userTurnOrder,
    firstPlayerName:
      userTurnOrder === "first"
        ? resolvedPlayers.userPlayerName ?? decidingPlayer.playerName
        : resolvedPlayers.opponentPlayerName ?? decidingPlayer.playerName,
    note: `Detected turn order: ${userTurnOrder}`,
  };
}

function getSegmentOwner(
  segment: string,
  opponentName: string | undefined,
  playerName: string | undefined
): SegmentOwner {
  const trimmed = segment.trim();

  if (
    playerName &&
    new RegExp(`^${escapeRegex(playerName)}(?:'s)?\\b`, "i").test(trimmed)
  ) {
    return "user";
  }

  if (
    opponentName &&
    new RegExp(`^${escapeRegex(opponentName)}(?:'s)?\\b`, "i").test(trimmed)
  ) {
    return "opponent";
  }

  return "neutral";
}

function cleanEvidenceCardName(value: string) {
  return value
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+(?:in|on|to|from|with|for)\b.*$/i, "")
    .trim();
}

function isSafeEvidenceCardName(value: string) {
  const normalizedValue = normalize(value);

  return Boolean(
    normalizedValue &&
      !/^(a|an|the|energy|tool|pokemon tool|trainer|supporter|stadium)$/.test(
        normalizedValue
      ) &&
      !/\b(?:damage counter|prize card|active spot|bench|opening hand)\b/.test(
        normalizedValue
      )
  );
}

function cleanCardReviewName(value: string) {
  return value
    .trim()
    .replace(/[.!?]+$/g, "")
    .replace(/^\ba\b\s+/i, "")
    .replace(/^\ban\b\s+/i, "")
    .replace(/^\bthe\b\s+/i, "")
    .replace(/\s+(?:from|with|for)\b.*$/i, "")
    .trim();
}

function isSafeCardReviewName(value: string) {
  const normalizedValue = normalize(value);

  return Boolean(
    normalizedValue &&
      !/^(a|an|the|card|cards|deck|hand|bench|active spot|prize card|prize cards|damage counter|damage counters)$/i.test(
        normalizedValue
      ) &&
      !/\b(?:damage counter|prize card|opening hand|active spot)\b/i.test(
        normalizedValue
      )
  );
}

function extractUserCardReviewFromSegment(
  segment: string,
  userName: string
) {
  const trimmed = segment.trim();
  const user = escapeRegex(userName);
  const cardsSeen: string[] = [];
  const cardsUsed: string[] = [];
  const cardsDiscarded: string[] = [];

  const addSeen = (value: string | undefined) => {
    const cardName = cleanCardReviewName(value ?? "");

    if (isSafeCardReviewName(cardName)) {
      cardsSeen.push(cardName);
    }
  };

  const addUsed = (value: string | undefined) => {
    const cardName = cleanCardReviewName(value ?? "");

    if (isSafeCardReviewName(cardName)) {
      cardsSeen.push(cardName);
      cardsUsed.push(cardName);
    }
  };

  const addDiscarded = (value: string | undefined) => {
    const cardName = cleanCardReviewName(value ?? "");

    if (isSafeCardReviewName(cardName)) {
      cardsSeen.push(cardName);
      cardsDiscarded.push(cardName);
    }
  };

  const actorPokemonMatch = trimmed.match(
    new RegExp(`^${user}'s\\s+(.+?)\\s+used\\b`, "i")
  );

  if (actorPokemonMatch?.[1]) {
    addUsed(actorPokemonMatch[1]);
  }

  const playedCardMatch = trimmed.match(
    new RegExp(
      `^${user}\\s+played\\s+(.+?)(?:\\s+to the (?:Active Spot|Bench))?\\.?$`,
      "i"
    )
  );

  if (playedCardMatch?.[1]) {
    addUsed(playedCardMatch[1]);
  }

  const evolvedCardMatch = trimmed.match(
    new RegExp(
      `^${user}\\s+evolved\\s+(.+?)\\s+to\\s+(.+?)(?:\\s+on the (?:Active Spot|Bench))?\\.?$`,
      "i"
    )
  );

  if (evolvedCardMatch?.[1] || evolvedCardMatch?.[2]) {
    addSeen(evolvedCardMatch?.[1]);
    addUsed(evolvedCardMatch?.[2]);
  }

  const attachedCardMatch = trimmed.match(
    new RegExp(`^${user}\\s+attached\\s+(.+?)\\s+to\\s+.+?\\.?$`, "i")
  );

  if (attachedCardMatch?.[1]) {
    addUsed(attachedCardMatch[1]);
  }

  const discardedCardMatch = trimmed.match(
    new RegExp(`^${user}\\s+discarded\\s+(.+?)(?:\\s+from\\b.*)?\\.?$`, "i")
  );

  if (discardedCardMatch?.[1]) {
    addDiscarded(discardedCardMatch[1]);
  }

  return {
    cardsSeen,
    cardsUsed,
    cardsDiscarded,
  };
}

function extractUserCardReview(
  lines: string[],
  userName: string | undefined,
  opponentName: string | undefined
) {
  if (!userName) {
    return {
      cardsSeen: [] as string[],
      cardsUsed: [] as string[],
      cardsDiscarded: [] as string[],
    };
  }

  const cardReview = lines.reduce(
    (summary, line) => {
      const trimmed = line.trim();

      if (getSegmentOwner(trimmed, opponentName, userName) !== "user") {
        return summary;
      }

      const extracted = extractUserCardReviewFromSegment(trimmed, userName);

      summary.cardsSeen.push(...extracted.cardsSeen);
      summary.cardsUsed.push(...extracted.cardsUsed);
      summary.cardsDiscarded.push(...extracted.cardsDiscarded);

      return summary;
    },
    {
      cardsSeen: [] as string[],
      cardsUsed: [] as string[],
      cardsDiscarded: [] as string[],
    }
  );

  return {
    cardsSeen: dedupe(cardReview.cardsSeen),
    cardsUsed: dedupe(cardReview.cardsUsed),
    cardsDiscarded: dedupe(cardReview.cardsDiscarded),
  };
}

function parsePrizeCount(value: string) {
  if (/^a$/i.test(value)) {
    return 1;
  }

  const count = Number.parseInt(value, 10);

  return Number.isInteger(count) && count >= 1 && count <= 6
    ? count
    : undefined;
}

function resolvePrizeActor(
  actorText: string,
  resolvedPlayers: ResolvedPlayers
) {
  const normalizedActor = normalize(actorText);

  if (/^(you)$/i.test(actorText)) {
    return "user" as const;
  }

  if (/^(opponent|your opponent)$/i.test(actorText)) {
    return "opponent" as const;
  }

  if (
    resolvedPlayers.userPlayerName &&
    normalizedActor === normalize(resolvedPlayers.userPlayerName)
  ) {
    return "user" as const;
  }

  if (
    resolvedPlayers.opponentPlayerName &&
    normalizedActor === normalize(resolvedPlayers.opponentPlayerName)
  ) {
    return "opponent" as const;
  }

  return undefined;
}

function getPrizeRaceSummary({
  events,
  userTotal,
  opponentTotal,
  endedByConcession,
}: Pick<MatchPrizeRace, "events" | "userTotal" | "opponentTotal" | "endedByConcession">) {
  if (!events.length) {
    if (userTotal === 6) {
      return "Final prize state detected: you took all Prize cards, but the sequence was not reconstructed.";
    }

    if (opponentTotal === 6) {
      return "Final prize state detected: opponent took all Prize cards, but the sequence was not reconstructed.";
    }

    return "Prize race could not be reconstructed from this log.";
  }

  const firstEvent = events[0];

  if (endedByConcession) {
    if (userTotal > opponentTotal) {
      return "You were ahead before the concession.";
    }

    if (userTotal < opponentTotal) {
      return "You were behind before the concession.";
    }

    return "The prize race was even before the concession.";
  }

  if (firstEvent.actor === "opponent") {
    return "You fell behind early in the prize race.";
  }

  if (events.every((event) => Math.abs(event.userTotal - event.opponentTotal) <= 1)) {
    return "You stayed close through the prize race.";
  }

  if (userTotal > opponentTotal) {
    return "You finished ahead in the prize race.";
  }

  if (userTotal < opponentTotal) {
    return "You fell behind in the prize race.";
  }

  return "You stayed even until the final exchange.";
}

function extractPrizeRace(
  lines: string[],
  resolvedPlayers: ResolvedPlayers
): MatchPrizeRace | undefined {
  let userTotal = 0;
  let opponentTotal = 0;
  let finalUserTotal: number | undefined;
  let finalOpponentTotal: number | undefined;
  let endedByConcession = false;
  const events: MatchPrizeRace["events"] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const prizeMatch = trimmed.match(
      new RegExp(
        `^(You|Opponent|Your opponent|${playerTokenPattern})\\s+took\\s+(a|[1-6])\\s+Prize cards?\\.?$`,
        "i"
      )
    );

    if (prizeMatch?.[1] && prizeMatch?.[2]) {
      const actor = resolvePrizeActor(prizeMatch[1], resolvedPlayers);
      const prizesTaken = parsePrizeCount(prizeMatch[2]);

      if (!actor || !prizesTaken) {
        continue;
      }

      if (actor === "user") {
        userTotal = Math.min(6, userTotal + prizesTaken);
      } else {
        opponentTotal = Math.min(6, opponentTotal + prizesTaken);
      }

      events.push({
        actor,
        prizesTaken,
        userTotal,
        opponentTotal,
        rawText: trimmed,
      });
      continue;
    }

    const allPrizesMatch = trimmed.match(
      new RegExp(
        `^(You|Opponent|Your opponent|${playerTokenPattern})\\s+took all\\b.*\\bPrize cards\\b`,
        "i"
      )
    );

    if (allPrizesMatch?.[1]) {
      const actor =
        /^all prize cards taken$/i.test(allPrizesMatch[1])
          ? undefined
          : resolvePrizeActor(allPrizesMatch[1], resolvedPlayers);

      if (actor === "user") {
        finalUserTotal = 6;
      } else if (actor === "opponent") {
        finalOpponentTotal = 6;
      }
    }

    if (/\bconceded\b/i.test(trimmed)) {
      endedByConcession = true;
    }
  }

  userTotal = Math.max(userTotal, finalUserTotal ?? 0);
  opponentTotal = Math.max(opponentTotal, finalOpponentTotal ?? 0);

  if (
    !events.length &&
    !endedByConcession &&
    finalUserTotal === undefined &&
    finalOpponentTotal === undefined
  ) {
    return undefined;
  }

  const prizeRace = {
    events,
    userTotal,
    opponentTotal,
    endedByConcession: endedByConcession || undefined,
  } satisfies Omit<MatchPrizeRace, "summary">;

  return {
    ...prizeRace,
    summary: getPrizeRaceSummary(prizeRace),
  };
}

function extractOpponentEvidenceFromSegment(
  segment: string,
  opponentName: string,
  playerName: string | undefined
) {
  const trimmed = segment.trim();
  const opponent = escapeRegex(opponentName);
  const user = playerName ? escapeRegex(playerName) : null;
  const extractedCards: string[] = [];

  const addCard = (value: string | undefined) => {
    const cardName = cleanEvidenceCardName(value ?? "");

    if (isSafeEvidenceCardName(cardName)) {
      extractedCards.push(cardName);
    }
  };

  const actorPokemonMatch = trimmed.match(
    new RegExp(`^${opponent}'s\\s+(.+?)\\s+used\\b`, "i")
  );

  if (actorPokemonMatch?.[1]) {
    addCard(actorPokemonMatch[1]);
  }

  const playedPokemonMatch = trimmed.match(
    new RegExp(
      `^${opponent}\\s+played\\s+(.+?)\\s+to the (?:Active Spot|Bench)\\.?$`,
      "i"
    )
  );

  if (playedPokemonMatch?.[1]) {
    addCard(playedPokemonMatch[1]);
  }

  const evolvedPokemonMatch = trimmed.match(
    new RegExp(
      `^${opponent}\\s+evolved\\s+(.+?)\\s+to\\s+(.+?)(?:\\s+on the (?:Active Spot|Bench))?\\.?$`,
      "i"
    )
  );

  if (evolvedPokemonMatch?.[1] || evolvedPokemonMatch?.[2]) {
    addCard(evolvedPokemonMatch?.[1]);
    addCard(evolvedPokemonMatch?.[2]);
  }

  const attachedPokemonMatch = trimmed.match(
    new RegExp(`^${opponent}\\s+attached\\s+.+?\\s+to\\s+(.+?)\\.?$`, "i")
  );
  const attachedTarget = attachedPokemonMatch?.[1]?.trim();

  if (
    attachedTarget &&
    (!user || !new RegExp(`\\b${user}'s\\b`, "i").test(attachedTarget))
  ) {
    const opponentOwnedTarget = attachedTarget.match(
      new RegExp(`^${opponent}'s\\s+(.+)$`, "i")
    );

    addCard(opponentOwnedTarget?.[1] ?? attachedTarget);
  }

  return extractedCards;
}

function extractOpponentFocusedLog(
  lines: string[],
  opponentName: string | undefined,
  playerName: string | undefined
) {
  if (!opponentName) {
    return { text: "", cards: [] as string[] };
  }

  const cards = dedupe(
    lines.flatMap((line) => {
      const trimmed = line.trim();

      if (getSegmentOwner(trimmed, opponentName, playerName) !== "opponent") {
        return [];
      }

      return extractOpponentEvidenceFromSegment(
        trimmed,
        opponentName,
        playerName
      );
    })
  );

  return {
    text: cards.join("\n"),
    cards,
  };
}

function detectOpponentDeck(
  lines: string[],
  opponentName: string | undefined,
  playerName: string | undefined,
  archetypeOptions: string[]
) {
  const opponentEvidence = extractOpponentFocusedLog(
    lines,
    opponentName,
    playerName
  );
  const opponentFocusedLog = opponentEvidence.text;

  if (!opponentFocusedLog) {
    return {
      opponentDeckGuess: undefined,
      opponentEvidenceCards: [] as string[],
      confidence: "low" as const,
      note: "Could not confidently detect opponent deck. Please choose it manually.",
    };
  }

  const suggestion = suggestArchetypeFromLogText(opponentFocusedLog);

  if (suggestion.isClearSuggestion && suggestion.archetype !== OTHER_ARCHETYPE) {
    return {
      opponentDeckGuess: suggestion.archetype,
      opponentEvidenceCards: opponentEvidence.cards,
      confidence:
        suggestion.confidence === "high"
          ? ("high" as const)
          : ("medium" as const),
      note: `Detected opponent deck: ${suggestion.archetype}`,
    };
  }

  const normalizedOpponentLog = normalize(opponentFocusedLog);
  const directMatch = archetypeOptions
    .slice()
    .sort((left, right) => right.length - left.length)
    .find((option) => normalizedOpponentLog.includes(normalize(option)));

  if (directMatch) {
    return {
      opponentDeckGuess: directMatch,
      opponentEvidenceCards: opponentEvidence.cards,
      confidence: "medium" as const,
      note: `Detected opponent deck: ${directMatch}`,
    };
  }

  return {
    opponentDeckGuess: undefined,
    opponentEvidenceCards: opponentEvidence.cards,
    confidence: "low" as const,
    note: "Could not confidently detect opponent deck. Please choose it manually.",
  };
}

export function parseTcgLiveLog(
  text: string,
  options: ParseOptions = {}
): TcgLiveLogParseResult {
  const lines = segmentTcgLiveLogText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const winnerName = detectWinner(lines);
  const openingHandPlayers = getOpeningHandPlayers(lines);
  const knownPlayers = getKnownPlayerNames(lines, options.playerName?.trim() || undefined);
  const resolvedPlayers = resolvePlayers(
    options.playerName?.trim() || undefined,
    knownPlayers,
    winnerName,
    openingHandPlayers
  );

  const resultInfo = resolveResult(lines, resolvedPlayers);
  const turnInfo = resolveTurnOrder(lines, resolvedPlayers);
  const safeOpponentName = isValidTcgLivePlayerName(
    resolvedPlayers.opponentPlayerName
  )
    ? resolvedPlayers.opponentPlayerName
    : undefined;

  const opponentDeck = detectOpponentDeck(
    lines,
    safeOpponentName,
    resolvedPlayers.userPlayerName,
    options.archetypeOptions ?? []
  );
  const cardReview = extractUserCardReview(
    lines,
    resolvedPlayers.userPlayerName,
    safeOpponentName
  );
  const prizeRace = extractPrizeRace(lines, {
    ...resolvedPlayers,
    opponentPlayerName: safeOpponentName,
  });

  const notes = dedupe(
    [
      resultInfo.note,
      turnInfo.note,
      safeOpponentName
        ? `Detected opponent: ${safeOpponentName}`
        : "Could not confidently detect opponent. Please enter it manually.",
      opponentDeck.note,
    ].filter((value): value is string => Boolean(value))
  );

  return {
    result: resultInfo.result,
    turnOrder: turnInfo.turnOrder,
    userPlayerName: resolvedPlayers.userPlayerName,
    opponentName: safeOpponentName,
    winnerName: resultInfo.winnerName,
    firstPlayerName: turnInfo.firstPlayerName,
    opponentDeckGuess: opponentDeck.opponentDeckGuess,
    opponentEvidenceCards: opponentDeck.opponentEvidenceCards,
    cardReview,
    prizeRace,
    confidence: opponentDeck.confidence,
    notes,
  };
}
