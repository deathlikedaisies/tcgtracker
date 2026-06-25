import { OTHER_ARCHETYPE } from "@/lib/archetypes";
import { suggestArchetypeFromLogText } from "@/lib/decklist";

export type TcgLiveLogParseResult = {
  result?: "win" | "loss" | "tie";
  turnOrder?: "first" | "second" | "unknown";
  opponentDeckGuess?: string;
  confidence?: "high" | "medium" | "low";
  notes: string[];
};

type ParseOptions = {
  archetypeOptions?: string[];
};

function normalize(value: string) {
  return value
    .trim()
    .replace(/[\u2018\u2019'`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function detectResult(normalizedLog: string) {
  if (
    /\b(match ended in a tie|match ended in draw|the match was a draw|the game was a draw|the game ended in a tie|it was a tie)\b/.test(
      normalizedLog
    )
  ) {
    return "tie" as const;
  }

  if (
    /\b(you won the match|you won the game|you won|you win|victory)\b/.test(
      normalizedLog
    ) &&
    !/\b(you lost the match|you lost the game|you lost|defeat|opponent won|opponent wins)\b/.test(
      normalizedLog
    )
  ) {
    return "win" as const;
  }

  if (
    /\b(you lost the match|you lost the game|you lost|defeat|opponent won|opponent wins)\b/.test(
      normalizedLog
    )
  ) {
    return "loss" as const;
  }

  return undefined;
}

function detectTurnOrder(normalizedLog: string) {
  if (
    /\b(you chose to go first|you went first|you are going first)\b/.test(
      normalizedLog
    ) ||
    /\b(your opponent chose to go second|opponent chose to go second|your opponent went second)\b/.test(
      normalizedLog
    )
  ) {
    return "first" as const;
  }

  if (
    /\b(you chose to go second|you went second|you are going second)\b/.test(
      normalizedLog
    ) ||
    /\b(your opponent chose to go first|opponent chose to go first|your opponent went first)\b/.test(
      normalizedLog
    )
  ) {
    return "second" as const;
  }

  return undefined;
}

function extractOpponentFocusedLog(logText: string) {
  const lines = logText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const opponentLines = lines.filter((line) =>
    /\b(opponent|your opponent)\b/i.test(line)
  );

  return opponentLines.length ? opponentLines.join("\n") : logText;
}

function detectOpponentDeck(logText: string, archetypeOptions: string[]) {
  const opponentFocusedLog = extractOpponentFocusedLog(logText);
  const suggestion = suggestArchetypeFromLogText(opponentFocusedLog);

  if (suggestion.isClearSuggestion && suggestion.archetype !== OTHER_ARCHETYPE) {
    return {
      opponentDeckGuess: suggestion.archetype,
      confidence:
        suggestion.confidence === "high"
          ? ("high" as const)
          : ("medium" as const),
      note:
        suggestion.confidence === "high"
          ? `Detected opponent deck: ${suggestion.archetype}.`
          : `Possible opponent deck: ${suggestion.archetype}.`,
    };
  }

  const normalizedLog = normalize(logText);
  const directMatch = archetypeOptions
    .slice()
    .sort((left, right) => right.length - left.length)
    .find((option) => normalizedLog.includes(normalize(option)));

  if (directMatch) {
    return {
      opponentDeckGuess: directMatch,
      confidence: "medium" as const,
      note: `Possible opponent deck: ${directMatch}.`,
    };
  }

  return {
    opponentDeckGuess: undefined,
    confidence: "low" as const,
    note: "Could not confidently detect the opponent deck. Please choose it manually.",
  };
}

export function parseTcgLiveLog(
  text: string,
  options: ParseOptions = {}
): TcgLiveLogParseResult {
  const normalizedLog = normalize(text);
  const notes: string[] = [];
  const result = detectResult(normalizedLog);
  const turnOrder = detectTurnOrder(normalizedLog);

  if (!result) {
    notes.push("Could not detect the result from this log.");
  }

  if (!turnOrder) {
    notes.push("Could not detect turn order from this log.");
  }

  const opponentDeck = detectOpponentDeck(text, options.archetypeOptions ?? []);
  notes.push(opponentDeck.note);

  return {
    result,
    turnOrder,
    opponentDeckGuess: opponentDeck.opponentDeckGuess,
    confidence: opponentDeck.confidence,
    notes,
  };
}
