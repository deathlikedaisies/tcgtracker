import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import {
  appContainer,
  appShell,
  emptyCard,
  logoOnDark,
  pageCopy,
  pageTitle,
  sectionCopy,
} from "@/components/brand-styles";
import { MatchLogForm } from "@/components/matches/MatchLogForm";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { getArchetypeOptions } from "@/lib/archetypes";
import { LATEST_FORMAT } from "@/lib/formats";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logMatch } from "./actions";

type DeckWithVersions = {
  id: string;
  name: string;
  archetype: string;
  deck_versions: {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
  }[];
};

type NewMatchPageProps = {
  searchParams: Promise<{
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
      "id, name, archetype, deck_versions(id, name, is_active, created_at)"
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
    .select("opponent_archetype, result, went_first, event_type, played_at, match_tags(tag)")
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
      result: "win" | "loss";
      went_first: boolean | null;
      event_type: string | null;
      played_at: string;
      match_tags: { tag: string }[] | null;
    }[]
  );
  const deckOptions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => ({
      id: version.id,
      label: `${deck.name} - ${version.name}`,
      detail: deck.archetype,
      isActive: version.is_active,
    }))
  );
  const opponentArchetypeOptions = getArchetypeOptions(LATEST_FORMAT, [
    ...previousOpponentArchetypes,
    ...userDecks.map((deck) => deck.archetype),
  ]);
  const recentOpponentArchetypes = Array.from(
    new Set(previousOpponentArchetypes)
  ).slice(0, 5);

  return (
    <main className={appShell}>
      <section className={`${appContainer} max-w-2xl`}>
        <div className="flex max-w-full min-w-0 flex-col gap-4 overflow-x-hidden lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-full">
            <PrizeMapLogo {...logoOnDark} />
            <p className="mt-5 text-sm font-medium text-[#94A3B8]">Match log</p>
            <h1 className={pageTitle}>
              What just happened?
            </h1>
            <p className={pageCopy}>
              Capture the game, then get back to testing.
            </p>
          </div>
          <AppNav current="log" />
        </div>

        {deckOptions.length ? (
          <MatchLogForm
            action={logMatch}
            deckOptions={deckOptions}
            opponentArchetypeOptions={opponentArchetypeOptions}
            recentOpponentArchetypes={recentOpponentArchetypes}
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
              Create a deck and add a version before logging matches.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
