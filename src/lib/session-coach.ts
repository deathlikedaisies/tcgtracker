export type CoachMatch = {
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
  commonIssue: string | null;
  criteria: string;
  evidence: string;
  headline: string;
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

function getConfidence(matchCount: number) {
  if (matchCount >= 10) {
    return "Strong signal";
  }

  if (matchCount >= 5) {
    return "Building signal";
  }

  return "Early signal";
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

    return {
      archetype: strongestPositiveSignal.archetype,
      confidence: getConfidence(strongestPositiveSignal.matches.length),
      commonIssue: null,
      criteria: `Counts games vs ${strongestPositiveSignal.archetype}.`,
      evidence: `Based on ${strongestPositiveSignal.matches.length} recent game${
        strongestPositiveSignal.matches.length === 1 ? "" : "s"
      } vs ${strongestPositiveSignal.archetype}.`,
      headline: `No clear leak yet. Stress-test ${strongestPositiveSignal.archetype}.`,
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

  return {
    archetype: biggestLeak.archetype,
    confidence: getConfidence(biggestLeak.matches.length),
    commonIssue: repeatedTag ?? null,
    criteria: turnContext
      ? `Counts games vs ${biggestLeak.archetype} when ${turnContext}.`
      : `Counts games vs ${biggestLeak.archetype}.`,
    evidence: `Based on ${biggestLeak.matches.length} recent game${
      biggestLeak.matches.length === 1 ? "" : "s"
    } vs ${biggestLeak.archetype}.`,
    headline: `Your biggest leak right now is ${biggestLeak.archetype}.`,
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
