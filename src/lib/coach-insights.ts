import {
  buildReviewAnalysis,
  type ReviewInsightCard,
  type ReviewMatch,
} from "@/lib/review-analysis";

// Cards that describe the opponent, not the player's deck
const OPPONENT_FOCUSED_KEYS = new Set(["matchup-leak", "next-action"]);

/**
 * Returns the highest-priority deck-focused coaching insight for a set of matches.
 * Prefers quality patterns and tag patterns over matchup reads, since the dashboard
 * already surfaces matchup coaching via the session coach mission.
 */
export function buildPrimaryDeckInsight(
  matches: ReviewMatch[]
): ReviewInsightCard | null {
  if (matches.length < 3) {
    return null;
  }

  const analysis = buildReviewAnalysis(matches, {});

  // Prefer a deck-focused insight (quality or tags) over a matchup read
  const deckCard = analysis.cards.find(
    (card) => !OPPONENT_FOCUSED_KEYS.has(card.key)
  );

  return deckCard ?? null;
}
