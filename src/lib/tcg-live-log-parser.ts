import { OTHER_ARCHETYPE } from "@/lib/archetypes";
import { suggestArchetypeFromLogText } from "@/lib/decklist";

export type TcgLiveLogParseResult = {
  result?: "win" | "loss" | "tie";
  turnOrder?: "first" | "second" | "unknown";
  userPlayerName?: string;
  opponentName?: string;
  winnerName?: string;
  firstPlayerName?: string;
  opponentDeckGuess?: string;
  opponentEvidenceCards?: string[];
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

function cleanPlayerName(value: string) {
  return value.trim().replace(/[.!?]+$/g, "").trim();
}

function parseWinnerNameFromLine(line: string) {
  const trimmed = line.trim();
  if (!/\bwins\.?$/i.test(trimmed)) {
    return undefined;
  }

  const finalClauseMatch = trimmed.match(/(?:^|[.!?]\s+)([^.!?]+?)\s+wins\.?$/i);
  const fallbackMatch = trimmed.match(/^(.+?)\s+wins\.?$/i);
  const winnerName = cleanPlayerName(finalClauseMatch?.[1] ?? fallbackMatch?.[1] ?? "");

  if (
    !winnerName ||
    /^(opponent took all of their prize cards|you took all of your prize cards|all prize cards taken|opponent conceded)$/i.test(
      winnerName
    )
  ) {
    return undefined;
  }

  return winnerName;
}

function getKnownPlayerNames(lines: string[]) {
  const candidates = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    const winnerName = parseWinnerNameFromLine(trimmed);
    if (winnerName && !/^you$/i.test(winnerName) && !/^your opponent$/i.test(winnerName)) {
      candidates.add(winnerName);
    }

    [
      /^(.*?) chose heads for the opening coin flip\./i,
      /^(.*?) won the coin toss\./i,
      /^(.*?) decided to go (first|second)\./i,
      /^(.*?) (played|attached|evolved|used|drew|discarded|shuffled|put|took)\b/i,
      /^(.*?)'s .*?\b(used|attacked|retreated|was Knocked Out|was damaged|used)\b/i,
    ].forEach((pattern) => {
      const match = trimmed.match(pattern);
      const playerName = match?.[1]?.trim();

      if (playerName && !/^you$/i.test(playerName) && !/^your opponent$/i.test(playerName)) {
        candidates.add(playerName);
      }
    });
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
  for (const line of lines) {
    const trimmed = line.trim();
    const namedMatch = trimmed.match(/^(.*?) decided to go (first|second)\.$/i);

    if (namedMatch?.[1] && namedMatch?.[2]) {
      return {
        playerName: namedMatch[1].trim(),
        choice: namedMatch[2].toLowerCase() as "first" | "second",
      };
    }

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
  knownPlayers: string[]
): ResolvedPlayers {
  const normalizedPlayer = rawPlayerName ? normalize(rawPlayerName) : "";
  const userPlayerName =
    knownPlayers.find((name) => normalize(name) === normalizedPlayer) ??
    rawPlayerName;
  const opponentPlayerName = userPlayerName
    ? knownPlayers.find((name) => normalize(name) !== normalize(userPlayerName))
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
        : "Detected result: loss",
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

function extractOpponentFocusedLog(
  lines: string[],
  opponentName: string | undefined,
  playerName: string | undefined
) {
  if (!opponentName) {
    return { text: "", cards: [] as string[] };
  }

  const opponentPattern = new RegExp(
    `^${escapeRegex(opponentName)}(?:'s)?\\b`,
    "i"
  );
  const playerPattern = playerName
    ? new RegExp(`^${escapeRegex(playerName)}(?:'s)?\\b`, "i")
    : null;

  const opponentLines = lines.filter((line) => {
      const trimmed = line.trim();

      if (playerPattern?.test(trimmed)) {
        return false;
      }

      return opponentPattern.test(trimmed);
    });

  const cards = dedupe(
    opponentLines.flatMap((line) => {
      const trimmed = line.trim();
      const patterns = [
        new RegExp(`^${escapeRegex(opponentName)} played (.*?) to the (?:Active Spot|Bench)\\.?$`, "i"),
        new RegExp(`^${escapeRegex(opponentName)} evolved .*? to (.*?) on the (?:Active Spot|Bench)\\.?$`, "i"),
        new RegExp(`^${escapeRegex(opponentName)} attached .*? to (.*?)\\.?$`, "i"),
        new RegExp(`^${escapeRegex(opponentName)}'s (.*?) used .*`, "i"),
      ];

      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          return [match[1].trim()];
        }
      }

      return [];
    })
  );

  return {
    text: opponentLines.join("\n"),
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
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const knownPlayers = getKnownPlayerNames(lines);
  const resolvedPlayers = resolvePlayers(
    options.playerName?.trim() || undefined,
    knownPlayers
  );

  const resultInfo = resolveResult(lines, resolvedPlayers);
  const turnInfo = resolveTurnOrder(lines, resolvedPlayers);
  const opponentDeck = detectOpponentDeck(
    lines,
    resolvedPlayers.opponentPlayerName,
    resolvedPlayers.userPlayerName,
    options.archetypeOptions ?? []
  );

  const notes = dedupe(
    [
      resultInfo.note,
      turnInfo.note,
      resolvedPlayers.opponentPlayerName
        ? `Detected opponent: ${resolvedPlayers.opponentPlayerName}`
        : null,
      opponentDeck.note,
    ].filter((value): value is string => Boolean(value))
  );

  return {
    result: resultInfo.result,
    turnOrder: turnInfo.turnOrder,
    userPlayerName: resolvedPlayers.userPlayerName,
    opponentName: resolvedPlayers.opponentPlayerName,
    winnerName: resultInfo.winnerName,
    firstPlayerName: turnInfo.firstPlayerName,
    opponentDeckGuess: opponentDeck.opponentDeckGuess,
    opponentEvidenceCards: opponentDeck.opponentEvidenceCards,
    confidence: opponentDeck.confidence,
    notes,
  };
}
