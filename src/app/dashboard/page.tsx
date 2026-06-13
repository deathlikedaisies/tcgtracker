import { DashboardContent } from "@/components/auth/DashboardContent";
import {
  buildSessionCoachInsight,
  buildTrainingProgressSummary,
} from "@/lib/session-coach";
import { getOwnProfile } from "@/lib/community";
import {
  countMatchResults,
  type MatchResult,
} from "@/lib/match-types";
import type { CoachMatch } from "@/lib/session-coach";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type MatchRow = {
  id: string;
  deck_version_id: string;
  opponent_archetype: string;
  result: MatchResult;
  went_first: boolean | null;
  event_type: string | null;
  played_at: string;
  metadata: {
    start_quality?: string;
    opening_hand_quality?: string;
    sequencing_quality?: string;
    issue_tags?: string[];
    positive_tags?: string[];
  } | null;
  match_tags: {
    tag: string;
  }[] | null;
  deck_versions: {
    name: string;
  } | {
    name: string;
  }[] | null;
};

type DeckRow = {
  id: string;
  name: string;
  archetype: string;
  created_at: string;
  deck_versions:
    | {
        id: string;
        name: string | null;
        is_active: boolean | null;
      }[]
    | null;
};

function formatWinRate(wins: number, total: number, emptyLabel = "0%") {
  if (total === 0) {
    return emptyLabel;
  }

  return `${Math.round((wins / total) * 100)}%`;
}

function getRecord(matches: MatchRow[], emptyLabel?: string) {
  const { wins, losses, ties, total } = countMatchResults(matches);

  return {
    matches: total,
    wins,
    losses,
    ties,
    winRate: formatWinRate(wins, total, emptyLabel),
  };
}

function getDeckVersionName(match: MatchRow) {
  const deckVersion = Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;

  return deckVersion?.name ?? "Unknown version";
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
    .select("id, name, archetype, created_at, deck_versions(id, name, is_active)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (decksError) {
    throw new Error(decksError.message);
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, deck_version_id, opponent_archetype, result, went_first, event_type, played_at, metadata, match_tags(tag), deck_versions(name)"
    )
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as unknown as MatchRow[];
  const deckRows = (decks ?? []) as unknown as DeckRow[];
  const ownProfile = await getOwnProfile(user.id);
  const hasAnyDeckVersions = deckRows.some(
    (deck) => (deck.deck_versions ?? []).length > 0
  );
  const sessionCoach = buildSessionCoachInsight(matchRows as unknown as CoachMatch[]);
  const trainingProgress = buildTrainingProgressSummary(matchRows);
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

  const recentMatches = filteredMatches.slice(0, 10).map((match) => ({
    id: match.id,
    playedAt: match.played_at,
    deckVersionName: getDeckVersionName(match),
    opponentArchetype: match.opponent_archetype,
    result: match.result,
    eventType: match.event_type,
  }));

  return (
    <DashboardContent
      email={user.email ?? "Unknown email"}
      decks={deckRows}
      hasAnyMatches={matchRows.length > 0}
      hasAnyDeckVersions={hasAnyDeckVersions}
      firstDeckId={deckRows[0]?.id}
      stats={{
        totalMatches: totalRecord.matches,
        totalWins: totalRecord.wins,
        totalLosses: totalRecord.losses,
        totalTies: totalRecord.ties,
        overallWinRate: totalRecord.winRate,
        wentFirstWinRate: wentFirstRecord.winRate,
        wentSecondWinRate: wentSecondRecord.winRate,
      }}
      recentMatches={recentMatches}
      matchupSummary={matchupSummary}
      sessionCoach={sessionCoach}
      trainingProgress={trainingProgress}
      hasProfile={Boolean(ownProfile)}
      profileIsPrivate={ownProfile?.profile_visibility === "private"}
    />
  );
}
