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
  | "event-prep";

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
  priority: 1 | 2 | 3 | 4 | 5;
  score: number;
  archetype: string;
  missionType: MissionType;
  missionTitle: string;
  missionReason: string;
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
    matchup: "Matchup mission",
    "loss-pattern": "Loss-pattern mission",
    "turn-order": "Turn-order mission",
    baseline: "Baseline mission",
    "deck-version": "Deck-version mission",
    "event-prep": "Event-prep mission",
  }[missionType];
}

function getMissionStatusLabel(status: MissionStatus) {
  return {
    needs_games: "Needs games",
    building_signal: "Building signal",
    needs_more_focused_games: "Needs more focused games",
    actionable_signal: "Actionable signal",
    mission_complete: "Mission complete",
    pattern_confirmed: "Pattern confirmed",
    pattern_rejected: "Pattern rejected",
    improvement_detected: "Improvement detected",
  }[status];
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
  completed: number,
  goal: number,
  contextCount: number,
  contextGoal: number,
  archetype: string
) {
  const remaining = Math.max(goal - completed, 0);
  const focusRemaining = Math.max(contextGoal - contextCount, 0);

  if (status === "needs_games") {
    return `Log ${remaining} more game${remaining === 1 ? "" : "s"} before this becomes a coaching read.`;
  }

  if (status === "building_signal") {
    return `Early pattern building against ${archetype}. Keep logging before changing your list.`;
  }

  if (status === "needs_more_focused_games") {
    return `The leak is showing, but ${focusRemaining} more focus game${focusRemaining === 1 ? "" : "s"} will make this read easier to trust.`;
  }

  if (status === "actionable_signal") {
    return "You have enough focused evidence to start reviewing the pattern.";
  }

  return `Log ${remaining} more focused game${remaining === 1 ? "" : "s"} before changing plans.`;
}

function getProgressFeedback(
  status: MissionStatus,
  completed: number,
  goal: number
) {
  const remaining = Math.max(goal - completed, 0);

  if (remaining === 1) {
    return "One more game unlocks review.";
  }

  if (status === "actionable_signal") {
    return "Focused sample is ready for review.";
  }

  if (status === "needs_more_focused_games") {
    return "Focus games matter most now.";
  }

  if (status === "building_signal") {
    return "Building signal.";
  }

  return "Counts toward your current mission.";
}

function getMissionNextAction(
  missionType: MissionType,
  status: MissionStatus,
  completed: number,
  goal: number,
  contextCount: number,
  contextGoal: number
) {
  const remaining = Math.max(goal - completed, 0);
  const focusRemaining = Math.max(contextGoal - contextCount, 0);

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
          : "You have enough focused evidence to review before changing your list.",
      ctaLabel:
        missionType === "deck-version" ? "Compare versions" : "Review mission",
    };
  }

  if (status === "needs_more_focused_games") {
    return {
      title: `Log ${focusRemaining} more focus game${focusRemaining === 1 ? "" : "s"}`,
      detail: "Keep the matchup or focus area consistent so the signal becomes trustworthy.",
      ctaLabel: `Continue mission (${completed}/${goal})`,
    };
  }

  return {
    title: remaining === goal ? "Log next game" : `Log ${remaining} more games`,
    detail: "Keep adding structured games so the pattern becomes clearer.",
    ctaLabel:
      completed === 0 ? "Log next game" : `Continue mission (${completed}/${goal})`,
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

function getSkillLabel(tag: string) {
  const normalized = tag.toLowerCase();

  if (normalized.includes("prize")) {
    return "Improve your prize plan";
  }

  if (normalized.includes("sequenc")) {
    return "Improve sequencing";
  }

  if (normalized.includes("setup")) {
    return "Clean up setup decisions";
  }

  if (normalized.includes("draw")) {
    return "Stabilize early turns";
  }

  if (normalized.includes("misplay")) {
    return "Reduce misplays";
  }

  if (normalized.includes("bad matchup")) {
    return "Reduce bad matchup losses";
  }

  return `Improve ${tag}`;
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
      const titleBase =
        versionFocus && versionFocusCount >= Math.ceil(total * 0.6)
          ? `Review ${versionFocus} into ${archetype}`
          : `Review ${archetype} matchup`;
      const missionTitle = titleBase;
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
        (versionFocus && versionFocusCount >= Math.ceil(total * 0.6) ? 4 : 0);

      return [{
        priority: 1 as const,
        score,
        archetype,
        missionType: "matchup" as const,
        missionTitle,
        missionReason: repeatedTag
          ? `${capitalizeLabel(commonIssueLabel ?? repeatedTag.tag)} keeps showing up in losses into ${archetype}.`
          : `${archetype} is the clearest underperforming matchup right now.`,
        missionContextLabel: "Focus matchup",
        missionContextTargetCount: 5,
        missionProgressGoal: 5,
        missionContextSeenCount: focusMatches.length,
        focus: repeatedTag
          ? `Track ${commonIssueLabel ?? repeatedTag.tag} before changing your list.`
          : turnContext
            ? `Keep the turn order fixed and review your opening plan ${turnContext}.`
            : "Keep the matchup constant so the loss pattern stays reviewable.",
        condition: turnContext
          ? `Leak is worse ${turnContext}`
          : `Record: ${formatMatchRecord(wins, losses, ties)}`,
        context: turnContext
          ? `${archetype} is costing more games when ${turnContext}.`
          : `${archetype} has the weakest sustained record in the current sample.`,
        exactTest: turnContext
          ? `Play 5 more focused games into ${archetype} ${turnContext}.`
          : `Play 5 more focused games into ${archetype}.`,
        nextTest: turnContext
          ? `Keep logging ${archetype} ${turnContext} and watch the same issue tags.`
          : `Keep logging ${archetype} and see whether the same leak repeats.`,
        reasoning: repeatedTag
          ? `${formatMatchRecord(wins, losses, ties)} into ${archetype}. ${capitalizeLabel(
              commonIssueLabel ?? repeatedTag.tag
            )} appears ${repeatedTag.count} time${repeatedTag.count === 1 ? "" : "s"} in losses.`
          : `${formatMatchRecord(wins, losses, ties)} into ${archetype}.`,
        criteria: turnContext
          ? `Counts ${archetype} games when ${turnContext}.`
          : `Counts focused games into ${archetype}.`,
        matches: groupedMatches,
        focusMatches,
        focusOpponent: archetype,
        focusTurnContext: null,
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

  if (!repeatedTag || repeatedTag.count < 4) {
    return null;
  }

  const focusMatches = losses.filter((match) => getTags(match).includes(repeatedTag.tag));
  const affectedMatchups = new Set(
    focusMatches.map((match) => match.opponent_archetype.trim()).filter(Boolean)
  );
  const issueLabel = formatIssueLabel(repeatedTag.tag);
  const eventType =
    getMostCommonValue(
      focusMatches
        .map((match) => match.event_type)
        .filter((value): value is string => Boolean(value))
    ) ?? "testing";

  return {
    priority: 2,
    score: repeatedTag.count * 4 + affectedMatchups.size * 3 + focusMatches.length,
    archetype:
      getMostCommonValue(
        focusMatches.map((match) => match.opponent_archetype).filter(Boolean)
      ) ?? "Current field",
    missionType: "loss-pattern",
    missionTitle: getSkillLabel(repeatedTag.tag),
    missionReason: `${capitalizeLabel(issueLabel)} appears in ${repeatedTag.count} losses across ${affectedMatchups.size} matchup${
      affectedMatchups.size === 1 ? "" : "s"
    }.`,
    missionContextLabel: "Tagged losses",
    missionContextTargetCount: 4,
    missionProgressGoal: 5,
    missionContextSeenCount: focusMatches.length,
    focus: `Keep tagging ${issueLabel} consistently so the pattern stays reviewable.`,
    condition: `Pattern: ${repeatedTag.tag}`,
    context: "This issue is repeating across different losses, not just one matchup.",
    exactTest: `Log 5 more games and tag ${issueLabel} honestly when it matters.`,
    nextTest: `Run another focused block and check whether ${issueLabel} still repeats.`,
    reasoning: `${capitalizeLabel(issueLabel)} appears in ${repeatedTag.count} recent loss${
      repeatedTag.count === 1 ? "" : "es"
    }.`,
    criteria: `Counts losses tagged with ${issueLabel}.`,
    matches,
    focusMatches,
    focusOpponent: null,
    focusTurnContext: null,
    focusTag: repeatedTag.tag,
    focusDeckVersionIds: [],
    commonIssue: repeatedTag,
    continueHref: "/matches",
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
    priority: 3,
    score: delta + focusMatches.length + (repeatedTag?.count ?? 0) * 2,
    archetype: getMostCommonValue(
      focusMatches.map((match) => match.opponent_archetype).filter(Boolean)
    ) ?? "Current field",
    missionType: "turn-order",
    missionTitle:
      weakerSide === "going second"
        ? "Stabilize going second games"
        : "Stabilize going first games",
    missionReason:
      weakerSide === "going second"
        ? `Second-turn games trail first-turn games by ${delta} percentage points.`
        : `First-turn games trail second-turn games by ${delta} percentage points.`,
    missionContextLabel: "Focused turn-order games",
    missionContextTargetCount: 5,
    missionProgressGoal: 5,
    missionContextSeenCount: focusMatches.length,
    focus: repeatedTag
      ? `Watch ${issueLabel ?? repeatedTag.tag} in ${weakerSide} games.`
      : `Keep logging the same turn order so the split stays reviewable.`,
    condition: `Split: ${weakerSide}`,
    context: `Turn order is changing the result more than most matchup reads right now.`,
    exactTest: `Play 5 more games ${weakerSide}.`,
    nextTest: `Keep logging ${weakerSide} games before changing your list.`,
    reasoning: `Going first: ${formatComparisonRecord(firstMatches)}. Going second: ${formatComparisonRecord(secondMatches)}.`,
    criteria: `Counts games played ${weakerSide}.`,
    matches,
    focusMatches,
    focusOpponent: null,
    focusTurnContext: weakerSide,
    focusTag: repeatedTag?.tag ?? null,
    focusDeckVersionIds: [],
    commonIssue: repeatedTag,
    continueHref: "/matchups",
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
    priority: 4,
    score: delta + focusMatches.length,
    archetype: "Deck versions",
    missionType: "deck-version",
    missionTitle: `Compare ${weakestVersion.name} vs ${bestVersion.name}`,
    missionReason: `${bestVersion.name} leads ${weakestVersion.name} by ${delta} win-rate points.`,
    missionContextLabel: "Compared versions",
    missionContextTargetCount: 2,
    missionProgressGoal: 6,
    missionContextSeenCount: 2,
    focus: "Review whether the better version is actually worth committing to.",
    condition: `Version gap: ${delta} points`,
    context: "You now have enough version sample to compare builds directly.",
    exactTest: `Review ${weakestVersion.name} against ${bestVersion.name}.`,
    nextTest: "Choose the next version to keep testing or retire the weaker build.",
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

  return {
    priority: 5,
    score: focusMatches.length,
    archetype: fallbackArchetype,
    missionType: "baseline",
    missionTitle: "Build a focused sample",
    missionReason: "No leak has enough evidence yet, so keep the next block clean and consistent.",
    missionContextLabel: "Focus matchup",
    missionContextTargetCount: 3,
    missionProgressGoal: 5,
    missionContextSeenCount: focusMatches.length,
    focus: `Keep the same deck and pressure-test ${fallbackArchetype}.`,
    condition: "First test in progress",
    context: "A few more structured games will unlock the first real coaching read.",
    exactTest: `Play 5 more focused games into ${fallbackArchetype}.`,
    nextTest: `Keep logging ${fallbackArchetype} before changing your list.`,
    reasoning: `Most common recent matchup: ${fallbackArchetype}.`,
    criteria: "Counts your next focused testing block.",
    matches,
    focusMatches,
    focusOpponent: fallbackArchetype,
    focusTurnContext: null,
    focusTag: null,
    focusDeckVersionIds: [],
    commonIssue: null,
    continueHref: `/matches/new?event=${encodeURIComponent(eventType)}`,
    eventType,
  };
}

function buildMissionInsightFromCandidate(
  candidate: MissionCandidate
): SessionCoachInsight {
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
  const missionStatusLabel = getMissionStatusLabel(missionStatus);
  const missionStatusReason = getMissionStatusReason(
    missionStatus,
    completed,
    candidate.missionProgressGoal,
    contextSeen,
    candidate.missionContextTargetCount,
    candidate.archetype
  );
  const missionNextAction = getMissionNextAction(
    candidate.missionType,
    missionStatus,
    completed,
    candidate.missionProgressGoal,
    contextSeen,
    candidate.missionContextTargetCount
  );
  const evidence =
    missionStatus === "actionable_signal"
      ? `Focused sample: ${sortedMissionMatches.length} game${
          sortedMissionMatches.length === 1 ? "" : "s"
        }. You can review this before changing your list.`
      : missionStatus === "needs_more_focused_games"
        ? `${candidate.missionContextLabel}: ${Math.max(
            candidate.missionContextTargetCount - contextSeen,
            0
          )} more focus game${
            candidate.missionContextTargetCount - contextSeen === 1 ? "" : "s"
          } to trust the read.`
        : missionStatus === "building_signal"
          ? `Focused sample: ${sortedMissionMatches.length} game${
              sortedMissionMatches.length === 1 ? "" : "s"
            }. Early pattern only.`
          : `Focused sample: ${sortedMissionMatches.length} game${
              sortedMissionMatches.length === 1 ? "" : "s"
            }.`;

  return {
    archetype: candidate.archetype,
    confidence: missionStatusLabel,
    ctaLabel: missionNextAction.ctaLabel,
    completionStatus: completion.completionStatus,
    completionSummary: completion.completionSummary,
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
  const lossPatternCandidate = buildLossPatternMissionCandidate(recentMatches);
  const turnOrderCandidate = buildTurnOrderMissionCandidate(recentMatches);
  const deckVersionCandidate = buildDeckVersionMissionCandidate(recentMatches);

  if (lossPatternCandidate) {
    candidates.push(lossPatternCandidate);
  }

  if (turnOrderCandidate) {
    candidates.push(turnOrderCandidate);
  }

  if (deckVersionCandidate) {
    candidates.push(deckVersionCandidate);
  }

  candidates.push(buildBaselineMissionCandidate(recentMatches));

  const selectedCandidate = [...candidates].sort(getMissionCandidateValue)[0];

  return selectedCandidate
    ? buildMissionInsightFromCandidate(selectedCandidate)
    : null;
}
