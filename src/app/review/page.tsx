import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ReviewDetailedAnalytics } from "@/components/review/ReviewDetailedAnalytics";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  glassPanel,
  glassPanelStrong,
  premiumInset,
  premiumInsetStrong,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  subtlePill,
  inputH10,
  label,
} from "@/components/brand-styles";
import {
  buildReviewAnalysis,
  getMostCommonTag,
  type ReviewMatch,
} from "@/lib/review-analysis";
import { resolveCurrentDeckScope } from "@/lib/current-deck-scope";
import {
  countMatchResults,
  formatMatchRecord,
  parseMatchMetadata,
  type MatchMetadata,
  type MatchResult,
} from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type ReviewPageProps = {
  searchParams: Promise<{
    deck_id?: string;
    deckId?: string;
    version_filter?: string;
  }>;
};

type DeckWithVersions = {
  id: string;
  name: string;
  created_at: string;
  deck_versions: {
    id: string;
    name: string;
    is_active: boolean;
  }[];
};

type MatchRow = {
  id: string;
  deck_version_id: string;
  opponent_archetype: string;
  result: MatchResult;
  went_first: boolean | null;
  event_type: string | null;
  played_at: string;
  metadata: MatchMetadata | Record<string, unknown> | null;
  deck_versions:
    | {
        id: string;
        name: string;
        is_active: boolean;
        deck_id: string;
        decks:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
      }
    | {
        id: string;
        name: string;
        is_active: boolean;
        deck_id: string;
        decks:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
      }[]
    | null;
  match_tags: { tag: string }[] | null;
};

function getDeckVersion(match: Pick<MatchRow, "deck_versions">) {
  return Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;
}

function getDeckName(match: Pick<MatchRow, "deck_versions">) {
  const deck = getDeckVersion(match)?.decks;
  const resolved = Array.isArray(deck) ? deck[0] : deck;
  return resolved?.name ?? "Unknown deck";
}

function getToneClass(tone: "blue" | "gold" | "emerald" | "rose") {
  if (tone === "gold") {
    return "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]";
  }

  if (tone === "emerald") {
    return "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]";
  }

  if (tone === "rose") {
    return "bg-[#F43F5E]/10 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]";
  }

  return "bg-[#4F8CFF]/10 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16)]";
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getTopTags(
  matches: ReviewMatch[],
  selector: (match: ReviewMatch) => string[]
) {
  const total = matches.length;
  const counts = new Map<string, number>();

  matches.forEach((match) => {
    selector(match).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([tag, count]) => ({
      tag,
      count,
      total,
      rate: total ? Math.round((count / total) * 100) : 0,
    }));
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: decks, error: decksError },
    { data: matches, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("decks")
      .select("id, name, created_at, deck_versions(id, name, is_active)")
      .eq("user_id", user.id)
      .order("name", { ascending: true })
      .order("is_active", {
        referencedTable: "deck_versions",
        ascending: false,
      })
      .order("name", {
        referencedTable: "deck_versions",
        ascending: true,
      }),
    supabase
      .from("matches")
      .select(
        "id, deck_version_id, opponent_archetype, result, went_first, event_type, played_at, metadata, deck_versions(id, name, is_active, deck_id, decks(id, name)), match_tags(tag)"
      )
      .eq("user_id", user.id)
      .order("played_at", { ascending: false }),
  ]);

  if (decksError) {
    throw new Error(decksError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const userDecks = (decks ?? []) as DeckWithVersions[];
  const allMatches = (matches ?? []) as MatchRow[];
  const requestedDeckId = params.deck_id ?? params.deckId ?? null;
  const deckScope = resolveCurrentDeckScope({
    decks: userDecks,
    matches: allMatches,
    explicitDeckId: requestedDeckId,
  });
  const selectedDeck =
    userDecks.find((deck) => deck.id === deckScope.deckId) ?? null;
  const showAllDecks = deckScope.showAllDecks;
  const selectedVersionFilter = params.version_filter ?? "";
  const activeVersionId =
    selectedDeck?.deck_versions.find((version) => version.is_active)?.id ?? null;
  const normalizedMatches: ReviewMatch[] = allMatches.map((match) => {
    const deckVersion = getDeckVersion(match);
    const metadata = parseMatchMetadata(match.metadata);

    return {
      id: match.id,
      deckId: deckVersion?.deck_id ?? "",
      deckName: getDeckName(match),
      deckVersionId: match.deck_version_id,
      deckVersionName: deckVersion?.name ?? "Unknown version",
      deckVersionIsActive: Boolean(deckVersion?.is_active),
      opponentArchetype: match.opponent_archetype,
      result: match.result,
      wentFirst: match.went_first,
      playedAt: match.played_at,
      metadata,
    };
  });

  const filteredMatches = normalizedMatches.filter((match) => {
    if (!showAllDecks && selectedDeck && match.deckId !== selectedDeck.id) {
      return false;
    }

    if (selectedVersionFilter === "active") {
      return activeVersionId ? match.deckVersionId === activeVersionId : false;
    }

    if (selectedVersionFilter && selectedVersionFilter !== "active") {
      return match.deckVersionId === selectedVersionFilter;
    }

    return true;
  });

  const selectedVersion =
    selectedVersionFilter && selectedVersionFilter !== "active"
      ? selectedDeck?.deck_versions.find((version) => version.id === selectedVersionFilter) ?? null
      : null;

  const analysis = buildReviewAnalysis(filteredMatches, {
    deckId: showAllDecks ? null : selectedDeck?.id ?? null,
    deckName: showAllDecks ? null : selectedDeck?.name ?? null,
    deckVersionId:
      selectedVersionFilter === "active"
        ? activeVersionId
        : selectedVersion?.id ?? null,
    deckVersionName:
      selectedVersionFilter === "active"
        ? selectedDeck?.deck_versions.find((version) => version.id === activeVersionId)?.name ??
          null
        : selectedVersion?.name ?? null,
    activeVersionOnly: selectedVersionFilter === "active",
  });
  const matchupSummary = Array.from(
    filteredMatches.reduce((summary, match) => {
      const grouped = summary.get(match.opponentArchetype) ?? [];
      grouped.push(match);
      summary.set(match.opponentArchetype, grouped);
      return summary;
    }, new Map<string, ReviewMatch[]>())
  )
    .map(([opponent, groupedMatches]) => {
      const record = countMatchResults(groupedMatches);
      const winRate = record.total
        ? Math.round((record.wins / record.total) * 100)
        : 0;

      return {
        opponent,
        matches: record.total,
        record: formatMatchRecord(record.wins, record.losses, record.ties),
        winRate,
      };
    })
    .sort((left, right) => right.matches - left.matches)
    .slice(0, 3);
  const wentFirstMatches = filteredMatches.filter((match) => match.wentFirst === true);
  const wentSecondMatches = filteredMatches.filter((match) => match.wentFirst === false);
  const firstRecord = countMatchResults(wentFirstMatches);
  const secondRecord = countMatchResults(wentSecondMatches);
  const topIssueTag = getMostCommonTag(
    filteredMatches.filter((match) => match.result === "loss"),
    (match) => match.metadata.issue_tags ?? []
  );
  const topPositiveTag = getMostCommonTag(
    filteredMatches.filter((match) => match.result === "win"),
    (match) => match.metadata.positive_tags ?? []
  );
  const recentMatches = filteredMatches.slice(0, 10).map((match) => ({
    id: match.id,
    deckVersionName: match.deckVersionName,
    opponentArchetype: match.opponentArchetype,
    playedAtLabel: formatShortDate(match.playedAt),
    result: match.result,
  }));
  const trendData = Array.from(
    filteredMatches.reduce((summary, match) => {
      const dateKey = match.playedAt.slice(0, 10);
      const current = summary.get(dateKey) ?? {
        date: dateKey,
        label: formatShortDate(dateKey),
        wins: 0,
        losses: 0,
        ties: 0,
      };

      if (match.result === "win") {
        current.wins += 1;
      } else if (match.result === "loss") {
        current.losses += 1;
      } else {
        current.ties += 1;
      }

      summary.set(dateKey, current);
      return summary;
    }, new Map<string, { date: string; label: string; wins: number; losses: number; ties: number }>())
  )
    .map(([, value]) => value)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-8)
    .map(({ label, wins, losses, ties }) => ({ label, wins, losses, ties }));
  const unknownTurnOrderCount = filteredMatches.filter(
    (match) => match.wentFirst === null
  ).length;
  const turnOrderRows = [
    firstRecord.total
      ? {
          label: "Going first",
          matches: firstRecord.total,
          record: formatMatchRecord(
            firstRecord.wins,
            firstRecord.losses,
            firstRecord.ties
          ),
          winRate: Math.round((firstRecord.wins / firstRecord.total) * 100),
        }
      : null,
    secondRecord.total
      ? {
          label: "Going second",
          matches: secondRecord.total,
          record: formatMatchRecord(
            secondRecord.wins,
            secondRecord.losses,
            secondRecord.ties
          ),
          winRate: Math.round((secondRecord.wins / secondRecord.total) * 100),
        }
      : null,
  ].filter(Boolean) as {
    label: string;
    matches: number;
    record: string;
    winRate: number;
  }[];
  const winTags = getTopTags(
    filteredMatches.filter((match) => match.result === "win"),
    (match) => match.metadata.positive_tags ?? []
  );
  const lossTags = getTopTags(
    filteredMatches.filter((match) => match.result === "loss"),
    (match) => match.metadata.issue_tags ?? []
  );
  const versionRows = Array.from(
    filteredMatches.reduce((summary, match) => {
      const current = summary.get(match.deckVersionId) ?? [];
      current.push(match);
      summary.set(match.deckVersionId, current);
      return summary;
    }, new Map<string, ReviewMatch[]>())
  )
    .map(([id, matchesForVersion]) => {
      const record = countMatchResults(matchesForVersion);
      const openingTagged = matchesForVersion.filter((match) => {
        const quality =
          match.metadata.start_quality ?? match.metadata.opening_hand_quality;
        return quality === "good" || quality === "great";
      });
      const openingObserved = matchesForVersion.filter((match) =>
        Boolean(match.metadata.start_quality ?? match.metadata.opening_hand_quality)
      );
      const sequencingTagged = matchesForVersion.filter((match) => {
        const quality = match.metadata.sequencing_quality;
        return quality === "good" || quality === "great";
      });
      const sequencingObserved = matchesForVersion.filter((match) =>
        Boolean(match.metadata.sequencing_quality)
      );
      const commonLossTag = getMostCommonTag(
        matchesForVersion.filter((match) => match.result === "loss"),
        (match) => match.metadata.issue_tags ?? []
      );

      return {
        id,
        name: matchesForVersion[0]?.deckVersionName ?? "Unknown version",
        matches: record.total,
        record: formatMatchRecord(record.wins, record.losses, record.ties),
        winRate: record.total ? Math.round((record.wins / record.total) * 100) : 0,
        openingRate: openingObserved.length
          ? Math.round((openingTagged.length / openingObserved.length) * 100)
          : null,
        sequencingRate: sequencingObserved.length
          ? Math.round((sequencingTagged.length / sequencingObserved.length) * 100)
          : null,
        commonLossTag: commonLossTag?.[0] ?? null,
      };
    })
    .sort((left, right) => right.matches - left.matches);
  const versionSummary =
    versionRows.length > 1
      ? (() => {
          const sortedByOpening = [...versionRows]
            .filter((row) => row.openingRate !== null)
            .sort(
              (left, right) =>
                (right.openingRate ?? -1) - (left.openingRate ?? -1) ||
                right.matches - left.matches
            );
          const leader = sortedByOpening[0] ?? versionRows[0];
          const runnerUp = sortedByOpening[1] ?? null;

          if (!leader) {
            return null;
          }

          return {
            bestLabel: leader.name,
            explanation:
              leader.openingRate !== null && runnerUp !== null && runnerUp.openingRate !== null
                ? `${leader.name} is showing the cleanest starts so far at ${leader.openingRate}% good or great openings versus ${runnerUp.openingRate}% on ${runnerUp.name}. Matchup spread may still explain part of the difference.`
                : `${leader.name} has the strongest sample so far, but keep logging before treating it as the clear winner.`,
          };
        })()
      : null;
  const supportingCards = [
    matchupSummary.length
      ? {
          key: "matchup-samples",
          title: "Matchup samples",
          content: (
            <div className="grid gap-3">
              {matchupSummary.map((matchup) => (
                <div
                  key={matchup.opponent}
                  className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                      {matchup.opponent}
                    </p>
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {matchup.winRate}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#94A3B8]/72">
                    {matchup.record} across {matchup.matches} games
                  </p>
                </div>
              ))}
            </div>
          ),
        }
      : null,
    firstRecord.total || secondRecord.total
      ? {
          key: "turn-order-split",
          title: "Turn-order split",
          content: (
            <div className="grid gap-3">
              <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#F8FAFC]">Going first</p>
                  <span className="text-sm font-bold text-[#F8FAFC]">
                    {firstRecord.total
                      ? `${Math.round((firstRecord.wins / firstRecord.total) * 100)}%`
                      : "N/A"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#94A3B8]/72">
                  {firstRecord.total
                    ? `${formatMatchRecord(
                        firstRecord.wins,
                        firstRecord.losses,
                        firstRecord.ties
                      )} across ${firstRecord.total} games`
                    : "No first-turn sample yet"}
                </p>
              </div>
              <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#F8FAFC]">Going second</p>
                  <span className="text-sm font-bold text-[#F8FAFC]">
                    {secondRecord.total
                      ? `${Math.round((secondRecord.wins / secondRecord.total) * 100)}%`
                      : "N/A"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#94A3B8]/72">
                  {secondRecord.total
                    ? `${formatMatchRecord(
                        secondRecord.wins,
                        secondRecord.losses,
                        secondRecord.ties
                      )} across ${secondRecord.total} games`
                    : "No second-turn sample yet"}
                </p>
              </div>
            </div>
          ),
        }
      : null,
    topIssueTag || topPositiveTag
      ? {
          key: "tag-pressure",
          title: "Tag pressure",
          content: (
            <div className="grid gap-3">
              {topIssueTag ? (
                <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  <p className="text-sm font-semibold text-[#F8FAFC]">
                    &quot;{topIssueTag[0]}&quot; is the leading loss tag
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]/72">
                    {topIssueTag[1]} logged losses include this tag.
                  </p>
                </div>
              ) : null}
              {topPositiveTag ? (
                <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  <p className="text-sm font-semibold text-[#F8FAFC]">
                    &quot;{topPositiveTag[0]}&quot; is the leading win tag
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]/72">
                    {topPositiveTag[1]} logged wins include this tag.
                  </p>
                </div>
              ) : null}
            </div>
          ),
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    title: string;
    content: ReactNode;
  }[];

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="review"
          insight={{
            label: "Review focus",
            value: analysis.cards[0]?.title ?? "Find the next testing question",
            helper: analysis.sampleSummary,
          }}
        />

        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="review"
            eyebrow="Analysis mode"
            title="Review"
            subtitle="See what your recent games are actually telling you, then decide the next test."
            userEmail={user.email ?? "Unknown email"}
          />

          <form action="/review" className={`p-3.5 sm:p-4 ${glassPanel}`}>
            <div className="grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-2">
                <label htmlFor="deck_id" className={label}>
                  Deck
                </label>
                <select
                  id="deck_id"
                  name="deck_id"
                  defaultValue={showAllDecks ? "all" : selectedDeck?.id ?? "all"}
                  className={inputH10}
                >
                  <option value="all">All decks</option>
                  {userDecks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="version_filter" className={label}>
                  Version
                </label>
                <select
                  id="version_filter"
                  name="version_filter"
                  defaultValue={selectedVersionFilter}
                  className={inputH10}
                >
                  <option value="">All versions</option>
                  {selectedDeck && activeVersionId ? (
                    <option value="active">Active version only</option>
                  ) : null}
                  {selectedDeck?.deck_versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name}
                      {version.is_active ? " (active)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className={primaryButton}>
                  Apply
                </button>
                <Link href="/review" className={secondaryButton}>
                  Reset
                </Link>
              </div>
            </div>
          </form>

          {!normalizedMatches.length ? (
            <section className={emptyCard}>
              <h2 className="text-xl font-semibold text-[#F8FAFC]">
                No logged games yet.
              </h2>
              <p className={`mt-2 ${sectionCopy}`}>
                Review gets better once you log structured games with matchup, quality, and tags.
              </p>
              <Link href="/matches/new" className={`mt-5 ${primaryButton}`}>
                Log your first game
              </Link>
            </section>
          ) : !filteredMatches.length ? (
            <section className={emptyCard}>
              <h2 className="text-xl font-semibold text-[#F8FAFC]">
                No games match this review filter.
              </h2>
              <p className={`mt-2 ${sectionCopy}`}>
                Try a different deck or version filter to widen the sample.
              </p>
              <Link href="/review" className={`mt-5 ${secondaryButton}`}>
                Clear filters
              </Link>
            </section>
          ) : (
            <>
              {/* Sample context — compact pill row, not a full card */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={subtlePill}>{analysis.sampleSummary}</span>
                <span className={subtlePill}>{analysis.sampleStatusLabel}</span>
                {showAllDecks ? (
                  <span className={subtlePill}>Showing combined insights across all decks</span>
                ) : selectedDeck ? (
                  <span className={subtlePill}>Showing insights for: {selectedDeck.name}</span>
                ) : null}
                {selectedVersionFilter === "active" ? (
                  <span className={subtlePill}>Active version only</span>
                ) : selectedVersion ? (
                  <span className={subtlePill}>{selectedVersion.name}</span>
                ) : null}
              </div>

              {/* Primary coach insight — the first thing the user sees */}
              {analysis.cards.length > 0 ? (
                <section
                  className={`${glassPanelStrong} p-4 sm:p-6 ${
                    analysis.cards[0].tone === "rose"
                      ? "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(244,63,94,0.22)]"
                      : analysis.cards[0].tone === "emerald"
                        ? "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(34,197,94,0.22)]"
                        : analysis.cards[0].tone === "gold"
                          ? "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(245,200,76,0.24)]"
                          : "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(79,140,255,0.20)]"
                  }`}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex size-8 items-center justify-center rounded-[12px] bg-[#F5C84C]/12 text-xs font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                          TC
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/58">
                          Top coach read
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getToneClass(analysis.cards[0].tone)}`}
                        >
                          {analysis.sampleStatusLabel}
                        </span>
                      </div>
                      <h2 className="mt-3 text-[1.65rem] font-bold tracking-tight text-[#F8FAFC] sm:mt-4 sm:text-3xl">
                        {analysis.cards[0].title}
                      </h2>
                      <p className="mt-2.5 text-sm leading-6 text-[#D6E0F0]/84 sm:mt-3 sm:text-base sm:leading-7">
                        {analysis.cards[0].explanation}
                      </p>
                      <div className={`${premiumInset} mt-3 p-3 sm:mt-4 sm:p-4`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          What to do next
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#F8FAFC]">
                          {analysis.cards[0].recommendation}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-3 xl:w-72">
                      <div className={`${premiumInsetStrong} p-3 sm:p-4`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Evidence
                        </p>
                        <p className={`mt-2 text-sm font-medium ${
                          analysis.cards[0].tone === "rose"
                            ? "text-rose-200"
                            : analysis.cards[0].tone === "emerald"
                              ? "text-emerald-300"
                              : analysis.cards[0].tone === "gold"
                                ? "text-[#F5C84C]"
                                : "text-[#B8D1FF]"
                        }`}>
                          {analysis.cards[0].evidence}
                        </p>
                      </div>
                      <div className={`${premiumInset} p-3 sm:p-4`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Confidence
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#DCE8FF]">
                          {analysis.cards[0].confidenceLabel}
                        </p>
                      </div>
                      <Link
                        href={analysis.cards[0].ctaHref}
                        className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#F5C84C] px-5 text-sm font-bold text-[#0B1020] shadow-[0_12px_28px_rgba(245,200,76,0.20)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0"
                      >
                        {analysis.cards[0].ctaLabel}
                      </Link>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* Secondary insight cards — max 3 visible, rest behind details */}
              {supportingCards.length > 0 ? (
                <section className={`${glassPanel} p-4 sm:p-5`}>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                      Supporting insights
                    </p>
                    <h2 className={sectionTitle}>Other patterns found</h2>
                    <p className="text-sm leading-6 text-[#94A3B8]/72">
                      These are the clearest supporting patterns behind the main read. Check them after the top recommendation.
                    </p>
                  </div>

                  <div
                    className={`mt-4 grid gap-4 ${
                      supportingCards.length === 1
                        ? ""
                        : supportingCards.length === 2
                          ? "xl:grid-cols-2"
                          : "xl:grid-cols-3"
                    }`}
                  >
                    {supportingCards.map((card) => (
                      <article key={card.key} className={`${premiumInset} p-4`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          {card.title}
                        </p>
                        <div className="mt-3">{card.content}</div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {analysis.cards.length > 1 ? (() => {
                const secondaryCards = analysis.cards.slice(1);

                const renderCard = (card: typeof secondaryCards[0]) => (
                  <article key={card.key} className={`p-5 ${glassPanel}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className={sectionTitle}>{card.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          {card.explanation}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getToneClass(card.tone)}`}
                      >
                        {card.confidenceLabel}
                      </span>
                    </div>
                    <div className={`${premiumInset} mt-4 p-3`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                        Evidence
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#F8FAFC]">
                        {card.evidence}
                      </p>
                    </div>
                    <div className={`${premiumInset} mt-3 p-3`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                        What to do next
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#D6E0F0]/82">
                        {card.recommendation}
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link href={card.ctaHref} className={primaryButton}>
                        {card.ctaLabel}
                      </Link>
                    </div>
                  </article>
                );

                return (
                  <section className={`${glassPanel} p-4 sm:p-5`}>
                    <details className="group">
                      <summary className={`${premiumInset} inline-flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#B8D1FF] transition hover:text-[#F8FAFC] marker:hidden`}>
                        Secondary reads
                      </summary>
                      <p className="mt-3 text-sm leading-6 text-[#94A3B8]/72">
                        These are useful, but they are not the main coaching read. Check them after the top recommendation and supporting evidence.
                      </p>
                      <section className="mt-4 grid gap-4 xl:grid-cols-2">
                        {secondaryCards.slice(0, 3).map(renderCard)}
                      </section>
                    </details>
                  </section>
                );
              })() : null}

              <ReviewDetailedAnalytics
                recentMatches={recentMatches}
                trendData={trendData}
                matchupRows={matchupSummary}
                turnOrderRows={turnOrderRows}
                unknownTurnOrderCount={unknownTurnOrderCount}
                winTags={winTags}
                lossTags={lossTags}
                versionRows={versionRows}
                versionSummary={versionSummary}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
