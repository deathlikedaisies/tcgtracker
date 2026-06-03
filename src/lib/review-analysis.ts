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
      reason: "Patterns are starting to show, but counts still matter more than percentages.",
    };
  }

  return {
    label: "Actionable review",
    reason: "There is enough logged signal here to review before changing the list.",
  };
}

function getIssueTags(match: ReviewMatch) {
  return match.metadata.issue_tags ?? [];
}

function getPositiveTags(match: ReviewMatch) {
  return match.metadata.positive_tags ?? [];
}

function getMostCommonTag(matches: ReviewMatch[], selector: (match: ReviewMatch) => string[]) {
  const counts = new Map<string, number>();

  matches.forEach((match) => {
    selector(match).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])[0] ?? null;
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

function getQualityFieldLabel(field: QualityField): string {
  if (field === "start_quality") return "start";
  if (field === "opening_hand_quality") return "opening hand";
  return "sequencing";
}

function getQualityInsightTitle(field: QualityField): string {
  if (field === "start_quality") return "Poor starts are costing you games";
  if (field === "opening_hand_quality") return "Opening hands are hurting your results";
  return "Sequencing issues are costing you games";
}

function buildMatchupLeakCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ReviewInsightCard | null {
  const grouped = new Map<string, ReviewMatch[]>();

  matches.forEach((match) => {
    const key = match.opponentArchetype.trim();
    if (!key) return;
    grouped.set(key, [...(grouped.get(key) ?? []), match]);
  });

  const candidates = Array.from(grouped.entries())
    .map(([opponent, groupedMatches]) => {
      const record = countMatchResults(groupedMatches);
      const winRate = record.total ? Math.round((record.wins / record.total) * 100) : 0;
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
      ? ` "${topLeak.commonIssue[0]}" is the most common loss tag — you tagged it ${topLeak.commonIssue[1]} times in those losses.`
      : "";

  return {
    key: "matchup-leak",
    title: `${topLeak.opponent} is your priority watchlist`,
    explanation: `${topLeak.opponent} has your worst win rate in ${getContextLabel(context)}. Keep logging normally — when this matchup appears, tag what breaks first instead of changing the list based on feel.${issueLine}`,
    evidence: `${formatMatchRecord(
      topLeak.record.wins,
      topLeak.record.losses,
      topLeak.record.ties
    )} across ${topLeak.record.total} games.${getEarlySignalSuffix(topLeak.record.total)}`,
    tone: "rose",
    ctaLabel: "View matching games",
    ctaHref: buildBaseMatchesHref(context, {
      opponent_archetype: topLeak.opponent,
    }),
  };
}

function buildQualityPatternCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ReviewInsightCard | null {
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
      };
    })
    .filter(
      (candidate) =>
        candidate.low.length >= 3 &&
        candidate.lowLosses >= 2 &&
        (candidate.delta >= 0.15 || candidate.lowRate >= 0.6)
    )
    .sort((left, right) => right.delta - left.delta)[0];

  if (!strongest) {
    return null;
  }

  const fieldLabel = getQualityFieldLabel(strongest.field);
  const lossRatePct = Math.round(strongest.lowRate * 100);
  const comparisonLine = strongest.high.length >= 2
    ? ` Compare that to ${strongest.highLosses} of ${strongest.high.length} games with a Good or Great ${fieldLabel}.`
    : "";

  return {
    key: "quality-pattern",
    title: getQualityInsightTitle(strongest.field),
    explanation: `You lose ${lossRatePct}% of games when your ${fieldLabel} is Bad or Okay in ${getContextLabel(context)}.${comparisonLine} Before changing tech cards, check whether this pattern holds across the full sample.`,
    evidence: `${strongest.lowLosses} of ${strongest.low.length} games with a bad or okay ${fieldLabel} were losses.${getEarlySignalSuffix(strongest.known.length)}`,
    tone: "gold",
    ctaLabel: "Log next game",
    ctaHref:
      context.deckVersionId
        ? `/matches/new?deck_version_id=${context.deckVersionId}`
        : "/matches/new",
  };
}

function buildIssueTagCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ReviewInsightCard | null {
  const losses = matches.filter((match) => match.result === "loss");
  const mostCommon = getMostCommonTag(losses, getIssueTags);

  if (!mostCommon || mostCommon[1] < 2 || losses.length < 3) {
    return null;
  }

  const [tag, count] = mostCommon;
  const wins = matches.filter((match) => match.result === "win");
  const winsWithTag = wins.filter((match) => getIssueTags(match).includes(tag)).length;
  const contextLabel = getContextLabel(context);

  const comparisonLine = winsWithTag
    ? ` It appears in only ${winsWithTag} win${winsWithTag === 1 ? "" : "s"}, so the gap is real.`
    : " It rarely shows up in wins.";

  return {
    key: "issue-tag",
    title: `"${tag}" is your most common loss tag`,
    explanation: `You tagged "${tag}" in ${count} of ${losses.length} losses with ${contextLabel}.${comparisonLine} That is the clearest issue signal in your current data.`,
    evidence: `${count} of ${losses.length} losses tagged with "${tag}".${getEarlySignalSuffix(losses.length)}`,
    tone: "rose",
    ctaLabel: "Review losses",
    ctaHref: buildBaseMatchesHref(context, {
      result: "loss",
    }),
  };
}

function buildPositiveTagCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ReviewInsightCard | null {
  const wins = matches.filter((match) => match.result === "win");
  const mostCommon = getMostCommonTag(wins, getPositiveTags);

  if (!mostCommon || mostCommon[1] < 2 || wins.length < 3) {
    return null;
  }

  const [tag, count] = mostCommon;
  const contextLabel = getContextLabel(context);

  return {
    key: "positive-tag",
    title: `"${tag}" appears often in your wins`,
    explanation: `You marked "${tag}" in ${count} of ${wins.length} wins with ${contextLabel}. That usually signals a tech or line that is worth keeping while you test other changes. Do not cut it before logging more games.`,
    evidence: `${count} of ${wins.length} wins tagged with "${tag}".${getEarlySignalSuffix(wins.length)}`,
    tone: "emerald",
    ctaLabel: context.deckId ? "Open deck" : "Log next game",
    ctaHref: context.deckId ? `/decks/${context.deckId}` : "/matches/new",
  };
}

function buildVersionSignalCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ReviewInsightCard | null {
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
    explanation: `There is a ${delta}-point win-rate gap between your two most tested versions. Review whether the stronger list is actually cleaner to pilot or just running hot on a small sample before committing to it.`,
    evidence: `${best.name}: ${formatMatchRecord(
      best.record.wins,
      best.record.losses,
      best.record.ties
    )}. ${worst.name}: ${formatMatchRecord(
      worst.record.wins,
      worst.record.losses,
      worst.record.ties
    )}.${getEarlySignalSuffix(best.matches.length + worst.matches.length)}`,
    tone: "blue",
    ctaLabel: "Review deck versions",
    ctaHref: `/decks/${context.deckId}#versions`,
  };
}

function buildNextActionCard(
  matches: ReviewMatch[],
  context: ReviewFilterContext
): ReviewInsightCard {
  const worstMatchup = buildMatchupLeakCard(matches, context);
  const issueCard = buildIssueTagCard(matches, context);
  const versionCard = buildVersionSignalCard(matches, context);

  if (worstMatchup) {
    const matchup = worstMatchup.title.replace(" is your priority watchlist", "");

    return {
      key: "next-action",
      title: "What to test next",
      explanation: `Keep logging normally. When ${matchup} appears, tag the first thing that goes wrong instead of changing the list on feel. Use the watchlist to capture one more clean review game.`,
      evidence: "One more structured game against this matchup sharpens the read.",
      tone: "blue",
      ctaLabel: "Log next game",
      ctaHref:
        context.deckVersionId
          ? `/matches/new?deck_version_id=${context.deckVersionId}`
          : "/matches/new",
    };
  }

  if (issueCard) {
    return {
      key: "next-action",
      title: "What to test next",
      explanation: "Keep the next block clean and keep tagging the repeated issue honestly. That is what turns a suspicion into a real coaching read — not changing the list early.",
      evidence: "Another small structured sample is more valuable than an instant deck change.",
      tone: "blue",
      ctaLabel: "Log next game",
      ctaHref:
        context.deckVersionId
          ? `/matches/new?deck_version_id=${context.deckVersionId}`
          : "/matches/new",
    };
  }

  if (versionCard) {
    return {
      key: "next-action",
      title: "What to test next",
      explanation: "Keep comparing versions through logged games instead of memory. If the gap persists after 10 more games, then commit to the cleaner build.",
      evidence: "Version comparisons are only useful when the sample keeps growing.",
      tone: "blue",
      ctaLabel: "Review deck versions",
      ctaHref: versionCard.ctaHref,
    };
  }

  return {
    key: "next-action",
    title: "What to test next",
    explanation: "No single leak is dominant yet. Keep logging normal games with clean tags and quality ratings until one pattern separates itself. Every log should answer a testing question.",
    evidence: "A five-game block with consistent tagging is the fastest path to a real coaching read.",
    tone: "blue",
    ctaLabel: "Log next game",
    ctaHref:
      context.deckVersionId
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

  // Priority: deck quality → issue tags → matchup → positive tags → version → next action
  const qualityCard = buildQualityPatternCard(matches, context);
  const issueTagCard = buildIssueTagCard(matches, context);
  const matchupCard = buildMatchupLeakCard(matches, context);
  const positiveCard = buildPositiveTagCard(matches, context);
  const versionCard = buildVersionSignalCard(matches, context);
  const nextActionCard = buildNextActionCard(matches, context);

  const cards = [
    qualityCard,
    issueTagCard,
    matchupCard,
    positiveCard,
    versionCard,
    nextActionCard,
  ].filter((card): card is ReviewInsightCard => Boolean(card));

  return {
    sampleStatusLabel: sampleStatus.label,
    sampleStatusReason: sampleStatus.reason,
    sampleSummary: `${formatMatchRecord(record.wins, record.losses, record.ties)} across ${record.total} logged games`,
    cards,
  };
}
