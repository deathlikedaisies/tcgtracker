import {
  countMatchResults,
  formatMatchRecord,
  type MatchResult,
} from "@/lib/match-types";

export type CoachMatch = {
  id?: string;
  deck_version_id?: string;
  opponent_archetype: string;
  result: MatchResult;
  went_first: boolean | null;
  event_type: string | null;
  played_at: string;
  match_tags?: { tag: string }[] | { tag: string } | null;
  metadata?: {
    start_quality?: string;
    opening_hand_quality?: string;
    sequencing_quality?: string;
    issue_tags?: string[];
    positive_tags?: string[];
  } | null;
  deck_versions?:
    | {
        id?: string;
        name?: string | null;
        deck_id?: string;
      }
    | {
        id?: string;
        name?: string | null;
        deck_id?: string;
      }[]
    | null;
};

export type MissionType =
  | "matchup"
  | "loss-pattern"
  | "turn-order"
  | "baseline"
  | "deck-version"
  | "event-prep"
  | "deck-leak"
  | "positive-pattern";

export type MissionGuidanceMode =
  | "priority_watchlist"
  | "focused_test"
  | "investigation"
  | "version_test";

export type MissionStatus =
  | "needs_games"
  | "building_signal"
  | "needs_more_focused_games"
  | "actionable_signal"
  | "mission_complete"
  | "pattern_confirmed"
  | "pattern_rejected"
  | "improvement_detected";

export type SessionCoachInsight = {
  archetype: string;
  confidence: string;
  ctaLabel: string;
  completionStatus: string | null;
  completionSummary: string | null;
  whyThisMatters: string;
  rewardLabel: string;
  completionLesson: string | null;
  commonIssue: {
    count: number;
    tag: string;
  } | null;
  criteria: string;
  duringRecord: string;
  evidence: string;
  headline: string;
  improvementDelta: number | null;
  issueTrend: string | null;
  missionState: "active" | "complete";
  missionType: MissionType;
  missionTypeLabel: string;
  missionGuidanceMode: MissionGuidanceMode;
  missionGuidanceLabel: string;
  missionStatus: MissionStatus;
  missionStatusLabel: string;
  missionStatusReason: string;
  missionTitle: string;
  missionSkill: string;
  missionProgress: number;
  missionTargetCount: number;
  missionContextLabel: string;
  missionContextSeenCount: number;
  missionContextTargetCount: number;
  missionFocusOpponent: string | null;
  missionFocusTurnContext: "going first" | "going second" | null;
  missionFocusTag: string | null;
  missionFocusDeckVersionIds: string[];
  missionReason: string;
  missionConfidence: string;
  missionNextAction: string;
  missionResults: {
    id?: string;
    opponent: string;
    playedAt: string;
    result: MatchResult;
  }[];
  nextAction: string;
  previousRecord: string | null;
  weakMatchup: string;
  condition: string;
  context: string;
  exactTest: string;
  nextTest: string;
  progressCompleted: number;
  progressGoal: number;
  progressFeedback: string;
  reasoning: string;
  focus: string;
  record: string;
  eventType: string;
  continueHref: string;
};

export type TrainingProgressSummary = {
  completedTestBlocks: number;
  improvedMatchups: number;
  currentWeakestImproved: boolean;
  lossPatternTrend: string | null;
};

type MissionCandidate = {
  priority: 1 | 2 | 3 | 4 | 5 | 6;
  score: number;
  archetype: string;
  missionType: MissionType;
  missionTitle: string;
  missionReason: string;
  whyThisMatters: string;
  rewardLabel: string;
  missionContextLabel: string;
  missionContextTargetCount: number;
  focus: string;
  condition: string;
  context: string;
  exactTest: string;
  nextTest: string;
  reasoning: string;
  criteria: string;
  matches: CoachMatch[];
  focusMatches: CoachMatch[];
  focusOpponent: string | null;
  focusTurnContext: "going first" | "going second" | null;
  focusTag: string | null;
  focusDeckVersionIds: string[];
  missionProgressGoal: number;
  missionContextSeenCount: number;
  commonIssue: {
    count: number;
    tag: string;
  } | null;
  continueHref: string;
  eventType: string;
};

function getTags(match: CoachMatch) {
  if (!match.match_tags) {
    return [];
  }

  return Array.isArray(match.match_tags)
    ? match.match_tags.map((tagRow) => tagRow.tag)
    : [match.match_tags.tag];
}

const LOW_QUALITY_VALUES = new Set(["bad", "okay"]);

function getMetadataQuality(
  match: CoachMatch,
  field: "start_quality" | "opening_hand_quality" | "sequencing_quality"
): string | null {
  if (!match.metadata) return null;
  const val = match.metadata[field];
  return typeof val === "string" ? val : null;
}

function getMetadataPositiveTags(match: CoachMatch): string[] {
  if (!match.metadata) return [];
  return Array.isArray(match.metadata.positive_tags) ? match.metadata.positive_tags : [];
}

function formatComparisonRecord(matches: CoachMatch[]) {
  const { wins, losses, ties } = countMatchResults(matches);

  return formatMatchRecord(wins, losses, ties);
}

function getWinRate(matches: CoachMatch[]) {
  if (!matches.length) {
    return null;
  }

  const wins = matches.filter((match) => match.result === "win").length;
  return Math.round((wins / matches.length) * 100);
}

function getMissionTypeLabel(missionType: MissionType) {
  return {
    matchup: "Priority watchlist",
    "loss-pattern": "Tag investigation",
    "turn-order": "Turn-order investigation",
    baseline: "Build sample",
    "deck-version": "Version test",
    "event-prep": "Event prep",
    "deck-leak": "Deck leak",
    "positive-pattern": "Positive pattern",
  }[missionType] ?? "Mission";
}

function getMissionGuidanceMode(missionType: MissionType): MissionGuidanceMode {
  if (missionType === "matchup") return "priority_watchlist";
  if (missionType === "deck-version") return "version_test";
  if (missionType === "deck-leak" || missionType === "loss-pattern" || missionType === "positive-pattern") return "investigation";
  return "focused_test";
}

function getMissionGuidanceLabel(mode: MissionGuidanceMode) {
  if (mode === "priority_watchlist") return "Priority watchlist";
  if (mode === "investigation") return "Investigation";
  if (mode === "version_test") return "Version test";
  return "Focused test";
}

function getMissionStatusLabel(
  status: MissionStatus,
  mode: MissionGuidanceMode
) {
  return {
    needs_games: "Needs games",
    building_signal: mode === "investigation" ? "Pattern forming" : "Building signal",
    needs_more_focused_games:
      mode === "priority_watchlist" ? "Needs more games" : "Needs more logs",
    actionable_signal: "Strong enough to review",
    mission_complete: "Read unlocked",
    pattern_confirmed: "Pattern confirmed",
    pattern_rejected: "Pattern rejected",
    improvement_detected: "Improvement detected",
  }[status] ?? "In progress";
}

function getMissionActiveStatus(
  completed: number,
  goal: number,
  contextCount: number,
  contextGoal: number
): MissionStatus {
  if (completed < Math.min(3, goal)) {
    return "needs_games";
  }

  if (contextCount > 0 && contextCount < contextGoal) {
    return "needs_more_focused_games";
  }

  if (completed >= goal) {
    return "actionable_signal";
  }

  return "building_signal";
}

function getMissionStatus(
  completed: number,
  goal: number,
  contextCount: number,
  contextGoal: number
): MissionStatus {
  return getMissionActiveStatus(completed, goal, contextCount, contextGoal);
}

function getMissionStatusReason(
  status: MissionStatus,
  mode: MissionGuidanceMode,
  completed: number,
  goal: number,
  contextCount: number,
  contextGoal: number,
  archetype: string,
  focusTag: string | null,
  turnContext: "going first" | "going second" | null
) {
  const remaining = Math.max(goal - completed, 0);
  const focusRemaining = Math.max(contextGoal - contextCount, 0);
  const issueLabel = focusTag ? formatIssueLabel(focusTag) : null;
  const turnContextLabel = turnContext ? ` ${turnContext}` : "";

  if (status === "needs_games") {
    return mode === "priority_watchlist"
      ? `Keep logging normally. ${remaining} more game${
          remaining === 1 ? "" : "s"
        } will turn ${archetype} into a coaching read.`
      : `Log ${remaining} more game${
          remaining === 1 ? "" : "s"
        } before this becomes a coaching read.`;
  }

  if (status === "building_signal") {
    return mode === "priority_watchlist"
      ? issueLabel
        ? `Early watchlist read on ${archetype}. Keep logging normally and tag ${issueLabel}${turnContextLabel}.`
        : `Early watchlist read on ${archetype}. Keep logging normally before changing your list.`
      : `Early pattern building against ${archetype}. Keep logging before changing your list.`;
  }

  if (status === "needs_more_focused_games") {
    return mode === "priority_watchlist"
      ? issueLabel
        ? `The leak is showing. When ${archetype} appears, tag ${issueLabel}${turnContextLabel} in ${focusRemaining} more game${
            focusRemaining === 1 ? "" : "s"
          }.`
        : `The leak is showing. When ${archetype} appears, capture ${focusRemaining} more watchlist game${
            focusRemaining === 1 ? "" : "s"
          }.`
      : `The leak is showing, but ${focusRemaining} more focus game${
          focusRemaining === 1 ? "" : "s"
        } will make this read easier to trust.`;
  }

  if (status === "actionable_signal") {
    return mode === "priority_watchlist"
      ? "You have enough watchlist evidence to start reviewing the pattern."
      : "You have enough focused evidence to start reviewing the pattern.";
  }

  return mode === "priority_watchlist"
    ? `Keep logging normally. ${remaining} more watchlist game${
        remaining === 1 ? "" : "s"
      } will make this read easier to trust.`
    : `Log ${remaining} more focused game${
        remaining === 1 ? "" : "s"
      } before changing plans.`;
}

function getProgressFeedback(
  status: MissionStatus,
  mode: MissionGuidanceMode,
  completed: number,
  goal: number
) {
  const remaining = Math.max(goal - completed, 0);

  if (remaining === 1) {
    return mode === "investigation"
      ? "One more log will confirm the pattern."
      : mode === "priority_watchlist"
        ? "One more watchlist game unlocks the read."
        : "One more game unlocks the read.";
  }

  if (status === "actionable_signal") {
    return mode === "investigation"
      ? "This pattern is strong enough to review."
      : mode === "priority_watchlist"
        ? "This is strong enough to review before changing the list."
        : "Focused sample is ready for review.";
  }

  if (status === "needs_more_focused_games") {
    return mode === "priority_watchlist"
      ? "When this matchup appears, capture it."
      : mode === "investigation"
        ? "Keep logging and tagging consistently."
        : "Focus games matter most now.";
  }

  if (status === "building_signal") {
    return mode === "investigation"
      ? `${remaining} more log${remaining === 1 ? "" : "s"} will tell us whether this is a real pattern.`
      : mode === "priority_watchlist"
        ? `${remaining} more watchlist game${remaining === 1 ? "" : "s"} until the read is ready.`
        : "Building signal.";
  }

  return mode === "investigation"
    ? "Keep logging to build the pattern."
    : mode === "priority_watchlist"
      ? "Counts toward your current watchlist."
      : "Counts toward your focused test.";
}

function getMissionNextAction(
  missionType: MissionType,
  mode: MissionGuidanceMode,
  status: MissionStatus,
  completed: number,
  goal: number,
  contextCount: number,
  contextGoal: number,
  archetype: string,
  focusTag: string | null,
  turnContext: "going first" | "going second" | null
) {
  const remaining = Math.max(goal - completed, 0);
  const focusRemaining = Math.max(contextGoal - contextCount, 0);
  const issueLabel = focusTag ? formatIssueLabel(focusTag) : null;
  const turnContextDetail = turnContext ? ` ${turnContext}` : "";

  if (status === "actionable_signal") {
    return {
      title:
        missionType === "deck-version"
          ? "Compare deck versions"
          : missionType === "loss-pattern"
            ? "Review loss pattern"
            : missionType === "turn-order"
              ? "Review turn-order split"
              : "Review matchup",
      detail:
        missionType === "deck-version"
          ? "You have enough version data to compare before changing your list."
          : mode === "priority_watchlist"
            ? issueLabel
              ? `${archetype} is ready for review. Start with ${issueLabel}${turnContextDetail}.`
              : `${archetype} is ready for review before you change your list.`
            : "You have enough focused evidence to review before changing your list.",
      ctaLabel:
        missionType === "deck-version" ? "Compare versions" : "Open review",
    };
  }

  if (status === "needs_more_focused_games") {
    return {
      title:
        mode === "priority_watchlist"
          ? "Log next game"
          : `Log ${focusRemaining} more focus game${
              focusRemaining === 1 ? "" : "s"
            }`,
      detail:
        mode === "priority_watchlist"
          ? issueLabel
            ? `Keep logging normally. When ${archetype} appears, tag ${issueLabel}${turnContextDetail}.`
            : `Keep logging normally. When ${archetype} appears, capture the watchlist sample.`
          : "Keep the matchup or focus area consistent so the signal becomes trustworthy.",
      ctaLabel:
        mode === "priority_watchlist"
          ? "Log next game"
          : "Keep logging",
    };
  }

  return {
    title:
      mode === "priority_watchlist"
        ? "Log next game"
        : remaining === goal
          ? "Log next game"
          : `Log ${remaining} more games`,
    detail:
      mode === "priority_watchlist"
        ? issueLabel
          ? `Keep logging normally. When ${archetype} appears, tag ${issueLabel}${turnContextDetail}.`
          : `Keep logging normally. When ${archetype} appears, add it to the watchlist sample.`
        : "Keep adding structured games so the pattern becomes clearer.",
    ctaLabel:
      mode === "priority_watchlist"
        ? "Log next game"
      : completed === 0
        ? "Log next game"
          : "Keep logging",
  };
}

function sortMatchesByPlayedAt(matches: CoachMatch[]) {
  return [...matches].sort((first, second) =>
    second.played_at.localeCompare(first.played_at)
  );
}

function getDeckVersionMeta(
  match: CoachMatch
): { id: string | null; name: string | null; deckId: string | null } {
  const rawVersion = Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;

  return {
    id: rawVersion?.id ?? match.deck_version_id ?? null,
    name: rawVersion?.name?.trim() || null,
    deckId: rawVersion?.deck_id ?? null,
  };
}

function getTurnContextForMatches(matches: CoachMatch[]) {
  const firstMatches = matches.filter((match) => match.went_first === true);
  const secondMatches = matches.filter((match) => match.went_first === false);
  const firstLosses = firstMatches.filter((match) => match.result === "loss").length;
  const secondLosses = secondMatches.filter((match) => match.result === "loss").length;
  const firstLossRate = firstMatches.length ? firstLosses / firstMatches.length : 0;
  const secondLossRate = secondMatches.length ? secondLosses / secondMatches.length : 0;
  const delta = secondLossRate - firstLossRate;

  if (
    secondMatches.length >= 5 &&
    firstMatches.length >= 5 &&
    secondLosses >= 4 &&
    secondLossRate >= 0.65 &&
    delta >= 0.3
  ) {
    return "going second" as const;
  }

  if (
    firstMatches.length >= 5 &&
    secondMatches.length >= 5 &&
    firstLosses >= 4 &&
    firstLossRate >= 0.65 &&
    delta <= -0.3
  ) {
    return "going first" as const;
  }

  return null;
}

function getMissionCandidateValue(first: MissionCandidate, second: MissionCandidate) {
  if (first.priority !== second.priority) {
    return first.priority - second.priority;
  }

  if (first.score !== second.score) {
    return second.score - first.score;
  }

  return second.focusMatches.length - first.focusMatches.length;
}

function isHighConfidenceMatchupLeak({
  total,
  wins,
  losses,
  repeatedTagCount,
  repeatedTagRate,
  hasTurnContext,
}: {
  total: number;
  wins: number;
  losses: number;
  repeatedTagCount: number;
  repeatedTagRate: number;
  hasTurnContext: boolean;
}) {
  const lossRate = total ? losses / total : 0;
  const winRate = total ? wins / total : 0;
  const strongSample = total >= 12;
  const poorRecord = lossRate >= 0.55 || winRate <= 0.35;
  const strongTagSupport =
    repeatedTagCount >= 4 && (repeatedTagRate >= 0.3 || repeatedTagCount >= 6);

  return (
    strongSample &&
    poorRecord &&
    (strongTagSupport || total >= 20 || hasTurnContext)
  );
}

function getCompletionStatus(
  completed: number,
  goal: number,
  duringMatches: CoachMatch[],
  previousMatches: CoachMatch[]
) {
  if (completed < goal) {
    return {
      completionStatus: null,
      completionSummary: null,
      improvementDelta: null,
      previousRecord: previousMatches.length
        ? formatComparisonRecord(previousMatches)
        : null,
    };
  }

  const duringRate = getWinRate(duringMatches) ?? 0;
  const previousRate = getWinRate(previousMatches);
  const improvementDelta =
    previousRate === null ? null : duringRate - previousRate;

  if (improvementDelta === null) {
    return {
      completionStatus: "Mission complete",
      completionSummary: `During test: ${formatComparisonRecord(duringMatches)}. No prior block to compare yet.`,
      improvementDelta,
      previousRecord: null,
    };
  }

  if (improvementDelta > 0) {
    return {
      completionStatus: "Improvement detected",
      completionSummary: `Before: ${formatComparisonRecord(previousMatches)}. During: ${formatComparisonRecord(duringMatches)}.`,
      improvementDelta,
      previousRecord: formatComparisonRecord(previousMatches),
    };
  }

  if (improvementDelta === 0) {
    return {
      completionStatus: "Pattern confirmed",
      completionSummary: `Before: ${formatComparisonRecord(previousMatches)}. During: ${formatComparisonRecord(duringMatches)}.`,
      improvementDelta,
      previousRecord: formatComparisonRecord(previousMatches),
    };
  }

  return {
    completionStatus: "Pattern rejected",
    completionSummary: `Before: ${formatComparisonRecord(previousMatches)}. During: ${formatComparisonRecord(duringMatches)}.`,
    improvementDelta,
    previousRecord: formatComparisonRecord(previousMatches),
  };
}

function getMostCommonValue(values: string[]) {
  return Array.from(
    values
      .reduce((counts, value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
        return counts;
      }, new Map<string, number>())
      .entries()
  ).sort((first, second) => second[1] - first[1])[0]?.[0];
}

function getMostCommonTag(values: string[]) {
  const [tag, count] = Array.from(
    values
      .reduce((counts, value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
        return counts;
      }, new Map<string, number>())
      .entries()
  ).sort((first, second) => second[1] - first[1])[0] ?? [null, 0];

  return tag ? { count, tag } : null;
}

function toMissionResults(matches: CoachMatch[]) {
  return matches.slice(0, 10).map((match) => ({
    id: match.id,
    opponent: match.opponent_archetype,
    playedAt: match.played_at,
    result: match.result,
  }));
}

function formatIssueLabel(tag: string) {
  const normalized = tag.toLowerCase();

  if (normalized.includes("prize")) {
    return "prize plan";
  }

  return tag;
}

function capitalizeLabel(value: string) {
  if (!value) {
    return value;
  }

  return value[0].toUpperCase() + value.slice(1);
}

function getLossPatternTrend(matches: CoachMatch[]) {
  const sortedMatches = [...matches].sort((first, second) =>
    second.played_at.localeCompare(first.played_at)
  );
  const recentLossTags = sortedMatches
    .slice(0, 10)
    .filter((match) => match.result === "loss")
    .flatMap(getTags);
  const previousLossTags = sortedMatches
    .slice(10, 20)
    .filter((match) => match.result === "loss")
    .flatMap(getTags);
  const recentMainTag = getMostCommonValue(recentLossTags);

  if (!recentMainTag || recentLossTags.length < 2) {
    return null;
  }

  const recentCount = recentLossTags.filter((tag) => tag === recentMainTag).length;
  const previousCount = previousLossTags.filter((tag) => tag === recentMainTag).length;
  const label = capitalizeLabel(formatIssueLabel(recentMainTag));

  if (previousLossTags.length >= 2 && recentCount < previousCount) {
    return `${label} is appearing less often in recent losses.`;
  }

  if (recentCount >= 2) {
    return `${label} is still common in recent losses.`;
  }

  return null;
}

function buildDeckLeakMissionCandidate(
  matches: CoachMatch[]
): MissionCandidate | null {
  const qualityFields = [
    "start_quality",
    "opening_hand_quality",
    "sequencing_quality",
  ] as const;

  const fieldLabels: Record<string, string> = {
    start_quality: "start",
    opening_hand_quality: "opening hand",
    sequencing_quality: "sequencing",
  };

  const fieldTitles: Record<string, string> = {
    start_quality: "Poor starts are costing this deck games.",
    opening_hand_quality: "Opening hand quality is hurting your results.",
    sequencing_quality: "Sequencing issues are costing you games.",
  };

  const fieldRewards: Record<string, string> = {
    start_quality: "Unlock deck start review",
    opening_hand_quality: "Unlock opening hand review",
    sequencing_quality: "Unlock sequencing review",
  };

  const strongest = qualityFields
    .map((field) => {
      const known = matches.filter((m) => Boolean(getMetadataQuality(m, field)));
      const low = known.filter((m) =>
        LOW_QUALITY_VALUES.has(getMetadataQuality(m, field) ?? "")
      );
      const lowLosses = low.filter((m) => m.result === "loss").length;
      const lowRate = low.length ? lowLosses / low.length : 0;
      const high = known.filter(
        (m) => !LOW_QUALITY_VALUES.has(getMetadataQuality(m, field) ?? "")
      );
      const highLosses = high.filter((m) => m.result === "loss").length;
      const highRate = high.length ? highLosses / high.length : 0;
      return { field, known, low, lowLosses, lowRate, high, highLosses, highRate, delta: lowRate - highRate };
    })
    .filter(
      (c) =>
        c.low.length >= 3 &&
        c.lowLosses >= 2 &&
        (c.delta >= 0.15 || c.lowRate >= 0.6)
    )
    .sort((a, b) => b.delta - a.delta)[0];

  if (!strongest) return null;

  const fieldLabel = fieldLabels[strongest.field] ?? strongest.field;
  const lossPct = Math.round(strongest.lowRate * 100);
  const eventType =
    getMostCommonValue(
      matches
        .map((m) => m.event_type)
        .filter((v): v is string => Boolean(v))
    ) ?? "testing";

  const comparisonLine =
    strongest.high.length >= 2
      ? ` Only ${strongest.highLosses} of ${strongest.high.length} games with Good or Great ${fieldLabel} were losses.`
      : "";

  return {
    priority: 3 as const,
    score: strongest.lowLosses * 4 + strongest.delta * 20 + strongest.low.length,
    archetype: "Your deck",
    missionType: "deck-leak" as const,
    missionTitle: fieldTitles[strongest.field] ?? `Poor ${fieldLabel} quality detected.`,
    missionReason: `You lose ${lossPct}% of games when ${fieldLabel} is Bad or Okay.`,
    whyThisMatters: `${strongest.lowLosses} of ${strongest.low.length} games with Bad or Okay ${fieldLabel} were losses.${comparisonLine}`,
    rewardLabel: fieldRewards[strongest.field] ?? "Unlock deck leak review",
    missionContextLabel: "Quality-rated games",
    missionContextTargetCount: 5,
    missionProgressGoal: 5,
    missionContextSeenCount: strongest.known.length,
    focus: `Log more games and keep rating ${fieldLabel} quality honestly.`,
    condition: `${lossPct}% loss rate with Bad/Okay ${fieldLabel}`,
    context: `Your ${fieldLabel} quality is the clearest deck-side pattern right now.`,
    exactTest: `Log 3 more games with quality ratings before changing tech cards.`,
    nextTest: `Check whether fixing ${fieldLabel} issues reduces your loss rate.`,
    reasoning: `${strongest.lowLosses} of ${strongest.low.length} Bad/Okay ${fieldLabel} games were losses.`,
    criteria: `Counts games with ${fieldLabel} quality rated.`,
    matches,
    focusMatches: strongest.known,
    focusOpponent: null,
    focusTurnContext: null,
    focusTag: null,
    focusDeckVersionIds: [],
    commonIssue: null,
    continueHref: "/review",
    eventType,
  };
}

function buildMatchupMissionCandidates(
  matches: CoachMatch[]
): MissionCandidate[] {
  const matchupGroups = Array.from(
    matches
      .reduce((groups, match) => {
        const key = match.opponent_archetype.trim();

        if (!key) {
          return groups;
        }

        const current = groups.get(key) ?? [];
        current.push(match);
        groups.set(key, current);
        return groups;
      }, new Map<string, CoachMatch[]>())
      .entries()
  );

  return matchupGroups.flatMap(([archetype, groupedMatches]) => {
      const total = groupedMatches.length;
      const { wins, losses, ties } = countMatchResults(groupedMatches);
      const winRate = total ? wins / total : 0;

      if (total < 5 || losses < 3 || winRate > 0.45) {
        return [];
      }

      const repeatedTag = getMostCommonTag(
        groupedMatches.filter((match) => match.result === "loss").flatMap(getTags)
      );
      const repeatedTagRate =
        repeatedTag && losses ? repeatedTag.count / losses : 0;
      const turnContext = getTurnContextForMatches(groupedMatches);
      const highConfidenceLeak = isHighConfidenceMatchupLeak({
        total,
        wins,
        losses,
        repeatedTagCount: repeatedTag?.count ?? 0,
        repeatedTagRate,
        hasTurnContext: Boolean(turnContext),
      });
      const focusMatches = groupedMatches;
      const versionNames = groupedMatches
        .map((match) => getDeckVersionMeta(match).name)
        .filter((value): value is string => Boolean(value));
      const versionFocus = getMostCommonValue(versionNames);
      const versionFocusCount = versionFocus
        ? versionNames.filter((value) => value === versionFocus).length
        : 0;
      const eventType =
        getMostCommonValue(
          groupedMatches
            .map((match) => match.event_type)
            .filter((value): value is string => Boolean(value))
        ) ?? "testing";
      const missionTitle = `${archetype} is your priority watchlist.`;
      const commonIssueLabel = repeatedTag
        ? formatIssueLabel(repeatedTag.tag)
        : null;
      const score =
        total * 1.5 +
        losses * 2 +
        (1 - winRate) * 28 +
        (repeatedTag?.count ?? 0) * 2.5 +
        repeatedTagRate * 10 +
        (turnContext ? 6 : 0) +
        (highConfidenceLeak ? 12 : 0) +
        (versionFocus && versionFocusCount >= Math.ceil(total * 0.6) ? 4 : 0);
      const whyRecord = formatMatchRecord(wins, losses, ties);
      const whyIssue = repeatedTag
        ? ` ${capitalizeLabel(commonIssueLabel ?? repeatedTag.tag)} shows up in ${repeatedTag.count} of those losses.`
        : "";
      const whyTurn = turnContext ? ` Leak is worse ${turnContext}.` : "";

      return [{
        priority: highConfidenceLeak ? (1 as const) : (4 as const),
        score,
        archetype,
        missionType: "matchup" as const,
        missionTitle,
        missionReason: repeatedTag
          ? `${capitalizeLabel(commonIssueLabel ?? repeatedTag.tag)} keeps showing up in losses into ${archetype}.`
          : `${archetype} is the clearest underperforming matchup right now.`,
      whyThisMatters: `Across all decks, you are ${whyRecord} vs ${archetype}.${whyIssue}${whyTurn}`,
        rewardLabel: "Unlock matchup read",
        missionContextLabel: "Watchlist games",
        missionContextTargetCount: 5,
        missionProgressGoal: 5,
        missionContextSeenCount: focusMatches.length,
        focus: repeatedTag
          ? `Keep logging normally. When ${archetype} appears, tag ${commonIssueLabel ?? repeatedTag.tag}${turnContext ? ` ${turnContext}` : ""}.`
          : turnContext
            ? `When ${archetype} appears ${turnContext}, review your opening plan.`
            : `Keep logging normally. When ${archetype} appears, capture the watchlist sample.`,
        condition: turnContext
          ? `Leak is worse ${turnContext}`
          : `Record: ${formatMatchRecord(wins, losses, ties)}`,
        context: turnContext
          ? `${archetype} is costing more games when ${turnContext}.`
          : `${archetype} has the weakest sustained record in the current sample.`,
        exactTest: turnContext
          ? `Keep logging normally. When ${archetype} appears ${turnContext}, capture the watchlist sample.`
          : `Keep logging normally. When ${archetype} appears, tag what breaks first.`,
        nextTest: turnContext
          ? `When ${archetype} appears ${turnContext}, watch for the same issue tags.`
          : `When ${archetype} appears, see whether the same leak repeats.`,
        reasoning: repeatedTag
          ? `${formatMatchRecord(wins, losses, ties)} into ${archetype}. ${capitalizeLabel(
              commonIssueLabel ?? repeatedTag.tag
            )} appears ${repeatedTag.count} time${repeatedTag.count === 1 ? "" : "s"} in losses.`
          : `${formatMatchRecord(wins, losses, ties)} into ${archetype}.`,
        criteria: turnContext
          ? `Counts ${archetype} games when ${turnContext}.`
          : `Counts watchlist games into ${archetype}.`,
        matches: groupedMatches,
        focusMatches,
        focusOpponent: archetype,
        focusTurnContext: turnContext,
        focusTag: repeatedTag?.tag ?? null,
        focusDeckVersionIds: [],
        commonIssue: repeatedTag,
        continueHref: "/matchups",
        eventType,
      }];
    });
}

function buildLossPatternMissionCandidate(
  matches: CoachMatch[]
): MissionCandidate | null {
  const losses = matches.filter((match) => match.result === "loss");

  if (losses.length < 5) {
    return null;
  }

  const repeatedTag = getMostCommonTag(losses.flatMap(getTags));

  if (!repeatedTag || repeatedTag.count < 2) {
    return null;
  }

  const focusMatches = losses.filter((match) => getTags(match).includes(repeatedTag.tag));
  const affectedMatchups = new Set(
    focusMatches.map((match) => match.opponent_archetype.trim()).filter(Boolean)
  );
  const issueLabel = formatIssueLabel(repeatedTag.tag);
  const lossPct = losses.length
    ? Math.round((repeatedTag.count / losses.length) * 100)
    : 0;
  const eventType =
    getMostCommonValue(
      focusMatches
        .map((match) => match.event_type)
        .filter((value): value is string => Boolean(value))
    ) ?? "testing";
  const isEarlySignal = repeatedTag.count < 4;

  return {
    priority: 2 as const,
    score: repeatedTag.count * 4 + affectedMatchups.size * 3 + focusMatches.length,
    archetype:
      getMostCommonValue(
        focusMatches.map((match) => match.opponent_archetype).filter(Boolean)
      ) ?? "Current field",
    missionType: "loss-pattern",
    missionTitle: `"${repeatedTag.tag}" is showing up in your losses.`,
    missionReason: `${capitalizeLabel(issueLabel)} appears in ${repeatedTag.count} of ${losses.length} losses.`,
    whyThisMatters: `You tagged "${repeatedTag.tag}" in ${repeatedTag.count} of ${losses.length} losses (${lossPct}%).${isEarlySignal ? " Early signal." : " Consistent pattern."}`,
    rewardLabel: `Unlock ${issueLabel} breakdown`,
    missionContextLabel: "Tagged losses",
    missionContextTargetCount: 3,
    missionProgressGoal: 5,
    missionContextSeenCount: focusMatches.length,
    focus: `Keep tagging "${repeatedTag.tag}" consistently and add one short note about what caused it.`,
    condition: `Pattern: ${repeatedTag.tag}`,
    context: "This issue is repeating across losses, not just one matchup.",
    exactTest: `In the next 5 games where "${issueLabel}" happens, log whether the cause was setup, sequencing, matchup pressure, or a deck issue.`,
    nextTest: `Keep logging and check whether "${issueLabel}" still dominates after the next 5 tagged losses.`,
    reasoning: `${capitalizeLabel(issueLabel)} appears in ${repeatedTag.count} of ${losses.length} recent losses.`,
    criteria: `Counts losses tagged with "${issueLabel}".`,
    matches,
    focusMatches,
    focusOpponent: null,
    focusTurnContext: null,
    focusTag: repeatedTag.tag,
    focusDeckVersionIds: [],
    commonIssue: repeatedTag,
    continueHref: "/review",
    eventType,
  };
}

function buildTurnOrderMissionCandidate(
  matches: CoachMatch[]
): MissionCandidate | null {
  const firstMatches = matches.filter((match) => match.went_first === true);
  const secondMatches = matches.filter((match) => match.went_first === false);

  if (firstMatches.length < 4 || secondMatches.length < 4) {
    return null;
  }

  const firstRate = getWinRate(firstMatches) ?? 0;
  const secondRate = getWinRate(secondMatches) ?? 0;
  const delta = Math.abs(firstRate - secondRate);

  if (delta < 20) {
    return null;
  }

  const weakerSide = secondRate < firstRate ? "going second" : "going first";
  const focusMatches =
    weakerSide === "going second" ? secondMatches : firstMatches;
  const repeatedTag = getMostCommonTag(
    focusMatches.filter((match) => match.result === "loss").flatMap(getTags)
  );
  const issueLabel = repeatedTag ? formatIssueLabel(repeatedTag.tag) : null;
  const eventType =
    getMostCommonValue(
      focusMatches
        .map((match) => match.event_type)
        .filter((value): value is string => Boolean(value))
    ) ?? "testing";

  return {
    priority: 4 as const,
    score: delta + focusMatches.length + (repeatedTag?.count ?? 0) * 2,
    archetype: getMostCommonValue(
      focusMatches.map((match) => match.opponent_archetype).filter(Boolean)
    ) ?? "Current field",
    missionType: "turn-order",
    missionTitle:
      weakerSide === "going second"
        ? "Going second is hurting your results."
        : "Going first is hurting your results.",
    missionReason:
      weakerSide === "going second"
        ? `Second-turn games trail first-turn games by ${delta} percentage points.`
        : `First-turn games trail second-turn games by ${delta} percentage points.`,
    whyThisMatters: `Going first: ${formatComparisonRecord(firstMatches)}. Going second: ${formatComparisonRecord(secondMatches)}. A ${delta}-point gap is significant.`,
    rewardLabel: "Unlock turn-order read",
    missionContextLabel: "Turn-order games",
    missionContextTargetCount: 5,
    missionProgressGoal: 5,
    missionContextSeenCount: focusMatches.length,
    focus: repeatedTag
      ? `Watch "${issueLabel ?? repeatedTag.tag}" in ${weakerSide} games.`
      : `Keep logging and note turn order so the split stays reviewable.`,
    condition: `Split: ${weakerSide}`,
    context: `Turn order is changing results more than matchup reads right now.`,
    exactTest: `Log more games and track turn order — do not skip "Can't remember" entries.`,
    nextTest: `Keep logging with turn order tracked before changing your list.`,
    reasoning: `Going first: ${formatComparisonRecord(firstMatches)}. Going second: ${formatComparisonRecord(secondMatches)}.`,
    criteria: `Counts games played ${weakerSide}.`,
    matches,
    focusMatches,
    focusOpponent: null,
    focusTurnContext: weakerSide,
    focusTag: repeatedTag?.tag ?? null,
    focusDeckVersionIds: [],
    commonIssue: repeatedTag,
    continueHref: "/review",
    eventType,
  };
}

function buildDeckVersionMissionCandidate(
  matches: CoachMatch[]
): MissionCandidate | null {
  const versionGroups = Array.from(
    matches.reduce((groups, match) => {
      const version = getDeckVersionMeta(match);
      const key = version.id ?? version.name;

      if (!key) {
        return groups;
      }

      const current = groups.get(key) ?? {
        id: version.id,
        name: version.name ?? "Unnamed version",
        matches: [] as CoachMatch[],
      };
      current.matches.push(match);
      groups.set(key, current);
      return groups;
    }, new Map<string, { id: string | null; name: string; matches: CoachMatch[] }>())
    .values()
  )
    .filter((group) => group.matches.length >= 4)
    .map((group) => ({
      ...group,
      winRate: getWinRate(group.matches) ?? 0,
    }))
    .sort((first, second) => second.winRate - first.winRate);

  if (versionGroups.length < 2) {
    return null;
  }

  const bestVersion = versionGroups[0];
  const weakestVersion = versionGroups[versionGroups.length - 1];

  if (!bestVersion || !weakestVersion || bestVersion.name === weakestVersion.name) {
    return null;
  }

  const delta = bestVersion.winRate - weakestVersion.winRate;

  if (delta < 15) {
    return null;
  }

  const focusMatches = sortMatchesByPlayedAt([
    ...bestVersion.matches,
    ...weakestVersion.matches,
  ]);
  const eventType =
    getMostCommonValue(
      focusMatches
        .map((match) => match.event_type)
        .filter((value): value is string => Boolean(value))
    ) ?? "testing";

  return {
    priority: 5 as const,
    score: delta + focusMatches.length,
    archetype: "Deck versions",
    missionType: "deck-version",
    missionTitle: `Test whether ${bestVersion.name} is actually stronger.`,
    missionReason: `${bestVersion.name} leads ${weakestVersion.name} by ${delta} win-rate points.`,
    whyThisMatters: `${bestVersion.name}: ${formatComparisonRecord(bestVersion.matches)}. ${weakestVersion.name}: ${formatComparisonRecord(weakestVersion.matches)}. A ${delta}-point gap is worth testing.`,
    rewardLabel: "Unlock version comparison",
    missionContextLabel: "Version games",
    missionContextTargetCount: 2,
    missionProgressGoal: 6,
    missionContextSeenCount: 2,
    focus: "Keep logging with the same version so the comparison stays clean.",
    condition: `Version gap: ${delta} points`,
    context: "You have enough version data to start comparing builds before committing.",
    exactTest: `Log more games with ${bestVersion.name} and compare starts, sequencing, and matchup spread.`,
    nextTest: `After the next 5 to 10 version games, decide whether ${bestVersion.name} is really stronger or whether the sample is still too mixed.`,
    reasoning: `${weakestVersion.name}: ${formatComparisonRecord(
      weakestVersion.matches
    )}. ${bestVersion.name}: ${formatComparisonRecord(bestVersion.matches)}.`,
    criteria: "Counts games from the two clearest version samples.",
    matches,
    focusMatches,
    focusOpponent: null,
    focusTurnContext: null,
    focusTag: null,
    focusDeckVersionIds: [bestVersion.id, weakestVersion.id].filter(
      (value): value is string => Boolean(value)
    ),
    commonIssue: null,
    continueHref: "/decks",
    eventType,
  };
}

function buildBaselineMissionCandidate(
  matches: CoachMatch[]
): MissionCandidate {
  const fallbackArchetype =
    getMostCommonValue(
      matches.map((match) => match.opponent_archetype.trim()).filter(Boolean)
    ) ?? "current field";
  const focusMatches = matches.filter(
    (match) => match.opponent_archetype.trim() === fallbackArchetype
  );
  const eventType =
    getMostCommonValue(
      matches
        .map((match) => match.event_type)
        .filter((value): value is string => Boolean(value))
    ) ?? "testing";

  const totalGames = matches.length;
  const gamesNeeded = Math.max(5 - totalGames, 0);

  return {
    priority: 6 as const,
    score: focusMatches.length,
    archetype: fallbackArchetype,
    missionType: "baseline",
    missionTitle:
      totalGames < 5
        ? `Log ${gamesNeeded} more game${gamesNeeded === 1 ? "" : "s"} to unlock your first read.`
        : "Build a focused sample.",
    missionReason: "No strong pattern has enough evidence yet. Keep logging consistently.",
    whyThisMatters:
      totalGames < 5
        ? `You have ${totalGames} logged game${totalGames === 1 ? "" : "s"}. The coach needs at least 5 before patterns become reliable.`
        : "No single pattern stands out yet. A clean block of games will surface the first real read.",
    rewardLabel: "Unlock first coach read",
    missionContextLabel: "Logged games",
    missionContextTargetCount: 5,
    missionProgressGoal: 5,
    missionContextSeenCount: Math.min(totalGames, 5),
    focus: `Keep logging with the same deck and rate quality honestly every game.`,
    condition: "Building baseline sample",
    context: "A few more structured games will unlock the first real coaching read.",
    exactTest: `Log 5 games total with quality ratings and tags to unlock the coaching loop.`,
    nextTest: `After the next 5 games, check Review to see if any pattern emerged.`,
    reasoning: `${totalGames} logged game${totalGames === 1 ? "" : "s"} so far.`,
    criteria: "Counts total logged games.",
    matches,
    focusMatches,
    focusOpponent: fallbackArchetype,
    focusTurnContext: null,
    focusTag: null,
    focusDeckVersionIds: [],
    commonIssue: null,
    continueHref: `/matches/new`,
    eventType,
  };
}

function buildPositivePatternMissionCandidate(
  matches: CoachMatch[]
): MissionCandidate | null {
  const wins = matches.filter((m) => m.result === "win");

  if (wins.length < 3) return null;

  // Check metadata positive_tags first (most specific)
  const metaPositiveCounts = new Map<string, number>();
  for (const m of wins) {
    for (const tag of getMetadataPositiveTags(m)) {
      metaPositiveCounts.set(tag, (metaPositiveCounts.get(tag) ?? 0) + 1);
    }
  }

  // Also check match_tags that appear in wins
  const tagPositiveCounts = new Map<string, number>();
  for (const m of wins) {
    for (const tag of getTags(m)) {
      tagPositiveCounts.set(tag, (tagPositiveCounts.get(tag) ?? 0) + 1);
    }
  }

  const topMeta = Array.from(metaPositiveCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  const topTag = Array.from(tagPositiveCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  const [tag, count] = topMeta && topMeta[1] >= 2
    ? topMeta
    : topTag && topTag[1] >= 2
      ? topTag
      : [null, 0];

  if (!tag || count < 2) return null;

  const winPct = Math.round((count / wins.length) * 100);
  const eventType =
    getMostCommonValue(
      wins.map((m) => m.event_type).filter((v): v is string => Boolean(v))
    ) ?? "testing";

  return {
    priority: 5 as const,
    score: count * 3 + wins.length,
    archetype: "Your deck",
    missionType: "positive-pattern" as const,
    missionTitle: `"${tag}" is linked to some of your wins.`,
    missionReason: `"${tag}" appears in ${count} of ${wins.length} wins (${winPct}%).`,
    whyThisMatters: `You tagged "${tag}" in ${count} of ${wins.length} wins. That makes it worth tracking, but not strong enough to treat as proof by itself.`,
    rewardLabel: "Unlock keep/cut signal",
    missionContextLabel: "Tagged wins",
    missionContextTargetCount: 3,
    missionProgressGoal: 3,
    missionContextSeenCount: count,
    focus: `Keep tagging "${tag}" and add one short note about what made it happen.`,
    condition: `Positive signal: ${tag}`,
    context: "This pattern is showing up in wins, but the next step is to compare it against losses before making a list call.",
    exactTest: `For the next 5 games, keep tagging "${tag}" and note what made it happen: prize map, setup turn, tech card, or opponent mistake.`,
    nextTest: `After the next 5 games, check whether "${tag}" still shows up more often in wins than losses.`,
    reasoning: `"${tag}" appears in ${count} of ${wins.length} wins.`,
    criteria: `Counts wins tagged with "${tag}".`,
    matches,
    focusMatches: wins.filter((m) =>
      getMetadataPositiveTags(m).includes(tag) || getTags(m).includes(tag)
    ),
    focusOpponent: null,
    focusTurnContext: null,
    focusTag: tag,
    focusDeckVersionIds: [],
    commonIssue: null,
    continueHref: "/review",
    eventType,
  };
}

function buildMissionInsightFromCandidate(
  candidate: MissionCandidate
): SessionCoachInsight {
  const missionGuidanceMode = getMissionGuidanceMode(candidate.missionType);
  const missionGuidanceLabel = getMissionGuidanceLabel(missionGuidanceMode);
  const sortedMissionMatches = sortMatchesByPlayedAt(
    candidate.focusMatches.length ? candidate.focusMatches : candidate.matches
  );
  const completed = Math.min(
    sortedMissionMatches.length,
    candidate.missionProgressGoal
  );
  const contextSeen = Math.min(
    candidate.missionContextSeenCount,
    candidate.missionContextTargetCount
  );
  const duringMatches = sortedMissionMatches.slice(0, candidate.missionProgressGoal);
  const previousMatches = sortedMissionMatches.slice(
    candidate.missionProgressGoal,
    candidate.missionProgressGoal * 2
  );
  const completion = getCompletionStatus(
    completed,
    candidate.missionProgressGoal,
    duringMatches,
    previousMatches
  );
  const missionStatus = getMissionStatus(
    completed,
    candidate.missionProgressGoal,
    contextSeen,
    candidate.missionContextTargetCount
  );
  const missionStatusLabel = getMissionStatusLabel(
    missionStatus,
    missionGuidanceMode
  );
  const missionStatusReason = getMissionStatusReason(
    missionStatus,
    missionGuidanceMode,
    completed,
    candidate.missionProgressGoal,
    contextSeen,
    candidate.missionContextTargetCount,
    candidate.archetype,
    candidate.focusTag,
    candidate.focusTurnContext
  );
  const missionNextAction = getMissionNextAction(
    candidate.missionType,
    missionGuidanceMode,
    missionStatus,
    completed,
    candidate.missionProgressGoal,
    contextSeen,
    candidate.missionContextTargetCount,
    candidate.archetype,
    candidate.focusTag,
    candidate.focusTurnContext
  );
  const evidence =
    missionStatus === "actionable_signal"
      ? `${missionGuidanceMode === "priority_watchlist" ? "Watchlist sample" : "Focused sample"}: ${sortedMissionMatches.length} game${
          sortedMissionMatches.length === 1 ? "" : "s"
        }. You can review this before changing your list.`
      : missionStatus === "needs_more_focused_games"
        ? `${candidate.missionContextLabel}: ${Math.max(
            candidate.missionContextTargetCount - contextSeen,
            0
          )} more ${missionGuidanceMode === "priority_watchlist" ? "watchlist" : "focus"} game${
            candidate.missionContextTargetCount - contextSeen === 1 ? "" : "s"
          } to trust the read.`
        : missionStatus === "building_signal"
          ? `${missionGuidanceMode === "priority_watchlist" ? "Watchlist sample" : "Focused sample"}: ${sortedMissionMatches.length} game${
              sortedMissionMatches.length === 1 ? "" : "s"
            }. Early pattern only.`
          : `${missionGuidanceMode === "priority_watchlist" ? "Watchlist sample" : "Focused sample"}: ${sortedMissionMatches.length} game${
              sortedMissionMatches.length === 1 ? "" : "s"
            }.`;

  // Generate completion lesson from available data
  const completionLesson = completion.completionStatus
    ? (() => {
        const lessonsLeft = Math.max(candidate.missionProgressGoal - completed, 0);
        if (candidate.missionType === "deck-leak") {
          return `${candidate.reasoning} Before changing tech cards, test whether a list change improves this pattern.`;
        }
        if (candidate.missionType === "loss-pattern" && candidate.commonIssue) {
          return `"${candidate.commonIssue.tag}" is your most consistent loss tag. Check Review to see what else it overlaps with.`;
        }
        if (candidate.missionType === "positive-pattern" && candidate.focusTag) {
          return `"${candidate.focusTag}" appears reliably in wins. Do not cut this package before testing a version without it.`;
        }
        if (candidate.missionType === "matchup" && candidate.focusOpponent) {
          return `You now have a ${candidate.missionContextSeenCount}-game watchlist read on ${candidate.focusOpponent}. Open Review to see the full breakdown.`;
        }
        if (candidate.missionType === "deck-version") {
          return `${candidate.reasoning} If the gap persists after more games, commit to the stronger version.`;
        }
        if (lessonsLeft <= 0) {
          return `This read is strong enough to review before changing your list.`;
        }
        return null;
      })()
    : null;

  return {
    archetype: candidate.archetype,
    confidence: missionStatusLabel,
    ctaLabel: missionNextAction.ctaLabel,
    completionStatus: completion.completionStatus,
    completionSummary: completion.completionSummary,
    whyThisMatters: candidate.whyThisMatters,
    rewardLabel: candidate.rewardLabel,
    completionLesson,
    commonIssue: candidate.commonIssue
      ? {
          ...candidate.commonIssue,
          tag: formatIssueLabel(candidate.commonIssue.tag),
        }
      : null,
    criteria: candidate.criteria,
    duringRecord: formatComparisonRecord(duringMatches),
    evidence,
    headline: candidate.missionTitle,
    improvementDelta: completion.improvementDelta,
    issueTrend: getLossPatternTrend(candidate.matches),
    missionState: completion.completionStatus ? "complete" : "active",
    missionType: candidate.missionType,
    missionTypeLabel: getMissionTypeLabel(candidate.missionType),
    missionGuidanceMode,
    missionGuidanceLabel,
    missionStatus,
    missionStatusLabel,
    missionStatusReason,
    missionTitle: candidate.missionTitle,
    missionSkill: candidate.missionTitle,
    missionProgress: completed,
    missionTargetCount: candidate.missionProgressGoal,
    missionContextLabel: candidate.missionContextLabel,
    missionContextSeenCount: contextSeen,
    missionContextTargetCount: candidate.missionContextTargetCount,
    missionFocusOpponent: candidate.focusOpponent,
    missionFocusTurnContext: candidate.focusTurnContext,
    missionFocusTag: candidate.focusTag,
    missionFocusDeckVersionIds: candidate.focusDeckVersionIds,
    missionReason: candidate.missionReason,
    missionConfidence: missionStatusLabel,
    missionNextAction: missionNextAction.title,
    missionResults: toMissionResults(sortedMissionMatches),
    nextAction: missionNextAction.detail,
    previousRecord: completion.previousRecord,
    weakMatchup: candidate.archetype,
    condition: candidate.condition,
    context: candidate.context,
    exactTest: candidate.exactTest,
    nextTest: candidate.nextTest,
    progressCompleted: completed,
    progressGoal: candidate.missionProgressGoal,
    progressFeedback: getProgressFeedback(
      missionStatus,
      missionGuidanceMode,
      completed,
      candidate.missionProgressGoal
    ),
    reasoning: candidate.reasoning,
    focus: candidate.focus,
    record: formatComparisonRecord(candidate.matches),
    eventType: candidate.eventType,
    continueHref:
      missionStatus === "actionable_signal"
        ? candidate.continueHref
        : `/matches/new?event=${encodeURIComponent(candidate.eventType)}`,
  };
}

export function buildTrainingProgressSummary(
  matches: CoachMatch[]
): TrainingProgressSummary {
  const groupedByMatchup = Array.from(
    matches
      .reduce((groups, match) => {
        const current = groups.get(match.opponent_archetype) ?? [];
        current.push(match);
        groups.set(match.opponent_archetype, current);
        return groups;
      }, new Map<string, CoachMatch[]>())
      .values()
  ).map((groupedMatches) =>
    [...groupedMatches].sort((first, second) =>
      second.played_at.localeCompare(first.played_at)
    )
  );
  const completedTestBlocks = groupedByMatchup.reduce(
    (total, groupedMatches) => total + Math.floor(groupedMatches.length / 5),
    0
  );
  const improvedMatchups = groupedByMatchup.filter((groupedMatches) => {
    const recentFive = groupedMatches.slice(0, 5);
    const previousFive = groupedMatches.slice(5, 10);
    const recentRate = getWinRate(recentFive);
    const previousRate = getWinRate(previousFive);

    return recentRate !== null && previousRate !== null && recentRate > previousRate;
  }).length;

  return {
    completedTestBlocks,
    improvedMatchups,
    currentWeakestImproved: improvedMatchups > 0,
    lossPatternTrend: getLossPatternTrend(matches),
  };
}

export function matchCountsTowardMission(
  match: CoachMatch,
  insight: SessionCoachInsight | null
) {
  if (!insight) {
    return false;
  }

  if (insight.missionType === "deck-version") {
    return insight.missionFocusDeckVersionIds.includes(match.deck_version_id ?? "");
  }

  if (insight.missionType === "loss-pattern") {
    return (
      match.result === "loss" &&
      (!!insight.missionFocusTag &&
        getTags(match).includes(insight.missionFocusTag))
    );
  }

  if (insight.missionType === "deck-leak") {
    // Any game with quality metadata contributes to the deck-leak investigation
    const m = match as CoachMatch;
    return Boolean(
      m.metadata?.start_quality ||
      m.metadata?.opening_hand_quality ||
      m.metadata?.sequencing_quality
    );
  }

  if (insight.missionType === "positive-pattern") {
    return (
      match.result === "win" &&
      !!insight.missionFocusTag &&
      getTags(match).includes(insight.missionFocusTag)
    );
  }

  if (insight.missionType === "turn-order") {
    return insight.missionFocusTurnContext === "going second"
      ? match.went_first === false
      : insight.missionFocusTurnContext === "going first"
        ? match.went_first === true
        : true;
  }

  if (insight.missionType === "matchup") {
    const matchesOpponent =
      !insight.missionFocusOpponent ||
      match.opponent_archetype === insight.missionFocusOpponent;
    const matchesTurn =
      !insight.missionFocusTurnContext ||
      (insight.missionFocusTurnContext === "going second"
        ? match.went_first === false
        : match.went_first === true);

    return matchesOpponent && matchesTurn;
  }

  return insight.missionFocusOpponent
    ? match.opponent_archetype === insight.missionFocusOpponent
    : true;
}

export function matchCountsTowardMissionContext(
  match: CoachMatch,
  insight: SessionCoachInsight | null
) {
  if (!insight) {
    return false;
  }

  if (insight.missionFocusOpponent) {
    return match.opponent_archetype === insight.missionFocusOpponent;
  }

  if (insight.missionFocusDeckVersionIds.length > 0) {
    return insight.missionFocusDeckVersionIds.includes(match.deck_version_id ?? "");
  }

  if (insight.missionFocusTag) {
    return getTags(match).includes(insight.missionFocusTag);
  }

  if (insight.missionFocusTurnContext === "going second") {
    return match.went_first === false;
  }

  if (insight.missionFocusTurnContext === "going first") {
    return match.went_first === true;
  }

  return false;
}

export function buildSessionCoachInsight(
  matches: CoachMatch[]
): SessionCoachInsight | null {
  const recentMatches = sortMatchesByPlayedAt(matches);

  if (!recentMatches.length) {
    return null;
  }

  const candidates: MissionCandidate[] = [
    ...buildMatchupMissionCandidates(recentMatches),
  ];

  const deckLeakCandidate = buildDeckLeakMissionCandidate(recentMatches);
  const lossPatternCandidate = buildLossPatternMissionCandidate(recentMatches);
  const turnOrderCandidate = buildTurnOrderMissionCandidate(recentMatches);
  const deckVersionCandidate = buildDeckVersionMissionCandidate(recentMatches);
  const positivePatternCandidate = buildPositivePatternMissionCandidate(recentMatches);

  if (deckLeakCandidate) candidates.push(deckLeakCandidate);
  if (lossPatternCandidate) candidates.push(lossPatternCandidate);
  if (turnOrderCandidate) candidates.push(turnOrderCandidate);
  if (deckVersionCandidate) candidates.push(deckVersionCandidate);
  if (positivePatternCandidate) candidates.push(positivePatternCandidate);

  candidates.push(buildBaselineMissionCandidate(recentMatches));

  const selectedCandidate = [...candidates].sort(getMissionCandidateValue)[0];

  return selectedCandidate
    ? buildMissionInsightFromCandidate(selectedCandidate)
    : null;
}
