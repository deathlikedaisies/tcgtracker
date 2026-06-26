import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
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
  ]);

  if (decksError) {
    throw new Error(decksError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const userDecks = (decks ?? []) as DeckWithVersions[];
  const coachMatchRows = (allMatchRowsForCoach ?? []) as unknown as MatchFilterBaseRow[];
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
          subtitle="Browse, filter, edit, and remove logged matches."
          userEmail={user.email ?? "Unknown email"}
        />

        {params.updated === "1" ? (
          <div className="rounded-[14px] bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            Match updated.
          </div>
        ) : null}

        <form action="/matches" className={`p-3 ${glassPanel}`}>
          <div className="grid gap-2 min-[430px]:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_1fr]">
            <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
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
              />
            </div>
            <div className="flex flex-col gap-1.5">
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
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="submit" className={primaryButton}>
              Apply filters
            </button>
            <Link href="/matches" className={secondaryButton}>
              Clear
            </Link>
          </div>
          <details
            className="mt-2"
            {...((params.start_date || params.end_date || missionOnly) ? { open: true } : {})}
          >
            <summary className="cursor-pointer select-none text-xs font-semibold text-[#94A3B8]/72 hover:text-[#F8FAFC]">
              Advanced filters
            </summary>
            <div className="mt-3 grid gap-2 min-[430px]:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="start_date" className={label}>From</label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={params.start_date ?? ""}
                  className={inputH10}
                />
              </div>
              <div className="flex flex-col gap-1.5">
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
          <section className={emptyCard}>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              No matches logged yet.
            </h2>
            <p className={`mt-3 max-w-xl ${sectionCopy}`}>
              Match history becomes useful once games are logged. SixPrizer needs
              one deck version first so each game belongs to a real test build.
            </p>
            <Link
              href={hasAnyDeckVersions ? "/matches/new" : "/decks"}
              className={`mt-6 ${primaryButton}`}
            >
              {hasAnyDeckVersions ? "Log your first game" : "Create your first deck"}
            </Link>
          </section>
        ) : totalFilteredMatches ? (
          <section className={cardLarge}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-1">
              <h2 className={sectionTitle}>
                Match History
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
                    className={`${interactiveTile} rounded-[16px] p-4`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-[#94A3B8]">
                            {formatDate(match.played_at)}
                          </p>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${
                              match.result === "win"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : match.result === "loss"
                                  ? "bg-[#F43F5E]/15 text-rose-200"
                                  : "bg-slate-400/15 text-slate-200"
                            }`}
                          >
                            {getMatchResultLabel(match.result)}
                          </span>
                          {countsTowardMission ? (
                            <span className="rounded-full bg-[#F5C84C]/14 px-2 py-1 text-xs font-semibold text-[#F5C84C]">
                              Focus progress
                            </span>
                          ) : null}
                          {countsTowardContext ? (
                            <span className="rounded-full bg-[#4F8CFF]/14 px-2 py-1 text-xs font-semibold text-[#B8D1FF]">
                              Focus evidence
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <ArchetypeSprites archetype={match.opponent_archetype} />
                          <h3 className="min-w-0 text-lg font-semibold text-[#F8FAFC]">
                            {match.opponent_archetype}
                            {match.opponent_variant
                              ? ` - ${match.opponent_variant}`
                              : ""}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-[#94A3B8]">
                          {getDeckName(match)} -{" "}
                          {deckVersion?.name ?? "Unknown version"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#94A3B8]">
                          <span className={subtlePill}>
                            {match.went_first === null
                              ? "Turn order unknown"
                              : match.went_first
                                ? "Went first"
                                : "Went second"}
                          </span>
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
                            <span className={subtlePill}>{metadata.event_name}</span>
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
                        <p className={`mt-3 ${sectionCopy}`}>
                          {notePreview(match.notes)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row lg:min-w-36 lg:flex-col">
                        <Link
                          href={`/matches/${match.id}/edit`}
                          className={primaryButton}
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
          <section className={emptyCard}>
            <h2 className="text-xl font-semibold text-[#F8FAFC]">
              No matches match these filters.
            </h2>
            <p className={`mt-2 ${sectionCopy}`}>
              Try a different deck, version, opponent, result, or date range.
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
