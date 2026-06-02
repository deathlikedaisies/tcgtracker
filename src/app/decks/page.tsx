import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Beaker,
  ClipboardList,
  Layers3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import {
  appFrame,
  appMain,
  appShell,
  dangerButton,
  emptyCard,
  glassPanel,
  glassPanelStrong,
  inputH10,
  label,
  logoOnDark,
  pageCopy,
  pageTitle,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  textarea,
} from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { getArchetypeOptions } from "@/lib/archetypes";
import {
  analyzeDeckList,
  type DecklistAnalysis,
} from "@/lib/decklist";
import { LATEST_FORMAT } from "@/lib/formats";
import { type MatchResult } from "@/lib/match-types";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createDeck, deleteDeck } from "./actions";

type DeckVersion = {
  id: string;
  name: string | null;
  decklist: string | null;
  notes: string | null;
  is_active: boolean | null;
  created_at: string;
};

type Deck = {
  id: string;
  name: string;
  archetype: string | null;
  notes: string | null;
  created_at: string;
  deck_versions: DeckVersion[] | null;
};

type MatchRow = {
  deck_version_id: string;
  opponent_archetype: string;
  result: MatchResult;
  went_first: boolean | null;
  event_type: string | null;
  played_at: string;
  match_tags: { tag: string }[] | null;
};

type DeckSummary = {
  deck: {
    id: string;
    name: string;
    archetype: string;
    notes: string | null;
    created_at: string;
  };
  deckId: string;
  deckName: string;
  deckArchetype: string;
  deckNotes: string | null;
  createdAt: string;
  activeVersion: {
    id: string;
    name: string;
    decklist: string | null;
    notes: string | null;
    is_active: boolean | null;
    created_at: string;
  } | null;
  activeVersionId: string | null;
  activeVersionName: string;
  totalVersions: number;
  totalDeckGames: number;
  performance: ReturnType<typeof formatRecord>;
  trend: ReturnType<typeof getTrendTone>;
  analysis: DecklistAnalysis | null;
  parseError: string | null;
  activeMission: string | null;
  listParseSummary: string;
  listParseDetail: string;
  versionPrompt: string;
  buildFailed: boolean;
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

function getDeckVersions(value: Deck["deck_versions"]) {
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
      parseError: "List could not be parsed. Open deck details to review the raw list.",
    };
  }
}

function getRecord(matches: { result: MatchResult }[]) {
  return matches.reduce(
    (record, match) => {
      if (match.result === "win") {
        record.wins += 1;
      } else if (match.result === "loss") {
        record.losses += 1;
      } else {
        record.ties += 1;
      }

      record.total += 1;
      return record;
    },
    { wins: 0, losses: 0, ties: 0, total: 0 }
  );
}

function formatRecord(matches: { result: MatchResult }[]) {
  const record = getRecord(matches);

  return {
    ...record,
    winRate: record.total ? Math.round((record.wins / record.total) * 100) : 0,
  };
}

function getTrendTone(total: number, winRate: number) {
  if (total < 3) {
    return {
      label: "Needs games",
      detail: total
        ? `Log ${Math.max(3 - total, 0)} more game${3 - total === 1 ? "" : "s"} to unlock a read`
        : "No games logged yet",
      tone:
        "bg-[#4F8CFF]/10 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]",
    };
  }

  if (total < 5) {
    return {
      label: "Building signal",
      detail: `${winRate}% across ${total} logged games`,
      tone:
        "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]",
    };
  }

  if (winRate >= 55) {
    return {
      label: "Improving signal",
      detail: `${winRate}% across ${total} logged games`,
      tone:
        "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]",
    };
  }

  return {
    label: "No clear trend",
    detail: `${winRate}% across ${total} logged games`,
    tone:
      "bg-[#F43F5E]/10 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]",
  };
}

export default async function DecksPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: decks, error } = await supabase
    .from("decks")
    .select(
      "id, name, archetype, notes, created_at, deck_versions(id, name, decklist, notes, is_active, created_at)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

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

  const userDecks = (decks ?? []) as Deck[];
  const userMatches = (matches ?? []) as MatchRow[];
  const sessionCoach = buildSessionCoachInsight(userMatches);
  const archetypeOptions = getArchetypeOptions(
    LATEST_FORMAT,
    userDecks.map((deck) => deck.archetype).filter(Boolean) as string[]
  );

  const deckSummaries = userDecks.map((deck, index): DeckSummary => {
    const deckId = typeof deck.id === "string" ? deck.id : `invalid-deck-${index}`;
    const deckName = safeText(deck.name, "Untitled deck");
    const deckArchetype = safeText(deck.archetype, "Unknown archetype");
    const deckNotes = safeOptionalText(deck.notes);

    try {
      const versions = getDeckVersions(deck.deck_versions);
      const activeVersion =
        versions.find((version) => version.is_active) ?? versions[0] ?? null;
      const activeVersionId =
        activeVersion && typeof activeVersion.id === "string"
          ? activeVersion.id
          : null;
      const versionIds = new Set(
        versions
          .map((version) => (typeof version.id === "string" ? version.id : ""))
          .filter(Boolean)
      );
      const deckMatches = userMatches.filter((match) => versionIds.has(match.deck_version_id));
      const activeVersionMatches = activeVersionId
        ? userMatches.filter((match) => match.deck_version_id === activeVersionId)
        : [];
      const performance = formatRecord(activeVersionMatches);
      const totalDeckGames = deckMatches.length;
      const trend = getTrendTone(performance.total, performance.winRate);
      const { analysis, parseError } = safeAnalyzeDeckList(
        typeof activeVersion?.decklist === "string" ? activeVersion.decklist : null
      );
      const activeMission =
        index === 0 && sessionCoach ? sessionCoach.missionTitle : null;
      const activeVersionName = activeVersion
        ? safeText(activeVersion.name, "Untitled version")
        : "No active version set";
      const listParseSummary = analysis
        ? `${analysis.totalCards} cards · ${analysis.pokemonCount} Pokémon · ${analysis.trainerCount} Trainer · ${analysis.energyCount} Energy`
        : parseError
          ? "List could not be parsed"
          : activeVersionId
            ? "No list added"
            : "Add a deck list to unlock local parsing";
      const listParseDetail = parseError
        ? parseError
        : analysis
          ? analysis.unresolved.length
            ? `${analysis.unresolved.length} unresolved name${analysis.unresolved.length === 1 ? "" : "s"}. Open deck for legality details.`
            : "Local list parsed. Open deck for legality details."
          : activeVersionId
            ? "This active version does not have a deck list yet."
            : "Add a first version to start list checks.";
      const versionPrompt = !versions.length
        ? "Add first version"
        : !performance.total
          ? "Log first game"
          : "Open";

      return {
        deck: {
          id: deckId,
          name: deckName,
          archetype: deckArchetype,
          notes: deckNotes,
          created_at: typeof deck.created_at === "string" ? deck.created_at : "",
        },
        deckId,
        deckName,
        deckArchetype,
        deckNotes,
        createdAt: typeof deck.created_at === "string" ? deck.created_at : "",
        activeVersion: activeVersion
          ? {
              id: activeVersionId ?? "",
              name: activeVersionName,
              decklist: typeof activeVersion.decklist === "string" ? activeVersion.decklist : null,
              notes: safeOptionalText(activeVersion.notes),
              is_active: activeVersion.is_active,
              created_at:
                typeof activeVersion.created_at === "string"
                  ? activeVersion.created_at
                  : "",
            }
          : null,
        activeVersionId,
        activeVersionName,
        totalVersions: versions.length,
        totalDeckGames,
        performance,
        trend,
        analysis,
        parseError,
        activeMission,
        listParseSummary,
        listParseDetail,
        versionPrompt,
        buildFailed: false,
      };
    } catch {
      return {
        deck: {
          id: deckId,
          name: deckName,
          archetype: deckArchetype,
          notes: deckNotes,
          created_at: typeof deck.created_at === "string" ? deck.created_at : "",
        },
        deckId,
        deckName,
        deckArchetype,
        deckNotes,
        createdAt: typeof deck.created_at === "string" ? deck.created_at : "",
        activeVersion: null,
        activeVersionId: null,
        activeVersionName: "Deck summary could not be built",
        totalVersions: getDeckVersions(deck.deck_versions).length,
        totalDeckGames: 0,
        performance: { wins: 0, losses: 0, ties: 0, total: 0, winRate: 0 },
        trend: getTrendTone(0, 0),
        analysis: null,
        parseError: "This deck has invalid data. Open it to review the saved versions.",
        activeMission: null,
        listParseSummary: "Deck summary could not be built",
        listParseDetail: "Open this deck to review the saved versions and raw list.",
        versionPrompt: "Open",
        buildFailed: true,
      };
    }
  });

  const totalVersions = deckSummaries.reduce(
    (count, deck) => count + deck.totalVersions,
    0
  );
  const activeDeckCount = deckSummaries.filter((deck) => deck.activeVersion).length;
  const bestPerformer = deckSummaries
    .filter((deck) => deck.performance.total >= 3)
    .sort((left, right) => {
      if (right.performance.winRate !== left.performance.winRate) {
        return right.performance.winRate - left.performance.winRate;
      }

      return right.performance.total - left.performance.total;
    })[0];

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="decks"
          insight={{
            label: "Deck work",
            value: sessionCoach?.missionSkill ?? "Create an experiment",
            helper: userDecks.length
              ? `${userDecks.length} deck${userDecks.length === 1 ? "" : "s"} saved`
              : "Start with one test list",
          }}
        />

        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <header className={glassPanelStrong}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <SixPrizerLogo {...logoOnDark} />
                <h1 className={pageTitle}>Deck Experiments</h1>
                <p className={pageCopy}>
                  Track each deck as a testable hypothesis.
                </p>
              </div>
              <div className="lg:hidden">
                <AppNav current="decks" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  icon: Layers3,
                  label: "Active decks",
                  value: String(activeDeckCount || userDecks.length),
                  helper: userDecks.length
                    ? "Decks with a current version in view"
                    : "Create your first experiment",
                  tone:
                    "bg-[#4F8CFF]/10 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16)]",
                },
                {
                  icon: Beaker,
                  label: "Versions testing",
                  value: String(totalVersions),
                  helper: totalVersions
                    ? "Versions are what you log matches with"
                    : "Add a first version after creating a deck",
                  tone:
                    "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]",
                },
                {
                  icon: ClipboardList,
                  label: "Games logged",
                  value: String(userMatches.length),
                  helper: userMatches.length
                    ? "Current experiment sample size"
                    : "Log 3 games to unlock first trends",
                  tone:
                    "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]",
                },
                {
                  icon: TrendingUp,
                  label: "Best performer",
                  value: bestPerformer
                    ? `${bestPerformer.deckName} ${bestPerformer.performance.winRate}%`
                    : "Needs more data",
                  helper: bestPerformer
                    ? `${bestPerformer.activeVersionName} across ${bestPerformer.performance.total} games`
                    : "A clear read appears after a few logged games",
                  tone:
                    "bg-[#4F8CFF]/10 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16)]",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[22px] bg-[linear-gradient(180deg,rgba(11,16,32,0.9),rgba(7,17,31,0.82))] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex size-9 items-center justify-center rounded-xl ${stat.tone}`}
                    >
                      <stat.icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/76">
                      {stat.label}
                    </p>
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight text-[#F8FAFC]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
                    {stat.helper}
                  </p>
                </div>
              ))}
            </div>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <section className="grid gap-4">
              <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(15,26,45,0.92),rgba(7,17,31,0.88))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.09)] sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#4F8CFF]/10 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                    <Layers3 className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className={sectionTitle}>Active experiments</h2>
                    <p className={`mt-1 ${sectionCopy}`}>
                      Decks hold versions. Versions are what you log games with.
                    </p>
                  </div>
                </div>
              </div>

              {deckSummaries.length ? (
                deckSummaries.map((summary, index) => {
                  const removeDeck = deleteDeck.bind(null, summary.deckId);
                  const activeVersionName = summary.activeVersionName;
                  const deckArchetype = summary.deckArchetype;

                  const localListSummary = summary.analysis
                    ? `${summary.analysis.totalCards} cards${summary.analysis.unresolved.length ? ` / ${summary.analysis.unresolved.length} unresolved` : ""}`
                    : summary.parseError
                      ? "List parse issue"
                      : "Add list to parse";
                  const localListDetail = summary.parseError
                    ? summary.parseError
                    : summary.analysis
                    ? `${summary.analysis.pokemonCount} Pokemon / ${summary.analysis.trainerCount} Trainer / ${summary.analysis.energyCount} Energy`
                    : summary.activeVersion
                      ? "Open deck for legality details."
                      : "Add a first version to start list checks.";
                  const versionPrompt = !summary.totalVersions
                    ? "Add first version"
                    : !summary.performance.total
                      ? "Log first game"
                      : "Open";
                  const statusItems = [
                    {
                      label: "Active version",
                      value: activeVersionName,
                      detail: summary.activeVersionId
                        ? "Current build selected for logging"
                        : "Choose or create the build you want to test",
                    },
                    {
                      label: "Games logged",
                      value: summary.totalDeckGames
                        ? `${summary.totalDeckGames} game${summary.totalDeckGames === 1 ? "" : "s"}`
                        : "No games yet",
                      detail: summary.totalDeckGames
                        ? `${summary.performance.wins}W ${summary.performance.losses}L ${summary.performance.ties}T`
                        : "Log 3 games to unlock first trends",
                    },
                    {
                      label: "Current read",
                      value: summary.trend.label,
                      detail: summary.performance.total
                        ? `${summary.performance.winRate}% win rate across ${summary.performance.total} games`
                        : "Needs games",
                    },
                    {
                      label: "List parse",
                      value: localListSummary,
                      detail: localListDetail,
                    },
                  ];

                  return (
                    <article
                      key={summary.deck.id}
                      className="rounded-[26px] bg-[radial-gradient(circle_at_top_left,rgba(79,140,255,0.12),transparent_34%),linear-gradient(180deg,rgba(15,26,45,0.94),rgba(7,17,31,0.88))] p-4 shadow-[0_20px_56px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.08)] sm:p-5"
                    >
                      <div className="grid gap-5">
                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-start">
                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <ArchetypeSprites
                                archetype={deckArchetype}
                                size="md"
                                className="shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-xl font-semibold text-[#F8FAFC]">
                                    {summary.deck.name}
                                  </h3>
                                  <span className="rounded-full bg-[#4F8CFF]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                                    Manual archetype
                                  </span>
                                  {index === 0 ? (
                                    <span className="rounded-full bg-[#F5C84C]/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                                      Active
                                    </span>
                                  ) : null}
                                  <span className="rounded-full bg-[#07111F]/58 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                                    {summary.totalVersions ? "Testing" : "Needs version"}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-[#94A3B8]/76">
                                  {deckArchetype}
                                </p>
                                <p className="mt-1 text-xs text-[#94A3B8]/62">
                                  Created {formatDate(summary.deck.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${summary.trend.tone}`}
                                >
                                  {summary.trend.label}
                                </span>
                                {summary.activeMission ? (
                                  <span className="rounded-full bg-[#F5C84C]/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                                    Mission: {sessionCoach?.missionSkill}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#94A3B8]/72">
                                {summary.deck.notes
                                  ? summary.deck.notes
                                  : summary.activeMission ?? summary.trend.detail}
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                            <Link
                              href={`/decks/${summary.deck.id}`}
                              className={primaryButton}
                            >
                              {versionPrompt}
                            </Link>
                            <Link
                              href={`/decks/${summary.deck.id}#versions`}
                              className={secondaryButton}
                            >
                              Compare versions
                            </Link>
                            <form action={removeDeck}>
                              <ConfirmSubmitButton
                                message="Delete this deck and all of its versions and matches? This cannot be undone."
                                className={`w-full ${dangerButton}`}
                              >
                                Delete
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {statusItems.map((item) => (
                            <div
                              key={item.label}
                              className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                            >
                              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                                {item.label}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                                {item.value}
                              </p>
                              <p className="mt-2 text-xs leading-5 text-[#94A3B8]/68">
                                {item.detail}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-3 rounded-[22px] bg-[#07111F]/34 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.07)] sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                              Experiment status
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
                              {summary.activeMission
                                ? summary.activeMission
                                : summary.totalVersions
                                  ? "Open this deck to compare versions, review parser evidence, and keep logging games into the active build."
                                  : "Add a first version so this deck can become a real testing experiment."}
                            </p>
                          </div>
                          <p className="text-xs leading-5 text-[#94A3B8]/62 sm:max-w-[280px] sm:text-right">
                            {summary.buildFailed
                              ? "One saved version needs review, but the deck is still accessible."
                              : localListDetail}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className={emptyCard}>
                  <h3 className="text-lg font-semibold text-[#F8FAFC]">
                    Create your first deck.
                  </h3>
                  <p className={`mt-2 ${sectionCopy}`}>
                    Start with the deck family, add a version next, and log a few games to unlock experiment signal.
                  </p>
                </div>
              )}
            </section>

            <aside className="lg:sticky lg:top-6">
              <div className="grid gap-4">
                <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(15,26,45,0.92),rgba(7,17,31,0.88))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-[#F5C84C]" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-[#F8FAFC]">
                      {userDecks.length ? "Add another deck" : "Start a new experiment"}
                    </h2>
                  </div>
                  <p className={`mt-1 ${sectionCopy}`}>
                    Create the deck family first. You&apos;ll add versions next.
                  </p>
                </div>

                <form action={createDeck} className={`p-4 ${glassPanel}`}>
                  <div className="mt-1 flex flex-col gap-4">
                    <input type="hidden" name="format" value={LATEST_FORMAT} />
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className={label}>
                        Deck name
                      </label>
                      <input
                        id="name"
                        name="name"
                        required
                        placeholder="Mega Lucario Duns"
                        className={inputH10}
                      />
                    </div>

                    <ArchetypePicker
                      id="archetype"
                      name="archetype"
                      label="Archetype"
                      options={archetypeOptions}
                      placeholder="Search or type an archetype"
                      customOptionPrefix="Use custom deck archetype"
                      required
                    />

                    <div className="flex flex-col gap-2">
                      <label htmlFor="notes" className={label}>
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={4}
                        placeholder="What are you testing with this deck family?"
                        className={textarea}
                      />
                    </div>

                    <button type="submit" className={primaryButton}>
                      Create deck
                    </button>
                  </div>
                </form>

                <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#4F8CFF]/10 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                      <ShieldCheck className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#F8FAFC]">
                        Deck setup
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
                        Decks hold versions. Versions are what you log games with.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
