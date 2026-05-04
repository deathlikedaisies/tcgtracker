import "server-only";

import type {
  CardLookupResult,
  CardSearchInput,
  NormalizedCard,
} from "@/lib/card-data/types";

const POKEMON_TCG_BASE_URL = "https://api.pokemontcg.io/v2";
const REQUEST_TIMEOUT_MS = 4500;

type PokemonTcgRawCard = {
  id?: string;
  images?: {
    large?: string;
    small?: string;
  };
  legalities?: Record<string, string>;
  name?: string;
  number?: string;
  rarity?: string;
  regulationMark?: string;
  set?: {
    id?: string;
    name?: string;
    ptcgoCode?: string;
  };
  subtypes?: string[];
  supertype?: string;
  types?: string[];
};

type PokemonTcgSearchResponse = {
  data?: PokemonTcgRawCard[];
};

function getHeaders() {
  const apiKey = process.env.POKEMON_TCG_API_KEY;

  return apiKey ? { "X-Api-Key": apiKey } : undefined;
}

function escapeQueryPhrase(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalizeCard(card: PokemonTcgRawCard): NormalizedCard | null {
  if (!card.id || !card.name) {
    return null;
  }

  return {
    id: card.id,
    imageLarge: card.images?.large ?? null,
    imageSmall: card.images?.small ?? null,
    legalities: card.legalities ?? null,
    name: card.name,
    number: card.number ?? null,
    regulationMark: card.regulationMark ?? null,
    rarity: card.rarity ?? null,
    setCode: card.set?.ptcgoCode ?? null,
    setId: card.set?.id ?? null,
    setName: card.set?.name ?? null,
    subtypes: card.subtypes ?? [],
    supertype: card.supertype ?? null,
    types: card.types ?? [],
  };
}

function isNormalizedCard(card: NormalizedCard | null): card is NormalizedCard {
  return card !== null;
}

function buildQueries(input: CardSearchInput) {
  const nameQuery = `name:"${escapeQueryPhrase(input.name)}"`;
  const queries = [];

  if (input.setCode && input.number) {
    queries.push(
      `${nameQuery} set.ptcgoCode:${input.setCode.toUpperCase()} number:${input.number}`
    );
  }

  if (input.number) {
    queries.push(`${nameQuery} number:${input.number}`);
  }

  queries.push(nameQuery);

  return Array.from(new Set(queries));
}

async function requestCards(query: string, limit: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(`${POKEMON_TCG_BASE_URL}/cards`);

  url.searchParams.set("q", query);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("orderBy", "-set.releaseDate");
  url.searchParams.set(
    "select",
    "id,name,set,number,supertype,subtypes,types,regulationMark,legalities,images,rarity"
  );

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
      signal: controller.signal,
      next: {
        revalidate: 60 * 60 * 24 * 7,
      },
    });

    if (!response.ok) {
      const rateLimited = response.status === 429;

      return {
        available: true,
        cards: [],
        error: rateLimited
          ? "Card lookup rate limit reached. Try again later or add a Pokémon TCG API key."
          : `Card lookup failed (${response.status}).`,
      } satisfies CardLookupResult;
    }

    const payload = (await response.json()) as PokemonTcgSearchResponse;

    return {
      available: true,
      cards: (payload.data ?? []).map(normalizeCard).filter(isNormalizedCard),
      error: null,
    } satisfies CardLookupResult;
  } catch {
    return {
      available: true,
      cards: [],
      error: "Card lookup timed out or failed.",
    } satisfies CardLookupResult;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchPokemonTcgCards(
  input: CardSearchInput,
  options: { limit?: number } = {}
): Promise<CardLookupResult> {
  const queries = buildQueries(input);
  let lastError: string | null = null;

  for (const query of queries) {
    const result = await requestCards(query, options.limit ?? 5);

    if (result.cards.length || !result.available) {
      return result;
    }

    lastError = result.error;
  }

  return {
    available: true,
    cards: [],
    error: lastError,
  };
}
