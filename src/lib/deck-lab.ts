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

export type DeckLabMetaWatchItem = {
  archetype: string;
  count: number;
  status: DeckLabMetaSampleStatus;
  statusLabel: string;
  tone: DeckLabStatusTone;
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
  sampleCaution: string;
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
  const currentGoingSecond = getTurnSplit(currentMatches, false);
  const previousGoingSecond = getTurnSplit(previousMatches, false);
  const repeatedLossTag = getRepeatedLossTag(currentMatches);

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
      `"${repeatedLossTag.tag}" keeps showing up in losses`,
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
  const metaWatchlist = watchlistSource.map((archetype) => {
    const count = opponentCounts.get(normalizeText(archetype)) ?? 0;
    const status = getMetaWatchStatus(count);

    return {
      archetype,
      count,
      status: status.status,
      statusLabel: status.label,
      tone: status.tone,
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
    sampleCaution: versionReadMeta.caution,
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
