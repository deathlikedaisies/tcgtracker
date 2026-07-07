import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  Beaker,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { DeckVersionEditForm } from "@/components/decks/DeckVersionEditForm";
import { DeckVersionForm } from "@/components/decks/DeckVersionForm";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  glassPanel,
  glassPanelStrong,
  interactiveTile,
  logoOnDark,
  pageTitle,
  premiumInset,
  primaryButton,
  statCard,
  secondaryButton,
  sectionCopy,
  sectionTitle,
} from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { getArchetypeOptions } from "@/lib/archetypes";
import {
  analyzeDeckList,
  getDecklistHealth,
  type DecklistAnalysis,
  isClearArchetypeSuggestion,
} from "@/lib/decklist";
import {
  buildDeckLabSummary,
  getDeckLabToneClasses,
} from "@/lib/deck-lab";
import { LATEST_FORMAT } from "@/lib/formats";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import {
  countMatchResults,
  parseMatchMetadata,
  type MatchMetadata,
  type MatchResult,
} from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  createDeckVersion,
  deleteDeckVersion,
  markDeckVersionActive,
  updateDeckVersion,
  updateDeckArchetype,
} from "./actions";

type DeckDetailPageProps = {
  params: Promise<{
    deckId: string;
  }>;
  searchParams: Promise<{
    created?: string;
  }>;
};

type DeckVersion = {
  id: string;
  name: string | null;
  decklist: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

function safeText(value: unknown, fallback: string) {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function safeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDecklistUiText(value: string) {
  if (!/[ÃÂâ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

function getDeckVersions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (version): version is DeckVersion =>
          Boolean(version) && typeof version === "object"
      )
    : [];
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function safeAnalyzeDeckList(decklist: string | null | undefined): {
  analysis: DecklistAnalysis | null;
  parseError: string | null;
} {
  if (!decklist?.trim()) {
    return { analysis: null, parseError: null };
  }

  try {
    return { analysis: analyzeDeckList(decklist), parseError: null };
  } catch {
    return {
      analysis: null,
      parseError: "This version list could not be parsed. Review the raw list before trusting the analysis.",
    };
  }
}

function getVersionTestStatus(matches: { result: MatchResult }[]) {
  const { wins, total } = countMatchResults(matches);
  const winRate = total ? Math.round((wins / total) * 100) : 0;

  if (total < 3) {
    return {
      label: "Needs games",
      detail: total
        ? `Log ${Math.max(3 - total, 0)} more game${3 - total === 1 ? "" : "s"} to unlock a read`
        : "No games logged yet",
      className:
        "bg-[#4F8CFF]/10 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]",
    };
  }

  if (total < 5) {
    return {
      label: "Building signal",
      detail: `${winRate}% over ${total} games`,
      className:
        "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]",
    };
  }

  return {
    label: winRate >= 55 ? "Improving signal" : "No clear trend",
    detail: `${winRate}% over ${total} games`,
    className:
      winRate >= 55
        ? "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]"
        : "bg-[#F43F5E]/10 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]",
  };
}

function getQualityRate(
  matches: { metadata: MatchMetadata }[],
  field: "opening_hand_quality" | "sequencing_quality"
) {
  const known = matches.filter((match) => Boolean(match.metadata[field]));
  const strong = known.filter((match) => {
    const value = match.metadata[field];
    return value === "good" || value === "great";
  }).length;

  return {
    known: known.length,
    strong,
    percent: known.length ? Math.round((strong / known.length) * 100) : null,
  };
}

function getMostCommonLossTag(matches: { result: MatchResult; match_tags: { tag: string }[] | null }[]) {
  const counts = new Map<string, number>();

  matches
    .filter((match) => match.result === "loss")
    .forEach((match) => {
      match.match_tags?.forEach((tag) => {
        counts.set(tag.tag, (counts.get(tag.tag) ?? 0) + 1);
      });
    });

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ?? null;
}

function getSuggestionBadgeTone(confidence: "high" | "medium" | "low" | "none") {
  return confidence === "high"
    ? "bg-emerald-500/14 text-emerald-200"
    : "bg-[#F5C84C]/14 text-[#F5C84C]";
}

export default async function DeckDetailPage({
  params,
  searchParams,
}: DeckDetailPageProps) {
  const { deckId } = await params;
  const { created } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, name, archetype, notes")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (deckError || !deck) {
    notFound();
  }

  const { data: versions, error: versionsError } = await supabase
    .from("deck_versions")
    .select("id, name, decklist, notes, is_active, created_at")
    .eq("deck_id", deck.id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const deckVersions = getDeckVersions(versions);
  const createVersion = createDeckVersion.bind(null, deck.id);

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "deck_version_id, opponent_archetype, result, went_first, event_type, played_at, metadata, match_tags(tag)"
    )
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as {
    deck_version_id: string;
    opponent_archetype: string;
    result: MatchResult;
    went_first: boolean | null;
    event_type: string | null;
    played_at: string;
    metadata: MatchMetadata | Record<string, unknown> | null;
    match_tags: { tag: string }[] | null;
  }[];
  const normalizedMatchRows = matchRows.map((match) => ({
    ...match,
    metadata: parseMatchMetadata(match.metadata),
  }));

  const sessionCoach = buildSessionCoachInsight(matchRows);
  const versionInsights = deckVersions.map((version) => {
      const { analysis, parseError } = safeAnalyzeDeckList(version.decklist);
      const versionMatches = normalizedMatchRows.filter(
        (match) => match.deck_version_id === version.id
      );
      const performance = countMatchResults(versionMatches);
      const openingQuality = getQualityRate(
        versionMatches,
        "opening_hand_quality"
      );
      const sequencingQuality = getQualityRate(
        versionMatches,
        "sequencing_quality"
      );
      const topLossTag = getMostCommonLossTag(versionMatches);

      return {
        versionId: version.id,
        analysis,
        parseError,
        versionMatches,
        performance,
        openingQuality,
        sequencingQuality,
        topLossTag,
      };
    });

  const versionInsightById = new Map(
    versionInsights.map((insight) => [insight.versionId, insight])
  );
  const clearSuggestedArchetypes = versionInsights
    .map((insight) => insight.analysis?.suggestion ?? null)
    .filter((suggestion): suggestion is NonNullable<typeof suggestion> => Boolean(suggestion))
    .filter((suggestion) => isClearArchetypeSuggestion(suggestion))
    .map((suggestion) => suggestion.archetype);
  const archetypeOptions = getArchetypeOptions(LATEST_FORMAT, [
    ...(deck.archetype ? [deck.archetype] : []),
    ...clearSuggestedArchetypes,
  ]);
  const setDeckArchetype = updateDeckArchetype.bind(null, deck.id);
  const totalDeckMatches = matchRows.filter((match) =>
    deckVersions.some((version) => version.id === match.deck_version_id)
  );
  const totalRecord = countMatchResults(totalDeckMatches);
  const totalWinRate = totalRecord.total
    ? Math.round((totalRecord.wins / totalRecord.total) * 100)
    : 0;
  const deckName = safeText(deck.name, "Untitled deck");
  const deckNotes = safeOptionalText(deck.notes);
  const deckArchetype = safeText(deck.archetype, "Unknown archetype");
  const activeVersion =
    deckVersions.find((version) => version.is_active) ?? deckVersions[0] ?? null;
  const deckLab = buildDeckLabSummary({
    deckArchetype: deck.archetype,
    versions: deckVersions,
    activeVersionId: activeVersion?.id ?? null,
    matches: normalizedMatchRows,
  });
  const showVersionComparison = Boolean(
    deckLab.previousVersionName && deckLab.comparisonRows.length
  );
  const deckLabVisibleSignal =
    deckLab.regressions[0] ?? deckLab.improvements[0] ?? null;
  const visibleDisciplineHabits = (() => {
    const warningHabit = deckLab.disciplineHabits.find(
      (habit) => habit.tone === "gold" || habit.tone === "rose"
    );
    const positiveOrSampleHabit =
      deckLab.disciplineHabits.find(
        (habit) => habit.label === "Sample builder"
      ) ??
      deckLab.disciplineHabits.find(
        (habit) => habit.label === "Version discipline"
      ) ??
      deckLab.disciplineHabits.find(
      (habit) => habit.tone === "emerald"
      ) ??
      null;

    return [positiveOrSampleHabit, warningHabit]
      .filter((habit, index, habits): habit is NonNullable<typeof habit> =>
        Boolean(habit) && habits.findIndex((candidate) => candidate?.label === habit?.label) === index
      )
      .slice(0, 2);
  })();
  const hiddenHabitCount = Math.max(
    deckLab.disciplineHabits.length - visibleDisciplineHabits.length,
    0
  );
  const formatDisciplineHabit = (label: string, statusLabel: string) => {
    if (label === "Clean logger") {
      return statusLabel;
    }

    if (label === "Sample builder") {
      return statusLabel;
    }

    if (label === "Version discipline") {
      return statusLabel === "Patient testing" ? "Version discipline" : statusLabel;
    }

    if (label === "Going-second tracker") {
      return statusLabel === "Needs more data" ? "Going second: thin" : "Going second ready";
    }

    if (label === "Meta watcher") {
      return statusLabel === "Coverage building" ? "Meta coverage" : "Watchlist thin";
    }

    return statusLabel;
  };
  const getMetaRowChip = (item: (typeof deckLab.metaWatchlist)[number]) => {
    if (item.count >= 5) {
      return { label: "Enough for now", tone: "emerald" as const };
    }

    if (item.count === 0) {
      return { label: "No data", tone: "blue" as const };
    }

    if (item.count <= 2) {
      return { label: "Needs more", tone: "gold" as const };
    }

    if (item.count <= 4) {
      return { label: "Early read", tone: "blue" as const };
    }

    return { label: item.statusLabel, tone: item.tone };
  };
  const activeVersionName = activeVersion
    ? safeText(activeVersion.name, "Untitled version")
    : "No active version";
  const primaryDeckActionHref = !deckVersions.length
    ? "#versions"
    : activeVersion
      ? `/matches/new?deck_version_id=${activeVersion.id}`
      : "#versions";
  const primaryDeckActionLabel = !deckVersions.length
    ? "Add first version"
    : !totalRecord.total
      ? "Log first game"
      : "Log game";
  const secondaryDeckActionHref = !deckVersions.length
    ? "#manual-archetype"
    : totalRecord.total > 0
      ? `/review?deck_id=${deck.id}`
      : "#add-version";
  const secondaryDeckActionLabel = !deckVersions.length
    ? "Set deck identity"
    : totalRecord.total > 0
      ? "View review"
      : "Add version";
  const bestVersion = versionInsights
    .filter((insight) => insight.performance.total >= 3)
    .sort((left, right) => {
      const leftRate = left.performance.total
        ? Math.round((left.performance.wins / left.performance.total) * 100)
        : 0;
      const rightRate = right.performance.total
        ? Math.round((right.performance.wins / right.performance.total) * 100)
        : 0;

      if (rightRate !== leftRate) {
        return rightRate - leftRate;
      }

      return right.performance.total - left.performance.total;
    })[0];
  const versionEvidenceRows = deckVersions.map((version) => {
    const insight = versionInsightById.get(version.id);
    if (!insight) {
      return null;
    }

    const openingRate = insight.openingQuality.percent;
    const sequencingRate = insight.sequencingQuality.percent;
    const total = insight.performance.total;
    const winRate = total
      ? Math.round((insight.performance.wins / total) * 100)
      : null;

    return {
      versionId: version.id,
      versionName: safeText(version.name, "Untitled version"),
      isActive: version.is_active,
      total,
      winRate,
      openingRate,
      openingKnown: insight.openingQuality.known,
      sequencingRate,
      sequencingKnown: insight.sequencingQuality.known,
      topLossTag: insight.topLossTag,
    };
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
  const versionsWithOpeningSignal = versionEvidenceRows
    .filter((row) => row.openingRate !== null && row.openingKnown >= 4)
    .sort((left, right) => (right.openingRate ?? 0) - (left.openingRate ?? 0));
  const strongestOpeningVersion = versionsWithOpeningSignal[0] ?? null;
  const weakestOpeningVersion =
    versionsWithOpeningSignal.length > 1
      ? versionsWithOpeningSignal[versionsWithOpeningSignal.length - 1]
      : null;
  const versionEvidenceSummary =
    strongestOpeningVersion &&
    weakestOpeningVersion &&
    strongestOpeningVersion.versionId !== weakestOpeningVersion.versionId &&
    (strongestOpeningVersion.openingRate ?? 0) - (weakestOpeningVersion.openingRate ?? 0) >= 10
      ? {
          title: `${strongestOpeningVersion.versionName} is showing the cleanest starts so far`,
          detail: `${strongestOpeningVersion.openingRate}% good or great openings versus ${weakestOpeningVersion.openingRate}% on ${weakestOpeningVersion.versionName}.`,
          evidence: strongestOpeningVersion.total >= 8 && weakestOpeningVersion.total >= 8
            ? "This is a meaningful opening-quality gap, not just a tiny sample."
            : "Useful early signal, but keep logging before you lock the list.",
        }
      : bestVersion
        ? {
            title: `${safeText(
              deckVersions.find((version) => version.id === bestVersion.versionId)?.name,
              "Version"
            )} is stronger so far`,
            detail: `${Math.round(
              (bestVersion.performance.wins / bestVersion.performance.total) * 100
            )}% win rate across ${bestVersion.performance.total} games.`,
            evidence:
              bestVersion.performance.total >= 8
                ? "Use this as the current benchmark while you keep comparing versions."
                : "Early signal only. Add more games before calling the test settled.",
          }
        : null;
  const bestCurrentVersionHint = strongestOpeningVersion
    ? `Best current signal: ${strongestOpeningVersion.versionName}`
    : activeVersion
      ? "Current active version needs more games"
      : "No clear version winner yet";
  const versionEvidenceCaution =
    versionEvidenceRows.filter((row) => row.total >= 5).length >= 2
      ? "Matchup spread may still explain part of the gap, so keep the versions in rotation until the cleaner read holds."
      : "Most versions still need more controlled games before this turns into a confident recommendation.";
  const versionEvidenceRowsWithInterpretation = versionEvidenceRows.map((row) => {
    const openingGap =
      strongestOpeningVersion && row.openingRate !== null && strongestOpeningVersion.openingRate !== null
        ? row.openingRate - strongestOpeningVersion.openingRate
        : null;
    const sequencingNote =
      row.sequencingRate !== null
        ? `${row.sequencingRate}% good or great sequencing`
        : "Sequencing read still thin";

    let interpretation = "Needs more games before this version has a trustworthy read.";

    if (row.total >= 8 && openingGap !== null && openingGap >= 0) {
      interpretation = `${row.versionName} is showing the cleanest starts so far. ${sequencingNote}.`;
    } else if (row.total >= 5 && row.openingRate !== null) {
      interpretation =
        openingGap !== null && openingGap <= -10
          ? `${row.versionName} is trailing the cleanest opener so far. Keep it in the pool until you know whether matchup spread explains the gap.`
          : `${row.versionName} is building a usable signal. ${sequencingNote}.`;
    } else if (row.total > 0) {
      interpretation = `${row.versionName} is still early. Log at least 5 games before treating this version as better.`;
    }

    return {
      ...row,
      interpretation,
    };
  });
  const hasDeckVersions = deckVersions.length > 0;
  const hasDeckGames = totalRecord.total > 0;
  const needsFirstVersionSetup = !hasDeckVersions;
  const needsFirstGame = hasDeckVersions && !hasDeckGames;
  const showVersionEvidence = hasDeckVersions && hasDeckGames;
  const deckHeaderStats = [
    {
      label: "Versions",
      value: `${deckVersions.length} saved`,
    },
    {
      label: "Games logged",
      value: totalRecord.total ? `${totalRecord.total} games` : "No games yet",
    },
    {
      label: hasDeckVersions ? "Active version" : "Next step",
      value: hasDeckVersions
        ? activeVersion
          ? safeText(activeVersion.name, "Untitled version")
          : "No active version"
        : "Add your first version",
    },
    ...(hasDeckGames
      ? [
          {
            label: "Best current read",
            value: bestVersion
              ? `${safeText(
                  deckVersions.find((version) => version.id === bestVersion.versionId)?.name,
                  "Version"
                )} ${Math.round(
                  (bestVersion.performance.wins / bestVersion.performance.total) * 100
                )}%`
              : `${totalWinRate}% overall`,
          },
        ]
      : []),
  ];

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="decks"
          deckLabel={deckName}
          insight={{
            label: "Version test",
            value: sessionCoach?.missionSkill ?? "Build a sample",
            helper: `${deckVersions.length} version${deckVersions.length === 1 ? "" : "s"}`,
          }}
        />

        <div className={`${appMain} mx-auto w-full max-w-7xl gap-6`}>
          <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <SixPrizerLogo {...logoOnDark} />
              <div className="lg:hidden">
                <AppNav current="decks" />
              </div>
            </div>

            <section className={`mt-5 p-5 sm:p-6 ${glassPanelStrong}`}>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-start">
                <div className="min-w-0">
                  <div className="flex gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(79,140,255,0.20),rgba(11,16,32,0.92))] shadow-[0_20px_38px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(79,140,255,0.16)] sm:h-[92px] sm:w-[92px]">
                      <ArchetypeSprites
                        archetype={deckArchetype}
                        size="lg"
                        variant="bare"
                        className="shrink-0"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#4F8CFF]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                          Active deck
                        </span>
                        <span className="rounded-full bg-[#0B1020]/62 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
                          {deckArchetype}
                        </span>
                      </div>
                      <h1 className={pageTitle}>{deckName}</h1>
                      <p className="mt-1 text-sm font-medium text-[#DCE8FF]">
                        Testing: {activeVersionName}
                      </p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/72">
                        {deckNotes ?? "Use this page to compare versions, keep the current test active, and decide what to log next."}
                      </p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Link href={primaryDeckActionHref} className={primaryButton}>
                          {primaryDeckActionLabel}
                        </Link>
                        <Link href={secondaryDeckActionHref} className={secondaryButton}>
                          {secondaryDeckActionLabel}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`grid gap-3 ${
                    deckHeaderStats.length > 3 ? "sm:grid-cols-2" : ""
                  }`}
                >
                  {deckHeaderStats.map((stat) => (
                    <div key={stat.label} className={`${statCard} p-3`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {created === "1" ? (
            <div className="rounded-[24px] bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100 shadow-[0_18px_40px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(34,197,94,0.16)]">
              <p className="font-semibold text-emerald-200">Deck created</p>
              <p className="mt-1 text-emerald-100/86">
                {deckVersions.length
                  ? "Your deck is ready. Pick the active test version you want to log games with."
                  : "Your deck family is saved. Add the first test version below to start logging games."}
              </p>
            </div>
          ) : null}

          {needsFirstVersionSetup ? (
            <section id="versions" className="grid gap-4 scroll-mt-8">
              <div className={`p-5 sm:p-6 ${glassPanelStrong}`}>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#F5C84C]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                        No versions yet
                      </span>
                      <span className="rounded-full bg-[#4F8CFF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                        First setup
                      </span>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#F8FAFC] sm:text-3xl">
                      Create your first deck version
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/78">
                      Paste the exact list you want to test first. Once saved,
                      SixPrizer can track games, compare future versions, and
                      surface matchup insights.
                    </p>
                  </div>

                  <div className={`${premiumInset} grid gap-3 p-4`}>
                    {[
                      {
                        title: "Paste your current 60",
                        copy: "Save the list exactly as you want to test it.",
                      },
                      {
                        title: "Log games on this version",
                        copy: "Every match attaches to the saved build.",
                      },
                      {
                        title: "Create a new version when you change cards",
                        copy: "Future builds can be compared against this baseline.",
                      },
                    ].map((step, index) => (
                      <div key={step.title} className="flex gap-3">
                        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F5C84C]/12 text-xs font-bold text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#F8FAFC]">
                            {step.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                            {step.copy}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <DeckVersionForm
                    action={createVersion}
                    deckHref={`/decks/${deck.id}`}
                    title="Create your first deck version"
                    description="Paste the exact 60-card list you want to use as your first test sample."
                    submitLabel="Create first version"
                    notesPlaceholder="What are you testing with this first build?"
                    className="border-white/8 bg-[linear-gradient(180deg,rgba(15,26,45,0.96),rgba(7,17,31,0.92))] p-0 shadow-none"
                  />
                </div>
              </div>

              <details className={`p-4 ${glassPanel}`}>
                <summary className="cursor-pointer list-none text-sm font-semibold text-[#DCE8FF] marker:hidden">
                  Deck identity settings
                </summary>
                <form
                  id="manual-archetype"
                  action={setDeckArchetype}
                  className="mt-4 flex flex-col gap-4"
                >
                  <p className={sectionCopy}>
                    Manual archetype is optional setup context. Creating version 1 is
                    the main step.
                  </p>
                  <ArchetypePicker
                    id="deck-archetype"
                    name="archetype"
                    label="Manual archetype"
                    options={archetypeOptions}
                    defaultValue={deckArchetype}
                    customOptionPrefix="Use custom deck archetype"
                    required
                  />
                  <button type="submit" className={secondaryButton}>
                    Save manual archetype
                  </button>
                </form>
              </details>
            </section>
          ) : null}

          {!needsFirstVersionSetup ? (
          <section className={`p-4 sm:p-5 ${glassPanel}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                  Deck Lab
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#F8FAFC]">
                  {deckLab.versionReadStatus === "baseline_ready" &&
                  !deckLab.previousVersionName
                    ? "You have a usable baseline."
                    : "Test this version before changing the list."}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
                  {deckLab.recommendation}
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#0B1020]/62 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
                Active version: {deckLab.activeVersionName}
              </span>
            </div>

            <div
              className={`mt-4 grid gap-4 ${
                showVersionComparison ? "xl:grid-cols-2" : "xl:grid-cols-3"
              }`}
            >
              <article className={`${premiumInset} min-w-0 p-4`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#F8FAFC]">Version read</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getDeckLabToneClasses(
                      deckLab.versionReadTone
                    )}`}
                  >
                    {deckLab.versionReadLabel}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#D6E0F0]/86">
                  {deckLab.versionReadSummary}
                </p>
                <p className="mt-2 text-sm font-medium text-[#F8FAFC]">
                  {deckLab.versionConclusion}
                </p>
                <div className="mt-3 grid gap-3 min-[430px]:grid-cols-2">
                  <div className={`${statCard} p-3`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Current sample
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                      {deckLab.currentSampleSize} games
                    </p>
                  </div>
                  <div className={`${statCard} p-3`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Previous version
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                      {deckLab.previousVersionName
                        ? `${deckLab.previousVersionName} • ${deckLab.previousSampleSize} games`
                        : "No previous version"}
                    </p>
                  </div>
                </div>
                {deckLab.changedTooSoonWarning ? (
                  <p className="mt-3 rounded-2xl bg-[#F5C84C]/10 px-3 py-2 text-xs leading-5 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
                    {deckLab.changedTooSoonWarning}
                  </p>
                ) : null}
                {deckLabVisibleSignal ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getDeckLabToneClasses(
                        deckLabVisibleSignal.tone
                      )}`}
                    >
                      {deckLabVisibleSignal.label}
                    </span>
                  </div>
                ) : null}
                <div className={`${statCard} mt-3 p-3`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    What to watch next
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#D6E0F0]/86">
                    {deckLab.nextObservation}
                  </p>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#94A3B8]/72">
                  {deckLab.sampleCaution}
                </p>
              </article>

              {showVersionComparison ? (
                <article className={`${premiumInset} min-w-0 p-4`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      Version comparison
                    </p>
                    <span className="rounded-full bg-[#0B1020]/62 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
                      {deckLab.activeVersionName} vs {deckLab.previousVersionName}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {deckLab.comparisonRows.map((row) => (
                      <div
                        key={row.label}
                        className={`${statCard} grid gap-2 p-3 min-[430px]:grid-cols-[minmax(0,0.9fr)_minmax(0,0.75fr)_minmax(0,0.75fr)_auto] min-[430px]:items-center`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          {row.label}
                        </p>
                        <p className="text-sm font-semibold text-[#F8FAFC]">
                          {row.current}
                        </p>
                        <p className="text-sm text-[#94A3B8]">
                          {row.previous}
                        </p>
                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${getDeckLabToneClasses(
                            row.tone
                          )}`}
                        >
                          {row.insight}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              <article className={`${premiumInset} min-w-0 p-4`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#F8FAFC]">
                    Testing discipline
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getDeckLabToneClasses(
                      deckLab.versionPatienceTone
                    )}`}
                  >
                    {deckLab.versionPatienceLabel}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 min-[430px]:grid-cols-2">
                  <div className={`${statCard} p-3`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Current version sample
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                      {deckLab.currentVersionSampleDisplay}
                    </p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]/72">
                      {deckLab.currentVersionSampleSummary}
                    </p>
                  </div>
                  <div className={`${statCard} p-3`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Clean logs
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                      {deckLab.cleanLogDisplay}
                    </p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]/72">
                      {deckLab.cleanLogSummary}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleDisciplineHabits.map((habit) => (
                    <span
                      key={habit.label}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getDeckLabToneClasses(
                        habit.tone
                      )}`}
                    >
                      {formatDisciplineHabit(habit.label, habit.statusLabel)}
                    </span>
                  ))}
                </div>
                {hiddenHabitCount > 0 ? (
                  <p className="mt-2 text-[11px] text-[#94A3B8]/72">
                    +{hiddenHabitCount} more habit{hiddenHabitCount === 1 ? "" : "s"}
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-6 text-[#D6E0F0]/86">
                  {deckLab.versionPatienceSummary}
                </p>
                {deckLab.logQualityCallout ? (
                  <p className="mt-3 rounded-2xl bg-[#4F8CFF]/10 px-3 py-2 text-xs leading-5 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                    {deckLab.logQualityCallout}
                  </p>
                ) : null}
                <p className="mt-2 text-xs leading-5 text-[#94A3B8]/72">
                  Clean logs help SixPrizer give better reads.
                </p>
              </article>

              <article className={`${premiumInset} min-w-0 p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      Meta watchlist
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                      If these show up on ladder, log them cleanly. They are not required targets.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {deckLab.metaWatchlist.map((item) => (
                    <div
                      key={item.archetype}
                      className={`${statCard} flex min-w-0 items-center justify-between gap-3 p-3`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                          {item.archetype}
                        </p>
                        <p className="mt-1 text-[11px] text-[#94A3B8]/72">
                          {item.count === 1 ? "1 game" : `${item.count} games`} · {item.recentLabel}
                        </p>
                      </div>
                      {(() => {
                        const rowChip = getMetaRowChip(item);
                        return (
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getDeckLabToneClasses(
                              rowChip.tone
                            )}`}
                          >
                            {rowChip.label}
                          </span>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
          ) : null}

          {sessionCoach && hasDeckGames ? (
            <section className={`p-4 ${glassPanel}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                    Current experiment
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                    {sessionCoach.missionTitle}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
                    {sessionCoach.nextAction}
                  </p>
                </div>
                <div className="rounded-full bg-[#0B1020]/62 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
                  {sessionCoach.missionProgress}/{sessionCoach.missionTargetCount} games
                </div>
              </div>
            </section>
          ) : null}

          {!needsFirstVersionSetup ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <section id="versions" className="grid gap-4 scroll-mt-8">
              <div className={`p-4 ${glassPanel}`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                    <Beaker className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className={sectionTitle}>Test versions</h2>
                    <p className={`mt-1 ${sectionCopy}`}>
                      {needsFirstVersionSetup
                        ? "Start by adding the build you actually want to test."
                        : needsFirstGame
                          ? "You have a version saved. Log a few games before SixPrizer starts comparing builds."
                        : "Manual archetype sets deck identity. Auto-detection below shows version-specific parser evidence."}
                    </p>
                  </div>
                </div>
              </div>

              {showVersionEvidence ? (
              <div className={`p-5 ${glassPanelStrong}`}>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                      Version evidence
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                      {versionEvidenceSummary?.title ?? "Version signal is still early"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]/74">
                      {versionEvidenceSummary?.detail ??
                        "This panel compares opening quality, sequencing quality, and recurring loss tags so you can tell whether a version is actually cleaner or just running hot."}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#DCE8FF]">
                      {versionEvidenceSummary?.evidence ??
                        "Once each version has a real sample, the strongest signal should separate itself here."}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className={`${statCard} p-3`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Best current signal
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                          {bestCurrentVersionHint}
                        </p>
                      </div>
                      <div className={`${statCard} p-3`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Sample honesty
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                          {versionEvidenceRows.filter((row) => row.total >= 5).length >= 2
                            ? "Controlled signal is building"
                            : "Needs more games"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#94A3B8]/72">
                      {versionEvidenceCaution}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {versionEvidenceRowsWithInterpretation.map((row) => (
                      <div
                        key={row.versionId}
                        className={`${premiumInset} grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#F8FAFC]">
                              {row.versionName}
                            </p>
                            {row.isActive ? (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                            {row.topLossTag
                              ? `Most common loss tag: ${row.topLossTag[0]} (${row.topLossTag[1]} losses)`
                              : row.total
                                ? "No repeated loss tag yet."
                                : "No games logged yet for this version."}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#D6E0F0]/82">
                            {row.interpretation}
                          </p>
                        </div>
                        <div className="grid gap-3 min-[430px]:grid-cols-2">
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Games
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                              {row.total}
                            </p>
                          </div>
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Win rate
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                              {row.winRate !== null ? `${row.winRate}%` : "N/A"}
                            </p>
                          </div>
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Opening quality
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                              {row.openingRate !== null ? `${row.openingRate}%` : "N/A"}
                            </p>
                            <p className="mt-1 text-[11px] text-[#94A3B8]/72">
                              {row.openingKnown
                                ? `${row.openingKnown} rated games`
                                : "No opening ratings"}
                            </p>
                          </div>
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Sequencing quality
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                              {row.sequencingRate !== null ? `${row.sequencingRate}%` : "N/A"}
                            </p>
                            <p className="mt-1 text-[11px] text-[#94A3B8]/72">
                              {row.sequencingKnown
                                ? `${row.sequencingKnown} rated games`
                                : "No sequencing ratings"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              ) : null}

              {needsFirstVersionSetup ? (
                <div className={`p-5 sm:p-6 ${glassPanelStrong}`}>
                  <DeckVersionForm
                    action={createVersion}
                    deckHref={`/decks/${deck.id}`}
                    title={
                      deckVersions.length
                        ? "Set up an active test version"
                        : "Add your first test version"
                    }
                    description={
                      deckVersions.length
                        ? "Paste a 60-card list and name the build you want to use for new match logs. You can mark it active immediately."
                        : "Versions are what you log games with. Paste a 60-card list, give this build a clear name, and start your first test."
                    }
                    submitLabel={
                      deckVersions.length ? "Create active test version" : "Create first version"
                    }
                    notesPlaceholder="What are you testing with this build?"
                    className="border-white/8 bg-[linear-gradient(180deg,rgba(15,26,45,0.96),rgba(7,17,31,0.92))] p-0 shadow-none"
                  />
                </div>
              ) : null}

              {deckVersions.length ? (
                deckVersions.map((version) => {
                  const markActive = markDeckVersionActive.bind(
                    null,
                    deck.id,
                    version.id
                  );
                  const saveVersionEdits = updateDeckVersion.bind(
                    null,
                    deck.id,
                    version.id
                  );
                  const removeVersion = deleteDeckVersion.bind(
                    null,
                    deck.id,
                    version.id
                  );
                  const insight = versionInsightById.get(version.id);
                  const analysis = insight?.analysis;
                  const parseError = insight?.parseError ?? null;
                  const listHealth = getDecklistHealth(
                    analysis ?? null,
                    parseError,
                    Boolean(version.decklist?.trim())
                  );
                  const versionMatches = insight?.versionMatches ?? [];
                  const testStatus = getVersionTestStatus(versionMatches);
                  const versionName = version.name?.trim() || "Untitled version";
                  const wins = insight?.performance.wins ?? 0;
                  const losses = insight?.performance.losses ?? 0;
                  const ties = insight?.performance.ties ?? 0;
                  const total = insight?.performance.total ?? 0;
                  const winRate = total ? Math.round((wins / total) * 100) : 0;
                  const canDeleteVersion = total === 0;
                  const versionLogHref = `/matches/new?deck_version_id=${version.id}`;

                  return (
                    <article
                      key={version.id}
                      className="rounded-[26px] bg-[radial-gradient(circle_at_top_left,rgba(79,140,255,0.12),transparent_34%),linear-gradient(180deg,rgba(15,26,45,0.94),rgba(7,17,31,0.88))] p-4 shadow-[0_20px_54px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.08)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold text-[#F8FAFC]">
                              {versionName}
                            </h3>
                            {version.is_active ? (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]">
                                Active test version
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${testStatus.className}`}
                            >
                              {testStatus.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#94A3B8]/62">
                            Created {formatDateTime(version.created_at)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                            {version.is_active
                              ? "This is the version used when logging new games."
                              : "Make this active if you want future match logs to use this build."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {needsFirstGame && version.is_active ? (
                            <Link href={versionLogHref} className={primaryButton}>
                              Log first game
                            </Link>
                          ) : null}
                          {!version.is_active ? (
                            <form action={markActive}>
                              <button
                                type="submit"
                                className={`${secondaryButton} h-10 px-4`}
                              >
                                Make active
                              </button>
                            </form>
                          ) : null}
                          <DeckVersionEditForm
                            action={saveVersionEdits}
                            versionId={version.id}
                            versionName={versionName}
                            decklist={version.decklist ?? ""}
                            notes={version.notes ?? ""}
                            isActive={version.is_active}
                            unresolvedLines={analysis?.unresolved.map((line) => line.raw) ?? []}
                            parseError={parseError}
                          />
                          {canDeleteVersion ? (
                            <form action={removeVersion}>
                              <ConfirmSubmitButton
                                message="Delete this version? This cannot be undone."
                                className="inline-flex h-10 items-center justify-center rounded-[14px] bg-[#F43F5E]/10 px-4 text-sm font-medium text-rose-200 transition hover:bg-[#F43F5E]/16"
                              >
                                Delete
                              </ConfirmSubmitButton>
                            </form>
                          ) : (
                            <div className="rounded-[14px] bg-[#0B1020]/66 px-3 py-2 text-xs leading-5 text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              This version has logged games. Archive would be safer than delete.
                            </div>
                          )}
                        </div>
                      </div>

                      {needsFirstGame ? (
                        <div className="mt-4 grid gap-4">
                          <div className={`${premiumInset} p-4`}>
                            <p className="text-sm leading-6 text-[#D6E0F0]/82">
                              Your first test version is ready. Log a few games before SixPrizer starts comparing versions.
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className={`${statCard} p-3`}>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                List health
                              </p>
                              <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                                {normalizeDecklistUiText(listHealth.label)}
                              </p>
                            </div>
                            <div className={`${statCard} p-3`}>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                Archetype suggestion
                              </p>
                              <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                                {analysis?.suggestion.isClearSuggestion
                                  ? analysis.suggestion.archetype
                                  : "No clear archetype yet"}
                              </p>
                            </div>
                          </div>

                          <details className={`${premiumInset} p-4`}>
                            <summary className="cursor-pointer list-none text-sm font-semibold text-[#DCE8FF] marker:hidden">
                              Decklist details
                            </summary>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                              <div className="grid gap-3">
                                <div className="flex items-center gap-2">
                                  <Target className="size-4 text-[#F5C84C]" aria-hidden="true" />
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                                    Suggested archetype
                                  </p>
                                </div>
                                {analysis?.suggestion.isClearSuggestion ? (
                                  <>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="flex min-w-0 items-center gap-3">
                                        <ArchetypeSprites
                                          archetype={analysis.suggestion.archetype}
                                          className="shrink-0"
                                        />
                                        <div className="min-w-0">
                                          <p className="truncate text-base font-semibold text-[#F8FAFC]">
                                            {analysis.suggestion.archetype}
                                          </p>
                                          <p className="mt-1 text-xs text-[#94A3B8]/72">
                                            Suggested archetype
                                          </p>
                                        </div>
                                      </div>
                                      <span
                                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getSuggestionBadgeTone(
                                          analysis.suggestion.confidence
                                        )}`}
                                      >
                                        {analysis.suggestion.confidenceLabel}
                                      </span>
                                    </div>
                                    <p className="text-sm leading-6 text-[#94A3B8]/72">
                                      {analysis.suggestion.reason}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm leading-6 text-[#94A3B8]/72">
                                    {parseError ??
                                      "No clear archetype detected yet. You can still log games with this version."}
                                  </p>
                                )}
                                <p className="text-xs text-[#94A3B8]/68">
                                  These cards helped SixPrizer identify the deck. This is only a suggestion.
                                </p>
                              </div>

                              <div className="grid gap-3">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="size-4 text-[#F5C84C]" aria-hidden="true" />
                                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                                    List status
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${listHealth.toneClass}`}
                                  >
                                    {listHealth.label}
                                  </span>
                                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                                    {normalizeDecklistUiText(listHealth.summary)}
                                  </span>
                                </div>
                                <p className="text-sm leading-6 text-[#94A3B8]/72">
                                  {normalizeDecklistUiText(listHealth.detail)}
                                </p>
                              </div>
                            </div>
                          </details>
                        </div>
                      ) : (
                      <div className="mt-4 grid gap-4">
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Games
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                              {total}
                            </p>
                          </div>
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Win rate
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                              {total ? `${winRate}%` : "N/A"}
                            </p>
                          </div>
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Record
                            </p>
                            <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                              {wins}W {losses}L {ties}T
                            </p>
                          </div>
                          <div className={`${statCard} p-3`}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              List health
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                              {normalizeDecklistUiText(listHealth.label)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm leading-6 text-[#94A3B8]/72">
                          {testStatus.detail}
                        </p>

                        <details className={`${premiumInset} p-4`}>
                          <summary className="cursor-pointer list-none text-sm font-semibold text-[#DCE8FF] marker:hidden">
                            Version details
                          </summary>
                          <div className="mt-4 grid gap-4 xl:grid-cols-2">

                            <div className={`${premiumInset} p-4 xl:col-span-2`}>
                          <div className="flex items-center gap-2">
                            <Target className="size-4 text-[#F5C84C]" aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                              Auto-detected archetype
                            </p>
                          </div>
                          {analysis?.suggestion.isClearSuggestion ? (
                            <div className="mt-4 grid gap-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <ArchetypeSprites
                                    archetype={analysis.suggestion.archetype}
                                    className="shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-base font-semibold text-[#F8FAFC]">
                                      {analysis.suggestion.archetype}
                                    </p>
                                    <p className="mt-1 text-xs text-[#94A3B8]/72">
                                      Suggested archetype
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getSuggestionBadgeTone(
                                    analysis.suggestion.confidence
                                  )}`}
                                >
                                  {analysis.suggestion.confidenceLabel}
                                </span>
                              </div>
                              <p className="text-sm leading-6 text-[#94A3B8]/72">
                                {analysis.suggestion.reason}
                              </p>
                              <p className="text-xs text-[#94A3B8]/68">
                                These cards helped SixPrizer identify the deck. This is only a suggestion.
                              </p>
                            </div>
                          ) : parseError ? (
                            <div className="mt-4">
                              <p className="text-base font-semibold text-[#F8FAFC]">
                                List could not be parsed
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                                {parseError}
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4">
                              <p className="text-base font-semibold text-[#F8FAFC]">
                                No clear archetype detected
                              </p>
                              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                                No clear archetype detected. Complete the list or set the deck family manually before trusting the parser.
                              </p>
                            </div>
                          )}
                        </div>

                            <div className={`${premiumInset} p-4 xl:col-span-2`}>
                          <div className="flex items-center gap-2">
                            <Layers3 className="size-4 text-[#4F8CFF]" aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                              Deck composition
                            </p>
                          </div>
                          {analysis?.cards.length ? (
                            <div className="mt-4 grid gap-3 grid-cols-2 min-[430px]:grid-cols-4">
                              {[
                                { label: "Total", value: analysis.totalCards },
                                { label: "Pokémon", value: analysis.pokemonCount },
                                { label: "Trainer", value: analysis.trainerCount },
                                { label: "Energy", value: analysis.energyCount },
                              ].map((stat) => (
                                <div
                                  key={stat.label}
                                  className={`${statCard} p-3`}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                    {stat.label}
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                    {stat.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : parseError ? (
                            <p className="mt-4 text-sm leading-6 text-[#94A3B8]/72">
                              {parseError}
                            </p>
                          ) : (
                            <p className="mt-4 text-sm leading-6 text-[#94A3B8]/72">
                              Paste a list to unlock composition and local parsing details.
                            </p>
                          )}
                        </div>

                            <div className={`${premiumInset} p-4`}>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-[#F5C84C]" aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                              List status
                            </p>
                          </div>
                          {analysis?.cards.length ? (
                            <div className="mt-4 grid gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${listHealth.toneClass}`}
                                >
                                  {listHealth.label}
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                                  {normalizeDecklistUiText(listHealth.summary)}
                                </span>
                              </div>
                              <div className="grid gap-3 grid-cols-2">
                                <div className={`${statCard} p-3`}>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                    Parsed cards
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                    {analysis.cards.length}
                                  </p>
                                </div>
                                <div className={`${statCard} p-3`}>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                    Unresolved
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                    {analysis.unresolved.length}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm leading-6 text-[#94A3B8]/72">
                                {normalizeDecklistUiText(listHealth.detail)}
                              </p>
                              <p className="text-xs text-[#94A3B8]/68">
                                {analysis.unresolved.length > 0
                                  ? `Use Edit decklist to resolve the line${
                                      analysis.unresolved.length === 1 ? "" : "s"
                                    } blocking a clean parse.`
                                  : "Open deck details to review card resolution before any deeper legality check."}
                              </p>
                            </div>
                          ) : parseError ? (
                            <p className="mt-4 text-sm leading-6 text-[#94A3B8]/72">
                              {normalizeDecklistUiText(listHealth.detail)}
                            </p>
                          ) : (
                            <p className="mt-4 text-sm leading-6 text-[#94A3B8]/72">
                              {normalizeDecklistUiText(listHealth.detail)}
                            </p>
                          )}
                        </div>
                          </div>
                        </details>

                      {version.notes ? (
                        <div className={`${premiumInset} mt-4 p-4`}>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                            Version notes
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                            {version.notes}
                          </p>
                        </div>
                      ) : null}

                      {version.decklist ? (
                        <details className={`${premiumInset} mt-4 p-4`}>
                          <summary className="cursor-pointer list-none text-sm font-semibold text-[#DCE8FF] marker:hidden">
                            View raw deck list
                          </summary>
                          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#0B1020]/58 p-4 text-sm leading-6 text-[#F8FAFC]">
                            {version.decklist}
                          </pre>
                        </details>
                      ) : null}
                      </div>
                      )}
                    </article>
                  );
                })
              ) : (
                needsFirstVersionSetup ? null : (
                  <div className={emptyCard}>
                    <h3 className="text-lg font-semibold text-[#F8FAFC]">
                      No test versions yet.
                    </h3>
                    <p className={sectionCopy}>
                      Add the first 60-card build above to unlock match logging, version comparison, and parser evidence.
                    </p>
                  </div>
                )
              )}
            </section>

            <aside id="add-version" className="scroll-mt-6 xl:sticky xl:top-6">
              <div className="flex flex-col gap-4">
                <div className={`p-4 ${glassPanel}`}>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#4F8CFF]/10 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                      <Sparkles className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className={sectionTitle}>Deck identity</h2>
                      <p className={`mt-1 ${sectionCopy}`}>
                        Manual archetype is the deck-level identity. Auto-detected version suggestions stay supportive, not final.
                      </p>
                    </div>
                  </div>
                </div>

                {needsFirstGame ? (
                  <details className={`p-4 ${glassPanel}`}>
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[#DCE8FF] marker:hidden">
                      Edit deck identity
                    </summary>
                    <form
                      id="manual-archetype"
                      action={setDeckArchetype}
                      className="mt-4 flex flex-col gap-4"
                    >
                      <p className={sectionCopy}>
                        Use a known archetype or type a custom deck family name.
                      </p>
                      <ArchetypePicker
                        id="deck-archetype"
                        name="archetype"
                        label="Manual archetype"
                        options={archetypeOptions}
                        defaultValue={deckArchetype}
                        customOptionPrefix="Use custom deck archetype"
                        required
                      />
                      <button type="submit" className={secondaryButton}>
                        Save manual archetype
                      </button>
                    </form>
                  </details>
                ) : (
                  <form
                    id="manual-archetype"
                    action={setDeckArchetype}
                    className={`scroll-mt-6 p-4 ${glassPanel}`}
                  >
                    <h2 className={sectionTitle}>Set archetype manually</h2>
                    <p className={`mt-1 ${sectionCopy}`}>
                      Use a known archetype or type a custom deck family name.
                    </p>
                    <div className="mt-4 flex flex-col gap-4">
                      <ArchetypePicker
                        id="deck-archetype"
                        name="archetype"
                        label="Manual archetype"
                        options={archetypeOptions}
                        defaultValue={deckArchetype}
                        customOptionPrefix="Use custom deck archetype"
                        required
                      />
                      <button type="submit" className={secondaryButton}>
                        Save manual archetype
                      </button>
                    </div>
                  </form>
                )}

                {!needsFirstVersionSetup ? (
                  needsFirstGame ? (
                    <details className={`${glassPanel} p-4`}>
                      <summary className="cursor-pointer list-none text-sm font-semibold text-[#DCE8FF] marker:hidden">
                        Add another test version
                      </summary>
                      <div className="mt-4">
                        <DeckVersionForm
                          action={createVersion}
                          deckHref={`/decks/${deck.id}`}
                          title="Add another test version"
                          description="Paste a 60-card list, name the build, and decide whether it should replace the current active version."
                          submitLabel="Create version"
                        />
                      </div>
                    </details>
                  ) : (
                  <DeckVersionForm
                    action={createVersion}
                    deckHref={`/decks/${deck.id}`}
                    title="Add another test version"
                    description="Paste a 60-card list, name the build, and decide whether it should replace the current active version."
                    submitLabel="Create version"
                  />
                  )
                ) : (
                  <div className={`${interactiveTile} p-4`}>
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                        <ArrowRight className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-[#F8FAFC]">
                          Add the first version in the main panel
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
                          Once the first build is saved, this side rail becomes the place to add extra versions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
