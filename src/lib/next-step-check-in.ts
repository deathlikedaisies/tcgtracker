export type NextStepCheckInState =
  | "no_deck"
  | "no_matches"
  | "needs_tags"
  | "ready_for_review"
  | "active_testing_block";

export type NextStepCheckInCounts = {
  deckCount: number;
  matchCount: number;
  taggedMatchCount?: number;
  issueTaggedMatchCount?: number;
  activeTestingBlock?: {
    id: string;
    targetMatchup?: string | null;
  } | null;
};

export type NextStepCheckInContent = {
  state: NextStepCheckInState;
  title: string;
  question: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

export function getNextStepCheckInContent({
  deckCount,
  matchCount,
  taggedMatchCount = 0,
  issueTaggedMatchCount = 0,
  activeTestingBlock = null,
}: NextStepCheckInCounts): NextStepCheckInContent {
  if (activeTestingBlock) {
    const target = activeTestingBlock.targetMatchup?.trim();
    const query = new URLSearchParams({
      testing_block_id: activeTestingBlock.id,
    });

    if (target) {
      query.set("opponent", target);
    }

    return {
      state: "active_testing_block",
      title: "Active testing block",
      question: target
        ? `Continue your focused test into ${target}?`
        : "Continue your focused testing block?",
      primaryLabel: "Log next game",
      primaryHref: `/matches/new?${query.toString()}`,
      secondaryLabel: "Open testing block",
      secondaryHref: "/testing",
    };
  }

  if (deckCount <= 0) {
    return {
      state: "no_deck",
      title: "Quick check-in",
      question: "Have you imported your first deck yet?",
      primaryLabel: "Import a deck",
      primaryHref: "/decks",
      secondaryLabel: "Start demo",
      secondaryHref: "/demo",
    };
  }

  if (matchCount <= 0) {
    return {
      state: "no_matches",
      title: "Quick check-in",
      question: "Have you imported a TCG Live battle log yet?",
      primaryLabel: "Import a log",
      primaryHref: "/matches/new",
      secondaryLabel: "Log manually",
      secondaryHref: "/matches/new",
    };
  }

  const minimumTaggedGames = Math.min(matchCount, 3);

  if (
    issueTaggedMatchCount <= 0 ||
    taggedMatchCount < minimumTaggedGames
  ) {
    return {
      state: "needs_tags",
      title: "Quick check-in",
      question: "Have you tagged why your recent games were won or lost?",
      primaryLabel: "Review matches",
      primaryHref: "/matches",
      secondaryLabel: "Open review",
      secondaryHref: "/review",
    };
  }

  return {
    state: "ready_for_review",
    title: "Next testing step",
    question: "Ready to see what to test next?",
    primaryLabel: "Open review",
    primaryHref: "/review",
    secondaryLabel: "View matchups",
    secondaryHref: "/matchups",
  };
}

type TaggableMatch = {
  metadata?: {
    issue_tags?: unknown;
    positive_tags?: unknown;
  } | null;
  match_tags?: { tag?: unknown }[] | { tag?: unknown } | null;
};

function hasArrayValues(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function hasMatchTagRows(value: TaggableMatch["match_tags"]) {
  if (!value) {
    return false;
  }

  const rows = Array.isArray(value) ? value : [value];
  return rows.some((row) => typeof row.tag === "string" && row.tag.trim());
}

export function getNextStepCheckInCounts(
  decks: unknown[] | null | undefined,
  matches: TaggableMatch[] | null | undefined
): NextStepCheckInCounts {
  const matchRows = matches ?? [];

  return {
    deckCount: decks?.length ?? 0,
    matchCount: matchRows.length,
    taggedMatchCount: matchRows.filter((match) => {
      return (
        hasMatchTagRows(match.match_tags) ||
        hasArrayValues(match.metadata?.issue_tags) ||
        hasArrayValues(match.metadata?.positive_tags)
      );
    }).length,
    issueTaggedMatchCount: matchRows.filter((match) => {
      return (
        hasMatchTagRows(match.match_tags) ||
        hasArrayValues(match.metadata?.issue_tags)
      );
    }).length,
  };
}
