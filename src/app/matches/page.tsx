import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { NextStepCheckIn } from "@/components/NextStepCheckIn";
import {
  appFrame,
  appMain,
  appShell,
  cardLarge,
  dangerButton,
  emptyCard,
  glassPanel,
  interactiveTile,
  inputH10,
  label,
  premiumInset,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  subtlePill,
} from "@/components/brand-styles";
import { getArchetypeOptions } from "@/lib/archetypes";
import { startDevTimer } from "@/lib/dev-timing";
import {
  getNextStepCheckInContent,
  getNextStepCheckInCounts,
} from "@/lib/next-step-check-in";
import { getActiveTestingBlockCheckIn } from "@/lib/testing-blocks";
import {
  buildSessionCoachInsight,
  matchCountsTowardMission,
  matchCountsTowardMissionContext,
} from "@/lib/session-coach";
import {
  getGameContextLabel,
  getMatchResultLabel,
  getQualityLabel,
  isMatchResult,
  parseMatchMetadata,
  type MatchMetadata,
  type MatchPrizeRace,
  type MatchResult,
} from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parseDateStart, parseDateEnd } from "@/lib/date-utils";
import { deleteMatch } from "./actions";

type MatchesPageProps = {
  searchParams: Promise<{
    deck_id?: string;
    deck_version_id?: string;
    opponent_archetype?: string;
    result?: string;
    start_date?: string;
    end_date?: string;
    mission_only?: string;
    page?: string;
    updated?: string;
  }>;
};

const MATCHES_PAGE_SIZE = 25;

type DeckWithVersions = {
  id: string;
  name: string;
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
  opponent_variant: string | null;
  result: MatchResult;
  went_first: boolean | null;
  event_type: string | null;
  metadata: MatchMetadata | Record<string, unknown> | null;
  notes: string | null;
  played_at: string;
  deck_versions:
    | {
        id: string;
        name: string;
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
  match_tags:
    | {
        tag: string;
      }[]
    | null;
};

type MatchFilterBaseRow = Pick<
  MatchRow,
  | "id"
  | "deck_version_id"
  | "opponent_archetype"
  | "result"
  | "went_first"
  | "event_type"
  | "played_at"
  | "deck_versions"
  | "match_tags"
>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function notePreview(notes: string | null) {
  if (!notes) {
    return "No notes";
  }

  const compact = notes.replace(/\s+/g, " ").trim();

  return compact.length > 72 ? `${compact.slice(0, 72)}...` : compact;
}

function getResultBadgeClass(result: MatchResult) {
  if (result === "win") {
    return "bg-emerald-500/15 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]";
  }

  if (result === "loss") {
    return "bg-[#F43F5E]/15 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]";
  }

  return "bg-[#4F8CFF]/13 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16)]";
}

function getCleanLogStatus(metadata: MatchMetadata) {
  const hasQuality = Boolean(
    metadata.start_quality &&
      metadata.opening_hand_quality &&
      metadata.sequencing_quality
  );
  const hasReason = Boolean(
    metadata.issue_tags?.length || metadata.positive_tags?.length
  );

  return hasQuality && hasReason ? "clean" : "needs-detail";
}

function getDeckVersion(match: Pick<MatchRow, "deck_versions">) {
  return Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;
}

function getDeckName(match: Pick<MatchRow, "deck_versions">) {
  const deck = getDeckVersion(match)?.decks;
  const resolvedDeck = Array.isArray(deck) ? deck[0] : deck;

  return resolvedDeck?.name ?? "Unknown deck";
}

function formatPrizePath(
  prizeRace: MatchPrizeRace,
  field: "userTotal" | "opponentTotal"
) {
  const totals = [0, ...prizeRace.events.map((event) => event[field])];
  const finalTotal = prizeRace[field];

  if (totals.at(-1) !== finalTotal) {
    totals.push(finalTotal);
  }

  return totals.join(" \u2192 ");
}

function getPrizeRaceTagSuggestions(prizeRace: MatchPrizeRace) {
  const suggestions: string[] = [];
  const firstEvent = prizeRace.events[0];

  if (firstEvent?.actor === "user") {
    suggestions.push("Ahead early");
  } else if (firstEvent?.actor === "opponent") {
    suggestions.push("Behind early");
  }

  if (prizeRace.events.length <= 3 && Math.max(prizeRace.userTotal, prizeRace.opponentTotal) >= 6) {
    suggestions.push("Quick game");
  }

  return suggestions;
}

function PrizeRacePanel({
  prizeRace,
}: {
  prizeRace: MatchPrizeRace | undefined;
}) {
  if (!prizeRace?.events.length) {
    return (
      <div className={`${premiumInset} mt-3 rounded-[16px] px-3 py-3`}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
          Prize race
        </p>
        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
          Prize race could not be reconstructed from this log.
        </p>
      </div>
    );
  }

  const tagSuggestions = getPrizeRaceTagSuggestions(prizeRace);

  return (
    <div
      data-testid="prize-race-panel"
      className={`${premiumInset} mt-3 rounded-[18px] px-3 py-3`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4F8CFF]">
            Prize race
          </p>
          <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
            {prizeRace.summary ?? "Prize race reconstructed from imported log."}
          </p>
        </div>
        {prizeRace.endedByConcession ? (
          <span className="w-fit rounded-full bg-[#F5C84C]/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FFE28A]">
            Concession
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-2xl bg-[#07111F]/58 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
            You
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-[#DCE8FF]">
            {formatPrizePath(prizeRace, "userTotal")}
          </p>
        </div>
        <div className="rounded-2xl bg-[#07111F]/58 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
            Opponent
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-[#F8FAFC]">
            {formatPrizePath(prizeRace, "opponentTotal")}
          </p>
        </div>
      </div>
      {tagSuggestions.length ? (
        <p className="mt-2 text-xs leading-5 text-[#94A3B8]/72">
          Suggested tags, not auto-applied: {tagSuggestions.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function buildMatchesPageHref(
  params: Awaited<MatchesPageProps["searchParams"]>,
  page: number
) {
  const query = new URLSearchParams();

  if (params.deck_id) query.set("deck_id", params.deck_id);
  if (params.deck_version_id) query.set("deck_version_id", params.deck_version_id);
  if (params.opponent_archetype) {
    query.set("opponent_archetype", params.opponent_archetype);
  }
  if (params.result) query.set("result", params.result);
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date) query.set("end_date", params.end_date);
  if (params.mission_only === "1") query.set("mission_only", "1");
  if (page > 1) query.set("page", String(page));

  const search = query.toString();
  return search ? `/matches?${search}` : "/matches";
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
  const endTiming = startDevTimer("route:/matches");
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
    { data: allMatchRowsForCoach, error: matchesError },
    activeTestingBlock,
  ] = await Promise.all([
    supabase
      .from("decks")
      .select("id, name, deck_versions(id, name, is_active)")
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
        "id, deck_version_id, opponent_archetype, result, went_first, event_type, played_at, deck_versions(id, name, deck_id, decks(id, name)), match_tags(tag)"
      )
      .eq("user_id", user.id)
      .order("played_at", { ascending: false }),
    getActiveTestingBlockCheckIn(supabase, user.id),
  ]);

  if (decksError) {
    throw new Error(decksError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const userDecks = (decks ?? []) as DeckWithVersions[];
  const coachMatchRows = (allMatchRowsForCoach ?? []) as unknown as MatchFilterBaseRow[];
  const nextStepCheckIn = getNextStepCheckInContent(
    {
      ...getNextStepCheckInCounts(userDecks, coachMatchRows),
      activeTestingBlock,
    }
  );
  const sessionCoach = buildSessionCoachInsight(coachMatchRows);
  const allVersions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => ({
      ...version,
      deckId: deck.id,
      deckName: deck.name,
    }))
  );
  const hasAnyDeckVersions = allVersions.length > 0;
  const selectedDeck = userDecks.find((deck) => deck.id === params.deck_id);
  const selectedDeckId = selectedDeck?.id ?? "";
  const visibleVersions = selectedDeckId
    ? allVersions.filter((version) => version.deckId === selectedDeckId)
    : allVersions;
  const selectedVersion = visibleVersions.find(
    (version) => version.id === params.deck_version_id
  );
  const selectedVersionId = selectedVersion?.id ?? "";
  const archetypeOptions = getArchetypeOptions(
    null,
    coachMatchRows.map((match) => match.opponent_archetype)
  );
  const selectedOpponentArchetype = archetypeOptions.includes(
    params.opponent_archetype ?? ""
  )
    ? params.opponent_archetype ?? ""
    : "";
  const selectedResult = isMatchResult(params.result ?? null) ? params.result : "";
  const startDate = parseDateStart(params.start_date);
  const endDate = parseDateEnd(params.end_date);
  const missionOnly = params.mission_only === "1";
  const requestedPage = parsePage(params.page);

  const filteredMatchSummaries = coachMatchRows.filter((match) => {
    const deckVersion = getDeckVersion(match);
    const playedAt = new Date(match.played_at);

    if (selectedDeckId && deckVersion?.deck_id !== selectedDeckId) {
      return false;
    }

    if (selectedVersionId && match.deck_version_id !== selectedVersionId) {
      return false;
    }

    if (
      selectedOpponentArchetype &&
      match.opponent_archetype !== selectedOpponentArchetype
    ) {
      return false;
    }

    if (selectedResult && match.result !== selectedResult) {
      return false;
    }

    if (startDate && playedAt < startDate) {
      return false;
    }

    if (endDate && playedAt >= endDate) {
      return false;
    }

    if (missionOnly && !matchCountsTowardMission(match, sessionCoach)) {
      return false;
    }

    return true;
  });
  const totalFilteredMatches = filteredMatchSummaries.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredMatches / MATCHES_PAGE_SIZE)
  );
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStartIndex = (currentPage - 1) * MATCHES_PAGE_SIZE;
  const pageMatchIds = filteredMatchSummaries
    .slice(pageStartIndex, pageStartIndex + MATCHES_PAGE_SIZE)
    .map((match) => match.id);
  const pageMatchIndex = new Map(
    pageMatchIds.map((id, index) => [id, index] as const)
  );
  const pageStart = totalFilteredMatches === 0 ? 0 : pageStartIndex + 1;
  const pageEnd = Math.min(
    pageStartIndex + MATCHES_PAGE_SIZE,
    totalFilteredMatches
  );

  const { data: pageMatches, error: pageMatchesError } = pageMatchIds.length
    ? await supabase
        .from("matches")
        .select(
          "id, deck_version_id, opponent_archetype, opponent_variant, result, went_first, event_type, metadata, notes, played_at, deck_versions(id, name, deck_id, decks(id, name)), match_tags(tag)"
        )
        .eq("user_id", user.id)
        .in("id", pageMatchIds)
    : { data: [], error: null };

  if (pageMatchesError) {
    throw new Error(pageMatchesError.message);
  }

  const filteredMatches = ((pageMatches ?? []) as unknown as MatchRow[]).sort(
    (first, second) =>
      (pageMatchIndex.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
      (pageMatchIndex.get(second.id) ?? Number.MAX_SAFE_INTEGER)
  );
  const pageHref = (page: number) => buildMatchesPageHref(params, page);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const filteredResultCounts = filteredMatchSummaries.reduce(
    (counts, match) => {
      counts[match.result] += 1;
      return counts;
    },
    { win: 0, loss: 0, tie: 0 } as Record<MatchResult, number>
  );
  const filteredWinRate = totalFilteredMatches
    ? Math.round((filteredResultCounts.win / totalFilteredMatches) * 100)
    : 0;
  const latestFilteredMatch = filteredMatchSummaries[0];
  const activeFilterCount = [
    selectedDeckId,
    selectedVersionId,
    selectedOpponentArchetype,
    selectedResult,
    params.start_date,
    params.end_date,
    missionOnly ? "mission" : "",
  ].filter(Boolean).length;
  const filterScopeLabel =
    selectedVersion?.name ??
    selectedDeck?.name ??
    (activeFilterCount ? "Filtered view" : "All logged games");

  endTiming();

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="matches"
          insight={{
            label: "Sessions",
            value: `${totalFilteredMatches} in view`,
            helper: sessionCoach?.missionTitle,
          }}
        />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
        <AuthenticatedPageHeader
          current="matches"
          title="Match history"
          subtitle="Review your logged games, spot patterns, and clean up entries."
          userEmail={user.email ?? "Unknown email"}
        />

        <NextStepCheckIn content={nextStepCheckIn} />

        {params.updated === "1" ? (
          <div className="rounded-[14px] bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            Match updated.
          </div>
        ) : null}

        <section className={`${glassPanel} overflow-hidden p-4 sm:p-5`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`${premiumInset} px-3 py-3`}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                In view
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#F8FAFC]">
                {totalFilteredMatches}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {filterScopeLabel}
              </p>
            </div>
            <div className={`${premiumInset} px-3 py-3`}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Record
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#F8FAFC]">
                {filteredResultCounts.win}-{filteredResultCounts.loss}
                {filteredResultCounts.tie ? `-${filteredResultCounts.tie}` : ""}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {totalFilteredMatches ? `${filteredWinRate}% win rate` : "No games yet"}
              </p>
            </div>
            <div className={`${premiumInset} px-3 py-3`}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Latest log
              </p>
              <p className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                {latestFilteredMatch ? formatDate(latestFilteredMatch.played_at) : "None yet"}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Most recent match in this view
              </p>
            </div>
            <div className={`${premiumInset} px-3 py-3`}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                Filters
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#F8FAFC]">
                {activeFilterCount}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]">
                {activeFilterCount ? "Filtered testing archive" : "Full archive"}
              </p>
            </div>
          </div>
        </section>

        <form action="/matches" className={`${glassPanel} overflow-visible p-3 sm:p-4`}>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  Filter archive
                </p>
                {activeFilterCount ? (
                  <span className="rounded-full bg-[#4F8CFF]/14 px-2.5 py-1 text-xs font-semibold text-[#B8D1FF]">
                    {activeFilterCount} active
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-[#94A3B8] sm:text-sm">
                Narrow the list without changing your logged data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primaryButton}>
                Apply filters
              </button>
              <Link href="/matches" className={secondaryButton}>
                Clear
              </Link>
            </div>
          </div>
          <div className="mt-3 grid gap-2.5 min-[430px]:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_1fr]">
            <div className="flex flex-col gap-1">
              <label htmlFor="deck_id" className={label}>
                Deck
              </label>
              <select
                id="deck_id"
                name="deck_id"
                defaultValue={selectedDeckId}
                className={inputH10}
              >
                <option value="">All decks</option>
                {userDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="deck_version_id" className={label}>
                Version
              </label>
              <select
                id="deck_version_id"
                name="deck_version_id"
                defaultValue={selectedVersionId}
                className={inputH10}
              >
                <option value="">All versions</option>
                {visibleVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.deckName} - {version.name}
                    {version.is_active ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <ArchetypePicker
                id="opponent_archetype"
                name="opponent_archetype"
                label="Opponent"
                options={archetypeOptions}
                defaultValue={selectedOpponentArchetype}
                placeholder="All archetypes"
                maxOptions={5}
                listMaxHeightClassName="max-h-40"
                suggestionsMode="popover"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="result" className={label}>
                Result
              </label>
              <select
                id="result"
                name="result"
                defaultValue={selectedResult}
                className={inputH10}
              >
                <option value="">All results</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="tie">Tie</option>
              </select>
            </div>
          </div>
          <details
            className="mt-2.5 rounded-2xl bg-[#07111F]/45 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
            {...((params.start_date || params.end_date || missionOnly) ? { open: true } : {})}
          >
            <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]/80 hover:text-[#F8FAFC]">
              Advanced filters
            </summary>
            <div className="mt-2.5 grid gap-2 min-[430px]:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="start_date" className={label}>From</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={params.start_date ?? ""}
                  className={inputH10}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="end_date" className={label}>To</label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={params.end_date ?? ""}
                  className={inputH10}
                />
              </div>
              {sessionCoach ? (
                <label className={`${premiumInset} flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-[#F8FAFC]`}>
                  <input
                    type="checkbox"
                    name="mission_only"
                    value="1"
                    defaultChecked={missionOnly}
                    className="h-4 w-4 rounded border-white/20 accent-[#F5C84C]"
                  />
                  Current focus only
                </label>
              ) : null}
            </div>
          </details>
        </form>

        {!coachMatchRows.length ? (
          <section className={`${emptyCard} overflow-hidden`}>
            <div className="mb-5 h-1.5 w-28 rounded-full bg-[linear-gradient(90deg,#F5C84C,#4F8CFF)]" />
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              No matches logged yet.
            </h2>
            <p className={`mt-3 max-w-xl ${sectionCopy}`}>
              Log your first match to start building matchup signal. SixPrizer
              turns clean logs into review prompts, matchup reads, and Deck Lab evidence.
            </p>
            <Link
              href={hasAnyDeckVersions ? "/matches/new" : "/decks"}
              className={`mt-6 ${primaryButton}`}
            >
              {hasAnyDeckVersions ? "Log your first game" : "Create your first deck"}
            </Link>
          </section>
        ) : totalFilteredMatches ? (
          <section className={`${cardLarge} overflow-hidden`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1">
              <h2 className={sectionTitle}>
                Testing archive
              </h2>
              <p className={sectionCopy}>
                {totalFilteredMatches <= MATCHES_PAGE_SIZE
                  ? `Filtered to ${totalFilteredMatches} match${
                      totalFilteredMatches === 1 ? "" : "es"
                    }`
                  : `Showing ${pageStart}-${pageEnd} of ${totalFilteredMatches} matches`}
                {missionOnly ? " for the current focus" : ""}. Page{" "}
                {currentPage} of {totalPages}.
              </p>
            </div>
              {totalPages > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {hasPreviousPage ? (
                    <Link href={pageHref(currentPage - 1)} className={secondaryButton}>
                      Previous
                    </Link>
                  ) : (
                    <span className={`${secondaryButton} pointer-events-none opacity-45`}>
                      Previous
                    </span>
                  )}
                  {hasNextPage ? (
                    <Link href={pageHref(currentPage + 1)} className={secondaryButton}>
                      Next
                    </Link>
                  ) : (
                    <span className={`${secondaryButton} pointer-events-none opacity-45`}>
                      Next
                    </span>
                  )}
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {filteredMatches.map((match) => {
                const deckVersion = getDeckVersion(match);
                const tags = match.match_tags?.map((tag) => tag.tag) ?? [];
                const metadata = parseMatchMetadata(match.metadata);
                const cleanLogStatus = getCleanLogStatus(metadata);
                const removeMatch = deleteMatch.bind(null, match.id);
                const countsTowardMission = matchCountsTowardMission(
                  match,
                  sessionCoach
                );
                const countsTowardContext = matchCountsTowardMissionContext(
                  match,
                  sessionCoach
                );

                return (
                  <article
                    key={match.id}
                    className={`${interactiveTile} rounded-[20px] p-4 sm:p-5`}
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getResultBadgeClass(match.result)}`}
                          >
                            {getMatchResultLabel(match.result)}
                          </span>
                          <span className={subtlePill}>
                            {formatDate(match.played_at)}
                          </span>
                          <span className={subtlePill}>
                            {match.went_first === null
                              ? "Turn unknown"
                              : match.went_first
                                ? "Went first"
                                : "Went second"}
                          </span>
                          <span
                            className={
                              cleanLogStatus === "clean"
                                ? "rounded-full bg-[#F5C84C]/14 px-2.5 py-1 text-xs font-semibold text-[#FFE28A]"
                                : "rounded-full bg-[#94A3B8]/10 px-2.5 py-1 text-xs font-semibold text-[#C6D0DE]"
                            }
                          >
                            {cleanLogStatus === "clean" ? "Clean log" : "Needs detail"}
                          </span>
                          {countsTowardMission ? (
                            <span className="rounded-full bg-[#F5C84C]/14 px-2.5 py-1 text-xs font-semibold text-[#F5C84C]">
                              Focus progress
                            </span>
                          ) : null}
                          {countsTowardContext ? (
                            <span className="rounded-full bg-[#4F8CFF]/14 px-2.5 py-1 text-xs font-semibold text-[#B8D1FF]">
                              Focus evidence
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 flex min-w-0 items-center gap-3">
                          <ArchetypeSprites archetype={match.opponent_archetype} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                              Opponent
                            </p>
                            <h3 className="min-w-0 truncate text-lg font-semibold text-[#F8FAFC] sm:text-xl">
                              {match.opponent_archetype}
                              {match.opponent_variant
                                ? ` - ${match.opponent_variant}`
                                : ""}
                            </h3>
                          </div>
                        </div>
                        <div className="mt-3 rounded-2xl bg-[#07111F]/45 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                            Test build
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-[#F8FAFC]">
                            {getDeckName(match)} · {deckVersion?.name ?? "Unknown version"}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#94A3B8]">
                          <span className={`${subtlePill} capitalize`}>
                            {match.event_type ?? "No event"}
                          </span>
                          {metadata.game_context ? (
                            <span className={subtlePill}>
                              {getGameContextLabel(metadata.game_context)}
                            </span>
                          ) : null}
                          {metadata.round_number ? (
                            <span className={subtlePill}>
                              Round {metadata.round_number}
                            </span>
                          ) : null}
                          {metadata.event_name ? (
                            <span className={subtlePill}>
                              Event: {metadata.event_name}
                            </span>
                          ) : null}
                          {metadata.testing_session_name ? (
                            <span className={subtlePill}>
                              {metadata.testing_session_name}
                            </span>
                          ) : null}
                          {metadata.focus_matchup ? (
                            <span className={subtlePill}>
                              Focus: {metadata.focus_matchup}
                            </span>
                          ) : null}
                          {metadata.start_quality ? (
                            <span className={subtlePill}>
                              Start: {getQualityLabel(metadata.start_quality)}
                            </span>
                          ) : null}
                          {metadata.opening_hand_quality ? (
                            <span className={subtlePill}>
                              Hand: {getQualityLabel(
                                metadata.opening_hand_quality
                              )}
                            </span>
                          ) : null}
                          {metadata.sequencing_quality ? (
                            <span className={subtlePill}>
                              Sequencing: {getQualityLabel(
                                metadata.sequencing_quality
                              )}
                            </span>
                          ) : null}
                        </div>
                        {metadata.issue_tags?.length || metadata.positive_tags?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {metadata.issue_tags?.map((tag) => (
                              <span
                                key={`issue-${match.id}-${tag}`}
                                className="rounded-full bg-[#F43F5E]/12 px-2 py-1 text-xs font-medium text-rose-100"
                              >
                                {tag}
                              </span>
                            ))}
                            {metadata.positive_tags?.map((tag) => (
                              <span
                                key={`positive-${match.id}-${tag}`}
                                className="rounded-full bg-emerald-500/12 px-2 py-1 text-xs font-medium text-emerald-100"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {tags.length &&
                        !metadata.issue_tags?.length &&
                        !metadata.positive_tags?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-[#4F8CFF]/16 px-2 py-1 text-xs font-medium text-[#F8FAFC]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {metadata.cards_shined?.length || metadata.cards_failed?.length ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {metadata.cards_shined?.length ? (
                              <div className={`${premiumInset} rounded-[14px] px-3 py-2 text-xs text-[#94A3B8]`}>
                                <span className="font-semibold text-[#F8FAFC]">
                                  Shined:
                                </span>{" "}
                                {metadata.cards_shined.join(", ")}
                              </div>
                            ) : null}
                            {metadata.cards_failed?.length ? (
                              <div className={`${premiumInset} rounded-[14px] px-3 py-2 text-xs text-[#94A3B8]`}>
                                <span className="font-semibold text-[#F8FAFC]">
                                  Failed:
                                </span>{" "}
                                {metadata.cards_failed.join(", ")}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        {metadata.prizeRace ||
                        metadata.source === "tcg_live_import" ? (
                          <PrizeRacePanel prizeRace={metadata.prizeRace} />
                        ) : null}
                        {match.notes ? (
                          <p className={`mt-3 ${sectionCopy}`}>
                            {notePreview(match.notes)}
                          </p>
                        ) : (
                          <p className="mt-3 text-sm text-[#94A3B8]/58">
                            No notes added.
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row lg:min-w-32 lg:flex-col">
                        <Link
                          href={`/matches/${match.id}/edit`}
                          className={secondaryButton}
                        >
                          Edit
                        </Link>
                        <form action={removeMatch}>
                          <ConfirmSubmitButton
                            message="Delete this match? This cannot be undone."
                            className={`w-full ${dangerButton}`}
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            {totalPages > 1 ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-white/6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#94A3B8]">
                  Showing {pageStart}-{pageEnd} of {totalFilteredMatches} matches.
                </p>
                <div className="flex flex-wrap gap-2">
                  {hasPreviousPage ? (
                    <Link href={pageHref(currentPage - 1)} className={secondaryButton}>
                      Previous page
                    </Link>
                  ) : (
                    <span className={`${secondaryButton} pointer-events-none opacity-45`}>
                      Previous page
                    </span>
                  )}
                  {hasNextPage ? (
                    <Link href={pageHref(currentPage + 1)} className={primaryButton}>
                      Next page
                    </Link>
                  ) : (
                    <span className={`${primaryButton} pointer-events-none opacity-45`}>
                      Next page
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <section className={`${emptyCard} overflow-hidden`}>
            <div className="mb-5 h-1.5 w-24 rounded-full bg-[#4F8CFF]/60" />
            <h2 className="text-xl font-semibold text-[#F8FAFC]">
              No matches found for these filters.
            </h2>
            <p className={`mt-2 ${sectionCopy}`}>
              Clear filters or try a broader search to inspect more games.
            </p>
            <Link
              href="/matches"
              className={`mt-5 ${secondaryButton}`}
            >
              Clear filters
            </Link>
          </section>
        )}
        </div>
      </section>
    </main>
  );
}
