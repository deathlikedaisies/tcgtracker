import {
  formatMatchRecord,
  type MatchResult,
} from "@/lib/match-types";

export const EVENT_TYPE_OPTIONS = [
  "Local",
  "League Challenge",
  "League Cup",
  "Regional",
  "International",
  "Online tournament",
  "TCG Live ladder session",
  "Testing block",
  "Other",
] as const;

export const EVENT_FORMAT_OPTIONS = ["Standard", "Expanded", "Other"] as const;

export const EVENT_MATCH_STRUCTURE_OPTIONS = ["bo1", "bo3"] as const;

export const EVENT_MATCH_STRUCTURE_LABELS: Record<EventMatchStructure, string> = {
  bo1: "Best of 1",
  bo3: "Best of 3",
};

export const MATCH_SCORE_OPTIONS = [
  "2-0",
  "2-1",
  "1-2",
  "0-2",
  "1-1",
  "1-1-1",
  "BO1",
  "Other",
] as const;

export type EventType = (typeof EVENT_TYPE_OPTIONS)[number];
export type EventFormat = (typeof EVENT_FORMAT_OPTIONS)[number];
export type EventMatchStructure =
  (typeof EVENT_MATCH_STRUCTURE_OPTIONS)[number];

export type EventRoundSummaryInput = {
  opponent_deck_name: string | null;
  result: MatchResult;
  went_first?: boolean | null;
  tags?: string[] | null;
};

export type EventReviewSummary = {
  record: string;
  bestMatchup: string | null;
  bestMatchupRecord: string | null;
  winningMatchups: string[];
  problemMatchup: string | null;
  problemMatchupRecord: string | null;
  problemMatchupLabel: string | null;
  commonTags: { tag: string; count: number }[];
  commonIssueTags: { tag: string; count: number }[];
  commonTagsLabel: string;
  hasLoggedTags: boolean;
  suggestedNextTest: string;
};

function isOneOf<T extends readonly string[]>(value: string, options: T): value is T[number] {
  return options.includes(value);
}

export function isEventType(value: string): value is EventType {
  return isOneOf(value, EVENT_TYPE_OPTIONS);
}

export function isEventFormat(value: string): value is EventFormat {
  return isOneOf(value, EVENT_FORMAT_OPTIONS);
}

export function isEventMatchStructure(
  value: string
): value is EventMatchStructure {
  return isOneOf(value, EVENT_MATCH_STRUCTURE_OPTIONS);
}

export function getDefaultMatchStructure(
  eventType: EventType
): EventMatchStructure {
  if (
    eventType === "League Cup" ||
    eventType === "Regional" ||
    eventType === "International"
  ) {
    return "bo3";
  }

  return "bo1";
}

export function getMatchStructureLabel(
  value: EventMatchStructure | string | null | undefined
) {
  return value === "bo3" ? EVENT_MATCH_STRUCTURE_LABELS.bo3 : EVENT_MATCH_STRUCTURE_LABELS.bo1;
}

function normalizeDeckVersionLabel(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[._-]+/g, " ")
    .toLowerCase();
}

export function getEventDeckLabel(
  deckName: string | null | undefined,
  versionName: string | null | undefined
) {
  const deckLabel = deckName?.trim() || "No deck";
  const versionLabel = versionName?.trim();

  if (!versionLabel) return deckLabel;

  const normalizedVersion = normalizeDeckVersionLabel(versionLabel);
  if (
    normalizedVersion === normalizeDeckVersionLabel(deckLabel) ||
    normalizedVersion === "active" ||
    normalizedVersion === "current" ||
    normalizedVersion === "current version"
  ) {
    return deckLabel;
  }

  return `${deckLabel} · ${versionLabel}`;
}

export function normalizeEventMatchType(eventType: EventType) {
  return eventType === "Testing block" || eventType === "TCG Live ladder session"
    ? "testing"
    : "tournament";
}

export function parseEventTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    )
  );
}

export function getEventRecord(rounds: EventRoundSummaryInput[]) {
  const counts = rounds.reduce(
    (total, round) => {
      if (round.result === "win") {
        total.wins += 1;
      } else if (round.result === "loss") {
        total.losses += 1;
      } else {
        total.ties += 1;
      }

      return total;
    },
    { wins: 0, losses: 0, ties: 0 }
  );

  return formatMatchRecord(counts.wins, counts.losses, counts.ties);
}

function topEntries(counts: Map<string, number>, limit = 3) {
  return Array.from(counts.entries())
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

function formatEventMatchupRecord(record: {
  wins: number;
  losses: number;
  ties: number;
}) {
  if (record.ties > 0) {
    return formatMatchRecord(record.wins, record.losses, record.ties);
  }

  return `${record.wins}-${record.losses}`;
}

export function buildEventReviewSummary({
  deckName,
  rounds,
}: {
  deckName?: string | null;
  rounds: EventRoundSummaryInput[];
}): EventReviewSummary {
  const matchupResults = new Map<string, { wins: number; losses: number; ties: number }>();
  const tagCounts = new Map<string, number>();
  const issueTagCounts = new Map<string, number>();

  for (const round of rounds) {
    const opponent = round.opponent_deck_name?.trim() || "Unknown matchup";
    const current = matchupResults.get(opponent) ?? { wins: 0, losses: 0, ties: 0 };

    if (round.result === "win") {
      current.wins += 1;
    } else if (round.result === "loss") {
      current.losses += 1;
    } else {
      current.ties += 1;
    }

    matchupResults.set(opponent, current);

    for (const tag of round.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      if (round.result !== "win") {
        issueTagCounts.set(tag, (issueTagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const bestMatchup =
    Array.from(matchupResults.entries())
      .filter(([, record]) => record.wins > 1)
      .sort((first, second) => second[1].wins - first[1].wins)[0]?.[0] ?? null;
  const bestMatchupRecord = bestMatchup
    ? formatEventMatchupRecord(matchupResults.get(bestMatchup)!)
    : null;
  const winningMatchups = Array.from(matchupResults.entries())
    .filter(([, record]) => record.wins > 0)
    .sort((first, second) => second[1].wins - first[1].wins || first[0].localeCompare(second[0]))
    .map(([opponent]) => opponent);

  const problemMatchup =
    Array.from(matchupResults.entries())
      .filter(([, record]) => record.losses + record.ties > 0)
      .sort((first, second) => {
        const firstBad = first[1].losses * 2 + first[1].ties;
        const secondBad = second[1].losses * 2 + second[1].ties;
        return secondBad - firstBad || first[0].localeCompare(second[0]);
      })[0]?.[0] ?? null;
  const problemRecord = problemMatchup ? matchupResults.get(problemMatchup) : null;
  const problemMatchupRecord = problemRecord
    ? formatEventMatchupRecord(problemRecord)
    : null;
  const problemMatchupLabel =
    problemMatchup && problemMatchupRecord
      ? `${problemMatchup}: ${problemMatchupRecord}`
      : null;

  const commonTags = topEntries(tagCounts);
  const commonIssueTags = topEntries(issueTagCounts);
  const commonTagsLabel = commonTags.length
    ? commonTags.map((item) => item.tag).join(", ")
    : "No tags logged";
  const hasLoggedTags = commonTags.length > 0;
  const issueLabels = commonIssueTags.map((item) => item.tag.toLowerCase());
  const consistencyIssue = issueLabels.find((tag) =>
    ["slow start", "dead drew", "behind early", "poor prizes"].includes(tag)
  );
  const deckLabel = deckName?.trim() || "this deck";
  const issueFocus = commonIssueTags.length
    ? `Track ${commonIssueTags.map((item) => item.tag).join(", ")} and turn order.`
    : "Track turn order, setup quality, and first-issue tags.";
  const mostCommonMatchup =
    Array.from(matchupResults.entries()).sort(
      (first, second) => {
        const firstCount = first[1].wins + first[1].losses + first[1].ties;
        const secondCount = second[1].wins + second[1].losses + second[1].ties;
        return secondCount - firstCount || first[0].localeCompare(second[0]);
      }
    )[0]?.[0] ?? null;
  const suggestedNextTest = problemMatchup && problemRecord?.losses
    ? problemRecord.losses > 1
      ? `Prioritize a 5-game testing block with ${deckLabel} into ${problemMatchup}. You lost this matchup ${problemRecord.losses} times during the event. ${issueFocus}`
      : `Play a 5-game testing block with ${deckLabel} into ${problemMatchup}. ${issueFocus}`
    : problemMatchup
      ? `Run a 5-game check with ${deckLabel} into ${problemMatchup}. The event produced a tie or unresolved read there. ${issueFocus}`
    : consistencyIssue
      ? `Run a 5-game testing block with ${deckLabel} focused on opening consistency and sequencing.`
      : rounds.length
        ? `Repeat ${deckLabel}${mostCommonMatchup ? ` into ${mostCommonMatchup}` : ""} and compare the result with this run.`
        : "Log event rounds to unlock a suggested next test.";

  return {
    record: getEventRecord(rounds),
    bestMatchup,
    bestMatchupRecord,
    winningMatchups,
    problemMatchup,
    problemMatchupRecord,
    problemMatchupLabel,
    commonTags,
    commonIssueTags,
    commonTagsLabel,
    hasLoggedTags,
    suggestedNextTest,
  };
}
