import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import {
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
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { logMatch } from "./actions";

type DeckWithVersions = {
  id: string;
  name: string;
  archetype: string;
  format: string | null;
  deck_versions: {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
  }[];
};

type NewMatchPageProps = {
  searchParams: Promise<{
    success?: string;
  }>;
};

export default async function NewMatchPage({
  searchParams,
}: NewMatchPageProps) {
  const { success } = await searchParams;
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
      "id, name, archetype, format, deck_versions(id, name, is_active, created_at)"
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
    .select("opponent_archetype")
    .eq("user_id", user.id);

  if (previousMatchesError) {
    throw new Error(previousMatchesError.message);
  }

  const userDecks = (decks ?? []) as DeckWithVersions[];
  const deckOptions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => ({
      id: version.id,
      label: `${deck.name} - ${version.name}`,
      detail: `${deck.archetype}${deck.format ? ` · ${deck.format}` : ""}`,
      isActive: version.is_active,
    }))
  );
  const opponentArchetypeOptions = getArchetypeOptions(LATEST_FORMAT, [
    ...((previousMatches ?? []) as { opponent_archetype: string }[]).map(
      (match) => match.opponent_archetype
    ),
    ...userDecks.map((deck) => deck.archetype),
  ]);

  return (
    <main className={appShell}>
      <section className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col gap-4">
          <PrizeMapLogo {...logoOnDark} />
          <AppNav current="log" />
        </div>

        <div className="mt-5 border-b border-white/10 pb-6">
          <p className="text-sm font-medium text-[#94A3B8]">Match Log</p>
          <h1 className={pageTitle}>
            Log a Match
          </h1>
          <p className={pageCopy}>
            Fast entry for testing sessions and event rounds.
          </p>
        </div>

        {deckOptions.length ? (
          <MatchLogForm
            action={logMatch}
            deckOptions={deckOptions}
            opponentArchetypeOptions={opponentArchetypeOptions}
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
