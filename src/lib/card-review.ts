import { parseDeckList } from "@/lib/decklist";
import type { MatchMetadata } from "@/lib/match-types";

export type CardReviewSignalLabel =
  | "Not enough logs"
  | "Core card"
  | "Often used"
  | "Rarely used"
  | "Review candidate"
  | "Not observed yet";

export type CardReviewRow = {
  cardName: string;
  countInDeck: number;
  importedLogSampleSize: number;
  seenCount: number;
  usedCount: number;
  discardedCount: number;
  useRate: number | null;
  signalLabel: CardReviewSignalLabel;
  coachingText: string;
};

export type CardReviewSummary = {
  rows: CardReviewRow[];
  importedLogCount: number;
  hasDecklist: boolean;
  minimumUsefulLogs: number;
  trackedFields: {
    seen: boolean;
    used: boolean;
    discarded: boolean;
  };
};

export type CardReviewMatchInput = {
  deck_version_id?: string | null;
  metadata: MatchMetadata;
};

const MINIMUM_USEFUL_IMPORTED_LOGS = 5;

function normalizeCardName(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\bpokemon\b/gi, "pokémon")
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function hasTrackedCards(metadata: MatchMetadata) {
  return Boolean(
    metadata.tcg_live_cards_seen?.length ||
      metadata.tcg_live_cards_used?.length ||
      metadata.tcg_live_cards_discarded?.length
  );
}

function isImportedLog(metadata: MatchMetadata) {
  return metadata.source === "tcg_live_import" || hasTrackedCards(metadata);
}

function metadataContainsCard(cards: string[] | undefined, cardName: string) {
  if (!cards?.length) {
    return false;
  }

  const normalizedCard = normalizeCardName(cardName);

  return cards.some((entry) => normalizeCardName(entry) === normalizedCard);
}

function getSignalLabel({
  importedLogCount,
  seenCount,
  usedCount,
}: {
  importedLogCount: number;
  seenCount: number;
  usedCount: number;
}): CardReviewSignalLabel {
  if (importedLogCount === 0) {
    return "Not enough logs";
  }

  if (importedLogCount < MINIMUM_USEFUL_IMPORTED_LOGS) {
    return seenCount || usedCount ? "Not enough logs" : "Not observed yet";
  }

  const seenRate = seenCount / importedLogCount;
  const usedRate = usedCount / importedLogCount;

  if (usedRate >= 0.75) {
    return "Core card";
  }

  if (usedRate >= 0.4 || seenRate >= 0.6) {
    return "Often used";
  }

  if (seenCount === 0 && usedCount === 0) {
    return "Review candidate";
  }

  if (usedRate < 0.15 && seenRate < 0.3) {
    return "Rarely used";
  }

  return "Often used";
}

function getCoachingText(signalLabel: CardReviewSignalLabel) {
  switch (signalLabel) {
    case "Core card":
      return "Shows up often in imported games. Treat it as part of the current plan.";
    case "Often used":
      return "Frequently appears in the logs. Keep tracking before drawing a hard conclusion.";
    case "Rarely used":
      return "Appears lightly across this sample. Review why it is in the list before changing it.";
    case "Review candidate":
      return "Not observed across enough imported logs. Ask whether it solves a matchup you still need.";
    case "Not observed yet":
      return "Not observed yet, but the sample is still too small to judge.";
    case "Not enough logs":
    default:
      return "Log at least 5 imported games before judging card usage.";
  }
}

function getSignalPriority(signalLabel: CardReviewSignalLabel) {
  return {
    "Review candidate": 0,
    "Rarely used": 1,
    "Not observed yet": 2,
    "Not enough logs": 3,
    "Core card": 4,
    "Often used": 5,
  }[signalLabel];
}

export function buildCardReviewRows({
  decklist,
  matches,
  minimumUsefulLogs = MINIMUM_USEFUL_IMPORTED_LOGS,
}: {
  decklist: string | null | undefined;
  matches: CardReviewMatchInput[];
  minimumUsefulLogs?: number;
}): CardReviewSummary {
  const parsedDecklist = parseDeckList(decklist);
  const cardCounts = new Map<string, { cardName: string; countInDeck: number }>();

  parsedDecklist.cards.forEach((card) => {
    const normalizedName = normalizeCardName(card.name);
    const existing = cardCounts.get(normalizedName);

    cardCounts.set(normalizedName, {
      cardName: existing?.cardName ?? card.name,
      countInDeck: (existing?.countInDeck ?? 0) + card.quantity,
    });
  });

  const importedLogs = matches.filter((match) => isImportedLog(match.metadata));
  const importedLogCount = importedLogs.length;
  const trackedFields = {
    seen: importedLogs.some((match) => Boolean(match.metadata.tcg_live_cards_seen?.length)),
    used: importedLogs.some((match) => Boolean(match.metadata.tcg_live_cards_used?.length)),
    discarded: importedLogs.some((match) =>
      Boolean(match.metadata.tcg_live_cards_discarded?.length)
    ),
  };
  const hasTrackedCardData =
    trackedFields.seen || trackedFields.used || trackedFields.discarded;

  const rows = Array.from(cardCounts.values())
    .map((card) => {
      const seenCount = importedLogs.filter((match) =>
        metadataContainsCard(match.metadata.tcg_live_cards_seen, card.cardName)
      ).length;
      const usedCount = importedLogs.filter((match) =>
        metadataContainsCard(match.metadata.tcg_live_cards_used, card.cardName)
      ).length;
      const discardedCount = importedLogs.filter((match) =>
        metadataContainsCard(
          match.metadata.tcg_live_cards_discarded,
          card.cardName
        )
      ).length;
      const useRate = importedLogCount ? usedCount / importedLogCount : null;
      const signalLabel = hasTrackedCardData
        ? getSignalLabel({
            importedLogCount,
            seenCount,
            usedCount,
          })
        : "Not enough logs";

      return {
        ...card,
        importedLogSampleSize: importedLogCount,
        seenCount,
        usedCount,
        discardedCount,
        useRate: hasTrackedCardData ? useRate : null,
        signalLabel:
          importedLogCount < minimumUsefulLogs &&
          signalLabel !== "Not observed yet"
            ? "Not enough logs"
            : signalLabel,
        coachingText: getCoachingText(signalLabel),
      };
    })
    .sort((left, right) => {
      const priorityDelta =
        getSignalPriority(left.signalLabel) -
        getSignalPriority(right.signalLabel);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return left.cardName.localeCompare(right.cardName);
    });

  return {
    rows,
    importedLogCount,
    hasDecklist: cardCounts.size > 0,
    minimumUsefulLogs,
    trackedFields,
  };
}
