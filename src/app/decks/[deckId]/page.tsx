import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  Beaker,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DeckVersionForm } from "@/components/decks/DeckVersionForm";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  glassPanel,
  glassPanelStrong,
  logoOnDark,
  pageTitle,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
} from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { SessionCoachPanel } from "@/components/SessionCoachPanel";
import { getArchetypeOptions } from "@/lib/archetypes";
import {
  analyzeDeckList,
  type DecklistAnalysis,
  isClearArchetypeSuggestion,
} from "@/lib/decklist";
import { LATEST_FORMAT } from "@/lib/formats";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import {
  countMatchResults,
  type MatchResult,
} from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  createDeckVersion,
  markDeckVersionActive,
  updateDeckArchetype,
} from "./actions";

type DeckDetailPageProps = {
  params: Promise<{
    deckId: string;
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

function getDeckVersions(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (version): version is DeckVersion =>
          Boolean(version) && typeof version === "object"
      )
    : [];
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function getSuggestionBadgeTone(confidence: "high" | "medium" | "low" | "none") {
  return confidence === "high"
    ? "bg-emerald-500/14 text-emerald-200"
    : "bg-[#F5C84C]/14 text-[#F5C84C]";
}

export default async function DeckDetailPage({ params }: DeckDetailPageProps) {
  const { deckId } = await params;
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
      "deck_version_id, opponent_archetype, result, went_first, event_type, played_at, match_tags(tag)"
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
    match_tags: { tag: string }[] | null;
  }[];

  const sessionCoach = buildSessionCoachInsight(matchRows);
  const versionInsights = deckVersions.map((version) => {
      const { analysis, parseError } = safeAnalyzeDeckList(version.decklist);
      const versionMatches = matchRows.filter(
        (match) => match.deck_version_id === version.id
      );
      const performance = countMatchResults(versionMatches);

      return {
        versionId: version.id,
        analysis,
        parseError,
        versionMatches,
        performance,
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
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className="min-w-0">
                  <div className="flex gap-4">
                    <ArchetypeSprites
                      archetype={deckArchetype}
                      size="md"
                      className="mt-1 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#4F8CFF]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                          Manual archetype
                        </span>
                        <p className="text-sm font-medium text-[#F5C84C]">
                          {deckArchetype}
                        </p>
                      </div>
                      <h1 className={pageTitle}>{deckName}</h1>
                      <p className="max-w-2xl text-sm leading-6 text-[#94A3B8]/72">
                        {deckNotes ??
                          "Use the manual archetype as the deck-level identity. Auto-detected archetypes below stay version-specific."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#07111F]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Versions
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                      {deckVersions.length} saved
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#07111F]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Games logged
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                      {totalRecord.total ? `${totalRecord.total} games` : "No games yet"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#07111F]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Active version
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                      {activeVersion ? safeText(activeVersion.name, "Untitled version") : "No active version set"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#07111F]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                      Best current read
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                      {bestVersion
                        ? `${safeText(
                            deckVersions.find((version) => version.id === bestVersion.versionId)?.name,
                            "Version"
                          )} ${Math.round(
                            (bestVersion.performance.wins / bestVersion.performance.total) * 100
                          )}%`
                        : totalRecord.total
                          ? `${totalWinRate}% overall`
                          : "Needs more data"}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {sessionCoach ? <SessionCoachPanel insight={sessionCoach} /> : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section id="versions" className="grid gap-4 scroll-mt-8">
              <div className={`p-4 ${glassPanel}`}>
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                    <Beaker className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className={sectionTitle}>Test versions</h2>
                    <p className={`mt-1 ${sectionCopy}`}>
                      Manual archetype sets deck identity. Auto-detection below shows version-specific parser evidence.
                    </p>
                  </div>
                </div>
              </div>

              {deckVersions.length ? (
                deckVersions.map((version) => {
                  const markActive = markDeckVersionActive.bind(
                    null,
                    deck.id,
                    version.id
                  );
                  const insight = versionInsightById.get(version.id);
                  const analysis = insight?.analysis;
                  const parseError = insight?.parseError ?? null;
                  const versionMatches = insight?.versionMatches ?? [];
                  const testStatus = getVersionTestStatus(versionMatches);
                  const versionName = version.name?.trim() || "Untitled version";
                  const wins = insight?.performance.wins ?? 0;
                  const losses = insight?.performance.losses ?? 0;
                  const ties = insight?.performance.ties ?? 0;
                  const total = insight?.performance.total ?? 0;
                  const winRate = total ? Math.round((wins / total) * 100) : 0;

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
                                Active
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${testStatus.className}`}
                            >
                              {testStatus.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#94A3B8]/62">
                            Created {formatDate(version.created_at)}
                          </p>
                        </div>

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
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="size-4 text-[#4F8CFF]" aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                              Performance
                            </p>
                          </div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                Games
                              </p>
                              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                {total}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                Win rate
                              </p>
                              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                {total ? `${winRate}%` : "N/A"}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                Record
                              </p>
                              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                {wins}W {losses}L {ties}T
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-[#94A3B8]/72">
                            {testStatus.detail}
                          </p>
                        </div>

                        <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
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
                                Matched core cards: {analysis.suggestion.matchedCoreCards.join(", ")}
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
                                Evidence is too thin to trust a parser guess. Keep the manual deck archetype as the primary identity here.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                          <div className="flex items-center gap-2">
                            <Layers3 className="size-4 text-[#4F8CFF]" aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                              Deck composition
                            </p>
                          </div>
                          {analysis?.cards.length ? (
                            <div className="mt-4 grid gap-3 sm:grid-cols-4">
                              {[
                                { label: "Total", value: analysis.totalCards },
                                { label: "Pokémon", value: analysis.pokemonCount },
                                { label: "Trainer", value: analysis.trainerCount },
                                { label: "Energy", value: analysis.energyCount },
                              ].map((stat) => (
                                <div
                                  key={stat.label}
                                  className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
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

                        <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4 text-[#F5C84C]" aria-hidden="true" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                              List status
                            </p>
                          </div>
                          {analysis?.cards.length ? (
                            <div className="mt-4 grid gap-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                    Parsed cards
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                    {analysis.cards.length}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                    Unresolved
                                  </p>
                                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                                    {analysis.unresolved.length}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm leading-6 text-[#94A3B8]/72">
                                {analysis.unresolved.length
                                  ? "Some card names still need review. Open the raw list and clean up unresolved entries before checking legality in detail."
                                  : "Local list parsed cleanly. Full legality lookup is not loaded on first view."}
                              </p>
                              <p className="text-xs text-[#94A3B8]/68">
                                Open deck details to review card resolution before any deeper legality check.
                              </p>
                            </div>
                          ) : parseError ? (
                            <p className="mt-4 text-sm leading-6 text-[#94A3B8]/72">
                              {parseError}
                            </p>
                          ) : (
                            <p className="mt-4 text-sm leading-6 text-[#94A3B8]/72">
                              Add a parsed list to unlock local card-resolution checks.
                            </p>
                          )}
                        </div>
                      </div>

                      {version.notes ? (
                        <div className="mt-4 rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                            Version notes
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                            {version.notes}
                          </p>
                        </div>
                      ) : null}

                      {version.decklist ? (
                        <details className="mt-4 rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-[#DCE8FF] marker:hidden">
                            View raw deck list
                          </summary>
                          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl bg-[#0B1020]/58 p-4 text-sm leading-6 text-[#F8FAFC]">
                            {version.decklist}
                          </pre>
                        </details>
                      ) : null}
                    </article>
                  );
                })
              ) : (
                <div className={emptyCard}>
                  <h3 className="text-lg font-semibold text-[#F8FAFC]">
                    Add the first test version.
                  </h3>
                  <p className={sectionCopy}>
                    Versions are what SixPrizer uses for match logging, version comparison, and future archetype evidence.
                  </p>
                  <a href="#add-version" className={`mt-5 ${primaryButton}`}>
                    Add first version
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </a>
                </div>
              )}
            </section>

            <aside id="add-version" className="scroll-mt-6 lg:sticky lg:top-6">
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

                <DeckVersionForm action={createVersion} />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
