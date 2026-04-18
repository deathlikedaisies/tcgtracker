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
  headline: string;
  context: string;
  nextTest: string;
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

function getConfidence(matchCount: number, totalMatches: number) {
  if (matchCount >= 10) {
    return `Stronger signal from ${matchCount} games`;
  }

  if (matchCount >= 3) {
    return `Early signal from ${matchCount} games`;
  }

  return totalMatches >= 3
    ? `Small sample, but clear trend from ${matchCount} game${
        matchCount === 1 ? "" : "s"
      }`
    : `Early signal from ${totalMatches} game${totalMatches === 1 ? "" : "s"}`;
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

    return {
      archetype: strongestPositiveSignal.archetype,
      confidence: getConfidence(
        strongestPositiveSignal.matches.length,
        recentMatches.length
      ),
      headline: `No clear leak yet. Stress-test ${strongestPositiveSignal.archetype}.`,
      context: "You have not logged a loss in your recent sample.",
      nextTest: `Next test: play 5 more games vs ${strongestPositiveSignal.archetype}.`,
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
  const focus = repeatedTag
    ? `Focus on ${repeatedTag} in this matchup.`
    : turnContext
      ? `Review your lines when ${turnContext}.`
      : "Focus on your opening plan and prize map.";

  return {
    archetype: biggestLeak.archetype,
    confidence: getConfidence(biggestLeak.matches.length, recentMatches.length),
    headline: `Your biggest leak right now is ${biggestLeak.archetype}.`,
    context: turnContext
      ? `You are losing more often when ${turnContext}.`
      : "This matchup is costing you the clearest games right now.",
    nextTest: `Next test: play 5 more games vs ${biggestLeak.archetype}${turnPhrase}.`,
    focus,
    record: formatRecord(biggestLeak.wins, biggestLeak.losses),
    eventType,
    continueHref: `/matches/new?opponent=${encodeURIComponent(
      biggestLeak.archetype
    )}&event=${encodeURIComponent(eventType)}`,
  };
}
