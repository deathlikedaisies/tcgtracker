import { DashboardContent } from "@/components/auth/DashboardContent";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getFormatOptions, LATEST_FORMAT } from "@/lib/formats";
import { redirect } from "next/navigation";

type MatchResult = "win" | "loss";

type MatchRow = {
  id: string;
  deck_version_id: string;
  opponent_archetype: string;
  result: MatchResult;
  went_first: boolean | null;
  event_type: string | null;
  format: string | null;
  played_at: string;
  deck_versions: {
    name: string;
  } | {
    name: string;
  }[] | null;
};

function formatWinRate(wins: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((wins / total) * 100)}%`;
}

function getRecord(matches: MatchRow[]) {
  const wins = matches.filter((match) => match.result === "win").length;
  const losses = matches.filter((match) => match.result === "loss").length;

  return {
    matches: matches.length,
    wins,
    losses,
    winRate: formatWinRate(wins, matches.length),
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

type DashboardPageProps = {
  searchParams: Promise<{
    format?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
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
    .select("id, name, archetype, format, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (decksError) {
    throw new Error(decksError.message);
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, deck_version_id, opponent_archetype, result, went_first, event_type, format, played_at, deck_versions(name)"
    )
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as unknown as MatchRow[];
  const formatOptions = getFormatOptions(matchRows.map((match) => match.format));
  const selectedFormat =
    params.format === "all"
      ? "all"
      : formatOptions.includes(params.format ?? "")
        ? params.format ?? LATEST_FORMAT
        : LATEST_FORMAT;
  const filteredMatches =
    selectedFormat === "all"
      ? matchRows
      : matchRows.filter((match) => match.format === selectedFormat);
  const totalRecord = getRecord(filteredMatches);
  const wentFirstRecord = getRecord(
    filteredMatches.filter((match) => match.went_first === true)
  );
  const wentSecondRecord = getRecord(
    filteredMatches.filter((match) => match.went_first === false)
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
    format: match.format,
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
      selectedFormat={selectedFormat}
      formatOptions={formatOptions}
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
    />
  );
}
