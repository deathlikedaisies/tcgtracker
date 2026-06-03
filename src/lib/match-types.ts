export type MatchResult = "win" | "loss" | "tie";
export type MatchGameContext = "testing" | "competitive";
export type MatchStartQuality = "great" | "good" | "okay" | "bad";
export type MatchOpeningHandQuality = "great" | "good" | "okay" | "bad";
export type MatchSequencingQuality = "great" | "good" | "okay" | "bad";

export type MatchMetadata = {
  game_context?: MatchGameContext;
  event_name?: string;
  round_number?: string;
  testing_session_name?: string;
  focus_matchup?: string;
  start_quality?: MatchStartQuality;
  opening_hand_quality?: MatchOpeningHandQuality;
  sequencing_quality?: MatchSequencingQuality;
  issue_tags?: string[];
  positive_tags?: string[];
  cards_shined?: string[];
  cards_failed?: string[];
};

export type MatchResultCounts = {
  wins: number;
  losses: number;
  ties: number;
  total: number;
};

export const MATCH_GAME_CONTEXT_OPTIONS = [
  "testing",
  "competitive",
] as const;
export const MATCH_START_QUALITY_OPTIONS = [
  "great",
  "good",
  "okay",
  "bad",
] as const;
export const MATCH_OPENING_HAND_OPTIONS = [
  "great",
  "good",
  "okay",
  "bad",
] as const;
export const MATCH_SEQUENCING_OPTIONS = [
  "great",
  "good",
  "okay",
  "bad",
] as const;

const KNOWN_METADATA_KEYS = [
  "game_context",
  "event_name",
  "round_number",
  "testing_session_name",
  "focus_matchup",
  "start_quality",
  "opening_hand_quality",
  "sequencing_quality",
  "issue_tags",
  "positive_tags",
  "cards_shined",
  "cards_failed",
] as const satisfies readonly (keyof MatchMetadata)[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const text = value.trim();
  return text ? text : undefined;
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = Array.from(
    new Set(
      value
        .map((entry) => cleanText(entry))
        .filter((entry): entry is string => Boolean(entry))
    )
  );

  return values.length ? values : undefined;
}

function isOneOf<T extends readonly string[]>(
  value: unknown,
  options: T
): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

export function isMatchResult(
  value: string | null | undefined
): value is MatchResult {
  return value === "win" || value === "loss" || value === "tie";
}

export function countMatchResults<T extends { result: MatchResult }>(
  matches: T[]
): MatchResultCounts {
  return matches.reduce(
    (counts, match) => {
      if (match.result === "win") {
        counts.wins += 1;
      } else if (match.result === "loss") {
        counts.losses += 1;
      } else {
        counts.ties += 1;
      }

      counts.total += 1;
      return counts;
    },
    { wins: 0, losses: 0, ties: 0, total: 0 }
  );
}

export function formatMatchRecord(wins: number, losses: number, ties = 0) {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function getMatchResultLabel(result: MatchResult) {
  if (result === "win") {
    return "Win";
  }

  if (result === "loss") {
    return "Loss";
  }

  return "Tie";
}

export function getGameContextLabel(context: MatchGameContext) {
  return context === "competitive" ? "Competitive" : "Testing";
}

export function getQualityLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseMatchMetadata(value: unknown): MatchMetadata {
  if (!isRecord(value)) {
    return {};
  }

  const metadata: MatchMetadata = {};

  if (isOneOf(value.game_context, MATCH_GAME_CONTEXT_OPTIONS)) {
    metadata.game_context = value.game_context;
  }

  metadata.event_name = cleanText(value.event_name);
  metadata.round_number = cleanText(value.round_number);
  metadata.testing_session_name = cleanText(value.testing_session_name);
  metadata.focus_matchup = cleanText(value.focus_matchup);

  if (isOneOf(value.start_quality, MATCH_START_QUALITY_OPTIONS)) {
    metadata.start_quality = value.start_quality;
  }

  if (isOneOf(value.opening_hand_quality, MATCH_OPENING_HAND_OPTIONS)) {
    metadata.opening_hand_quality = value.opening_hand_quality;
  }

  if (isOneOf(value.sequencing_quality, MATCH_SEQUENCING_OPTIONS)) {
    metadata.sequencing_quality = value.sequencing_quality;
  }

  metadata.issue_tags = cleanStringArray(value.issue_tags);
  metadata.positive_tags = cleanStringArray(value.positive_tags);
  metadata.cards_shined = cleanStringArray(value.cards_shined);
  metadata.cards_failed = cleanStringArray(value.cards_failed);

  return metadata;
}

export function replaceKnownMatchMetadata(
  existingValue: unknown,
  nextKnownFields: MatchMetadata
) {
  const existing = isRecord(existingValue) ? { ...existingValue } : {};

  for (const key of KNOWN_METADATA_KEYS) {
    delete existing[key];
  }

  return {
    ...existing,
    ...nextKnownFields,
  };
}

export function deriveInitialGameContext(
  metadata: MatchMetadata,
  eventType?: string | null
): MatchGameContext {
  if (metadata.game_context) {
    return metadata.game_context;
  }

  return eventType === "tournament" ? "competitive" : "testing";
}
