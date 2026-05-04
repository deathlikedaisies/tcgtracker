import "server-only";

import { type DecklistAnalysis } from "@/lib/decklist";
import { searchPokemonCards, type ScrydexCard } from "@/lib/scrydex/client";

export type EnrichedDeckCard = {
  card: DecklistAnalysis["cards"][number];
  scrydexCard: ScrydexCard | null;
  status: "resolved" | "unresolved" | "lookup-unavailable";
};

export type DeckEnrichment = {
  available: boolean;
  cards: EnrichedDeckCard[];
  error: string | null;
  resolvedCount: number;
  unresolvedCount: number;
  legalityWarnings: string[];
};

function escapeQueryPhrase(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalize(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function chooseBestCard(name: string, cards: ScrydexCard[]) {
  const normalizedName = normalize(name);

  return (
    cards.find((card) => normalize(card.name) === normalizedName) ??
    cards.find((card) => normalize(card.name).includes(normalizedName)) ??
    cards[0] ??
    null
  );
}

function getLegalityWarning(card: ScrydexCard) {
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
      available: false,
      cards: [],
      error: null,
      resolvedCount: 0,
      unresolvedCount: 0,
      legalityWarnings: [],
    };
  }

  const uniqueNames = Array.from(new Set(analysis.cards.map((card) => card.name)));
  const lookupResults = await Promise.all(
    uniqueNames.map(async (name) => {
      const result = await searchPokemonCards(`name:"${escapeQueryPhrase(name)}"`, {
        limit: 3,
      });

      return [name, result] as const;
    })
  );
  const lookupByName = new Map(lookupResults);
  const firstResult = lookupResults[0]?.[1];
  const available = firstResult?.available ?? false;

  if (!available) {
    return {
      available: false,
      cards: analysis.cards.map((card) => ({
        card,
        scrydexCard: null,
        status: "lookup-unavailable",
      })),
      error: firstResult?.error ?? "Card lookup unavailable.",
      resolvedCount: 0,
      unresolvedCount: analysis.cards.length + analysis.unresolved.length,
      legalityWarnings: [],
    };
  }

  const enrichedCards = analysis.cards.map((card) => {
    const lookup = lookupByName.get(card.name);
    const scrydexCard = chooseBestCard(card.name, lookup?.cards ?? []);

    return {
      card,
      scrydexCard,
      status: scrydexCard ? "resolved" : "unresolved",
    } satisfies EnrichedDeckCard;
  });
  const legalityWarnings = enrichedCards
    .map((entry) =>
      entry.scrydexCard ? getLegalityWarning(entry.scrydexCard) : null
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
