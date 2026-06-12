import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
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
  type ReviewMatch,
} from "@/lib/review-analysis";
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
    version_filter?: string;
  }>;
};

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

function getMostCommonTag(
  matches: ReviewMatch[],
  selector: (match: ReviewMatch) => string[]
) {
  const counts = new Map<string, number>();

  matches.forEach((match) => {
    selector(match).forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    });
  });

  return (
    Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0] ?? null
  );
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

  const { data: decks, error: decksError } = await supabase
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
    });

  if (decksError) {
    throw new Error(decksError.message);
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, deck_version_id, opponent_archetype, result, went_first, event_type, played_at, metadata, deck_versions(id, name, is_active, deck_id, decks(id, name)), match_tags(tag)"
    )
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const userDecks = (decks ?? []) as DeckWithVersions[];
  const allMatches = (matches ?? []) as MatchRow[];

  const selectedDeck = userDecks.find((deck) => deck.id === params.deck_id) ?? null;
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
    if (selectedDeck && match.deckId !== selectedDeck.id) {
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
    deckId: selectedDeck?.id ?? null,
    deckName: selectedDeck?.name ?? null,
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

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="review"
          insight={{
            label: "Review mode",
            value: analysis.cards[0]?.title ?? "Find the next testing question",
            helper: analysis.sampleSummary,
          }}
        />

        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="review"
            eyebrow="Analysis mode"
            title="Review"
            subtitle="Turn saved games, tags, and deck versions into actual coaching reads."
            userEmail={user.email ?? "Unknown email"}
          />

          <form action="/review" className={`p-4 ${glassPanel}`}>
            <div className="grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
              <div className="flex flex-col gap-2">
                <label htmlFor="deck_id" className={label}>
                  Deck
                </label>
                <select
                  id="deck_id"
                  name="deck_id"
                  defaultValue={selectedDeck?.id ?? ""}
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
                  Clear
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
                {selectedDeck ? (
                  <span className={subtlePill}>{selectedDeck.name}</span>
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
                  className={`${glassPanelStrong} p-5 sm:p-6 ${
                    analysis.cards[0].tone === "rose"
                      ? "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(244,63,94,0.22)]"
                      : analysis.cards[0].tone === "emerald"
                        ? "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(34,197,94,0.22)]"
                        : analysis.cards[0].tone === "gold"
                          ? "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(245,200,76,0.24)]"
                          : "shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(79,140,255,0.20)]"
                  }`}
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:gap-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex size-8 items-center justify-center rounded-[12px] bg-[#F5C84C]/12 text-xs font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                          TC
                        </span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/58">
                          Coach says
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${getToneClass(analysis.cards[0].tone)}`}
                        >
                          {analysis.sampleStatusLabel}
                        </span>
                      </div>
                      <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
                        {analysis.cards[0].title}
                      </h2>
                      <p className="mt-3 text-base leading-7 text-[#D6E0F0]/84">
                        {analysis.cards[0].explanation}
                      </p>
                      <div className={`${premiumInset} mt-4 p-4`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          What to do next
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#F8FAFC]">
                          {analysis.cards[0].recommendation}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-3 xl:w-72">
                      <div className={`${premiumInsetStrong} p-4`}>
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
                      <div className={`${premiumInset} p-4`}>
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
              {analysis.cards.length > 1 ? (() => {
                const secondaryCards = analysis.cards.slice(1);
                const visibleCards = secondaryCards.slice(0, 3);
                const hiddenCards = secondaryCards.slice(3);

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
                  <>
                    <section className={`${glassPanel} p-5`}>
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                          Supporting insights
                        </p>
                        <h2 className={sectionTitle}>Other patterns found</h2>
                        <p className="text-sm leading-6 text-[#94A3B8]/72">
                          These are secondary patterns from your logs. Use them after reviewing the main coach recommendation.
                        </p>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <article className={`${premiumInset} p-4`}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                            Matchup samples
                          </p>
                          <div className="mt-3 grid gap-3">
                            {matchupSummary.length ? (
                              matchupSummary.map((matchup) => (
                                <div key={matchup.opponent} className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
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
                              ))
                            ) : (
                              <p className="text-sm leading-6 text-[#94A3B8]/72">
                                Log a few more games before matchup pressure separates cleanly.
                              </p>
                            )}
                          </div>
                        </article>

                        <article className={`${premiumInset} p-4`}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                            Turn-order split
                          </p>
                          <div className="mt-3 grid gap-3">
                            <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-[#F8FAFC]">Going first</p>
                                <span className="text-sm font-bold text-[#F8FAFC]">
                                  {firstRecord.total ? `${Math.round((firstRecord.wins / firstRecord.total) * 100)}%` : "N/A"}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#94A3B8]/72">
                                {firstRecord.total
                                  ? `${formatMatchRecord(firstRecord.wins, firstRecord.losses, firstRecord.ties)} across ${firstRecord.total} games`
                                  : "No first-turn sample yet"}
                              </p>
                            </div>
                            <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-[#F8FAFC]">Going second</p>
                                <span className="text-sm font-bold text-[#F8FAFC]">
                                  {secondRecord.total ? `${Math.round((secondRecord.wins / secondRecord.total) * 100)}%` : "N/A"}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#94A3B8]/72">
                                {secondRecord.total
                                  ? `${formatMatchRecord(secondRecord.wins, secondRecord.losses, secondRecord.ties)} across ${secondRecord.total} games`
                                  : "No second-turn sample yet"}
                              </p>
                            </div>
                          </div>
                        </article>

                        <article className={`${premiumInset} p-4`}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                            Tag pressure
                          </p>
                          <div className="mt-3 grid gap-3">
                            <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <p className="text-sm font-semibold text-[#F8FAFC]">
                                {topIssueTag ? `"${topIssueTag[0]}" is the leading loss tag` : "No repeated loss tag yet"}
                              </p>
                              <p className="mt-1 text-xs text-[#94A3B8]/72">
                                {topIssueTag
                                  ? `${topIssueTag[1]} logged losses include this tag.`
                                  : "Keep using issue tags so failure patterns can separate."}
                              </p>
                            </div>
                            <div className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <p className="text-sm font-semibold text-[#F8FAFC]">
                                {topPositiveTag ? `"${topPositiveTag[0]}" is the leading win tag` : "No repeated positive tag yet"}
                              </p>
                              <p className="mt-1 text-xs text-[#94A3B8]/72">
                                {topPositiveTag
                                  ? `${topPositiveTag[1]} logged wins include this tag.`
                                  : "Keep tagging what worked so SixPrizer can compare wins against losses."}
                              </p>
                            </div>
                          </div>
                        </article>
                      </div>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-2">
                      {visibleCards.map(renderCard)}
                    </section>
                    {hiddenCards.length > 0 ? (
                      <details className="group">
                        <summary className={`${premiumInset} inline-flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#B8D1FF] transition hover:text-[#F8FAFC] marker:hidden`}>
                          {hiddenCards.length} more insight{hiddenCards.length > 1 ? "s" : ""}
                        </summary>
                        <section className="mt-4 grid gap-4 xl:grid-cols-2">
                          {hiddenCards.map(renderCard)}
                        </section>
                      </details>
                    ) : null}
                  </>
                );
              })() : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
