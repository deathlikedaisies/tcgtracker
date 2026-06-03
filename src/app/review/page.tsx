import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  glassPanel,
  logoOnDark,
  pageCopy,
  pageHeaderCard,
  pageTitle,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  subtlePill,
  inputH10,
  label,
} from "@/components/brand-styles";
import { SessionCoachPanel } from "@/components/SessionCoachPanel";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import {
  buildReviewAnalysis,
  type ReviewMatch,
} from "@/lib/review-analysis";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import {
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
  const sessionCoach = buildSessionCoachInsight(
    allMatches.map((match) => ({
      id: match.id,
      deck_version_id: match.deck_version_id,
      opponent_archetype: match.opponent_archetype,
      result: match.result,
      went_first: match.went_first,
      event_type: match.event_type,
      played_at: match.played_at,
      match_tags: match.match_tags,
      deck_versions: getDeckVersion(match)
        ? {
            id: getDeckVersion(match)?.id,
            name: getDeckVersion(match)?.name,
            deck_id: getDeckVersion(match)?.deck_id,
          }
        : null,
    }))
  );

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

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="review"
          insight={{
            label: "Review mode",
            value: sessionCoach?.missionTitle ?? "Find the next testing question",
            helper: analysis.sampleSummary,
          }}
        />

        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <header className={pageHeaderCard}>
            <div>
              <SixPrizerLogo {...logoOnDark} />
              <p className="mt-4 text-sm font-medium text-[#4F8CFF]">Analysis mode</p>
              <h1 className={pageTitle}>Review</h1>
              <p className={pageCopy}>
                Turn saved games, tags, and deck versions into actual coaching reads.
              </p>
            </div>
            <div className="lg:hidden">
              <AppNav current="review" />
            </div>
          </header>

          {sessionCoach ? <SessionCoachPanel insight={sessionCoach} /> : null}

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
              <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <article className={`p-5 ${glassPanel}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                    Recent sample
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                    {analysis.sampleSummary}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                    {analysis.sampleStatusReason}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={subtlePill}>
                      {analysis.sampleStatusLabel}
                    </span>
                    {selectedDeck ? (
                      <span className={subtlePill}>{selectedDeck.name}</span>
                    ) : null}
                    {selectedVersionFilter === "active" ? (
                      <span className={subtlePill}>Active version only</span>
                    ) : selectedVersion ? (
                      <span className={subtlePill}>{selectedVersion.name}</span>
                    ) : null}
                  </div>
                </article>

                <article className={`p-5 ${glassPanel}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                    What this page does
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#F8FAFC]">
                    Review the games, not just the totals
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                    This page looks for repeated matchup leaks, weak quality patterns, recurring issue tags, positive tech signals, and version gaps.
                  </p>
                </article>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                {analysis.cards.map((card) => (
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
                        Insight
                      </span>
                    </div>
                    <div className="mt-4 rounded-[18px] bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                        Evidence
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#F8FAFC]">
                        {card.evidence}
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link href={card.ctaHref} className={primaryButton}>
                        {card.ctaLabel}
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
