import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  primaryButton,
  sectionCopy,
  secondaryButton,
} from "@/components/brand-styles";
import { MatchLogForm } from "@/components/matches/MatchLogForm";
import { getArchetypeOptions } from "@/lib/archetypes";
import { startDevTimer } from "@/lib/dev-timing";
import {
  analyzeDeckList,
  isClearArchetypeSuggestion,
} from "@/lib/decklist";
import { LATEST_FORMAT } from "@/lib/formats";
import { type MatchResult } from "@/lib/match-types";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isTestingBlocksMissingError } from "@/lib/testing-blocks";
import { getOwnUserPrivateSettings } from "@/lib/user-private-settings";
import { logMatch, rememberPokemonTcgLiveUsername } from "./actions";

type DeckWithVersions = {
  id: string;
  name: string;
  archetype: string;
    deck_versions: {
      id: string;
      decklist: string | null;
      name: string;
      is_active: boolean;
      created_at: string;
  }[];
};

type NewMatchPageProps = {
  searchParams: Promise<{
    deck_version_id?: string;
    event?: string;
    opponent?: string;
    result?: string;
    success?: string;
    testing_block_id?: string;
    went_first?: string;
  }>;
};

export default async function NewMatchPage({
  searchParams,
}: NewMatchPageProps) {
  const endTiming = startDevTimer("route:/matches/new");
  const {
    event,
    opponent,
    result,
    success,
    testing_block_id: testingBlockId,
    deck_version_id: deckVersionId,
    went_first: wentFirst,
  } = await searchParams;
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
      "id, name, archetype, deck_versions(id, name, decklist, is_active, created_at)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("is_active", {
      referencedTable: "deck_versions",
      ascending: false,
    })
    .order("created_at", {
      referencedTable: "deck_versions",
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: previousMatches, error: previousMatchesError } = await supabase
    .from("matches")
    .select("opponent_archetype, result, went_first, event_type, played_at, metadata, match_tags(tag)")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (previousMatchesError) {
    throw new Error(previousMatchesError.message);
  }

  const [
    { data: activeBlocks, error: activeBlocksError },
    { data: testingBlockMatches, error: testingBlockMatchesError },
  ] = await Promise.all([
    supabase
      .from("testing_blocks")
      .select("id, target_matchup, target_games")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select("id, testing_block_id")
      .eq("user_id", user.id)
      .not("testing_block_id", "is", null),
  ]);

  if (activeBlocksError && !isTestingBlocksMissingError(activeBlocksError)) {
    throw new Error(activeBlocksError.message);
  }

  if (
    testingBlockMatchesError &&
    !isTestingBlocksMissingError(testingBlockMatchesError)
  ) {
    throw new Error(testingBlockMatchesError.message);
  }

  const userDecks = (decks ?? []) as DeckWithVersions[];
  const previousOpponentArchetypes = (
    (previousMatches ?? []) as { opponent_archetype: string }[]
  ).map((match) => match.opponent_archetype);
  const sessionCoach = buildSessionCoachInsight(
    (previousMatches ?? []) as {
      opponent_archetype: string;
      result: MatchResult;
      went_first: boolean | null;
      event_type: string | null;
      played_at: string;
      match_tags: { tag: string }[] | null;
    }[]
  );
  const deckOptions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => {
      const suggestion = analyzeDeckList(version.decklist).suggestion;

      return {
        id: version.id,
        label: `${deck.name} - ${version.name}`,
        detail: deck.archetype,
        suggestedArchetype: isClearArchetypeSuggestion(suggestion)
          ? suggestion.archetype
          : null,
        isActive: version.is_active,
      };
    })
  );
  const opponentArchetypeOptions = getArchetypeOptions(LATEST_FORMAT, [
    ...previousOpponentArchetypes,
    ...userDecks.map((deck) => deck.archetype),
  ]);
  const privateSettings = await getOwnUserPrivateSettings(user.id);
  const blockMatchCounts = new Map<string, number>();
  ((testingBlockMatches ?? []) as { testing_block_id: string | null }[]).forEach(
    (match) => {
      if (!match.testing_block_id) return;
      blockMatchCounts.set(
        match.testing_block_id,
        (blockMatchCounts.get(match.testing_block_id) ?? 0) + 1
      );
    }
  );
  const activeTestingBlocks = activeBlocksError
    ? []
    : ((activeBlocks ?? []) as {
        id: string;
        target_matchup: string | null;
        target_games: number | null;
      }[]).map((block) => {
        const progress = blockMatchCounts.get(block.id) ?? 0;
        const target = Math.max(block.target_games ?? 5, 1);

        return {
          id: block.id,
          label: block.target_matchup ?? "Focused testing block",
          targetMatchup: block.target_matchup,
          progressLabel: `${progress} / ${target}`,
        };
      });

  endTiming();

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="log" deckLabel={deckOptions[0]?.label} />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="log"
            eyebrow="Fast log"
            title="Log a game"
            subtitle="Capture the match before the next queue."
            userEmail={user.email ?? "Unknown email"}
            compact
          />

          {deckOptions.length ? (
            <MatchLogForm
              action={logMatch}
              deckOptions={deckOptions}
              opponentArchetypeOptions={opponentArchetypeOptions}
              initialDeckVersionId={deckVersionId}
              initialEventType={event}
              initialOpponentArchetype={opponent}
              initialResult={result}
              initialWentFirst={wentFirst}
              initialTestingBlockId={testingBlockId}
              initialTcgLivePlayerName={
                privateSettings?.pokemon_tcg_live_username ?? null
              }
              activeTestingBlocks={activeTestingBlocks}
              rememberTcgLiveUsernameAction={rememberPokemonTcgLiveUsername}
              sessionCoach={sessionCoach}
              wasSuccessful={success === "1"}
            />
          ) : (
            <div className={`mt-8 ${emptyCard}`}>
              <h2 className="text-lg font-semibold text-[#F8FAFC]">
                No deck versions yet.
              </h2>
              <p className={`mt-2 ${sectionCopy}`}>
                Create a deck and add a version before logging a match. SixPrizer
                uses the version to compare builds and keep your testing history clean.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link href="/decks" className={primaryButton}>
                  Create your first deck
                </Link>
                <Link href="/decks" className={secondaryButton}>
                  Manage decks
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
