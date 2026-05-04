import "server-only";

const SCRYDEX_BASE_URL = "https://api.scrydex.com/pokemon/v1";
const REQUEST_TIMEOUT_MS = 4500;

export type ScrydexCard = {
  id: string;
  imageLarge: string | null;
  imageSmall: string | null;
  legalities: Record<string, string> | null;
  name: string;
  number: string | null;
  rarity: string | null;
  regulationMark: string | null;
  setName: string | null;
  subtypes: string[];
  types: string[];
};

type ScrydexRawCard = {
  id?: string;
  images?: Array<{
    large?: string;
    medium?: string;
    small?: string;
  }>;
  legalities?: Record<string, string>;
  name?: string;
  number?: string;
  printed_number?: string;
  printedNumber?: string;
  rarity?: string;
  regulation_mark?: string;
  regulationMark?: string;
  expansion?: {
    name?: string;
  };
  subtypes?: string[];
  types?: string[];
};

type ScrydexSearchResponse = {
  data?: ScrydexRawCard[];
};

export function isScrydexConfigured() {
  return Boolean(process.env.SCRYDEX_API_KEY && process.env.SCRYDEX_TEAM_ID);
}

function getHeaders() {
  const apiKey = process.env.SCRYDEX_API_KEY;
  const teamId = process.env.SCRYDEX_TEAM_ID;

  if (!apiKey || !teamId) {
    return null;
  }

  const headers: Record<string, string> = {
    "X-Api-Key": apiKey,
    "X-Team-ID": teamId,
  };

  return headers;
}

function normalizeCard(card: ScrydexRawCard): ScrydexCard | null {
  if (!card.id || !card.name) {
    return null;
  }

  const frontImage = card.images?.find((image) => image.small || image.large);

  return {
    id: card.id,
    imageLarge: frontImage?.large ?? frontImage?.medium ?? null,
    imageSmall: frontImage?.small ?? frontImage?.medium ?? null,
    legalities: card.legalities ?? null,
    name: card.name,
    number: card.number ?? card.printed_number ?? card.printedNumber ?? null,
    rarity: card.rarity ?? null,
    regulationMark: card.regulation_mark ?? card.regulationMark ?? null,
    setName: card.expansion?.name ?? null,
    subtypes: card.subtypes ?? [],
    types: card.types ?? [],
  };
}

function isScrydexCard(card: ScrydexCard | null): card is ScrydexCard {
  return card !== null;
}

export async function searchPokemonCards(
  query: string,
  options: { limit?: number } = {}
) {
  const headers = getHeaders();

  if (!headers) {
    return {
      available: false as const,
      cards: [] as ScrydexCard[],
      error: "Scrydex card lookup is unavailable. Configure SCRYDEX_API_KEY and SCRYDEX_TEAM_ID.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(`${SCRYDEX_BASE_URL}/en/cards`);

  url.searchParams.set("q", query);
  url.searchParams.set("page_size", String(options.limit ?? 5));
  url.searchParams.set(
    "select",
    "id,name,number,printed_number,rarity,regulation_mark,legalities,types,subtypes,images,expansion"
  );

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      next: {
        revalidate: 60 * 60 * 24 * 7,
      },
    });

    if (!response.ok) {
      return {
        available: true as const,
        cards: [] as ScrydexCard[],
        error: `Scrydex lookup failed (${response.status}).`,
      };
    }

    const payload = (await response.json()) as ScrydexSearchResponse;

    return {
      available: true as const,
      cards: (payload.data ?? []).map(normalizeCard).filter(isScrydexCard),
      error: null,
    };
  } catch {
    return {
      available: true as const,
      cards: [] as ScrydexCard[],
      error: "Scrydex lookup timed out or failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
