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

export type ArchetypeConfidence = "high" | "medium" | "low" | "none";

export type ArchetypeSuggestion = {
  archetype: string;
  confidence: ArchetypeConfidence;
  confidenceLabel: "High confidence" | "Medium confidence" | "Low confidence" | "No clear archetype detected";
  isClearSuggestion: boolean;
  score: number;
  reason: string;
  matchedCoreCards: string[];
  matchedSupportCards: string[];
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

type CardGroup = readonly string[];

type ArchetypeRule = {
  archetype: string;
  requiredCoreCards: readonly CardGroup[];
  optionalCoreCards?: readonly CardGroup[];
  optionalSupportCards?: readonly CardGroup[];
  excludedCards?: readonly CardGroup[];
  baseScore?: number;
};

type ArchetypeCandidate = {
  archetype: string;
  score: number;
  confidence: Exclude<ArchetypeConfidence, "none">;
  matchedCoreCards: string[];
  matchedSupportCards: string[];
};

const sectionPatterns: Array<[DecklistSection, RegExp]> = [
  ["pokemon", /^pok[eÃ©]mon\s*:?\s*\d*$/i],
  ["trainer", /^trainers?\s*:?\s*\d*$/i],
  ["energy", /^energ(?:y|ies)\s*:?\s*\d*$/i],
];

const cardLinePattern =
  /^(\d+)\s+(.+?)(?:\s+([A-Z0-9]{2,6})\s+([A-Za-z0-9-]+(?:\/[A-Za-z0-9-]+)?))?$/;

function normalize(value: string) {
  return value
    .trim()
    .replace(/[â€™â€˜`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeCardName(value: string) {
  return normalize(value)
    .replace(/\bpokemon\b/g, "pokÃ©mon")
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

function buildCardIndex(cards: ParsedDeckCard[]) {
  const normalizedNames = cards.map((card) => normalizeCardName(card.name));
  const originalByNormalized = new Map<string, string>();

  cards.forEach((card) => {
    const normalizedName = normalizeCardName(card.name);

    if (!originalByNormalized.has(normalizedName)) {
      originalByNormalized.set(normalizedName, card.name);
    }
  });

  return {
    normalizedNames,
    originalByNormalized,
  };
}

function findMatchedCard(
  cardIndex: ReturnType<typeof buildCardIndex>,
  value: string,
  usedNormalizedNames: Set<string> = new Set()
) {
  const needle = normalizeCardName(value);
  const exact = cardIndex.normalizedNames.find(
    (name) => name === needle && !usedNormalizedNames.has(name)
  );

  if (exact) {
    return {
      displayName: cardIndex.originalByNormalized.get(exact) ?? value,
      normalizedName: exact,
    };
  }

  const partial = cardIndex.normalizedNames.find(
    (name) => name.includes(needle) && !usedNormalizedNames.has(name)
  );

  if (partial) {
    return {
      displayName: cardIndex.originalByNormalized.get(partial) ?? value,
      normalizedName: partial,
    };
  }

  return null;
}

function matchCardGroup(
  cardIndex: ReturnType<typeof buildCardIndex>,
  group: CardGroup,
  usedNormalizedNames: Set<string>
) {
  for (const value of group) {
    const match = findMatchedCard(cardIndex, value, usedNormalizedNames);

    if (match) {
      return match;
    }
  }

  return null;
}

function getUniqueMatches(
  cardIndex: ReturnType<typeof buildCardIndex>,
  groups: readonly CardGroup[] | undefined,
  usedNormalizedNames: Set<string> = new Set()
) {
  if (!groups?.length) {
    return [];
  }

  const matches: string[] = [];

  groups.forEach((group) => {
    const match = matchCardGroup(cardIndex, group, usedNormalizedNames);

    if (!match) {
      return;
    }

    usedNormalizedNames.add(match.normalizedName);
    matches.push(match.displayName);
  });

  return Array.from(new Set(matches));
}

function scoreRule(
  cardIndex: ReturnType<typeof buildCardIndex>,
  rule: ArchetypeRule
): ArchetypeCandidate | null {
  const usedNormalizedNames = new Set<string>();
  const matchedRequiredCore = getUniqueMatches(
    cardIndex,
    rule.requiredCoreCards,
    usedNormalizedNames
  );

  if (matchedRequiredCore.length !== rule.requiredCoreCards.length) {
    return null;
  }

  const matchedOptionalCore = getUniqueMatches(
    cardIndex,
    rule.optionalCoreCards,
    usedNormalizedNames
  );
  const matchedSupport = getUniqueMatches(
    cardIndex,
    rule.optionalSupportCards,
    usedNormalizedNames
  );
  const matchedExcluded = getUniqueMatches(cardIndex, rule.excludedCards);
  const optionalCoreTotal = rule.optionalCoreCards?.length ?? 0;
  const optionalSupportTotal = rule.optionalSupportCards?.length ?? 0;
  const optionalCoreRatio = optionalCoreTotal
    ? matchedOptionalCore.length / optionalCoreTotal
    : 0;
  const optionalSupportRatio = optionalSupportTotal
    ? matchedSupport.length / optionalSupportTotal
    : 0;
  const baseScore = rule.baseScore ?? 74;
  const score = Math.max(
    0,
    Math.round(
      baseScore + optionalCoreRatio * 16 + optionalSupportRatio * 10 - matchedExcluded.length * 18
    )
  );

  if (score >= 90) {
    return {
      archetype: rule.archetype,
      score,
      confidence: "high",
      matchedCoreCards: [...matchedRequiredCore, ...matchedOptionalCore],
      matchedSupportCards: matchedSupport,
    };
  }

  if (score >= 75) {
    return {
      archetype: rule.archetype,
      score,
      confidence: "medium",
      matchedCoreCards: [...matchedRequiredCore, ...matchedOptionalCore],
      matchedSupportCards: matchedSupport,
    };
  }

  return {
    archetype: rule.archetype,
    score,
    confidence: "low",
    matchedCoreCards: [...matchedRequiredCore, ...matchedOptionalCore],
    matchedSupportCards: matchedSupport,
  };
}

const ARCHETYPE_RULES: ArchetypeRule[] = [
  // Sanity examples for conservative matching:
  // - Raging Bolt ex + Teal Mask Ogerpon ex -> Raging Bolt, medium/high confidence
  // - Teal Mask Ogerpon ex alone -> no clear archetype detected
  // - Generic trainer cards only -> no clear archetype detected
  // - Dragapult ex + Dusknoir line -> Dragapult Dusknoir
  // - Charizard ex + Pidgeot ex + Rare Candy -> Charizard ex
  // - Random rogue list -> no clear archetype detected
  {
    archetype: "Dragapult Dusknoir",
    requiredCoreCards: [
      ["Dragapult ex"],
      ["Dusknoir", "Dusclops", "Duskull"],
    ],
    optionalCoreCards: [["Drakloak", "Dreepy"]],
    optionalSupportCards: [["Rare Candy"]],
    baseScore: 82,
  },
  {
    archetype: "Dragapult Blaziken",
    requiredCoreCards: [
      ["Dragapult ex"],
      ["Blaziken", "Combusken", "Torchic"],
    ],
    optionalCoreCards: [["Drakloak", "Dreepy"]],
    baseScore: 82,
  },
  {
    archetype: "Dragapult ex",
    requiredCoreCards: [["Dragapult ex"], ["Drakloak", "Dreepy"]],
    excludedCards: [
      ["Dusknoir", "Dusclops", "Duskull"],
      ["Blaziken", "Combusken", "Torchic"],
      ["Dudunsparce", "Dunsparce"],
    ],
    baseScore: 78,
  },
  {
    archetype: "Raging Bolt",
    requiredCoreCards: [["Raging Bolt ex", "Raging Bolt"]],
    optionalCoreCards: [["Teal Mask Ogerpon ex"]],
    optionalSupportCards: [
      ["Professor Sada's Vitality"],
      ["Sandy Shocks"],
      ["Bravery Charm"],
      ["Energy Retrieval"],
    ],
    baseScore: 76,
  },
  {
    archetype: "Charizard ex",
    requiredCoreCards: [["Charizard ex"]],
    optionalCoreCards: [["Pidgeot ex", "Pidgeot", "Pidgeotto", "Pidgey"]],
    optionalSupportCards: [["Rare Candy"], ["Charmander", "Charmeleon"]],
    baseScore: 76,
  },
  {
    archetype: "Ogerpon Meganium",
    requiredCoreCards: [
      ["Teal Mask Ogerpon ex", "Ogerpon"],
      ["Meganium", "Bayleef", "Chikorita"],
    ],
    optionalSupportCards: [["Rare Candy"]],
    baseScore: 80,
  },
  {
    archetype: "Froslass Munkidori",
    requiredCoreCards: [["Froslass", "Snorunt"], ["Munkidori"]],
    baseScore: 80,
  },
  {
    archetype: "Starmie Froslass",
    requiredCoreCards: [["Starmie", "Starmie ex"], ["Froslass", "Snorunt"]],
    optionalSupportCards: [["Rare Candy"]],
    baseScore: 80,
  },
  {
    archetype: "Archaludon Zoroark",
    requiredCoreCards: [["Archaludon"], ["Zoroark", "Zorua"]],
    baseScore: 80,
  },
  {
    archetype: "Lucario Hariyama",
    requiredCoreCards: [["Lucario", "Riolu"], ["Hariyama", "Makuhita"]],
    baseScore: 80,
  },
  {
    archetype: "Mega Greninja",
    requiredCoreCards: [["Mega Greninja ex", "Mega Greninja"]],
    optionalSupportCards: [["Frogadier", "Froakie"]],
    baseScore: 78,
  },
  {
    archetype: "Mega Lucario",
    requiredCoreCards: [["Mega Lucario ex", "Mega Lucario"]],
    optionalSupportCards: [["Lucario", "Riolu"]],
    baseScore: 78,
  },
  {
    archetype: "Mega Lopunny",
    requiredCoreCards: [["Mega Lopunny ex", "Mega Lopunny"]],
    optionalSupportCards: [["Lopunny", "Buneary"]],
    baseScore: 78,
  },
  {
    archetype: "Mega Starmie",
    requiredCoreCards: [["Mega Starmie ex", "Mega Starmie"]],
    optionalSupportCards: [["Starmie ex", "Staryu"]],
    baseScore: 78,
  },
  {
    archetype: "N's Zoroark",
    requiredCoreCards: [["N's Zoroark"]],
    optionalSupportCards: [["Zorua"]],
    baseScore: 78,
  },
  {
    archetype: "Rocket's Mewtwo",
    requiredCoreCards: [["Rocket's Mewtwo"]],
    optionalSupportCards: [["Mewtwo"]],
    baseScore: 78,
  },
  {
    archetype: "Rocket's Honchkrow",
    requiredCoreCards: [["Rocket's Honchkrow"]],
    optionalSupportCards: [["Murkrow"]],
    baseScore: 78,
  },
  {
    archetype: "Cynthia's Garchomp",
    requiredCoreCards: [["Cynthia's Garchomp"]],
    optionalSupportCards: [["Gabite", "Gible"]],
    baseScore: 78,
  },
  {
    archetype: "Beedrill",
    requiredCoreCards: [["Beedrill"]],
    optionalSupportCards: [["Kakuna", "Weedle"]],
    baseScore: 70,
  },
];

function getConfidenceLabel(confidence: ArchetypeConfidence) {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
    default:
      return "No clear archetype detected";
  }
}

export function isClearArchetypeSuggestion(suggestion: ArchetypeSuggestion) {
  return suggestion.isClearSuggestion;
}

function suggestArchetype(cards: ParsedDeckCard[]): ArchetypeSuggestion {
  const cardIndex = buildCardIndex(cards);
  const candidates = ARCHETYPE_RULES.map((rule) => scoreRule(cardIndex, rule))
    .filter((candidate): candidate is ArchetypeCandidate => Boolean(candidate))
    .sort((left, right) => right.score - left.score);
  const topCandidate = candidates[0];

  if (!topCandidate) {
    return {
      archetype: OTHER_ARCHETYPE,
      confidence: "none",
      confidenceLabel: getConfidenceLabel("none"),
      isClearSuggestion: false,
      score: 0,
      reason: "Not enough core archetype cards were found in this list.",
      matchedCoreCards: [],
      matchedSupportCards: [],
    };
  }

  const isClearSuggestion = topCandidate.confidence === "high" || topCandidate.confidence === "medium";
  const matchedCoreLine = topCandidate.matchedCoreCards.length
    ? `Matched core cards: ${topCandidate.matchedCoreCards.join(", ")}.`
    : "No matched core cards yet.";
  const matchedSupportLine = topCandidate.matchedSupportCards.length
    ? ` Support cards: ${topCandidate.matchedSupportCards.join(", ")}.`
    : "";

  if (!isClearSuggestion) {
    return {
      archetype: topCandidate.archetype,
      confidence: "low",
      confidenceLabel: getConfidenceLabel("none"),
      isClearSuggestion: false,
      score: topCandidate.score,
      reason: "Evidence is too thin to trust this as an archetype suggestion yet.",
      matchedCoreCards: topCandidate.matchedCoreCards,
      matchedSupportCards: topCandidate.matchedSupportCards,
    };
  }

  return {
    archetype: topCandidate.archetype,
    confidence: topCandidate.confidence,
    confidenceLabel: getConfidenceLabel(topCandidate.confidence),
    isClearSuggestion: true,
    score: topCandidate.score,
    reason: `${matchedCoreLine}${matchedSupportLine}`,
    matchedCoreCards: topCandidate.matchedCoreCards,
    matchedSupportCards: topCandidate.matchedSupportCards,
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
