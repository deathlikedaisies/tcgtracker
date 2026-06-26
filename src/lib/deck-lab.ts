import {
  OTHER_ARCHETYPE,
  POST_ROTATION_2026_ARCHETYPES,
} from "@/lib/archetypes";
import {
  countMatchResults,
  type MatchMetadata,
  type MatchResult,
  type MatchStartQuality,
} from "@/lib/match-types";

type DeckLabVersion = {
  id: string;
  name: string | null;
  created_at: string;
  is_active: boolean;
};

type DeckLabMatch = {
  deck_version_id: string;
  opponent_archetype: string;
  result: MatchResult;
  went_first: boolean | null;
  played_at: string;
  metadata: MatchMetadata;
  match_tags?: { tag: string }[] | null;
};

type DeckLabStatusTone = "blue" | "gold" | "emerald" | "rose";
type DeckLabVersionReadStatus =
  | "first_version"
  | "baseline_ready"
  | "needs_games"
  | "early_read"
  | "useful_read";
type DeckLabPatienceStatus =
  | "build_sample"
  | "switched_early"
  | "good_sample"
  | "baseline_ready";
type DeckLabMetaSampleStatus = "no_data" | "needs_more" | "early_read" | "useful_sample";

type DeckLabVersionSignal = {
  label: string;
  tone: DeckLabStatusTone;
};

export type DeckLabComparisonRow = {
  label: string;
  current: string;
  previous: string;
  insight: string;
  tone: DeckLabStatusTone;
};

export type DeckLabHabit = {
  label: string;
  statusLabel: string;
  tone: DeckLabStatusTone;
};

export type DeckLabMetaWatchItem = {
  archetype: string;
  count: number;
  status: DeckLabMetaSampleStatus;
  statusLabel: string;
  tone: DeckLabStatusTone;
  priorityLabel: string;
  priorityTone: DeckLabStatusTone;
  recentLabel: string;
};

export type DeckLabSummary = {
  activeVersionName: string;
  previousVersionName: string | null;
  currentSampleSize: number;
  previousSampleSize: number;
  currentVersionSampleDisplay: string;
  currentVersionSampleSummary: string;
  cleanLogDisplay: string;
  cleanLogSummary: string;
  versionReadStatus: DeckLabVersionReadStatus;
  versionReadLabel: string;
  versionReadTone: DeckLabStatusTone;
  versionReadSummary: string;
  versionConclusion: string;
  nextObservation: string;
  sampleCaution: string;
  changedTooSoonWarning: string | null;
  comparisonRows: DeckLabComparisonRow[];
  improvements: DeckLabVersionSignal[];
  regressions: DeckLabVersionSignal[];
  cleanLogCount: number;
  cleanLogTotal: number;
  cleanLogStreak: number;
  currentVersionTarget: number;
  versionPatienceStatus: DeckLabPatienceStatus;
  versionPatienceLabel: string;
  versionPatienceTone: DeckLabStatusTone;
  versionPatienceSummary: string;
  disciplineHabits: DeckLabHabit[];
  logQualityCallout: string | null;
  metaWatchlist: DeckLabMetaWatchItem[];
  recommendation: string;
};

type BuildDeckLabSummaryInput = {
  deckArchetype: string | null;
  versions: DeckLabVersion[];
  activeVersionId: string | null;
  matches: DeckLabMatch[];
  archetypes?: string[];
};

function safeText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getStrongQualityRate(
  matches: DeckLabMatch[],
  field: "start_quality" | "opening_hand_quality" | "sequencing_quality"
) {
  const knownValues = matches
    .map((match) => match.metadata[field])
    .filter((value): value is MatchStartQuality => Boolean(value));
  const strong = knownValues.filter(
    (value) => value === "good" || value === "great"
  ).length;

  return {
    known: knownValues.length,
    strong,
    percent: knownValues.length ? Math.round((strong / knownValues.length) * 100) : null,
  };
}

function getTurnSplit(matches: DeckLabMatch[], wentFirst: boolean) {
  const splitMatches = matches.filter((match) => match.went_first === wentFirst);
  const record = countMatchResults(splitMatches);
  const winRate = record.total ? Math.round((record.wins / record.total) * 100) : null;

  return {
    total: record.total,
    winRate,
  };
}

function getRepeatedLossTag(matches: DeckLabMatch[]) {
  const counts = new Map<string, number>();

  matches
    .filter((match) => match.result === "loss")
    .forEach((match) => {
      const metadataTags = match.metadata.issue_tags ?? [];
      const attachedTags = (match.match_tags ?? []).map((tag) => tag.tag);
      const uniqueTags = Array.from(new Set([...metadataTags, ...attachedTags]));

      uniqueTags.forEach((tag) => {
        const normalized = tag.trim();
        if (!normalized) {
          return;
        }

        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      });
    });

  const [tag, count] =
    Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ?? [];

  if (!tag || !count || count < 2) {
    return null;
  }

  return { tag, count };
}

function isCleanLog(match: DeckLabMatch) {
  const metadata = match.metadata;
  const hasQuality =
    Boolean(metadata.start_quality) &&
    Boolean(metadata.opening_hand_quality) &&
    Boolean(metadata.sequencing_quality);

  const issueTags = metadata.issue_tags ?? [];
  const positiveTags = metadata.positive_tags ?? [];
  const hasReason =
    match.result === "win"
      ? positiveTags.length > 0
      : match.result === "loss"
        ? issueTags.length > 0
        : issueTags.length > 0 || positiveTags.length > 0;

  return match.went_first !== null && hasQuality && hasReason;
}

function getMetaWatchStatus(count: number): {
  status: DeckLabMetaSampleStatus;
  label: string;
  tone: DeckLabStatusTone;
} {
  if (count === 0) {
    return { status: "no_data", label: "No data", tone: "blue" };
  }

  if (count <= 2) {
    return { status: "needs_more", label: "Needs more", tone: "gold" };
  }

  if (count <= 4) {
    return { status: "early_read", label: "Early read", tone: "blue" };
  }

  return { status: "useful_sample", label: "Useful sample", tone: "emerald" };
}

function getMetaWatchPriority(
  count: number,
  orderIndex: number
): {
  label: string;
  tone: DeckLabStatusTone;
} {
  if (count >= 5) {
    return { label: "Enough for now", tone: "emerald" };
  }

  if (count === 0 || (count <= 2 && orderIndex <= 1)) {
    return { label: "High priority", tone: "gold" };
  }

  return { label: "Watch", tone: "blue" };
}

function formatPercent(value: number | null) {
  return value === null ? "No data" : `${value}%`;
}

function formatLossTag(value: { tag: string; count: number } | null) {
  return value ? `${value.tag} (${value.count})` : "No repeat yet";
}

function getVersionReadMeta(
  currentSampleSize: number,
  previousSampleSize: number,
  hasPreviousVersion: boolean,
  currentVersionTarget: number
) {
  if (!hasPreviousVersion) {
    if (currentSampleSize >= currentVersionTarget) {
      return {
        status: "baseline_ready" as const,
        label: "Baseline ready",
        tone: "emerald" as const,
        caution: "Future versions can now be compared against this sample.",
      };
    }

    return {
      status: "first_version" as const,
      label: "First version",
      tone: "blue" as const,
      caution: "Build a clean sample before changing the list.",
    };
  }

  if (currentSampleSize <= 2 || previousSampleSize <= 2) {
    return {
      status: "needs_games" as const,
      label: "Needs games",
      tone: "blue" as const,
      caution: "Not enough games to compare versions yet.",
    };
  }

  if (currentSampleSize <= 4 || previousSampleSize <= 4) {
    return {
      status: "early_read" as const,
      label: "Early read",
      tone: "gold" as const,
      caution: "Useful early signal only. Keep logging before you call the test.",
    };
  }

  return {
    status: "useful_read" as const,
    label: currentSampleSize >= 10 && previousSampleSize >= 10 ? "Useful read" : "Building read",
    tone: currentSampleSize >= 10 && previousSampleSize >= 10 ? ("emerald" as const) : ("blue" as const),
    caution:
      currentSampleSize >= 10 && previousSampleSize >= 10
        ? "This is a stronger compare, but matchup spread can still shape the read."
        : "Enough games for a practical compare, but keep the sample growing.",
  };
}

function pushSignal(
  target: DeckLabVersionSignal[],
  label: string,
  tone: DeckLabStatusTone
) {
  if (!target.some((signal) => signal.label === label)) {
    target.push({ label, tone });
  }
}

export function buildDeckLabSummary({
  deckArchetype,
  versions,
  activeVersionId,
  matches,
  archetypes = POST_ROTATION_2026_ARCHETYPES as unknown as string[],
}: BuildDeckLabSummaryInput): DeckLabSummary {
  const versionsByOldest = [...versions].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );
  const activeVersion =
    versions.find((version) => version.id === activeVersionId) ??
    versions.find((version) => version.is_active) ??
    versionsByOldest.at(-1) ??
    null;
  const activeIndex = activeVersion
    ? versionsByOldest.findIndex((version) => version.id === activeVersion.id)
    : -1;
  const previousVersion =
    activeIndex > 0 ? versionsByOldest[activeIndex - 1] : null;
  const activeVersionName = safeText(activeVersion?.name, "Current version");
  const previousVersionName = previousVersion
    ? safeText(previousVersion.name, "Previous version")
    : null;

  const currentMatches = activeVersion
    ? matches.filter((match) => match.deck_version_id === activeVersion.id)
    : [];
  const previousMatches = previousVersion
    ? matches.filter((match) => match.deck_version_id === previousVersion.id)
    : [];

  const currentRecord = countMatchResults(currentMatches);
  const previousRecord = countMatchResults(previousMatches);
  const currentSampleSize = currentRecord.total;
  const previousSampleSize = previousRecord.total;
  const currentVersionTarget = 10;

  const versionReadMeta = getVersionReadMeta(
    currentSampleSize,
    previousSampleSize,
    Boolean(previousVersion),
    currentVersionTarget
  );

  const currentWinRate = currentSampleSize
    ? Math.round((currentRecord.wins / currentSampleSize) * 100)
    : null;
  const previousWinRate = previousSampleSize
    ? Math.round((previousRecord.wins / previousSampleSize) * 100)
    : null;
  const currentStartQuality = getStrongQualityRate(currentMatches, "start_quality");
  const previousStartQuality = getStrongQualityRate(previousMatches, "start_quality");
  const currentOpeningQuality = getStrongQualityRate(
    currentMatches,
    "opening_hand_quality"
  );
  const previousOpeningQuality = getStrongQualityRate(
    previousMatches,
    "opening_hand_quality"
  );
  const currentSequencingQuality = getStrongQualityRate(
    currentMatches,
    "sequencing_quality"
  );
  const previousSequencingQuality = getStrongQualityRate(
    previousMatches,
    "sequencing_quality"
  );
  const currentGoingFirst = getTurnSplit(currentMatches, true);
  const previousGoingFirst = getTurnSplit(previousMatches, true);
  const currentGoingSecond = getTurnSplit(currentMatches, false);
  const previousGoingSecond = getTurnSplit(previousMatches, false);
  const repeatedLossTag = getRepeatedLossTag(currentMatches);
  const previousRepeatedLossTag = getRepeatedLossTag(previousMatches);

  const improvements: DeckLabVersionSignal[] = [];
  const regressions: DeckLabVersionSignal[] = [];

  if (
    currentWinRate !== null &&
    previousWinRate !== null &&
    currentSampleSize >= 3 &&
    previousSampleSize >= 3 &&
    Math.abs(currentWinRate - previousWinRate) >= 10
  ) {
    if (currentWinRate > previousWinRate) {
      pushSignal(improvements, `Win rate is up ${currentWinRate - previousWinRate} points so far`, "emerald");
    } else {
      pushSignal(regressions, `Win rate is down ${previousWinRate - currentWinRate} points so far`, "rose");
    }
  }

  if (
    currentStartQuality.percent !== null &&
    previousStartQuality.percent !== null &&
    currentStartQuality.known >= 3 &&
    previousStartQuality.known >= 3 &&
    Math.abs(currentStartQuality.percent - previousStartQuality.percent) >= 15
  ) {
    if (currentStartQuality.percent > previousStartQuality.percent) {
      pushSignal(improvements, "Starts look cleaner than the previous version", "emerald");
    } else {
      pushSignal(regressions, "Starts look shakier than the previous version", "rose");
    }
  }

  if (
    currentOpeningQuality.percent !== null &&
    previousOpeningQuality.percent !== null &&
    currentOpeningQuality.known >= 3 &&
    previousOpeningQuality.known >= 3 &&
    Math.abs(currentOpeningQuality.percent - previousOpeningQuality.percent) >= 15
  ) {
    if (currentOpeningQuality.percent > previousOpeningQuality.percent) {
      pushSignal(improvements, "Opening hands are stronger so far", "emerald");
    } else {
      pushSignal(regressions, "Opening hands are weaker so far", "rose");
    }
  }

  if (
    currentSequencingQuality.percent !== null &&
    previousSequencingQuality.percent !== null &&
    currentSequencingQuality.known >= 3 &&
    previousSequencingQuality.known >= 3 &&
    Math.abs(currentSequencingQuality.percent - previousSequencingQuality.percent) >= 15
  ) {
    if (currentSequencingQuality.percent > previousSequencingQuality.percent) {
      pushSignal(improvements, "Sequencing quality looks better", "emerald");
    } else {
      pushSignal(regressions, "Sequencing still looks loose", "rose");
    }
  }

  if (repeatedLossTag) {
    pushSignal(
      regressions,
      `Watch ${repeatedLossTag.tag.toLowerCase()} losses`,
      "rose"
    );
  }

  if (
    currentGoingSecond.total >= 3 &&
    currentGoingSecond.winRate !== null &&
    currentGoingSecond.winRate <= 35
  ) {
    pushSignal(
      regressions,
      `Going second is still weak (${currentGoingSecond.winRate}% over ${currentGoingSecond.total} games)`,
      "rose"
    );
  } else if (
    currentGoingSecond.total >= 3 &&
    previousGoingSecond.total >= 3 &&
    currentGoingSecond.winRate !== null &&
    previousGoingSecond.winRate !== null &&
    currentGoingSecond.winRate - previousGoingSecond.winRate >= 15
  ) {
    pushSignal(improvements, "Going-second games are holding up better", "emerald");
  }

  const versionReadSummary = (() => {
    if (!previousVersion) {
      if (currentSampleSize >= currentVersionTarget) {
        return "This first version now has enough games to use as a baseline.";
      }

      return "This is your first version. Build a clean sample before changing the list.";
    }

    if (versionReadMeta.status === "needs_games") {
      return "Not enough games to compare versions yet.";
    }

    if (improvements[0] && regressions[0]) {
      return `${versionReadMeta.label}: ${activeVersionName} shows ${improvements[0].label.toLowerCase()}, but ${regressions[0].label.charAt(0).toLowerCase()}${regressions[0].label.slice(1)}.`;
    }

    if (improvements[0]) {
      return `${versionReadMeta.label}: ${activeVersionName} looks better than ${previousVersionName} so far because ${improvements[0].label.charAt(0).toLowerCase()}${improvements[0].label.slice(1)}.`;
    }

    if (regressions[0]) {
      return `${versionReadMeta.label}: ${regressions[0].label}.`;
    }

    return `${versionReadMeta.label}: No clear version edge yet. Keep the sample building before you change the list.`;
  })();

  const cleanLogCount = currentMatches.filter(isCleanLog).length;
  const cleanLogStreak = currentMatches
    .slice()
    .sort(
      (left, right) =>
        new Date(right.played_at).getTime() - new Date(left.played_at).getTime()
    )
    .reduce((count, match, index) => {
      if (index !== count || !isCleanLog(match)) {
        return count;
      }

      return count + 1;
    }, 0);

  const versionPatienceStatus: DeckLabPatienceStatus =
    !previousVersion && currentSampleSize >= currentVersionTarget
      ? "baseline_ready"
      : currentSampleSize >= 5
      ? "good_sample"
      : previousVersion && previousSampleSize < 5 && currentSampleSize < 5
        ? "switched_early"
        : "build_sample";
  const versionPatienceLabel =
    versionPatienceStatus === "baseline_ready"
      ? "Baseline ready"
      : versionPatienceStatus === "good_sample"
      ? "Good sample forming"
      : versionPatienceStatus === "switched_early"
        ? "Changed quickly"
        : "Keep testing";
  const versionPatienceTone: DeckLabStatusTone =
    versionPatienceStatus === "baseline_ready" ||
    versionPatienceStatus === "good_sample"
      ? "emerald"
      : versionPatienceStatus === "switched_early"
        ? "gold"
        : "blue";
  const versionPatienceSummary =
    versionPatienceStatus === "baseline_ready"
      ? "Good baseline. Future versions can be compared against this sample."
      : versionPatienceStatus === "good_sample"
      ? "You have enough games on this version to start trusting the pattern."
      : versionPatienceStatus === "switched_early"
        ? "You changed versions before building a clear sample. Give this list more time."
        : "Keep testing before changing the list again.";
  const currentVersionSampleDisplay =
    currentSampleSize >= currentVersionTarget
      ? `${currentSampleSize} games`
      : `${currentSampleSize}/${currentVersionTarget} games`;
  const currentVersionSampleSummary =
    !previousVersion && currentSampleSize >= currentVersionTarget
      ? "Baseline ready."
      : currentSampleSize >= currentVersionTarget
        ? "Target reached."
        : "Keep testing before changing the list.";
  const cleanLogDisplay = `${cleanLogCount} of ${currentSampleSize}`;
  const cleanLogSummary =
    cleanLogStreak > 0
      ? `${cleanLogStreak}-game clean streak`
      : currentSampleSize > 0
        ? `${currentSampleSize} total games`
        : "Start a clean-log streak";
  const changedTooSoonWarning =
    previousVersion && previousSampleSize > 0 && previousSampleSize < 5
      ? "You changed from the previous version before building a clear sample."
      : null;
  const incompleteLogCount = Math.max(currentSampleSize - cleanLogCount, 0);
  const logQualityCallout =
    incompleteLogCount >= 2
      ? "Some logs are missing quality or reason details."
      : null;
  const versionConclusion = (() => {
    if (!previousVersion) {
      return currentSampleSize >= currentVersionTarget
        ? "This version is your baseline. Future changes can be compared against it."
        : "Too early to call. Let this version build a cleaner sample first.";
    }

    if (versionReadMeta.status === "needs_games") {
      return "Too little data to compare versions cleanly.";
    }

    if (improvements[0] && !regressions[0]) {
      return "This version looks better so far, mostly because the cleaner signals are holding up.";
    }

    if (improvements[0] && regressions[0]) {
      return "The version looks better in one area, but the main weakness still needs more testing.";
    }

    if (regressions[0]) {
      return "The version is not clearly better yet. Keep testing before changing again.";
    }

    return "No clear version edge yet. Keep testing before you swap the list again.";
  })();
  const nextObservation = (() => {
    if (currentSampleSize < 5) {
      return "Log a few more clean games before making another change.";
    }

    if (repeatedLossTag) {
      return `Watch whether ${repeatedLossTag.tag.toLowerCase()} keeps causing losses.`;
    }

    if (
      currentGoingSecond.total >= 2 &&
      currentGoingSecond.winRate !== null &&
      currentGoingSecond.winRate <= 40
    ) {
      return "Watch going-second games before changing the list.";
    }

    if (
      currentOpeningQuality.percent !== null &&
      currentOpeningQuality.percent <= 50
    ) {
      return "Keep an eye on opening hand quality before you change again.";
    }

    if (
      currentSequencingQuality.percent !== null &&
      currentSequencingQuality.percent <= 50
    ) {
      return "Watch whether sequencing keeps deciding your losses.";
    }

    return "Keep logging clean games before making another list change.";
  })();
  const disciplineHabits: DeckLabHabit[] = [
    {
      label: "Clean logger",
      statusLabel:
        cleanLogCount >= Math.max(3, Math.ceil(currentSampleSize * 0.7))
          ? "Strong recent logs"
          : cleanLogCount > 0
            ? "Needs cleaner logs"
            : "No clean sample yet",
      tone:
        cleanLogCount >= Math.max(3, Math.ceil(currentSampleSize * 0.7))
          ? "emerald"
          : cleanLogCount > 0
            ? "gold"
            : "blue",
    },
    {
      label: "Sample builder",
      statusLabel:
        currentSampleSize >= currentVersionTarget
          ? "Baseline ready"
          : currentSampleSize >= 5
            ? "Good sample forming"
            : "Building sample",
      tone:
        currentSampleSize >= currentVersionTarget
          ? "emerald"
          : currentSampleSize >= 5
            ? "blue"
            : "gold",
    },
    {
      label: "Version discipline",
      statusLabel: changedTooSoonWarning ? "Changed too soon" : "Patient testing",
      tone: changedTooSoonWarning ? "gold" : "emerald",
    },
    {
      label: "Going-second tracker",
      statusLabel:
        currentGoingSecond.total >= 3 ? "Useful sample" : "Needs more data",
      tone: currentGoingSecond.total >= 3 ? "emerald" : "blue",
    },
    {
      label: "Meta watcher",
      statusLabel:
        currentMatches.length > 0 &&
        new Set(
          currentMatches
            .map((match) => normalizeText(match.opponent_archetype))
            .filter(Boolean)
        ).size >= 3
          ? "Coverage building"
          : "Watchlist still thin",
      tone:
        currentMatches.length > 0 &&
        new Set(
          currentMatches
            .map((match) => normalizeText(match.opponent_archetype))
            .filter(Boolean)
        ).size >= 3
          ? "emerald"
          : "blue",
    },
  ];
  const comparisonRows: DeckLabComparisonRow[] = previousVersion
    ? [
        {
          label: "Win rate",
          current: formatPercent(currentWinRate),
          previous: formatPercent(previousWinRate),
          insight:
            currentWinRate !== null && previousWinRate !== null
              ? currentWinRate > previousWinRate
                ? "Up so far"
                : currentWinRate < previousWinRate
                  ? "Still behind"
                  : "Flat"
              : "Too early",
          tone:
            currentWinRate !== null &&
            previousWinRate !== null &&
            currentWinRate > previousWinRate
              ? "emerald"
              : currentWinRate !== null &&
                  previousWinRate !== null &&
                  currentWinRate < previousWinRate
                ? "rose"
                : "blue",
        },
        {
          label: "Setup quality",
          current: formatPercent(currentStartQuality.percent),
          previous: formatPercent(previousStartQuality.percent),
          insight:
            currentStartQuality.percent !== null &&
            previousStartQuality.percent !== null
              ? currentStartQuality.percent > previousStartQuality.percent
                ? "Better"
                : currentStartQuality.percent < previousStartQuality.percent
                  ? "Worse"
                  : "Stable"
              : "Too early",
          tone:
            currentStartQuality.percent !== null &&
            previousStartQuality.percent !== null &&
            currentStartQuality.percent > previousStartQuality.percent
              ? "emerald"
              : currentStartQuality.percent !== null &&
                  previousStartQuality.percent !== null &&
                  currentStartQuality.percent < previousStartQuality.percent
                ? "rose"
                : "blue",
        },
        {
          label: "Opening hand",
          current: formatPercent(currentOpeningQuality.percent),
          previous: formatPercent(previousOpeningQuality.percent),
          insight:
            currentOpeningQuality.percent !== null &&
            previousOpeningQuality.percent !== null
              ? currentOpeningQuality.percent > previousOpeningQuality.percent
                ? "Better"
                : currentOpeningQuality.percent < previousOpeningQuality.percent
                  ? "Worse"
                  : "Stable"
              : "Too early",
          tone:
            currentOpeningQuality.percent !== null &&
            previousOpeningQuality.percent !== null &&
            currentOpeningQuality.percent > previousOpeningQuality.percent
              ? "emerald"
              : currentOpeningQuality.percent !== null &&
                  previousOpeningQuality.percent !== null &&
                  currentOpeningQuality.percent < previousOpeningQuality.percent
                ? "rose"
                : "blue",
        },
        {
          label: "Sequencing",
          current: formatPercent(currentSequencingQuality.percent),
          previous: formatPercent(previousSequencingQuality.percent),
          insight:
            currentSequencingQuality.percent !== null &&
            previousSequencingQuality.percent !== null
              ? currentSequencingQuality.percent > previousSequencingQuality.percent
                ? "Better"
                : currentSequencingQuality.percent < previousSequencingQuality.percent
                  ? "Worse"
                  : "Stable"
              : "Too early",
          tone:
            currentSequencingQuality.percent !== null &&
            previousSequencingQuality.percent !== null &&
            currentSequencingQuality.percent > previousSequencingQuality.percent
              ? "emerald"
              : currentSequencingQuality.percent !== null &&
                  previousSequencingQuality.percent !== null &&
                  currentSequencingQuality.percent < previousSequencingQuality.percent
                ? "rose"
                : "blue",
        },
        {
          label: "Going first",
          current: formatPercent(currentGoingFirst.winRate),
          previous: formatPercent(previousGoingFirst.winRate),
          insight:
            currentGoingFirst.total >= 2 && previousGoingFirst.total >= 2
              ? currentGoingFirst.winRate !== null &&
                previousGoingFirst.winRate !== null &&
                currentGoingFirst.winRate > previousGoingFirst.winRate
                ? "Stronger"
                : currentGoingFirst.winRate !== null &&
                    previousGoingFirst.winRate !== null &&
                    currentGoingFirst.winRate < previousGoingFirst.winRate
                  ? "Softer"
                  : "Stable"
              : "Thin sample",
          tone:
            currentGoingFirst.total >= 2 &&
            previousGoingFirst.total >= 2 &&
            currentGoingFirst.winRate !== null &&
            previousGoingFirst.winRate !== null &&
            currentGoingFirst.winRate > previousGoingFirst.winRate
              ? "emerald"
              : currentGoingFirst.total >= 2 &&
                  previousGoingFirst.total >= 2 &&
                  currentGoingFirst.winRate !== null &&
                  previousGoingFirst.winRate !== null &&
                  currentGoingFirst.winRate < previousGoingFirst.winRate
                ? "rose"
                : "blue",
        },
        {
          label: "Going second",
          current: formatPercent(currentGoingSecond.winRate),
          previous: formatPercent(previousGoingSecond.winRate),
          insight:
            currentGoingSecond.total >= 2 && previousGoingSecond.total >= 2
              ? currentGoingSecond.winRate !== null &&
                previousGoingSecond.winRate !== null &&
                currentGoingSecond.winRate > previousGoingSecond.winRate
                ? "Holding better"
                : currentGoingSecond.winRate !== null &&
                    previousGoingSecond.winRate !== null &&
                    currentGoingSecond.winRate < previousGoingSecond.winRate
                  ? "Still weak"
                  : "Stable"
              : "Thin sample",
          tone:
            currentGoingSecond.total >= 2 &&
            previousGoingSecond.total >= 2 &&
            currentGoingSecond.winRate !== null &&
            previousGoingSecond.winRate !== null &&
            currentGoingSecond.winRate > previousGoingSecond.winRate
              ? "emerald"
              : currentGoingSecond.total >= 2 &&
                  previousGoingSecond.total >= 2 &&
                  currentGoingSecond.winRate !== null &&
                  previousGoingSecond.winRate !== null &&
                  currentGoingSecond.winRate < previousGoingSecond.winRate
                ? "rose"
                : "blue",
        },
        {
          label: "Main loss issue",
          current: formatLossTag(repeatedLossTag),
          previous: formatLossTag(previousRepeatedLossTag),
          insight: repeatedLossTag ? "Watch this" : "No repeat yet",
          tone: repeatedLossTag ? "rose" : "blue",
        },
      ]
    : [];

  const currentArchetypeNormalized = normalizeText(deckArchetype);
  const watchlistSource = Array.from(
    new Set(
      archetypes.filter(
        (archetype) =>
          archetype &&
          archetype !== OTHER_ARCHETYPE &&
          normalizeText(archetype) !== currentArchetypeNormalized
      )
    )
  ).slice(0, 5);
  const opponentCounts = currentMatches.reduce((counts, match) => {
    const key = normalizeText(match.opponent_archetype);
    if (!key) {
      return counts;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const now = Date.now();
  const metaWatchlist = watchlistSource.map((archetype, index) => {
    const count = opponentCounts.get(normalizeText(archetype)) ?? 0;
    const status = getMetaWatchStatus(count);
    const priority = getMetaWatchPriority(count, index);
    const seenRecently = currentMatches.some((match) => {
      if (normalizeText(match.opponent_archetype) !== normalizeText(archetype)) {
        return false;
      }

      return now - new Date(match.played_at).getTime() <= 1000 * 60 * 60 * 24 * 14;
    });

    return {
      archetype,
      count,
      status: status.status,
      statusLabel: status.label,
      tone: status.tone,
      priorityLabel: priority.label,
      priorityTone: priority.tone,
      recentLabel: seenRecently ? "Seen recently" : "No recent games",
    };
  });

  const recommendation = (() => {
    const remainingToTarget = Math.max(currentVersionTarget - currentSampleSize, 0);
    const lowDataWatchlist = metaWatchlist.filter((item) => item.count <= 2).slice(0, 2);

    if (!previousVersion) {
      return remainingToTarget > 0
        ? `Log ${remainingToTarget} more game${remainingToTarget === 1 ? "" : "s"} before making your first change.`
        : "Create a new version when you have a specific list change to test.";
    }

    if (currentSampleSize < 5 || previousSampleSize < 5) {
      return remainingToTarget > 0
        ? `No clear version read yet. Log ${remainingToTarget} more clean game${remainingToTarget === 1 ? "" : "s"}.`
        : "You have an early version read now. Keep logging a little longer before you swap the list again.";
    }

    const goingSecondRegression = regressions.find((signal) =>
      signal.label.toLowerCase().includes("going second")
    );
    if (goingSecondRegression) {
      return "Setup looks better, but going second still needs attention.";
    }

    if (lowDataWatchlist.length > 0) {
      return `If you face ${lowDataWatchlist.map((item) => item.archetype).join(" or ")}, prioritize clean logs.`;
    }

    if (improvements.length > 0) {
      return "You have enough games to compare this version with the previous one.";
    }

    return "Watch this version for a few more games before you change the list.";
  })();

  return {
    activeVersionName,
    previousVersionName,
    currentSampleSize,
    previousSampleSize,
    currentVersionSampleDisplay,
    currentVersionSampleSummary,
    cleanLogDisplay,
    cleanLogSummary,
    versionReadStatus: versionReadMeta.status,
    versionReadLabel: versionReadMeta.label,
    versionReadTone: versionReadMeta.tone,
    versionReadSummary,
    versionConclusion,
    nextObservation,
    sampleCaution: versionReadMeta.caution,
    changedTooSoonWarning,
    comparisonRows,
    improvements: improvements.slice(0, 3),
    regressions: regressions.slice(0, 3),
    cleanLogCount,
    cleanLogTotal: currentSampleSize,
    cleanLogStreak,
    currentVersionTarget,
    versionPatienceStatus,
    versionPatienceLabel,
    versionPatienceTone,
    versionPatienceSummary,
    disciplineHabits,
    logQualityCallout,
    metaWatchlist,
    recommendation,
  };
}

export function getDeckLabToneClasses(tone: DeckLabStatusTone) {
  if (tone === "emerald") {
    return "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]";
  }

  if (tone === "rose") {
    return "bg-[#F43F5E]/10 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]";
  }

  if (tone === "gold") {
    return "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]";
  }

  return "bg-[#4F8CFF]/10 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]";
}
