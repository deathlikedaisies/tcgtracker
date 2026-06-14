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
import {
  analyzeDeckList,
  isClearArchetypeSuggestion,
} from "@/lib/decklist";
import { LATEST_FORMAT } from "@/lib/formats";
import { type MatchResult } from "@/lib/match-types";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logMatch } from "./actions";

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
    went_first?: string;
  }>;
};

export default async function NewMatchPage({
  searchParams,
}: NewMatchPageProps) {
  const {
    event,
    opponent,
    result,
    success,
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

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="log" deckLabel={deckOptions[0]?.label} />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="log"
            eyebrow="Fast log"
            title="Log a game"
            subtitle="Capture the matchup, result, and context before the next queue."
            userEmail={user.email ?? "Unknown email"}
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
