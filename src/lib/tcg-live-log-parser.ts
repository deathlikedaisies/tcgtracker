import { OTHER_ARCHETYPE } from "@/lib/archetypes";
import { suggestArchetypeFromLogText } from "@/lib/decklist";

export type TcgLiveLogParseResult = {
  result?: "win" | "loss" | "tie";
  turnOrder?: "first" | "second" | "unknown";
  opponentName?: string;
  winnerName?: string;
  decidingPlayerName?: string;
  opponentDeckGuess?: string;
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
  decidingPlayerName?: string;
  note: string;
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

function getKnownPlayerNames(lines: string[]) {
  const candidates = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();

    [
      /^(.*?) chose heads for the opening coin flip\./i,
      /^(.*?) won the coin toss\./i,
      /^(.*?) decided to go (first|second)\./i,
      /^(.*?) (played|attached|evolved|used|drew|discarded|shuffled|put|took)\b/i,
      /All Prize cards taken\. (.*?) wins\./i,
      /^(.*?) wins\./i,
    ].forEach((pattern) => {
      const match = trimmed.match(pattern);
      const playerName = match?.[1]?.trim();

      if (playerName && !/^you$/i.test(playerName) && !/^your opponent$/i.test(playerName)) {
        candidates.add(playerName);
      }
    });
  }

  return Array.from(candidates);
}

function detectWinner(lines: string[]) {
  for (const line of lines) {
    const trimmed = line.trim();
    const prizeMatch = trimmed.match(/^All Prize cards taken\. (.*?) wins\.$/i);

    if (prizeMatch?.[1]) {
      return prizeMatch[1].trim();
    }

    const simpleMatch = trimmed.match(/^(.*?) wins\.$/i);

    if (simpleMatch?.[1] && !/^you$/i.test(simpleMatch[1])) {
      return simpleMatch[1].trim();
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

function resolveOpponentName(playerName: string | undefined, knownPlayers: string[]) {
  if (!playerName) {
    return undefined;
  }

  const normalizedPlayer = normalize(playerName);
  return knownPlayers.find((name) => normalize(name) !== normalizedPlayer);
}

function resolveResult(
  lines: string[],
  playerName: string | undefined,
  knownPlayers: string[]
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
      winnerName: playerName,
      note: "Detected result: win",
    };
  }

  if (
    /\b(you lost the match|you lost the game|you lost|defeat|opponent won|opponent wins)\b/.test(fullLog)
  ) {
    return {
      result: "loss" as const,
      winnerName: resolveOpponentName(playerName, knownPlayers),
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

  if (!playerName) {
    return {
      result: undefined,
      winnerName,
      note: `Detected winner: ${winnerName}. Add your TCG Live name to autofill win/loss.`,
    };
  }

  return {
    result:
      normalize(winnerName) === normalize(playerName)
        ? ("win" as const)
        : ("loss" as const),
    winnerName,
    note:
      normalize(winnerName) === normalize(playerName)
        ? "Detected result: win"
        : "Detected result: loss",
  };
}

function resolveTurnOrder(
  lines: string[],
  playerName: string | undefined
): TurnOrderResolution {
  const decidingPlayer = detectDecidingPlayer(lines);

  if (!decidingPlayer) {
    return {
      turnOrder: undefined,
      decidingPlayerName: undefined,
      note: "Could not detect turn order from this log.",
    };
  }

  if (decidingPlayer.playerName === "you") {
    return {
      turnOrder: decidingPlayer.choice,
      decidingPlayerName: playerName,
      note: `Detected turn order: ${decidingPlayer.choice}`,
    };
  }

  if (decidingPlayer.playerName === "opponent") {
    return {
      turnOrder: decidingPlayer.choice === "first" ? "second" : "first",
      decidingPlayerName: undefined,
      note: `Detected turn order: ${
        decidingPlayer.choice === "first" ? "second" : "first"
      }`,
    };
  }

  if (!playerName) {
    return {
      turnOrder: undefined,
      decidingPlayerName: decidingPlayer.playerName,
      note: `Detected turn choice: ${decidingPlayer.playerName} decided to go ${decidingPlayer.choice}. Add your TCG Live name to autofill turn order.`,
    };
  }

  const isUser = normalize(decidingPlayer.playerName) === normalize(playerName);

  return {
    turnOrder: isUser
      ? decidingPlayer.choice
      : decidingPlayer.choice === "first"
        ? "second"
        : "first",
    decidingPlayerName: decidingPlayer.playerName,
    note: `Detected turn order: ${
      isUser
        ? decidingPlayer.choice
        : decidingPlayer.choice === "first"
          ? "second"
          : "first"
    }`,
  };
}

function extractOpponentFocusedLog(
  lines: string[],
  opponentName: string | undefined,
  playerName: string | undefined
) {
  if (!opponentName) {
    return "";
  }

  const opponentPattern = new RegExp(
    `^${escapeRegex(opponentName)}(?:'s)?\\b`,
    "i"
  );
  const playerPattern = playerName
    ? new RegExp(`^${escapeRegex(playerName)}(?:'s)?\\b`, "i")
    : null;

  return lines
    .filter((line) => {
      const trimmed = line.trim();

      if (playerPattern?.test(trimmed)) {
        return false;
      }

      return opponentPattern.test(trimmed);
    })
    .join("\n");
}

function detectOpponentDeck(
  lines: string[],
  opponentName: string | undefined,
  playerName: string | undefined,
  archetypeOptions: string[]
) {
  const opponentFocusedLog = extractOpponentFocusedLog(
    lines,
    opponentName,
    playerName
  );

  if (!opponentFocusedLog) {
    return {
      opponentDeckGuess: undefined,
      confidence: "low" as const,
      note: "Could not confidently detect opponent deck. Please choose it manually.",
    };
  }

  const suggestion = suggestArchetypeFromLogText(opponentFocusedLog);

  if (suggestion.isClearSuggestion && suggestion.archetype !== OTHER_ARCHETYPE) {
    return {
      opponentDeckGuess: suggestion.archetype,
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
      confidence: "medium" as const,
      note: `Detected opponent deck: ${directMatch}`,
    };
  }

  return {
    opponentDeckGuess: undefined,
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
  const playerName = options.playerName?.trim() || undefined;
  const opponentName = playerName
    ? resolveOpponentName(playerName, knownPlayers)
    : undefined;

  const resultInfo = resolveResult(lines, playerName, knownPlayers);
  const turnInfo = resolveTurnOrder(lines, playerName);
  const opponentDeck = detectOpponentDeck(
    lines,
    opponentName,
    playerName,
    options.archetypeOptions ?? []
  );

  const notes = dedupe(
    [
      resultInfo.note,
      turnInfo.note,
      opponentName ? `Detected opponent: ${opponentName}` : null,
      opponentDeck.note,
    ].filter((value): value is string => Boolean(value))
  );

  return {
    result: resultInfo.result,
    turnOrder: turnInfo.turnOrder,
    opponentName,
    winnerName: resultInfo.winnerName,
    decidingPlayerName: turnInfo.decidingPlayerName,
    opponentDeckGuess: opponentDeck.opponentDeckGuess,
    confidence: opponentDeck.confidence,
    notes,
  };
}
