import { DashboardContent } from "@/components/auth/DashboardContent";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type MatchResult = "win" | "loss";

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
  deck_versions: {
    name: string;
  } | {
    name: string;
  }[] | null;
};

function formatWinRate(wins: number, total: number, emptyLabel = "0%") {
  if (total === 0) {
    return emptyLabel;
  }

  return `${Math.round((wins / total) * 100)}%`;
}

function getRecord(matches: MatchRow[], emptyLabel?: string) {
  const wins = matches.filter((match) => match.result === "win").length;
  const losses = matches.filter((match) => match.result === "loss").length;

  return {
    matches: matches.length,
    wins,
    losses,
    winRate: formatWinRate(wins, matches.length, emptyLabel),
  };
}

function getDeckVersionName(match: MatchRow) {
  const deckVersion = Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;

  return deckVersion?.name ?? "Unknown version";
}

function formatChartDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: decks, error: decksError } = await supabase
    .from("decks")
    .select("id, name, archetype, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (decksError) {
    throw new Error(decksError.message);
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, deck_version_id, opponent_archetype, result, went_first, event_type, played_at, match_tags(tag), deck_versions(name)"
    )
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as unknown as MatchRow[];
  const sessionCoach = buildSessionCoachInsight(matchRows);
  const filteredMatches = matchRows;
  const totalRecord = getRecord(filteredMatches);
  const wentFirstRecord = getRecord(
    filteredMatches.filter((match) => match.went_first === true),
    "N/A"
  );
  const wentSecondRecord = getRecord(
    filteredMatches.filter((match) => match.went_first === false),
    "N/A"
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
  )
    .map(([opponentArchetype, groupedMatches]) => ({
      opponentArchetype,
      ...getRecord(groupedMatches),
    }))
    .sort((first, second) => second.matches - first.matches);

  const deckPerformance = Array.from(
    filteredMatches
      .reduce((summary, match) => {
        const current = summary.get(match.deck_version_id) ?? {
          deckVersionId: match.deck_version_id,
          deckVersionName: getDeckVersionName(match),
          matches: [] as MatchRow[],
        };

        current.matches.push(match);
        summary.set(match.deck_version_id, current);
        return summary;
      }, new Map<string, { deckVersionId: string; deckVersionName: string; matches: MatchRow[] }>())
      .values()
  )
    .map((deckVersion) => ({
      deckVersionId: deckVersion.deckVersionId,
      deckVersionName: deckVersion.deckVersionName,
      ...getRecord(deckVersion.matches),
    }))
    .sort((first, second) => second.matches - first.matches);

  const recentMatches = filteredMatches.slice(0, 10).map((match) => ({
    id: match.id,
    playedAt: match.played_at,
    deckVersionName: getDeckVersionName(match),
    opponentArchetype: match.opponent_archetype,
    result: match.result,
    eventType: match.event_type,
  }));
  const trendData = Array.from(
    filteredMatches
      .reduce((summary, match) => {
        const dateKey = match.played_at.slice(0, 10);
        const current = summary.get(dateKey) ?? {
          date: dateKey,
          label: formatChartDate(dateKey),
          wins: 0,
          losses: 0,
        };

        if (match.result === "win") {
          current.wins += 1;
        } else {
          current.losses += 1;
        }

        summary.set(dateKey, current);
        return summary;
      }, new Map<string, { date: string; label: string; wins: number; losses: number }>())
      .values()
  ).sort((first, second) => first.date.localeCompare(second.date));
  const deckPerformanceChart = deckPerformance.slice(0, 8).map((deckVersion) => ({
    name: deckVersion.deckVersionName,
    matches: deckVersion.matches,
    winRate:
      deckVersion.matches === 0
        ? 0
        : Math.round((deckVersion.wins / deckVersion.matches) * 100),
  }));

  return (
    <DashboardContent
      email={user.email ?? "Unknown email"}
      decks={decks ?? []}
      hasAnyMatches={matchRows.length > 0}
      stats={{
        totalMatches: totalRecord.matches,
        totalWins: totalRecord.wins,
        totalLosses: totalRecord.losses,
        overallWinRate: totalRecord.winRate,
        wentFirstWinRate: wentFirstRecord.winRate,
        wentSecondWinRate: wentSecondRecord.winRate,
      }}
      recentMatches={recentMatches}
      matchupSummary={matchupSummary}
      deckPerformance={deckPerformance}
      trendData={trendData}
      deckPerformanceChart={deckPerformanceChart}
      sessionCoach={sessionCoach}
    />
  );
}
