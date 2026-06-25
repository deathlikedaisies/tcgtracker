import { DashboardContent } from "@/components/auth/DashboardContent";
import { resolveCurrentDeckScope } from "@/lib/current-deck-scope";
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

  const [
    { data: decks, error: decksError },
    { data: matches, error: matchesError },
    ownProfile,
  ] = await Promise.all([
    supabase
      .from("decks")
      .select("id, name, archetype, created_at, deck_versions(id, name, is_active)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select(
        "id, deck_version_id, opponent_archetype, result, went_first, event_type, played_at, metadata, match_tags(tag), deck_versions(name)"
      )
      .eq("user_id", user.id)
      .order("played_at", { ascending: false }),
    getOwnProfile(user.id),
  ]);

  if (decksError) {
    throw new Error(decksError.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as unknown as MatchRow[];
  const deckRows = (decks ?? []) as unknown as DeckRow[];
  const deckScope = resolveCurrentDeckScope({
    decks: deckRows,
    matches: matchRows,
  });
  const currentDeck =
    deckRows.find((deck) => deck.id === deckScope.deckId) ?? null;
  const currentDeckActiveVersion =
    currentDeck?.deck_versions?.find((version) => Boolean(version.is_active)) ??
    currentDeck?.deck_versions?.[0] ??
    null;
  const scopedMatchRows = deckScope.deckId
    ? matchRows.filter(
        (match) =>
          deckScope.versionToDeckId.get(match.deck_version_id) === deckScope.deckId
      )
    : matchRows;
  const hasAnyDeckVersions = deckRows.some(
    (deck) => (deck.deck_versions ?? []).length > 0
  );
  const sessionCoach = buildSessionCoachInsight(
    scopedMatchRows as unknown as CoachMatch[]
  );
  const trainingProgress = buildTrainingProgressSummary(scopedMatchRows);
  const totalRecord = getRecord(scopedMatchRows);
  const wentFirstRecord = getRecord(
    scopedMatchRows.filter((match) => match.went_first === true),
    "N/A"
  );
  const wentSecondRecord = getRecord(
    scopedMatchRows.filter((match) => match.went_first === false),
    "N/A"
  );

  const matchupSummary = Array.from(
    scopedMatchRows
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

  const recentMatches = scopedMatchRows.slice(0, 10).map((match) => ({
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
      hasScopedMatches={scopedMatchRows.length > 0}
      hasAnyDeckVersions={hasAnyDeckVersions}
      firstDeckId={deckRows[0]?.id}
      currentDeckId={deckScope.deckId}
      currentDeckName={deckScope.deckName}
      currentDeckArchetype={currentDeck?.archetype ?? null}
      currentDeckVersionName={currentDeckActiveVersion?.name ?? null}
      reviewHref={
        deckScope.deckId
          ? `/review?deck_id=${encodeURIComponent(deckScope.deckId)}`
          : "/review?deck_id=all"
      }
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
