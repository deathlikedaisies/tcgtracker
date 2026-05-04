import "server-only";

import { type DecklistAnalysis } from "@/lib/decklist";
import { searchPokemonTcgCards } from "@/lib/card-data/pokemon-tcg-client";
import type { NormalizedCard } from "@/lib/card-data/types";

export type EnrichedDeckCard = {
  card: DecklistAnalysis["cards"][number];
  providerCard: NormalizedCard | null;
  status: "resolved" | "unresolved";
};

export type DeckEnrichment = {
  available: boolean;
  cards: EnrichedDeckCard[];
  error: string | null;
  resolvedCount: number;
  unresolvedCount: number;
  legalityWarnings: string[];
};

function normalize(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function chooseBestCard(
  source: DecklistAnalysis["cards"][number],
  cards: NormalizedCard[]
) {
  const normalizedName = normalize(source.name);
  const normalizedNumber = source.number ? normalize(source.number) : null;
  const normalizedSetCode = source.setCode ? normalize(source.setCode) : null;

  return (
    cards.find(
      (card) =>
        normalize(card.name) === normalizedName &&
        (!normalizedNumber || normalize(card.number ?? "") === normalizedNumber) &&
        (!normalizedSetCode || normalize(card.setCode ?? "") === normalizedSetCode)
    ) ??
    cards.find(
      (card) =>
        normalize(card.name) === normalizedName &&
        (!normalizedNumber || normalize(card.number ?? "") === normalizedNumber)
    ) ??
    cards.find((card) => normalize(card.name) === normalizedName) ??
    cards[0] ??
    null
  );
}

function getLegalityWarning(card: NormalizedCard) {
  const standard = card.legalities?.standard?.toLowerCase();

  if (standard && standard !== "legal") {
    return `${card.name} is marked ${standard} in Standard.`;
  }

  return null;
}

export async function enrichDeckAnalysis(
  analysis: DecklistAnalysis
): Promise<DeckEnrichment> {
  if (!analysis.cards.length) {
    return {
      available: true,
      cards: [],
      error: null,
      resolvedCount: 0,
      unresolvedCount: 0,
      legalityWarnings: [],
    };
  }

  const lookupResults = await Promise.all(
    analysis.cards.map(async (card) => {
      const result = await searchPokemonTcgCards(
        {
          name: card.name,
          number: card.number,
          setCode: card.setCode,
        },
        { limit: 5 }
      );

      return [card.raw, result] as const;
    })
  );
  const lookupByRaw = new Map(lookupResults);
  const enrichedCards = analysis.cards.map((card) => {
    const lookup = lookupByRaw.get(card.raw);
    const providerCard = chooseBestCard(card, lookup?.cards ?? []);

    return {
      card,
      providerCard,
      status: providerCard ? "resolved" : "unresolved",
    } satisfies EnrichedDeckCard;
  });
  const legalityWarnings = enrichedCards
    .map((entry) =>
      entry.providerCard ? getLegalityWarning(entry.providerCard) : null
    )
    .filter((warning): warning is string => Boolean(warning))
    .slice(0, 4);

  return {
    available: true,
    cards: enrichedCards,
    error: lookupResults.find(([, result]) => result.error)?.[1].error ?? null,
    resolvedCount: enrichedCards.filter((entry) => entry.status === "resolved").length,
    unresolvedCount:
      enrichedCards.filter((entry) => entry.status === "unresolved").length +
      analysis.unresolved.length,
    legalityWarnings,
  };
}
