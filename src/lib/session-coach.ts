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
  commonIssue: string | null;
  criteria: string;
  duringRecord: string;
  evidence: string;
  headline: string;
  improvementDelta: number | null;
  issueTrend: string | null;
  missionState: "active" | "complete";
  missionTitle: string;
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

function getConfidence(matchCount: number) {
  if (matchCount >= 10) {
    return "Strong signal";
  }

  if (matchCount >= 5) {
    return "Building signal";
  }

  if (matchCount >= 3) {
    return "Early read";
  }

  if (matchCount >= 2) {
    return "Low-confidence read";
  }

  return "Needs more games";
}

function getProgressFeedback(completed: number, goal: number) {
  const remaining = Math.max(goal - completed, 0);

  if (remaining === 0) {
    return "Test block complete. Review the pattern before changing plans.";
  }

  if (remaining === 1) {
    return "One more game to strengthen this read.";
  }

  if (completed >= 3) {
    return "You are building signal.";
  }

  return "Keep logging this exact test.";
}

function getMissionCta(archetype: string, completed: number, goal: number) {
  if (completed >= goal) {
    return `Review ${archetype} test`;
  }

  if (completed === 0) {
    return `Log next game vs ${archetype}`;
  }

  return `Continue test (${completed}/${goal})`;
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
  if (!insight || match.opponent_archetype !== insight.archetype) {
    return false;
  }

  if (insight.criteria.includes("going second")) {
    return match.went_first === false;
  }

  if (insight.criteria.includes("going first")) {
    return match.went_first === true;
  }

  return true;
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

    const completed = Math.min(strongestPositiveSignal.matches.length, 5);
    const duringMatches = strongestPositiveSignal.matches.slice(0, 5);
    const previousMatches = strongestPositiveSignal.matches.slice(5, 10);
    const completion = getCompletionStatus(
      completed,
      5,
      duringMatches,
      previousMatches
    );

    return {
      archetype: strongestPositiveSignal.archetype,
      confidence: getConfidence(strongestPositiveSignal.matches.length),
      ctaLabel: getMissionCta(strongestPositiveSignal.archetype, completed, 5),
      completionStatus: completion.completionStatus,
      completionSummary: completion.completionSummary,
      commonIssue: null,
      criteria: `Counts games vs ${strongestPositiveSignal.archetype}.`,
      duringRecord: formatComparisonRecord(duringMatches),
      evidence: `Based on ${strongestPositiveSignal.matches.length} recent game${
        strongestPositiveSignal.matches.length === 1 ? "" : "s"
      } vs ${strongestPositiveSignal.archetype}.`,
      headline: `No clear leak yet. Stress-test ${strongestPositiveSignal.archetype}.`,
      improvementDelta: completion.improvementDelta,
      issueTrend: getLossPatternTrend(strongestPositiveSignal.matches),
      missionState: completed >= 5 ? "complete" : "active",
      missionTitle: `Mission: Test ${strongestPositiveSignal.archetype}`,
      nextAction:
        completed >= 5
          ? "Review the completed block before changing the list."
          : `Log ${5 - completed} more game${5 - completed === 1 ? "" : "s"} in this matchup.`,
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
      continueHref: `/matches/new?opponent=${encodeURIComponent(
        strongestPositiveSignal.archetype
      )}&event=${encodeURIComponent(eventType)}`,
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
  const repeatedTag = getMostCommonValue(lossTags);
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
  const sortedProgressMatches = [...progressMatches].sort((first, second) =>
    second.played_at.localeCompare(first.played_at)
  );
  const condition = turnContext
    ? `Worse when ${turnContext}`
    : repeatedTag
      ? `Losses repeat around ${repeatedTag}`
      : "Weakest recent matchup";
  const exactTest = `Play 5 games vs ${biggestLeak.archetype}${turnPhrase}.`;
  const focus = repeatedTag
    ? `Focus on ${repeatedTag} in this matchup.`
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
      ? `${repeatedTag} appears most often in losses vs this matchup.`
      : `You are ${formatRecord(biggestLeak.wins, biggestLeak.losses)} against this matchup recently.`;
  const completed = Math.min(progressMatches.length, 5);
  const duringMatches = sortedProgressMatches.slice(0, 5);
  const previousMatches = sortedProgressMatches.slice(5, 10);
  const completion = getCompletionStatus(
    completed,
    5,
    duringMatches,
    previousMatches
  );
  const remaining = Math.max(5 - completed, 0);
  const skillPhrase = repeatedTag
    ? `${repeatedTag} vs ${biggestLeak.archetype}`
    : turnContext
      ? `${biggestLeak.archetype} ${turnContext}`
      : biggestLeak.archetype;

  return {
    archetype: biggestLeak.archetype,
    confidence: getConfidence(biggestLeak.matches.length),
    ctaLabel: getMissionCta(biggestLeak.archetype, completed, 5),
    completionStatus: completion.completionStatus,
    completionSummary: completion.completionSummary,
    commonIssue: repeatedTag ?? null,
    criteria: turnContext
      ? `Counts games vs ${biggestLeak.archetype} when ${turnContext}.`
      : `Counts games vs ${biggestLeak.archetype}.`,
    duringRecord: formatComparisonRecord(duringMatches),
    evidence: `Based on ${biggestLeak.matches.length} recent game${
      biggestLeak.matches.length === 1 ? "" : "s"
    } vs ${biggestLeak.archetype}.`,
    headline: `Your biggest leak right now is ${biggestLeak.archetype}.`,
    improvementDelta: completion.improvementDelta,
    issueTrend: getLossPatternTrend(biggestLeak.matches),
    missionState: completed >= 5 ? "complete" : "active",
    missionTitle: repeatedTag
      ? `Mission: Improve ${skillPhrase}`
      : `Mission: Fix ${skillPhrase}`,
    nextAction:
      completed >= 5
        ? "Review this block and decide whether to keep testing or change plans."
        : `Log ${remaining} more game${remaining === 1 ? "" : "s"} that match this test.`,
    previousRecord: completion.previousRecord,
    weakMatchup: biggestLeak.archetype,
    condition,
    context: turnContext
      ? `You are losing more often when ${turnContext}.`
      : "This matchup is costing you the clearest games right now.",
    exactTest,
    nextTest: `Run 5 games vs ${biggestLeak.archetype}${turnPhrase}.`,
    progressCompleted: completed,
    progressGoal: 5,
    progressFeedback: getProgressFeedback(completed, 5),
    reasoning,
    focus,
    record: formatRecord(biggestLeak.wins, biggestLeak.losses),
    eventType,
    continueHref: `/matches/new?opponent=${encodeURIComponent(
      biggestLeak.archetype
    )}&event=${encodeURIComponent(eventType)}`,
  };
}
