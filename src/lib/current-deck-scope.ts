type DeckVersionScopeRow = {
  id: string;
  is_active?: boolean | null;
};

type DeckScopeRow = {
  id: string;
  name: string;
  created_at?: string | null;
  deck_versions?: DeckVersionScopeRow[] | null;
};

type MatchScopeRow = {
  deck_version_id?: string | null;
  played_at?: string | null;
};

export type CurrentDeckScopeSource =
  | "explicit"
  | "active_version"
  | "recent_match"
  | "recent_deck"
  | "all_decks"
  | "none";

export type CurrentDeckScope = {
  deckId: string | null;
  deckName: string | null;
  source: CurrentDeckScopeSource;
  showAllDecks: boolean;
  versionToDeckId: Map<string, string>;
};

type ResolveCurrentDeckScopeOptions = {
  decks: DeckScopeRow[];
  matches: MatchScopeRow[];
  explicitDeckId?: string | null;
};

function getMostRecentDeckIdFromMatches(
  matches: MatchScopeRow[],
  versionToDeckId: Map<string, string>,
  allowedDeckIds?: Set<string>
) {
  for (const match of matches) {
    const versionId = match.deck_version_id ?? "";
    const deckId = versionToDeckId.get(versionId);

    if (!deckId) {
      continue;
    }

    if (allowedDeckIds && !allowedDeckIds.has(deckId)) {
      continue;
    }

    return deckId;
  }

  return null;
}

function getMostRecentCreatedDeck(decks: DeckScopeRow[], allowedDeckIds?: Set<string>) {
  return [...decks]
    .filter((deck) => !allowedDeckIds || allowedDeckIds.has(deck.id))
    .sort((left, right) => {
      const leftDate = left.created_at ?? "";
      const rightDate = right.created_at ?? "";
      return rightDate.localeCompare(leftDate);
    })[0] ?? null;
}

export function resolveCurrentDeckScope({
  decks,
  matches,
  explicitDeckId,
}: ResolveCurrentDeckScopeOptions): CurrentDeckScope {
  const versionToDeckId = new Map<string, string>();

  decks.forEach((deck) => {
    (deck.deck_versions ?? []).forEach((version) => {
      versionToDeckId.set(version.id, deck.id);
    });
  });

  if (explicitDeckId === "all") {
    return {
      deckId: null,
      deckName: null,
      source: "all_decks",
      showAllDecks: true,
      versionToDeckId,
    };
  }

  if (explicitDeckId) {
    const explicitDeck = decks.find((deck) => deck.id === explicitDeckId) ?? null;

    if (explicitDeck) {
      return {
        deckId: explicitDeck.id,
        deckName: explicitDeck.name,
        source: "explicit",
        showAllDecks: false,
        versionToDeckId,
      };
    }
  }

  const activeDecks = decks.filter((deck) =>
    (deck.deck_versions ?? []).some((version) => Boolean(version.is_active))
  );

  if (activeDecks.length === 1) {
    return {
      deckId: activeDecks[0].id,
      deckName: activeDecks[0].name,
      source: "active_version",
      showAllDecks: false,
      versionToDeckId,
    };
  }

  if (activeDecks.length > 1) {
    const activeDeckIds = new Set(activeDecks.map((deck) => deck.id));
    const recentActiveDeckId = getMostRecentDeckIdFromMatches(
      matches,
      versionToDeckId,
      activeDeckIds
    );

    if (recentActiveDeckId) {
      const recentActiveDeck = activeDecks.find((deck) => deck.id === recentActiveDeckId);

      if (recentActiveDeck) {
        return {
          deckId: recentActiveDeck.id,
          deckName: recentActiveDeck.name,
          source: "active_version",
          showAllDecks: false,
          versionToDeckId,
        };
      }
    }

    const recentActiveDeck = getMostRecentCreatedDeck(decks, activeDeckIds);

    if (recentActiveDeck) {
      return {
        deckId: recentActiveDeck.id,
        deckName: recentActiveDeck.name,
        source: "active_version",
        showAllDecks: false,
        versionToDeckId,
      };
    }
  }

  const recentDeckId = getMostRecentDeckIdFromMatches(matches, versionToDeckId);

  if (recentDeckId) {
    const recentDeck = decks.find((deck) => deck.id === recentDeckId) ?? null;

    if (recentDeck) {
      return {
        deckId: recentDeck.id,
        deckName: recentDeck.name,
        source: "recent_match",
        showAllDecks: false,
        versionToDeckId,
      };
    }
  }

  const recentDeck = getMostRecentCreatedDeck(decks);

  if (recentDeck) {
    return {
      deckId: recentDeck.id,
      deckName: recentDeck.name,
      source: "recent_deck",
      showAllDecks: false,
      versionToDeckId,
    };
  }

  return {
    deckId: null,
    deckName: null,
    source: "none",
    showAllDecks: false,
    versionToDeckId,
  };
}
