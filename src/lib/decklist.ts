import { OTHER_ARCHETYPE } from "@/lib/archetypes";

export type DecklistSection = "pokemon" | "trainer" | "energy" | "unknown";

export type ParsedDeckCard = {
  quantity: number;
  name: string;
  setCode: string | null;
  number: string | null;
  raw: string;
  section: DecklistSection;
};

export type UnparsedDeckLine = {
  raw: string;
  section: DecklistSection;
};

export type ArchetypeSuggestion = {
  archetype: string;
  confidence: "strong" | "possible" | "unknown";
  reason: string;
};

export type DecklistAnalysis = {
  cards: ParsedDeckCard[];
  unresolved: UnparsedDeckLine[];
  totalCards: number;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
  keyPokemon: string[];
  suggestion: ArchetypeSuggestion;
};

const sectionPatterns: Array<[DecklistSection, RegExp]> = [
  ["pokemon", /^pok[eé]mon\s*:?\s*\d*$/i],
  ["trainer", /^trainers?\s*:?\s*\d*$/i],
  ["energy", /^energ(?:y|ies)\s*:?\s*\d*$/i],
];

const cardLinePattern =
  /^(\d+)\s+(.+?)(?:\s+([A-Z0-9]{2,6})\s+([A-Za-z0-9-]+(?:\/[A-Za-z0-9-]+)?))?$/;

function normalize(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeCardName(value: string) {
  return normalize(value)
    .replace(/\bpokemon\b/g, "pokémon")
    .replace(/\s+-\s+/g, " ")
    .replace(/[.,]/g, "");
}

function getSection(line: string, current: DecklistSection) {
  const normalized = line.trim();
  const match = sectionPatterns.find(([, pattern]) => pattern.test(normalized));
  return match?.[0] ?? current;
}

function isIgnorableLine(line: string) {
  return (
    !line ||
    /^deck$/i.test(line) ||
    /^total cards\s*:?\s*\d*$/i.test(line) ||
    /^#+\s*/.test(line)
  );
}

export function parseDeckList(decklist: string | null | undefined) {
  const cards: ParsedDeckCard[] = [];
  const unresolved: UnparsedDeckLine[] = [];
  let currentSection: DecklistSection = "unknown";

  String(decklist ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .forEach((line) => {
      if (isIgnorableLine(line)) {
        return;
      }

      const nextSection = getSection(line, currentSection);

      if (nextSection !== currentSection) {
        currentSection = nextSection;
        return;
      }

      const match = line.match(cardLinePattern);

      if (!match) {
        unresolved.push({ raw: line, section: currentSection });
        return;
      }

      const [, quantity, name, setCode, number] = match;

      cards.push({
        quantity: Number(quantity),
        name: name.trim(),
        setCode: setCode?.trim() ?? null,
        number: number?.trim() ?? null,
        raw: line,
        section: currentSection,
      });
    });

  return { cards, unresolved };
}

function hasCard(cardNames: Set<string>, value: string) {
  const needle = normalizeCardName(value);
  return Array.from(cardNames).some(
    (name) => name === needle || name.includes(needle)
  );
}

function hasAny(cardNames: Set<string>, values: string[]) {
  return values.some((value) => hasCard(cardNames, value));
}

function suggestArchetype(cards: ParsedDeckCard[]): ArchetypeSuggestion {
  const cardNames = new Set(cards.map((card) => normalizeCardName(card.name)));

  const rules: Array<{
    archetype: string;
    confidence: "strong" | "possible";
    reason: string;
    matches: (names: Set<string>) => boolean;
  }> = [
    {
      archetype: "Dragapult Dusknoir",
      confidence: "strong",
      reason: "Dragapult ex and Dusknoir are both present.",
      matches: (names) => hasCard(names, "Dragapult ex") && hasCard(names, "Dusknoir"),
    },
    {
      archetype: "Dragapult Blaziken",
      confidence: "strong",
      reason: "Dragapult ex and Blaziken are both present.",
      matches: (names) => hasCard(names, "Dragapult ex") && hasCard(names, "Blaziken"),
    },
    {
      archetype: "Raging Bolt Ogerpon",
      confidence: "strong",
      reason: "Raging Bolt and Ogerpon are both present.",
      matches: (names) => hasAny(names, ["Raging Bolt ex", "Raging Bolt"]) && hasCard(names, "Ogerpon"),
    },
    {
      archetype: "Froslass Munkidori",
      confidence: "strong",
      reason: "Froslass and Munkidori are both present.",
      matches: (names) => hasCard(names, "Froslass") && hasCard(names, "Munkidori"),
    },
    {
      archetype: "N's Zoroark",
      confidence: "strong",
      reason: "N's Zoroark is present.",
      matches: (names) => hasCard(names, "N's Zoroark"),
    },
    {
      archetype: "Archaludon Zoroark",
      confidence: "strong",
      reason: "Archaludon and Zoroark are both present.",
      matches: (names) => hasCard(names, "Archaludon") && hasCard(names, "Zoroark"),
    },
    {
      archetype: "Mega Starmie",
      confidence: "possible",
      reason: "Mega Starmie appears in the list.",
      matches: (names) => hasAny(names, ["Mega Starmie", "Starmie ex"]),
    },
    {
      archetype: "Starmie Froslass",
      confidence: "strong",
      reason: "Starmie and Froslass are both present.",
      matches: (names) => hasCard(names, "Starmie") && hasCard(names, "Froslass"),
    },
    {
      archetype: "Lucario Hariyama",
      confidence: "strong",
      reason: "Lucario and Hariyama are both present.",
      matches: (names) => hasCard(names, "Lucario") && hasCard(names, "Hariyama"),
    },
    {
      archetype: "Ogerpon Meganium",
      confidence: "strong",
      reason: "Ogerpon and Meganium are both present.",
      matches: (names) => hasCard(names, "Ogerpon") && hasCard(names, "Meganium"),
    },
    {
      archetype: "Rocket's Mewtwo",
      confidence: "strong",
      reason: "Rocket's Mewtwo is present.",
      matches: (names) => hasCard(names, "Rocket's Mewtwo"),
    },
    {
      archetype: "Rocket's Honchkrow",
      confidence: "strong",
      reason: "Rocket's Honchkrow is present.",
      matches: (names) => hasCard(names, "Rocket's Honchkrow"),
    },
    {
      archetype: "Cynthia's Garchomp",
      confidence: "strong",
      reason: "Cynthia's Garchomp is present.",
      matches: (names) => hasCard(names, "Cynthia's Garchomp"),
    },
  ];

  const match = rules.find((rule) => rule.matches(cardNames));

  if (match) {
    return {
      archetype: match.archetype,
      confidence: match.confidence,
      reason: match.reason,
    };
  }

  return {
    archetype: OTHER_ARCHETYPE,
    confidence: "unknown",
    reason: "No clear key-card pattern found yet.",
  };
}

export function analyzeDeckList(decklist: string | null | undefined): DecklistAnalysis {
  const { cards, unresolved } = parseDeckList(decklist);
  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  const pokemonCards = cards.filter((card) => card.section === "pokemon");
  const keyPokemon = Array.from(
    new Set(
      pokemonCards
        .filter((card) =>
          /\b(ex|mega|vstar|vmax)\b/i.test(card.name) || card.quantity >= 2
        )
        .map((card) => card.name)
    )
  ).slice(0, 6);

  return {
    cards,
    unresolved,
    totalCards,
    pokemonCount: cards
      .filter((card) => card.section === "pokemon")
      .reduce((sum, card) => sum + card.quantity, 0),
    trainerCount: cards
      .filter((card) => card.section === "trainer")
      .reduce((sum, card) => sum + card.quantity, 0),
    energyCount: cards
      .filter((card) => card.section === "energy")
      .reduce((sum, card) => sum + card.quantity, 0),
    keyPokemon,
    suggestion: suggestArchetype(cards),
  };
}
