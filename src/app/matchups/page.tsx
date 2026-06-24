import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Zap } from "lucide-react";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { MatchStrip } from "@/components/MatchStrip";
import {
  appFrame,
  appMain,
  appShell,
  cardLarge,
  emptyCard,
  glassPanel,
  glassPanelStrong,
  interactiveTile,
  inputH10,
  label,
  premiumInset,
  premiumInsetStrong,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  textarea,
} from "@/components/brand-styles";
import { SessionCoachPanel } from "@/components/SessionCoachPanel";
import { ShareReportButton, type ShareReport } from "@/components/ShareReportButton";
import { createMatchupSharedReportAction } from "@/app/community/actions";
import { getArchetypeOptions } from "@/lib/archetypes";
import {
  countMatchResults,
  formatMatchRecord,
  type MatchResult,
} from "@/lib/match-types";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import { evaluateMatchupSignal } from "@/lib/session-coach";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { parseDateStart, parseDateEnd } from "@/lib/date-utils";
import { saveMatchupNote } from "./actions";

type SortKey = "most_played" | "highest_win_rate" | "lowest_win_rate" | "az";

type MatchupsPageProps = {
  searchParams: Promise<{
    deck_id?: string;
    deck_version_id?: string;
    start_date?: string;
    end_date?: string;
    opponent_archetype?: string;
    sort?: string;
    share_error?: string;
  }>;
};

type DeckWithVersions = {
  id: string;
  name: string;
  archetype: string;
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
  match_tags: {
    tag: string;
  }[] | null;
  deck_versions:
    | {
        id: string;
        deck_id: string;
      }
    | {
        id: string;
        deck_id: string;
      }[]
    | null;
};

type MatchupNote = {
  id: string;
  your_archetype: string;
  opponent_archetype: string;
  notes: string | null;
  updated_at: string;
};

function formatWinRateValue(wins: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((wins / total) * 100);
}

function formatWinRate(wins: number, total: number) {
  return `${formatWinRateValue(wins, total)}%`;
}

function getDeckVersion(match: MatchRow) {
  return Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getMatchupCoachLabel(matchup: {
  matches: number;
  winRateValue: number;
}) {
  if (matchup.matches < 6) {
    const gamesNeeded = Math.max(6 - matchup.matches, 1);
    return {
      label: "Needs more data",
      className: "bg-[#F5C84C]/14 text-[#FFE28A]",
      action:
        matchup.matches <= 1
          ? `Only ${matchup.matches} game logged. Log ${gamesNeeded} more before treating this matchup as a real trend.`
          : `Small sample. Log ${gamesNeeded} more games before treating this matchup as a reliable read.`,
    };
  }

  if (matchup.matches < 15) {
    return {
      label: "Building signal",
      className: "bg-[#F5C84C]/14 text-[#F5C84C]",
      action: "Early pattern. Keep logging normally — when this matchup appears, tag what goes wrong.",
    };
  }

  if (matchup.winRateValue >= 60) {
    return {
      label: "Strong matchup",
      className: "bg-emerald-500/14 text-emerald-200",
      action: "Good signal. Keep the plan stable and verify after more logged games.",
    };
  }

  if (matchup.winRateValue <= 45) {
    return {
      label: "Priority watchlist",
      className: "bg-[#F43F5E]/14 text-rose-200",
      action: "When this matchup appears, tag the first thing that breaks. Do not change the list until the pattern is clear.",
    };
  }

  return {
    label: "Watchlist",
    className: "bg-[#F5C84C]/14 text-[#F5C84C]",
    action: "Pattern unclear — could go either way. Keep logging to see which direction this moves.",
  };
}

function getHeadlineSignal(matchup: {
  matches: number;
  winRateValue: number;
} | null) {
  if (!matchup) {
    return "Needs more games";
  }

  if (matchup.matches < 6) {
    return "Early warning";
  }

  if (matchup.matches < 15) {
    return "Building signal";
  }

  return matchup.winRateValue <= 45 ? "Priority weakness" : "Needs more games";
}

function getHeadlineTone(matchup: {
  matches: number;
  winRateValue: number;
} | null) {
  if (!matchup || matchup.matches < 15 || matchup.winRateValue > 45) {
    return {
      iconClassName: "text-[#F5C84C]",
      labelClassName: "text-[#FFE28A]",
      valueClassName: "text-[#F5C84C]",
    };
  }

  return {
    iconClassName: "text-[#F43F5E]",
    labelClassName: "text-rose-200",
    valueClassName: "text-[#F43F5E]",
  };
}

export default async function MatchupsPage({
  searchParams,
}: MatchupsPageProps) {
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
    { data: notes, error: notesError },
  ] = await Promise.all([
    supabase
      .from("decks")
      .select("id, name, archetype, deck_versions(id, name, is_active)")
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
        "id, deck_version_id, opponent_archetype, result, went_first, event_type, played_at, match_tags(tag), deck_versions(id, deck_id)"
      )
      .eq("user_id", user.id),
    supabase
      .from("matchup_notes")
      .select("id, your_archetype, opponent_archetype, notes, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  if (decksError) {
    throw new Error(decksError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  if (notesError) {
    throw new Error(notesError.message);
  }

  const userDecks = (decks ?? []) as DeckWithVersions[];
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
  const sort = (
    ["most_played", "highest_win_rate", "lowest_win_rate", "az"].includes(
      params.sort ?? ""
    )
      ? params.sort
      : "most_played"
  ) as SortKey;
  const startDate = parseDateStart(params.start_date);
  const endDate = parseDateEnd(params.end_date);

  const matchRows = (matches ?? []) as unknown as MatchRow[];
  const sessionCoach = buildSessionCoachInsight(matchRows);
  const matchupNotes = (notes ?? []) as MatchupNote[];
  const archetypeOptions = getArchetypeOptions(
    null,
    matchRows.map((match) => match.opponent_archetype)
  );
  const selectedOpponentArchetype = archetypeOptions.includes(
    params.opponent_archetype ?? ""
  )
    ? params.opponent_archetype ?? ""
    : "";
  const filteredMatches = matchRows.filter((match) => {
    const deckVersion = getDeckVersion(match);
    const playedAt = new Date(match.played_at);

    if (
      selectedOpponentArchetype &&
      match.opponent_archetype !== selectedOpponentArchetype
    ) {
      return false;
    }

    if (selectedVersionId && match.deck_version_id !== selectedVersionId) {
      return false;
    }

    if (
      !selectedVersionId &&
      selectedDeckId &&
      deckVersion?.deck_id !== selectedDeckId
    ) {
      return false;
    }

    if (startDate && playedAt < startDate) {
      return false;
    }

    if (endDate && playedAt >= endDate) {
      return false;
    }

    return true;
  });
  const deckById = new Map(userDecks.map((deck) => [deck.id, deck]));
  const yourArchetypesForView = Array.from(
    new Set([
      ...filteredMatches
        .map((match) => {
          const deckId = getDeckVersion(match)?.deck_id;
          return deckId ? deckById.get(deckId)?.archetype : null;
        })
        .filter((archetype): archetype is string => Boolean(archetype)),
      ...matchupNotes
        .map((note) => note.your_archetype)
        .filter((archetype): archetype is string => Boolean(archetype)),
      ...userDecks.map((deck) => deck.archetype),
    ])
  );

  const matchupSummary = Array.from(
    filteredMatches
      .reduce((summary, match) => {
        const current = summary.get(match.opponent_archetype) ?? [];
        current.push(match);
        summary.set(match.opponent_archetype, current);
        return summary;
      }, new Map<string, MatchRow[]>())
      .entries()
  ).map(([opponentArchetype, groupedMatches]) => {
    const { wins, losses, ties, total } = countMatchResults(groupedMatches);

    return {
      opponentArchetype,
      matches: total,
      recentMatches: groupedMatches
        .sort((first, second) => second.played_at.localeCompare(first.played_at))
        .slice(0, 10)
        .map((match) => ({
          id: match.id,
          opponent: match.opponent_archetype,
          playedAt: match.played_at,
          result: match.result,
        })),
      wins,
      losses,
      ties,
      winRate: formatWinRate(wins, total),
      winRateValue: formatWinRateValue(wins, total),
    };
  });

  matchupSummary.sort((first, second) => {
    if (sort === "highest_win_rate") {
      return (
        second.winRateValue - first.winRateValue ||
        second.matches - first.matches ||
        first.opponentArchetype.localeCompare(second.opponentArchetype)
      );
    }

    if (sort === "lowest_win_rate") {
      return (
        first.winRateValue - second.winRateValue ||
        second.matches - first.matches ||
        first.opponentArchetype.localeCompare(second.opponentArchetype)
      );
    }

    if (sort === "az") {
      return first.opponentArchetype.localeCompare(second.opponentArchetype);
    }

    return (
      second.matches - first.matches ||
      first.opponentArchetype.localeCompare(second.opponentArchetype)
    );
  });

  const hasMatches = matchRows.length > 0;
  const hasFilteredMatches = matchupSummary.length > 0;
  const filteredWins = filteredMatches.filter(
    (match) => match.result === "win"
  ).length;
  const reportWinRate = hasFilteredMatches
    ? formatWinRate(filteredWins, filteredMatches.length)
    : "0%";
  const bestMatchup = matchupSummary.reduce<
    (typeof matchupSummary)[number] | null
  >((currentBest, matchup) => {
    if (!currentBest) {
      return matchup;
    }

    if (matchup.winRateValue > currentBest.winRateValue) {
      return matchup;
    }

    if (
      matchup.winRateValue === currentBest.winRateValue &&
      matchup.matches > currentBest.matches
    ) {
      return matchup;
    }

    return currentBest;
  }, null);
  const worstMatchup = matchupSummary.reduce<
    (typeof matchupSummary)[number] | null
  >((currentWorst, matchup) => {
    if (!currentWorst) {
      return matchup;
    }

    const matchupSignal = evaluateMatchupSignal({
      matches: matchup.matches,
      wins: matchup.wins,
      losses: matchup.losses,
      ties: matchup.ties,
    });
    const currentSignal = evaluateMatchupSignal({
      matches: currentWorst.matches,
      wins: currentWorst.wins,
      losses: currentWorst.losses,
      ties: currentWorst.ties,
    });

    if (matchupSignal.score > currentSignal.score) {
      return matchup;
    }

    if (
      matchupSignal.score === currentSignal.score &&
      matchup.matches > currentWorst.matches
    ) {
      return matchup;
    }

    return currentWorst;
  }, null);
  const reportDeckName = selectedVersion
    ? `${selectedVersion.deckName} - ${selectedVersion.name}`
    : selectedDeck?.name ?? "All decks";
  const shareReport: ShareReport = {
    title: "Matchup Analysis Report",
    deckName: reportDeckName,
    winRate: reportWinRate,
    worstMatchup: worstMatchup?.opponentArchetype ?? "No matchup yet",
    bestMatchup: bestMatchup?.opponentArchetype ?? "No matchup yet",
    totalMatches: filteredMatches.length,
    context: "Your matchup data",
  };
  const worstMatchupCoachLabel = worstMatchup
    ? getMatchupCoachLabel(worstMatchup)
    : null;
  const worstMatchupTone = getHeadlineTone(worstMatchup);

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="matchups"
          deckLabel={reportDeckName}
          insight={{
            label: "Weakest read",
            value: worstMatchup?.opponentArchetype ?? "No matchup yet",
            helper: worstMatchup
              ? `${worstMatchup.winRate} across ${worstMatchup.matches} games`
              : "Log games to build signal",
          }}
        />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
        <AuthenticatedPageHeader
          current="matchups"
          title="Matchup Intelligence"
          subtitle="Understand what is really happening and where to focus next."
          userEmail={user.email ?? "Unknown email"}
          actions={
            hasFilteredMatches ? (
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <ShareReportButton report={shareReport} />
                {worstMatchup ? (
                  <form
                    action={createMatchupSharedReportAction.bind(
                      null,
                      selectedDeckId || null,
                      selectedVersionId || null,
                      worstMatchup.opponentArchetype,
                      "link_only"
                    )}
                  >
                    <button type="submit" className={primaryButton}>
                      Create report link
                    </button>
                  </form>
                ) : null}
              </div>
            ) : null
          }
        />

        {params.share_error ? (
          <section className="rounded-[18px] border border-rose-400/18 bg-[linear-gradient(180deg,rgba(68,12,26,0.74),rgba(20,10,18,0.82))] px-4 py-3 text-sm font-medium text-rose-100 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
            Matchup report could not be created right now. Try again in a moment.
          </section>
        ) : null}

        {hasFilteredMatches ? (
          <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
            <article className={`p-3 sm:p-4 ${glassPanelStrong}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`size-4 ${worstMatchupTone.iconClassName}`} aria-hidden="true" />
                    <p className={`text-xs font-semibold uppercase tracking-[0.1em] ${worstMatchupTone.labelClassName}`}>
                      {getHeadlineSignal(worstMatchup)}
                    </p>
                  </div>
                  {worstMatchup ? (
                    <ArchetypeSprites archetype={worstMatchup.opponentArchetype} />
                  ) : null}
                  <h2 className="text-lg font-bold tracking-tight text-[#F8FAFC]">
                    {worstMatchup?.opponentArchetype ?? "No matchup yet"}
                  </h2>
                </div>
                <p className={`text-3xl font-bold ${worstMatchupTone.valueClassName}`}>
                  {worstMatchup?.winRate ?? "0%"}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className={`${premiumInset} flex items-center gap-2 rounded-[12px] px-3 py-1.5`}>
                  <span className="text-xs text-[#94A3B8]/72">Samples</span>
                  <span className="text-sm font-bold text-[#F8FAFC]">{worstMatchup?.matches ?? 0}</span>
                </div>
                <div className={`${premiumInset} flex items-center gap-2 rounded-[12px] px-3 py-1.5`}>
                  <span className="text-xs text-[#94A3B8]/72">Record</span>
                  <span className="text-sm font-bold text-[#F8FAFC]">
                    {worstMatchup
                      ? formatMatchRecord(
                          worstMatchup.wins,
                          worstMatchup.losses,
                          worstMatchup.ties
                        )
                      : "0-0"}
                  </span>
                </div>
                <div className={`${premiumInset} flex items-center rounded-[12px] px-3 py-1.5`}>
                  <span className="text-xs font-semibold text-[#F8FAFC]">
                    {worstMatchup && worstMatchup.matches >= 15
                      ? "Keep logging"
                      : "Keep building signal"}
                  </span>
                </div>
              </div>
              {worstMatchupCoachLabel ? (
                <p className="mt-3 text-sm font-medium text-[#94A3B8]">
                  {worstMatchupCoachLabel.action}
                </p>
              ) : null}
            </article>

            <aside className={`p-4 ${glassPanel}`}>
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-[#F5C84C]" aria-hidden="true" />
                <h2 className="text-lg font-bold text-[#F8FAFC]">
                  What to test next
                </h2>
              </div>
              <div className="mt-4 grid gap-2">
                {([
                  {
                    label: sessionCoach?.missionTitle ?? "Build a five-game sample",
                    href: "/review",
                    cta: "Open review",
                  },
                  worstMatchup
                    ? {
                        label: `Tag every loss vs ${worstMatchup.opponentArchetype}`,
                        href: "/matches/new",
                        cta: "Log a game",
                      }
                    : {
                        label: "Log your first matchup set",
                        href: "/matches/new",
                        cta: "Log a game",
                      },
                  {
                    label: "Compare going first vs second in your recent losses",
                    href: "/review",
                    cta: "Open review",
                  },
                ] as { label: string; href: string; cta: string }[]).map((item, index) => (
                  <div key={item.label} className={`${premiumInset} flex items-center gap-3 rounded-[16px] p-3`}>
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#4F8CFF] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="min-w-0 flex-1 text-sm font-medium leading-5 text-[#F8FAFC]">
                      {item.label}
                    </p>
                    <Link
                      href={item.href}
                      className="shrink-0 rounded-md bg-[#4F8CFF]/18 px-3 py-1 text-xs font-semibold text-[#B8D1FF] transition hover:bg-[#4F8CFF]/28"
                    >
                      {item.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        ) : sessionCoach ? (
          <SessionCoachPanel insight={sessionCoach} />
        ) : null}

        <form action="/matchups" className={`p-3 ${glassPanel}`}>
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
              <label htmlFor="sort" className={label}>
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort}
                className={inputH10}
              >
                <option value="most_played">Most played</option>
                <option value="highest_win_rate">Highest win rate</option>
                <option value="lowest_win_rate">Lowest win rate</option>
                <option value="az">Opponent A-Z</option>
              </select>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="submit" className={primaryButton}>
              Apply filters
            </button>
            <Link href="/matchups" className={secondaryButton}>
              Clear
            </Link>
          </div>
          <details
            className="mt-2"
            {...((params.start_date || params.end_date) ? { open: true } : {})}
          >
            <summary className="cursor-pointer select-none text-xs font-semibold text-[#94A3B8]/72 hover:text-[#F8FAFC]">
              Advanced filters
            </summary>
            <div className="mt-3 grid gap-2 min-[430px]:grid-cols-2">
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
            </div>
          </details>
        </form>

        {!hasMatches ? (
          <section className={emptyCard}>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              No matches logged yet.
            </h2>
            <p className={`mt-3 max-w-xl ${sectionCopy}`}>
              Matchup reports appear after you log games against a deck version.
              Start by setting up a deck if you have not created one yet.
            </p>
            <Link
              href={hasAnyDeckVersions ? "/matches/new" : "/decks"}
              className={`mt-6 ${primaryButton}`}
            >
              {hasAnyDeckVersions ? "Log your first game" : "Create your first deck"}
            </Link>
          </section>
        ) : hasFilteredMatches ? (
          <section className={cardLarge}>
            <div className="flex flex-col gap-1">
              <h2 className={sectionTitle}>
                Matchup breakdown
              </h2>
              <p className={sectionCopy}>
                Every row should tell you what to do next.
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {matchupSummary.map((matchup) => {
                const coachLabel = getMatchupCoachLabel(matchup);

                return (
                  <article
                    key={matchup.opponentArchetype}
                    className={`${interactiveTile} rounded-[16px] p-4`}
                  >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <ArchetypeSprites
                          archetype={matchup.opponentArchetype}
                        />
                        <h3 className="font-medium text-[#F8FAFC]">
                          {matchup.opponentArchetype}
                        </h3>
                        <span
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${coachLabel.className}`}
                        >
                          {coachLabel.label}
                        </span>
                        {sessionCoach?.archetype === matchup.opponentArchetype ? (
                          <span className="rounded-md bg-[#F5C84C]/12 px-2 py-1 text-xs font-semibold text-[#F5C84C]">
                            Focus area
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-[#1A2238]/70">
                        <div
                          className={`h-2 rounded-full bg-[#4F8CFF] ${
                            matchup.matches < 3 ? "opacity-45" : ""
                          }`}
                          style={{ width: `${matchup.winRateValue}%` }}
                        />
                      </div>
                      {matchup.matches < 6 ? (
                        <p className="mt-2 text-xs font-medium text-[#94A3B8]/76">
                          {matchup.matches <= 1
                            ? "Only 1 game logged. Add more before trusting this rate."
                            : "Small sample. Log more games before trusting this rate."}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm font-medium text-[#94A3B8]">
                        {coachLabel.action}
                      </p>
                      <div className="mt-3">
                        <MatchStrip matches={matchup.recentMatches} />
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-sm">
                      <p className="text-[#94A3B8]">{matchup.matches} played</p>
                      <p className="text-[#94A3B8]">{matchup.wins} W</p>
                      <p className="text-[#94A3B8]">{matchup.losses} L</p>
                      <p className="text-[#94A3B8]">{matchup.ties} T</p>
                      <p className="font-semibold text-[#F8FAFC]">
                        {matchup.winRate}
                      </p>
                    </div>
                  </div>

                  <details className={`${premiumInsetStrong} mt-4 rounded-[16px] p-3`}>
                    <summary className="cursor-pointer text-sm font-medium text-[#F8FAFC] transition hover:text-[#F5C84C]">
                      Preparation notes
                    </summary>
                    <div className="mt-4 flex flex-col gap-3">
                      {yourArchetypesForView.length ? (
                        yourArchetypesForView.map((yourArchetype) => {
                          const note = matchupNotes.find(
                            (candidate) =>
                              candidate.your_archetype === yourArchetype &&
                              candidate.opponent_archetype ===
                                matchup.opponentArchetype
                          );

                          return (
                            <form
                              key={`${yourArchetype}-${matchup.opponentArchetype}`}
                              action={saveMatchupNote}
                              className={`${premiumInset} rounded-[16px] p-3`}
                            >
                              <input
                                type="hidden"
                                name="your_archetype"
                                value={yourArchetype}
                              />
                              <input
                                type="hidden"
                                name="opponent_archetype"
                                value={matchup.opponentArchetype}
                              />
                              <div className="flex flex-col gap-1">
                                <p className="text-xs font-medium uppercase text-[#94A3B8]">
                                  {yourArchetype} vs {matchup.opponentArchetype}
                                </p>
                                {note ? (
                                  <p className="text-xs text-[#94A3B8]/78">
                                    Updated {formatUpdatedAt(note.updated_at)}
                                  </p>
                                ) : null}
                              </div>
                              <textarea
                                name="notes"
                                rows={3}
                                defaultValue={note?.notes ?? ""}
                                placeholder="Plan, tech cards, sequencing, side notes..."
                                className={`mt-3 w-full text-sm ${textarea}`}
                              />
                              <button
                                type="submit"
                                className={`mt-3 h-9 px-3 ${primaryButton}`}
                              >
                                {note ? "Update note" : "Save note"}
                              </button>
                            </form>
                          );
                        })
                      ) : (
                        <p className={sectionCopy}>
                          Create a deck before saving prep notes.
                        </p>
                      )}
                    </div>
                  </details>
                </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className={emptyCard}>
            <h2 className="text-xl font-semibold text-[#F8FAFC]">
              No matchups match these filters.
            </h2>
            <p className={`mt-2 ${sectionCopy}`}>
              Try a different deck, deck version, archetype, date range, or
              clear the filters.
            </p>
            <Link
              href="/matchups"
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
