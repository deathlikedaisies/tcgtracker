import { isOneOf } from "@/lib/type-guards";

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
  source?: "manual" | "tcg_live_import" | "event_round";
  start_quality?: MatchStartQuality;
  opening_hand_quality?: MatchOpeningHandQuality;
  sequencing_quality?: MatchSequencingQuality;
  issue_tags?: string[];
  positive_tags?: string[];
  cards_shined?: string[];
  cards_failed?: string[];
  tcg_live_cards_seen?: string[];
  tcg_live_cards_used?: string[];
  tcg_live_cards_discarded?: string[];
  prizeRace?: MatchPrizeRace;
};

export type MatchPrizeRaceEvent = {
  actor: "user" | "opponent";
  prizesTaken: number;
  userTotal: number;
  opponentTotal: number;
  rawText?: string;
};

export type MatchPrizeRace = {
  events: MatchPrizeRaceEvent[];
  userTotal: number;
  opponentTotal: number;
  endedByConcession?: boolean;
  summary?: string;
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
  "source",
  "start_quality",
  "opening_hand_quality",
  "sequencing_quality",
  "issue_tags",
  "positive_tags",
  "cards_shined",
  "cards_failed",
  "tcg_live_cards_seen",
  "tcg_live_cards_used",
  "tcg_live_cards_discarded",
  "prizeRace",
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

function cleanPrizeRaceActor(value: unknown) {
  return value === "user" || value === "opponent" ? value : undefined;
}

function cleanPrizeCount(value: unknown) {
  const count = typeof value === "number" ? value : Number(value);

  return Number.isInteger(count) && count >= 0 && count <= 6
    ? count
    : undefined;
}

export function parseMatchPrizeRace(value: unknown): MatchPrizeRace | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const events = Array.isArray(value.events)
    ? value.events
        .map((event): MatchPrizeRaceEvent | null => {
          if (!isRecord(event)) {
            return null;
          }

          const actor = cleanPrizeRaceActor(event.actor);
          const prizesTaken = cleanPrizeCount(event.prizesTaken);
          const userTotal = cleanPrizeCount(event.userTotal);
          const opponentTotal = cleanPrizeCount(event.opponentTotal);

          if (!actor || !prizesTaken || userTotal === undefined || opponentTotal === undefined) {
            return null;
          }

          return {
            actor,
            prizesTaken,
            userTotal,
            opponentTotal,
            rawText: cleanText(event.rawText),
          };
        })
        .filter((event): event is MatchPrizeRaceEvent => Boolean(event))
    : [];
  const userTotal = cleanPrizeCount(value.userTotal) ?? events.at(-1)?.userTotal ?? 0;
  const opponentTotal =
    cleanPrizeCount(value.opponentTotal) ?? events.at(-1)?.opponentTotal ?? 0;
  const summary = cleanText(value.summary);

  if (!events.length && !value.endedByConcession && !summary) {
    return undefined;
  }

  return {
    events,
    userTotal,
    opponentTotal,
    endedByConcession:
      typeof value.endedByConcession === "boolean"
        ? value.endedByConcession
        : undefined,
    summary,
  };
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

  if (
    value.source === "manual" ||
    value.source === "tcg_live_import" ||
    value.source === "event_round"
  ) {
    metadata.source = value.source;
  }

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
  metadata.tcg_live_cards_seen = cleanStringArray(value.tcg_live_cards_seen);
  metadata.tcg_live_cards_used = cleanStringArray(value.tcg_live_cards_used);
  metadata.tcg_live_cards_discarded = cleanStringArray(
    value.tcg_live_cards_discarded
  );
  metadata.prizeRace = parseMatchPrizeRace(value.prizeRace);

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
