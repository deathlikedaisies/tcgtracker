import { parseDeckList } from "@/lib/decklist";
import type { MatchResultCounts } from "@/lib/match-types";

export type DeckVersionCardChangeType = "added" | "removed" | "count_changed";

export type DeckVersionCardChange = {
  cardName: string;
  previousCount: number;
  currentCount: number;
  delta: number;
  changeType: DeckVersionCardChangeType;
};

export type DeckVersionUnchangedCard = {
  cardName: string;
  count: number;
};

export type DeckVersionDiff = {
  added: DeckVersionCardChange[];
  removed: DeckVersionCardChange[];
  countChanged: DeckVersionCardChange[];
  unchanged: DeckVersionUnchangedCard[];
  summary: {
    added: number;
    removed: number;
    countChanged: number;
  };
};

export type DeckVersionImpactRead = {
  label: string;
  tone:
    | "blue"
    | "gold"
    | "emerald"
    | "rose";
  summary: string;
  next: string;
};

export function buildDeckVersionImpactRead({
  currentName,
  previousName,
  currentPerformance,
  previousPerformance,
  currentIssueTagCount,
  previousIssueTagCount,
}: {
  currentName: string;
  previousName: string | null;
  currentPerformance: MatchResultCounts;
  previousPerformance: MatchResultCounts | null;
  currentIssueTagCount: number;
  previousIssueTagCount: number | null;
}): DeckVersionImpactRead {
  const currentWinRate = currentPerformance.total
    ? currentPerformance.wins / currentPerformance.total
    : null;
  const previousWinRate =
    previousPerformance && previousPerformance.total
      ? previousPerformance.wins / previousPerformance.total
      : null;
  const issueTagsImproved =
    previousIssueTagCount !== null &&
    previousIssueTagCount > 0 &&
    currentIssueTagCount < previousIssueTagCount;

  if (currentPerformance.total === 0) {
    return {
      label: "No games logged yet",
      tone: "blue",
      summary: `${currentName} has no games yet, so the list changes are only a checklist right now.`,
      next: "No games logged yet. Play 5 games before changing more cards.",
    };
  }

  if (currentPerformance.total < 5) {
    const looksBetter =
      previousWinRate !== null &&
      currentWinRate !== null &&
      currentWinRate > previousWinRate;

    return {
      label: looksBetter ? "Early improvement" : "Early read",
      tone: looksBetter ? "emerald" : "gold",
      summary: looksBetter
        ? `Early improvement versus ${previousName ?? "the previous version"}, but ${currentPerformance.total} games is still thin.`
        : `${currentName} only has ${currentPerformance.total} logged game${
            currentPerformance.total === 1 ? "" : "s"
          }. Treat this as early signal only.`,
      next: `Log ${Math.max(
        5 - currentPerformance.total,
        1
      )} more game${
        Math.max(5 - currentPerformance.total, 1) === 1 ? "" : "s"
      } with this version before judging the change.`,
    };
  }

  if (
    previousPerformance &&
    previousPerformance.total >= 5 &&
    currentWinRate !== null &&
    previousWinRate !== null
  ) {
    const currentPercent = Math.round(currentWinRate * 100);
    const previousPercent = Math.round(previousWinRate * 100);

    if (currentWinRate > previousWinRate && currentWinRate < 0.5) {
      return {
        label: "Improved, still losing",
        tone: "gold",
        summary: `${currentName} improved versus ${previousName ?? "the previous version"} (${currentPercent}% vs ${previousPercent}%), but it is still losing overall.`,
        next: issueTagsImproved
          ? "Issue tags are appearing less often. Keep logging clean games and confirm the improvement holds."
          : "Keep testing before changing more cards. Track setup quality and first-issue tags.",
      };
    }

    if (currentWinRate > previousWinRate) {
      return {
        label: "Version improving",
        tone: "emerald",
        summary: `${currentName} is stronger so far than ${previousName ?? "the previous version"} (${currentPercent}% vs ${previousPercent}%).`,
        next: issueTagsImproved
          ? "Issue tags are down too. Add a few more clean logs before locking the list."
          : "Log 5 more games against common matchups to make sure this is not just matchup spread.",
      };
    }

    if (currentWinRate < previousWinRate) {
      return {
        label: "Version concern",
        tone: "rose",
        summary: `${currentName} is behind ${previousName ?? "the previous version"} so far (${currentPercent}% vs ${previousPercent}%).`,
        next: "Review the loss tags before changing again. If the same issue repeats, test that matchup directly.",
      };
    }
  }

  return {
    label: "Stable read",
    tone: "blue",
    summary: `${currentName} has a usable sample, but the comparison is not clearly separating yet.`,
    next: issueTagsImproved
      ? "Issue tags are down, but the record is not decisive. Keep logging before calling the change solved."
      : "Log 5 more games with this version before judging the change.",
  };
}

function normalizeCardName(value: string) {
  return value
    .trim()
    .replace(/[\u2019\u2018`]/g, "'")
    .replace(/\bpokemon\b/gi, "pokemon")
    .replace(/\s+-\s+/g, " ")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function buildCountMap(decklist: string | null | undefined) {
  const cards = parseDeckList(decklist).cards;
  const counts = new Map<
    string,
    {
      cardName: string;
      count: number;
    }
  >();

  cards.forEach((card) => {
    const key = normalizeCardName(card.name);
    const existing = counts.get(key);

    counts.set(key, {
      cardName: existing?.cardName ?? card.name,
      count: (existing?.count ?? 0) + card.quantity,
    });
  });

  return counts;
}

function sortChanges(left: DeckVersionCardChange, right: DeckVersionCardChange) {
  return left.cardName.localeCompare(right.cardName);
}

export function compareDeckLists(
  previousDecklist: string | null | undefined,
  currentDecklist: string | null | undefined
): DeckVersionDiff {
  const previous = buildCountMap(previousDecklist);
  const current = buildCountMap(currentDecklist);
  const allKeys = Array.from(new Set([...previous.keys(), ...current.keys()]));
  const added: DeckVersionCardChange[] = [];
  const removed: DeckVersionCardChange[] = [];
  const countChanged: DeckVersionCardChange[] = [];
  const unchanged: DeckVersionUnchangedCard[] = [];

  allKeys.forEach((key) => {
    const previousCard = previous.get(key);
    const currentCard = current.get(key);
    const previousCount = previousCard?.count ?? 0;
    const currentCount = currentCard?.count ?? 0;
    const cardName = currentCard?.cardName ?? previousCard?.cardName ?? key;
    const delta = currentCount - previousCount;

    if (!previousCard && currentCard) {
      added.push({
        cardName,
        previousCount,
        currentCount,
        delta,
        changeType: "added",
      });
      return;
    }

    if (previousCard && !currentCard) {
      removed.push({
        cardName,
        previousCount,
        currentCount,
        delta,
        changeType: "removed",
      });
      return;
    }

    if (delta !== 0) {
      countChanged.push({
        cardName,
        previousCount,
        currentCount,
        delta,
        changeType: "count_changed",
      });
      return;
    }

    if (currentCard) {
      unchanged.push({
        cardName,
        count: currentCount,
      });
    }
  });

  return {
    added: added.sort(sortChanges),
    removed: removed.sort(sortChanges),
    countChanged: countChanged.sort(sortChanges),
    unchanged: unchanged.sort((left, right) =>
      left.cardName.localeCompare(right.cardName)
    ),
    summary: {
      added: added.length,
      removed: removed.length,
      countChanged: countChanged.length,
    },
  };
}
