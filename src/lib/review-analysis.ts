import {
  countMatchResults,
  formatMatchRecord,
  type MatchMetadata,
  type MatchResult,
} from "@/lib/match-types";

export type ReviewMatch = {
  id: string;
  deckId: string;
  deckName: string;
  deckVersionId: string;
  deckVersionName: string;
  deckVersionIsActive: boolean;
  opponentArchetype: string;
  result: MatchResult;
  wentFirst: boolean | null;
  playedAt: string;
  metadata: MatchMetadata;
};

export type ReviewFilterContext = {
  deckId?: string | null;
  deckName?: string | null;
  deckVersionId?: string | null;
  deckVersionName?: string | null;
  activeVersionOnly?: boolean;
};

export type ReviewInsightTone = "blue" | "gold" | "emerald" | "rose";

export type ReviewInsightCard = {
  key: string;
  title: string;
  explanation: string;
  evidence: string;
  recommendation: string;
  confidenceLabel: "Strong signal" | "Building signal" | "Early signal" | "Needs more games";
  tone: ReviewInsightTone;
  ctaLabel: string;
  ctaHref: string;
};

export type ReviewAnalysis = {
  sampleStatusLabel: string;
  sampleStatusReason: string;
  sampleSummary: string;
  cards: ReviewInsightCard[];
};

type ScoredReviewInsightCard = ReviewInsightCard & {
  score: number;
};

type QualityField =
  | "start_quality"
  | "opening_hand_quality"
  | "sequencing_quality";

const LOW_QUALITY_VALUES = new Set(["bad", "okay"]);
const HIGH_QUALITY_VALUES = new Set(["good", "great"]);

function getSampleStatus(total: number) {
  if (total < 5) {
    return {
      label: "Needs more games",
      reason: "Under five games is still too thin for strong coaching calls.",
    };
  }

  if (total < 10) {
    return {
      label: "Early signal",
      reason:
        "Patterns are starting to show, but counts still matter more than percentages.",
    };
  }

  return {
    label: "Actionable review",
    reason:
      "There is enough logged signal here to review before changing the list.",
  };
}

function getIssueTags(match: ReviewMatch) {
  return match.metadata.issue_tags ?? [];
}

function getPositiveTags(match: ReviewMatch) {
  return match.metadata.positive_tags ?? [];
}

function getMostCommonTag(
  matches: ReviewMatch[],
  selector: (match: ReviewMatch) => string[]
) {
  const counts = new Map<string, number>();

  matches.forEach((match) => {
    selector(match).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return (
    Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ??
    null
  );
}

function buildBaseMatchesHref(
  context: ReviewFilterContext,
  extra: Record<string, string | undefined> = {}
) {
  const query = new URLSearchParams();

  if (context.deckId) {
    query.set("deck_id", context.deckId);
  }

  if (context.deckVersionId) {
    query.set("deck_version_id", context.deckVersionId);
  }

  for (const [key, value] of Object.entries(extra)) {
    if (value) {
      query.set(key, value);
    }
  }

  const search = query.toString();
  return search ? `/matches?${search}` : "/matches";
}

function getContextLabel(context: ReviewFilterContext) {
  if (context.deckVersionName) {
    return context.deckVersionName;
  }

  if (context.deckName) {
    return context.deckName;
  }

  return "your recent games";
}

function getEarlySignalSuffix(total: number) {
  return total < 10 ? " Early signal only." : "";
}

function getConfidenceLabel({
  sampleSize,
  concentration,
}: {
  sampleSize: number;
  concentration?: number;
}): ReviewInsightCard["confidenceLabel"] {
  if (sampleSize >= 12 && (concentration ?? 0.5) >= 0.6) {
    return "Strong signal";
  }

  if (sampleSize >= 8 && (concentration ?? 0.35) >= 0.45) {
    return "Building signal";
  }

  if (sampleSize >= 4) {
    return "Early signal";
  }

  return "Needs more games";
}

function getQualityFieldLabel(field: QualityField): string {
  if (field === "start_quality") return "start";
  if (field === "opening_hand_quality") return "opening hand";
  return "sequencing";
}

function getQualityInsightTitle(field: QualityField): string {
  if (field === "start_quality") return "Poor starts are costing you games";
  if (field === "opening_hand_quality")
    return "Opening hands are hurting your results";
  return "Sequencing is costing games";
}

function getDominantGroupLabel(
  matches: ReviewMatch[],
  selector: (match: ReviewMatch) => string
) {
  const counts = new Map<string, number>();

  matches.forEach((match) => {
    const key = selector(match).trim();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const topGroup = Array.from(counts.entries()).sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }

    return left[0].localeCompare(right[0]);
  })[0];

  if (!topGroup) {
    return null;
  }

  return {
    label: topGroup[0],
    count: topGroup[1],
    share: matches.length ? topGroup[1] / matches.length : 0,
  };
}

function formatTaggedFraction(count: number, total: number) {
  if (total === 0) {
    return `0 of ${total}`;
  }

  return `${count} of ${total}`;
}

function formatTaggedComparison(
  tag: string,
  winsWithTag: number,
  totalWins: number,
  lossesWithTag: number,
  totalLosses: number
) {
  return `"${tag}" was tagged in ${formatTaggedFraction(
    winsWithTag,
    totalWins
  )} wins and ${formatTaggedFraction(lossesWithTag, totalLosses)} losses.`;
}

function getRateDifferenceLabel(
  higherRate: number,
  lowerRate: number
): "Strong signal" | "Building signal" | "Early signal" | "Needs more games" {
  const gap = higherRate - lowerRate;

  if (higherRate >= 0.55 && gap >= 0.25) {
    return "Strong signal";
  }

  if (higherRate >= 0.4 && gap >= 0.15) {
    return "Building signal";
  }

  if (higherRate > 0 || lowerRate > 0) {
    return "Early signal";
  }

  return "Needs more games";
}

function buildMatchupLeakCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ScoredReviewInsightCard | null {
  const grouped = new Map<string, ReviewMatch[]>();

  matches.forEach((match) => {
    const key = match.opponentArchetype.trim();
    if (!key) return;
    grouped.set(key, [...(grouped.get(key) ?? []), match]);
  });

  const candidates = Array.from(grouped.entries())
    .map(([opponent, groupedMatches]) => {
      const record = countMatchResults(groupedMatches);
      const winRate = record.total
        ? Math.round((record.wins / record.total) * 100)
        : 0;
      const commonIssue = getMostCommonTag(
        groupedMatches.filter((match) => match.result === "loss"),
        getIssueTags
      );

      return {
        opponent,
        groupedMatches,
        record,
        winRate,
        commonIssue,
      };
    })
    .filter((candidate) => candidate.record.total >= 5 && candidate.winRate <= 45)
    .sort((left, right) => {
      if (left.winRate !== right.winRate) {
        return left.winRate - right.winRate;
      }

      return right.record.total - left.record.total;
    });

  const topLeak = candidates[0];

  if (!topLeak) {
    return null;
  }

  const issueLine =
    topLeak.commonIssue && topLeak.commonIssue[1] >= 2
      ? ` "${topLeak.commonIssue[0]}" is the most common loss tag, and you logged it ${topLeak.commonIssue[1]} times in those losses.`
      : "";

  return {
    key: "matchup-leak",
    title: `${topLeak.opponent} is your priority watchlist`,
    explanation: `${topLeak.opponent} is the clearest matchup problem in ${getContextLabel(
      context
    )}.${issueLine}`,
    evidence: `${formatMatchRecord(
      topLeak.record.wins,
      topLeak.record.losses,
      topLeak.record.ties
    )} across ${topLeak.record.total} games.${getEarlySignalSuffix(
      topLeak.record.total
    )}`,
    recommendation:
      topLeak.commonIssue && topLeak.commonIssue[1] >= 2
        ? `Next test: keep the list stable and tag whether ${topLeak.commonIssue[0]} or raw matchup pressure breaks the game first.`
        : "Next test: keep the list stable and tag whether setup, bench pressure, or prize race breaks first.",
    confidenceLabel: getConfidenceLabel({
      sampleSize: topLeak.record.total,
      concentration: 1 - topLeak.winRate / 100,
    }),
    tone: "rose",
    ctaLabel: "View matching games",
    ctaHref: buildBaseMatchesHref(context, {
      opponent_archetype: topLeak.opponent,
    }),
    score:
      topLeak.record.total * 1.6 +
      (1 - topLeak.winRate / 100) * 40 +
      (topLeak.commonIssue?.[1] ?? 0) * 2,
  };
}

function buildQualityPatternCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ScoredReviewInsightCard | null {
  const fields: QualityField[] = [
    "start_quality",
    "opening_hand_quality",
    "sequencing_quality",
  ];

  const strongest = fields
    .map((field) => {
      const known = matches.filter((match) => Boolean(match.metadata[field]));
      const low = known.filter((match) =>
        LOW_QUALITY_VALUES.has(String(match.metadata[field]))
      );
      const high = known.filter((match) =>
        HIGH_QUALITY_VALUES.has(String(match.metadata[field]))
      );
      const lowLosses = low.filter((match) => match.result === "loss").length;
      const highLosses = high.filter((match) => match.result === "loss").length;
      const lowRate = low.length ? lowLosses / low.length : 0;
      const highRate = high.length ? highLosses / high.length : 0;

      return {
        field,
        known,
        low,
        high,
        lowLosses,
        highLosses,
        lowRate,
        highRate,
        delta: lowRate - highRate,
        score:
          low.length * 0.15 +
          lowLosses * 0.45 +
          (lowRate - highRate) * 35 +
          (field === "sequencing_quality"
            ? 7
            : field === "start_quality"
              ? 2
              : 0),
      };
    })
    .filter(
      (candidate) =>
        candidate.low.length >= 3 &&
        candidate.lowLosses >= 2 &&
        (candidate.delta >= 0.15 || candidate.lowRate >= 0.6)
    )
    .sort((left, right) => right.score - left.score)[0];

  if (!strongest) {
    return null;
  }

  const fieldLabel = getQualityFieldLabel(strongest.field);
  const comparisonLine =
    strongest.high.length >= 2
      ? ` Compare that to ${strongest.highLosses} of ${strongest.high.length} games with a Good or Great ${fieldLabel}.`
      : "";
  const nextTestLine =
    strongest.field === "sequencing_quality"
      ? "Review your turn-two setup and midgame prize-map decisions across the next few games."
      : strongest.field === "opening_hand_quality"
        ? "Tag whether the bad hands came from missing basics, draw, or early search."
        : "Log the next few games with extra focus on what makes the first two turns unstable.";

  return {
    key: "quality-pattern",
    title: getQualityInsightTitle(strongest.field),
    explanation: `${fieldLabel === "sequencing" ? "Sequencing" : fieldLabel === "opening hand" ? "Opening hands" : "Starts"} are dragging results down in ${getContextLabel(
      context
    )}.${comparisonLine}`,
    evidence: `${strongest.lowLosses} of ${strongest.low.length} games with a bad or okay ${fieldLabel} were losses.${getEarlySignalSuffix(
      strongest.known.length
    )}`,
    recommendation: `Next test: ${nextTestLine}`,
    confidenceLabel: getConfidenceLabel({
      sampleSize: strongest.low.length,
      concentration: strongest.lowRate,
    }),
    tone: "gold",
    ctaLabel: "Log next game",
    ctaHref: context.deckVersionId
      ? `/matches/new?deck_version_id=${context.deckVersionId}`
      : "/matches/new",
    score: strongest.score,
  };
}

function buildIssueTagCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ScoredReviewInsightCard | null {
  const losses = matches.filter((match) => match.result === "loss");
  const mostCommon = getMostCommonTag(losses, getIssueTags);

  if (!mostCommon || mostCommon[1] < 2 || losses.length < 3) {
    return null;
  }

  const [tag, count] = mostCommon;
  const wins = matches.filter((match) => match.result === "win");
  const winsWithTag = wins.filter((match) => getIssueTags(match).includes(tag)).length;
  const contextLabel = getContextLabel(context);
  const lossesWithTag = losses.filter((match) => getIssueTags(match).includes(tag));
  const tagLossShare = losses.length ? count / losses.length : 0;
  const tagWinShare = wins.length ? winsWithTag / wins.length : 0;
  const deckFocus = getDominantGroupLabel(lossesWithTag, (match) => match.deckName);
  const matchupFocus = getDominantGroupLabel(
    lossesWithTag,
    (match) => match.opponentArchetype
  );
  const focusedDeckLabel =
    !context.deckId && deckFocus && deckFocus.share >= 0.55 ? deckFocus.label : null;
  const focusedMatchupLabel =
    matchupFocus && matchupFocus.share >= 0.5 ? matchupFocus.label : null;
  const tagEvidence = formatTaggedComparison(
    tag,
    winsWithTag,
    wins.length,
    count,
    losses.length
  );
  const focusLine = focusedMatchupLabel
    ? ` Most of those losses are into ${focusedMatchupLabel}.`
    : focusedDeckLabel
      ? ` Most of those losses are with ${focusedDeckLabel}.`
      : "";
  const confidenceLabel = getRateDifferenceLabel(tagLossShare, tagWinShare);

  return {
    key: "issue-tag",
    title: focusedDeckLabel
      ? `"${tag}" is showing up in ${focusedDeckLabel} losses`
      : `"${tag}" is showing up in your losses`,
    explanation: `${tagEvidence} In ${contextLabel}, that points to a possible failure pattern rather than a solved deck change.${focusLine}`,
    evidence: `${formatTaggedFraction(count, losses.length)} losses tagged, ${formatTaggedFraction(
      winsWithTag,
      wins.length
    )} wins tagged.${getEarlySignalSuffix(losses.length + wins.length)}`,
    recommendation:
      `What to do next: in the next 5 games where "${tag}" happens, add one note saying what caused it and whether it was matchup pressure, a deck issue, sequencing, or an opening-hand problem.`,
    confidenceLabel,
    tone: "rose",
    ctaLabel: "Review losses",
    ctaHref: buildBaseMatchesHref(context, {
      result: "loss",
    }),
    score:
      count * 2 +
      tagLossShare * 18 +
      (focusedDeckLabel ? 18 : 0) +
      (focusedMatchupLabel ? 8 : 0) +
      (deckFocus && deckFocus.count >= 6 ? 12 : 0) +
      (winsWithTag === 0 ? 8 : 0) -
      winsWithTag,
  };
}

function buildPositiveTagCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ScoredReviewInsightCard | null {
  const wins = matches.filter((match) => match.result === "win");
  const mostCommon = getMostCommonTag(wins, getPositiveTags);

  if (!mostCommon || mostCommon[1] < 2 || wins.length < 3) {
    return null;
  }

  const [tag, count] = mostCommon;
  const losses = matches.filter((match) => match.result === "loss");
  const lossesWithTag = losses.filter((match) =>
    getPositiveTags(match).includes(tag)
  ).length;
  const contextLabel = getContextLabel(context);
  const winShare = wins.length ? count / wins.length : 0;
  const lossShare = losses.length ? lossesWithTag / losses.length : 0;
  const strongSignal = count >= 3 && winShare >= lossShare + 0.15;
  const confidenceLabel = strongSignal
    ? getRateDifferenceLabel(winShare, lossShare)
    : getConfidenceLabel({
        sampleSize: count + lossesWithTag,
        concentration: Math.max(winShare, lossShare),
      });
  const evidence = formatTaggedComparison(
    tag,
    count,
    wins.length,
    lossesWithTag,
    losses.length
  );

  return {
    key: "positive-tag",
    title: strongSignal
      ? `"${tag}" is showing a positive pattern`
      : `"${tag}" is linked to some of your wins`,
    explanation: strongSignal
      ? `${evidence} In ${contextLabel}, that makes "${tag}" worth tracking as part of your winning setup, but it is still not proof by itself.`
      : `${evidence} In ${contextLabel}, "${tag}" is showing up in some wins, but the sample is not strong enough to treat it as a real edge yet.`,
    evidence: `${formatTaggedFraction(count, wins.length)} wins tagged, ${formatTaggedFraction(
      lossesWithTag,
      losses.length
    )} losses tagged.${getEarlySignalSuffix(wins.length + losses.length)}`,
    recommendation:
      `What to do next: for your next 5 games, keep tagging "${tag}" and add a short note saying what made it happen, for example prize map, tech card, setup turn, or opponent mistake.`,
    confidenceLabel,
    tone: "emerald",
    ctaLabel: "Log next game",
    ctaHref: context.deckVersionId
      ? `/matches/new?deck_version_id=${context.deckVersionId}`
      : "/matches/new",
    score:
      count * 1.4 +
      winShare * 16 -
      lossShare * 12 +
      (strongSignal ? 12 : 0),
  };
}

function buildVersionSignalCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ScoredReviewInsightCard | null {
  if (!context.deckId || context.deckVersionId) {
    return null;
  }

  const grouped = new Map<
    string,
    { name: string; matches: ReviewMatch[]; isActive: boolean }
  >();

  matches.forEach((match) => {
    const current = grouped.get(match.deckVersionId) ?? {
      name: match.deckVersionName,
      matches: [],
      isActive: match.deckVersionIsActive,
    };
    current.matches.push(match);
    grouped.set(match.deckVersionId, current);
  });

  const candidates = Array.from(grouped.values())
    .map((group) => ({
      ...group,
      record: countMatchResults(group.matches),
      winRate: group.matches.length
        ? Math.round(
            (group.matches.filter((match) => match.result === "win").length /
              group.matches.length) *
              100
          )
        : 0,
    }))
    .filter((group) => group.matches.length >= 3)
    .sort((left, right) => right.winRate - left.winRate);

  if (candidates.length < 2) {
    return null;
  }

  const best = candidates[0];
  const worst = candidates[candidates.length - 1];
  const delta = best.winRate - worst.winRate;

  if (delta < 15) {
    return null;
  }

  return {
    key: "version-signal",
    title: `${best.name} is outperforming ${worst.name}`,
    explanation: `${best.name} is outperforming ${worst.name} so far, but version reads only matter if the cleaner list keeps holding up as the sample grows.`,
    evidence: `${best.name}: ${formatMatchRecord(
      best.record.wins,
      best.record.losses,
      best.record.ties
    )}. ${worst.name}: ${formatMatchRecord(
      worst.record.wins,
      worst.record.losses,
      worst.record.ties
    )}.${getEarlySignalSuffix(best.matches.length + worst.matches.length)}`,
    recommendation:
      "Next test: keep both versions in the pool a little longer and compare whether starts, sequencing, or matchup spread explain the gap.",
    confidenceLabel: getConfidenceLabel({
      sampleSize: best.matches.length + worst.matches.length,
      concentration: delta / 100,
    }),
    tone: "blue",
    ctaLabel: "Review deck versions",
    ctaHref: `/decks/${context.deckId}#versions`,
    score: delta + best.matches.length + worst.matches.length,
  };
}

function buildNextActionCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext,
  rankedCards: ReviewInsightCard[]
): ReviewInsightCard {
  const primaryCard = rankedCards[0];
  const matchupCard = rankedCards.find((card) => card.key === "matchup-leak");
  const versionCard = rankedCards.find((card) => card.key === "version-signal");

  if (primaryCard?.key === "matchup-leak" && matchupCard) {
    const matchup = matchupCard.title.replace(" is your priority watchlist", "");

    return {
      key: "next-action",
      title: "What to test next",
      explanation: `Turn ${matchup} into a focused test block instead of a vague frustration point.`,
      evidence:
        "One more structured game against this matchup sharpens the read.",
      recommendation:
        "Next test: log one more clean review game into this matchup and tag the first break point before changing the list.",
      confidenceLabel: "Building signal",
      tone: "blue",
      ctaLabel: "Log next game",
      ctaHref: context.deckVersionId
        ? `/matches/new?deck_version_id=${context.deckVersionId}`
        : "/matches/new",
    };
  }

  if (primaryCard?.key === "issue-tag") {
    return {
      key: "next-action",
      title: "What to test next",
      explanation:
        "Use the repeated issue tag as the center of the next test block.",
      evidence:
        "Another small structured sample is more valuable than an instant deck change.",
      recommendation:
        "Next test: keep the next block clean and keep tagging the repeated issue honestly before touching the list.",
      confidenceLabel: "Building signal",
      tone: "blue",
      ctaLabel: "Log next game",
      ctaHref: context.deckVersionId
        ? `/matches/new?deck_version_id=${context.deckVersionId}`
        : "/matches/new",
    };
  }

  if (primaryCard?.key === "quality-pattern") {
    return {
      key: "next-action",
      title: "What to test next",
      explanation:
        "Use the next few games to separate a piloting issue from a real list issue.",
      evidence:
        "Consistent quality tagging is what makes this signal trustworthy.",
      recommendation:
        "Next test: keep the same quality tags and one concrete checkpoint in mind for the next few games.",
      confidenceLabel: "Building signal",
      tone: "blue",
      ctaLabel: "Log next game",
      ctaHref: context.deckVersionId
        ? `/matches/new?deck_version_id=${context.deckVersionId}`
        : "/matches/new",
    };
  }

  if (versionCard) {
    return {
      key: "next-action",
      title: "What to test next",
      explanation:
        "Version comparisons only become real when the cleaner build keeps holding up after more games.",
      evidence:
        "Version comparisons are only useful when the sample keeps growing.",
      recommendation:
        "Next test: keep comparing versions through logged games instead of memory for another short block.",
      confidenceLabel: "Early signal",
      tone: "blue",
      ctaLabel: "Review deck versions",
      ctaHref: versionCard.ctaHref,
    };
  }

  return {
    key: "next-action",
    title: "What to test next",
    explanation:
      "No single leak is dominant yet, so the next job is to keep the logging clean enough for one to separate itself.",
    evidence:
      "A five-game block with consistent tagging is the fastest path to a real coaching read.",
    recommendation:
      "Next test: log a five-game block with clean tags and quality ratings before changing the list.",
    confidenceLabel: "Needs more games",
    tone: "blue",
    ctaLabel: "Log next game",
    ctaHref: context.deckVersionId
      ? `/matches/new?deck_version_id=${context.deckVersionId}`
      : "/matches/new",
  };
}

export function buildReviewAnalysis(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ReviewAnalysis {
  const record = countMatchResults(matches);
  const sampleStatus = getSampleStatus(record.total);

  const rankedCards = [
    buildIssueTagCard(matches, context),
    buildQualityPatternCard(matches, context),
    buildMatchupLeakCard(matches, context),
    buildPositiveTagCard(matches, context),
    buildVersionSignalCard(matches, context),
  ]
    .filter((card): card is ScoredReviewInsightCard => Boolean(card))
    .sort((left, right) => right.score - left.score)
    .map((card) => {
      const { score, ...nextCard } = card;
      void score;
      return nextCard;
    });

  const cards = [...rankedCards, buildNextActionCard(matches, context, rankedCards)];

  return {
    sampleStatusLabel: sampleStatus.label,
    sampleStatusReason: sampleStatus.reason,
    sampleSummary: `${formatMatchRecord(
      record.wins,
      record.losses,
      record.ties
    )} across ${record.total} logged games`,
    cards,
  };
}
