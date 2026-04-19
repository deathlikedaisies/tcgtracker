export type CoachMatch = {
  id?: string;
  opponent_archetype: string;
  result: "win" | "loss";
  went_first: boolean | null;
  event_type: string | null;
  played_at: string;
  match_tags?: { tag: string }[] | { tag: string } | null;
};

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
  missionTitle: string;
  missionSkill: string;
  missionProgress: number;
  missionTargetCount: number;
  missionContextLabel: string;
  missionContextSeenCount: number;
  missionContextTargetCount: number;
  missionReason: string;
  missionConfidence: string;
  missionNextAction: string;
  missionResults: {
    id?: string;
    opponent: string;
    playedAt: string;
    result: "win" | "loss";
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

function getTags(match: CoachMatch) {
  if (!match.match_tags) {
    return [];
  }

  return Array.isArray(match.match_tags)
    ? match.match_tags.map((tagRow) => tagRow.tag)
    : [match.match_tags.tag];
}

function formatRecord(wins: number, losses: number) {
  return `${wins}-${losses}`;
}

function formatComparisonRecord(matches: CoachMatch[]) {
  const wins = matches.filter((match) => match.result === "win").length;
  const losses = matches.length - wins;

  return formatRecord(wins, losses);
}

function getWinRate(matches: CoachMatch[]) {
  if (!matches.length) {
    return null;
  }

  const wins = matches.filter((match) => match.result === "win").length;
  return Math.round((wins / matches.length) * 100);
}

function getMissionConfidence(primaryCount: number, contextCount: number) {
  if (primaryCount >= 10 && contextCount >= 3) {
    return "Strong read";
  }

  if (primaryCount >= 5) {
    return contextCount >= 2 ? "Building read" : "General read";
  }

  if (primaryCount >= 3) {
    return "Early read";
  }

  return "Needs games";
}

function getProgressFeedback(completed: number, goal: number) {
  const remaining = Math.max(goal - completed, 0);

  if (remaining === 0) {
    return "Mission complete. Review the read before changing plans.";
  }

  if (remaining === 1) {
    return "One more game to strengthen this read.";
  }

  if (completed >= 3) {
    return "Building signal.";
  }

  return "Counts toward your current mission.";
}

function getMissionCta(skill: string, completed: number, goal: number) {
  if (completed >= goal) {
    return "Review mission";
  }

  if (completed === 0) {
    return "Log next game";
  }

  return `Continue mission (${completed}/${goal})`;
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
      completionStatus: "Test complete: review the result",
      completionSummary: `During test: ${formatComparisonRecord(duringMatches)}. No prior block to compare yet.`,
      improvementDelta,
      previousRecord: null,
    };
  }

  if (improvementDelta > 0) {
    return {
      completionStatus: "Mission complete: improvement detected",
      completionSummary: `Before: ${formatComparisonRecord(previousMatches)}. During: ${formatComparisonRecord(duringMatches)}.`,
      improvementDelta,
      previousRecord: formatComparisonRecord(previousMatches),
    };
  }

  if (improvementDelta === 0) {
    return {
      completionStatus: "Test complete: no clear improvement yet",
      completionSummary: `Before: ${formatComparisonRecord(previousMatches)}. During: ${formatComparisonRecord(duringMatches)}.`,
      improvementDelta,
      previousRecord: formatComparisonRecord(previousMatches),
    };
  }

  return {
    completionStatus: "Test complete: more work needed",
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

function getMissionMatches(
  matches: CoachMatch[],
  missionSkill: string,
  turnContext: string
) {
  if (turnContext === "going second") {
    return matches.filter((match) => match.went_first === false);
  }

  if (turnContext === "going first") {
    return matches.filter((match) => match.went_first === true);
  }

  if (missionSkill === "Reduce bad matchup losses") {
    return matches.filter((match) => match.result === "loss");
  }

  return matches;
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

  if (previousLossTags.length >= 2 && recentCount < previousCount) {
    return `${recentMainTag} is appearing less often in recent losses.`;
  }

  if (recentCount >= 2) {
    return `${recentMainTag} is still common in recent losses.`;
  }

  return null;
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

  if (insight.missionSkill.toLowerCase().includes("going-second")) {
    return match.went_first === false;
  }

  if (
    insight.missionSkill.toLowerCase().includes("going first") ||
    insight.missionSkill.toLowerCase().includes("going-first")
  ) {
    return match.went_first === true;
  }

  if (insight.missionSkill === "Reduce bad matchup losses") {
    return match.result === "loss";
  }

  return true;
}

export function matchCountsTowardMissionContext(
  match: CoachMatch,
  insight: SessionCoachInsight | null
) {
  if (!insight) {
    return false;
  }

  return match.opponent_archetype === insight.archetype;
}

export function buildSessionCoachInsight(
  matches: CoachMatch[]
): SessionCoachInsight | null {
  const recentMatches = [...matches]
    .sort((first, second) => second.played_at.localeCompare(first.played_at))
    .slice(0, 20);

  if (!recentMatches.length) {
    return null;
  }

  const matchupGroups = Array.from(
    recentMatches
      .reduce((groups, match) => {
        const current = groups.get(match.opponent_archetype) ?? [];
        current.push(match);
        groups.set(match.opponent_archetype, current);
        return groups;
      }, new Map<string, CoachMatch[]>())
      .entries()
  );

  const matchupCandidates = matchupGroups
    .map(([archetype, groupedMatches]) => {
      const wins = groupedMatches.filter((match) => match.result === "win").length;
      const losses = groupedMatches.length - wins;
      const winRate = wins / groupedMatches.length;

      return {
        archetype,
        matches: groupedMatches,
        wins,
        losses,
        winRate,
      };
    })
    .filter((matchup) => matchup.losses > 0)
    .sort((first, second) => {
      if (first.winRate !== second.winRate) {
        return first.winRate - second.winRate;
      }

      if (first.losses !== second.losses) {
        return second.losses - first.losses;
      }

      return second.matches.length - first.matches.length;
    });

  if (!matchupCandidates.length) {
    const strongestPositiveSignal = matchupGroups
      .map(([archetype, groupedMatches]) => ({
        archetype,
        matches: groupedMatches,
        wins: groupedMatches.filter((match) => match.result === "win").length,
        losses: 0,
      }))
      .sort((first, second) => second.matches.length - first.matches.length)[0];

    if (!strongestPositiveSignal) {
      return null;
    }

    const eventType =
      getMostCommonValue(
        strongestPositiveSignal.matches
          .map((match) => match.event_type)
          .filter((eventType): eventType is string => Boolean(eventType))
      ) ?? "testing";

    const primaryMatches = recentMatches;
    const contextMatches = primaryMatches.filter(
      (match) => match.opponent_archetype === strongestPositiveSignal.archetype
    );
    const completed = Math.min(primaryMatches.length, 5);
    const duringMatches = primaryMatches.slice(0, 5);
    const previousMatches = primaryMatches.slice(5, 10);
    const contextSeen = Math.min(contextMatches.length, 3);
    const missionSkill = "Stabilize testing baseline";
    const missionContextLabel = `Focus area: ${strongestPositiveSignal.archetype}`;
    const missionConfidence = getMissionConfidence(
      primaryMatches.length,
      contextMatches.length
    );
    const completion = getCompletionStatus(
      completed,
      5,
      duringMatches,
      previousMatches
    );

    return {
      archetype: strongestPositiveSignal.archetype,
      confidence: missionConfidence,
      ctaLabel: getMissionCta(strongestPositiveSignal.archetype, completed, 5),
      completionStatus: completion.completionStatus,
      completionSummary: completion.completionSummary,
      commonIssue: null,
      criteria: `${missionContextLabel} adds context, but general testing advances the mission.`,
      duringRecord: formatComparisonRecord(duringMatches),
      evidence: `Based on ${strongestPositiveSignal.matches.length} recent game${
        strongestPositiveSignal.matches.length === 1 ? "" : "s"
      } vs ${strongestPositiveSignal.archetype}.`,
      headline: `No clear leak yet. Stress-test ${strongestPositiveSignal.archetype}.`,
      improvementDelta: completion.improvementDelta,
      issueTrend: getLossPatternTrend(strongestPositiveSignal.matches),
      missionState: completed >= 5 ? "complete" : "active",
      missionTitle: missionSkill,
      missionSkill,
      missionProgress: completed,
      missionTargetCount: 5,
      missionContextLabel,
      missionContextSeenCount: contextSeen,
      missionContextTargetCount: 3,
      missionReason: "No leak has repeated yet. Keep testing the current plan.",
      missionConfidence,
      missionNextAction:
        completed >= 5 ? "Review the baseline." : "Log the next game.",
      missionResults: toMissionResults(primaryMatches),
      nextAction:
        completed >= 5
          ? contextSeen >= 3
            ? "Mission complete. Focus area had enough evidence to review."
            : "Mission complete. The read is general because the focus area was rare."
          : `Log ${5 - completed} more game${5 - completed === 1 ? "" : "s"}.`,
      previousRecord: completion.previousRecord,
      weakMatchup: strongestPositiveSignal.archetype,
      condition: "No loss cluster yet",
      context: "You have not logged a loss in your recent sample.",
      exactTest: `Play 5 more games vs ${strongestPositiveSignal.archetype}.`,
      nextTest: `Run 5 more games vs ${strongestPositiveSignal.archetype}.`,
      progressCompleted: completed,
      progressGoal: 5,
      progressFeedback: getProgressFeedback(completed, 5),
      reasoning: `You are ${formatRecord(strongestPositiveSignal.wins, 0)} in this matchup so far.`,
      focus: "Keep the same deck and test whether the matchup stays stable.",
      record: formatRecord(strongestPositiveSignal.wins, 0),
      eventType,
      continueHref: `/matches/new?event=${encodeURIComponent(eventType)}`,
    };
  }

  const biggestLeak = matchupCandidates[0];

  if (!biggestLeak) {
    return null;
  }

  const firstMatches = biggestLeak.matches.filter(
    (match) => match.went_first === true
  );
  const secondMatches = biggestLeak.matches.filter(
    (match) => match.went_first === false
  );
  const firstLosses = firstMatches.filter((match) => match.result === "loss").length;
  const secondLosses = secondMatches.filter((match) => match.result === "loss").length;
  const firstLossRate = firstMatches.length ? firstLosses / firstMatches.length : 0;
  const secondLossRate = secondMatches.length ? secondLosses / secondMatches.length : 0;
  const turnContext =
    secondMatches.length >= 2 && secondLossRate >= firstLossRate && secondLosses > 0
      ? "going second"
      : firstMatches.length >= 2 && firstLossRate > secondLossRate && firstLosses > 0
        ? "going first"
        : "";

  const lossTags = biggestLeak.matches
    .filter((match) => match.result === "loss")
    .flatMap(getTags);
  const repeatedTag = getMostCommonTag(lossTags);
  const eventType =
    getMostCommonValue(
      biggestLeak.matches
        .map((match) => match.event_type)
        .filter((eventType): eventType is string => Boolean(eventType))
    ) ?? "testing";
  const turnPhrase = turnContext ? ` ${turnContext}` : "";
  const progressMatches = turnContext
    ? biggestLeak.matches.filter((match) =>
        turnContext === "going second"
          ? match.went_first === false
          : match.went_first === true
      )
    : biggestLeak.matches;
  const condition = turnContext
    ? `Worse when ${turnContext}`
    : repeatedTag
      ? `🔁 ${repeatedTag.tag} (${repeatedTag.count}x)`
      : "Weakest recent matchup";
  const exactTest = `Play 5 games vs ${biggestLeak.archetype}${turnPhrase}.`;
  const focus = repeatedTag
    ? `Focus on ${repeatedTag.tag} in this matchup.`
    : turnContext
      ? `Review your lines when ${turnContext}.`
      : "Focus on your opening plan and prize map.";
  const comparisonMatches =
    turnContext === "going second" ? firstMatches : secondMatches;
  const reasoning = turnContext
    ? comparisonMatches.length
      ? `You are ${formatComparisonRecord(progressMatches)} when ${turnContext} vs ${formatComparisonRecord(
          comparisonMatches
        )} otherwise.`
      : `All recent losses in this matchup happened when ${turnContext}.`
    : repeatedTag
      ? `🔁 ${repeatedTag.tag} (${repeatedTag.count}x)`
      : `You are ${formatRecord(biggestLeak.wins, biggestLeak.losses)} against this matchup recently.`;
  const missionSkill = repeatedTag
    ? getSkillLabel(repeatedTag.tag)
    : turnContext === "going second"
      ? "Improve going-second play"
      : turnContext === "going first"
        ? "Improve going-first play"
        : "Reduce bad matchup losses";
  const primaryMatches = getMissionMatches(recentMatches, missionSkill, turnContext);
  const sortedPrimaryMatches = [...primaryMatches].sort((first, second) =>
    second.played_at.localeCompare(first.played_at)
  );
  const contextMatches = sortedPrimaryMatches.filter(
    (match) => match.opponent_archetype === biggestLeak.archetype
  );
  const completed = Math.min(sortedPrimaryMatches.length, 5);
  const contextSeen = Math.min(contextMatches.length, 3);
  const duringMatches = sortedPrimaryMatches.slice(0, 5);
  const previousMatches = sortedPrimaryMatches.slice(5, 10);
  const completion = getCompletionStatus(
    completed,
    5,
    duringMatches,
    previousMatches
  );
  const remaining = Math.max(5 - completed, 0);
  const missionContextLabel = `Focus area: ${biggestLeak.archetype}`;
  const missionConfidence = getMissionConfidence(
    sortedPrimaryMatches.length,
    contextMatches.length
  );
  const contextEvidence =
    contextSeen >= 3
      ? "Focus area has enough evidence."
      : contextSeen > 0
        ? `Focus area seen ${contextSeen}/3.`
        : "Focus area not seen yet.";
  const missionReason = repeatedTag
    ? `${repeatedTag.tag} appears in ${repeatedTag.count} recent loss${
        repeatedTag.count === 1 ? "" : "es"
      }.`
    : turnContext
      ? `Losses cluster when ${turnContext}.`
      : `Weakest recent matchup is ${biggestLeak.archetype}.`;

  return {
    archetype: biggestLeak.archetype,
    confidence: missionConfidence,
    ctaLabel: getMissionCta(missionSkill, completed, 5),
    completionStatus: completion.completionStatus,
    completionSummary: completion.completionSummary
      ? `${completion.completionSummary} ${contextEvidence}`
      : null,
    commonIssue: repeatedTag,
    criteria: turnContext
      ? `Counts games when ${turnContext}. ${missionContextLabel} adds context.`
      : `Counts logged games for this skill. ${missionContextLabel} adds context.`,
    duringRecord: formatComparisonRecord(duringMatches),
    evidence: `${missionConfidence} from ${sortedPrimaryMatches.length} qualifying game${
      sortedPrimaryMatches.length === 1 ? "" : "s"
    }. ${contextEvidence}`,
    headline: missionSkill,
    improvementDelta: completion.improvementDelta,
    issueTrend: getLossPatternTrend(biggestLeak.matches),
    missionState: completed >= 5 ? "complete" : "active",
    missionTitle: missionSkill,
    missionSkill,
    missionProgress: completed,
    missionTargetCount: 5,
    missionContextLabel,
    missionContextSeenCount: contextSeen,
    missionContextTargetCount: 3,
    missionReason,
    missionConfidence,
    missionNextAction:
      completed >= 5 ? "Review mission" : `Log ${remaining} more game${remaining === 1 ? "" : "s"}.`,
    missionResults: toMissionResults(sortedPrimaryMatches),
    nextAction:
      completed >= 5
        ? contextSeen >= 3
          ? "Mission complete. Strongest evidence came from focus-area games."
          : "Mission complete. The read is general because focus evidence was limited."
        : `Log ${remaining} more game${remaining === 1 ? "" : "s"}.`,
    previousRecord: completion.previousRecord,
    weakMatchup: biggestLeak.archetype,
    condition,
    context: turnContext
      ? `You are losing more often when ${turnContext}.`
      : "This matchup is costing you the clearest games right now.",
    exactTest,
    nextTest: turnContext
      ? `Run 5 games ${turnContext}; watch ${biggestLeak.archetype}.`
      : `Run 5 games with ${biggestLeak.archetype} as the focus area.`,
    progressCompleted: completed,
    progressGoal: 5,
    progressFeedback: getProgressFeedback(completed, 5),
    reasoning,
    focus,
    record: formatRecord(biggestLeak.wins, biggestLeak.losses),
    eventType,
    continueHref: `/matches/new?event=${encodeURIComponent(eventType)}`,
  };
}
