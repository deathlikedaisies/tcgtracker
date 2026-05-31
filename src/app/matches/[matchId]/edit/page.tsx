import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import {
  appFrame,
  appMain,
  appShell,
  logoOnDark,
  pageCopy,
  pageTitle,
} from "@/components/brand-styles";
import { MatchLogForm } from "@/components/matches/MatchLogForm";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { getArchetypeOptions } from "@/lib/archetypes";
import {
  parseMatchMetadata,
  type MatchMetadata,
  type MatchResult,
} from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { updateMatch } from "../../actions";

type EditMatchPageProps = {
  params: Promise<{
    matchId: string;
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
  opponent_variant: string | null;
  result: MatchResult;
  went_first: boolean | null;
  event_type: string | null;
  notes: string | null;
  metadata: MatchMetadata | Record<string, unknown> | null;
  match_tags:
    | {
        tag: string;
      }[]
    | null;
};

export default async function EditMatchPage({ params }: EditMatchPageProps) {
  const { matchId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select(
      "id, deck_version_id, opponent_archetype, opponent_variant, result, went_first, event_type, notes, metadata, match_tags(tag)"
    )
    .eq("id", matchId)
    .eq("user_id", user.id)
    .single();

  if (matchError || !match) {
    notFound();
  }

  const { data: decks, error: decksError } = await supabase
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
    });

  if (decksError) {
    throw new Error(decksError.message);
  }

  const { data: previousMatches, error: previousMatchesError } = await supabase
    .from("matches")
    .select("opponent_archetype")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (previousMatchesError) {
    throw new Error(previousMatchesError.message);
  }

  const currentMatch = match as unknown as MatchRow;
  const userDecks = (decks ?? []) as DeckWithVersions[];
  const deckOptions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => ({
      id: version.id,
      label: `${deck.name} - ${version.name}`,
      detail: deck.archetype,
      isActive: version.is_active,
      suggestedArchetype: null,
    }))
  );
  const currentTags = currentMatch.match_tags?.map((tag) => tag.tag) ?? [];
  const opponentArchetypeOptions = getArchetypeOptions(null, [
    ...((previousMatches ?? []) as { opponent_archetype: string }[]).map(
      (previousMatch) => previousMatch.opponent_archetype
    ),
    ...userDecks.map((deck) => deck.archetype),
    currentMatch.opponent_archetype,
  ]);
  const saveMatch = updateMatch.bind(null, currentMatch.id);

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="matches"
          insight={{
            label: "Editing",
            value: currentMatch.opponent_archetype,
            helper: currentMatch.result,
          }}
        />
        <div className={`${appMain} mx-auto w-full max-w-6xl`}>
          <div className="flex max-w-full min-w-0 flex-col gap-4 overflow-x-hidden lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-full">
              <SixPrizerLogo {...logoOnDark} />
              <p className="mt-5 text-sm font-medium text-[#94A3B8]">
                Match history
              </p>
              <h1 className={pageTitle}>Edit Match</h1>
              <p className={pageCopy}>
                Update the structured context, result, and learnings for this game.
              </p>
            </div>
            <div className="lg:hidden">
              <AppNav current="matches" />
            </div>
          </div>

          <MatchLogForm
            action={saveMatch}
            deckOptions={deckOptions}
            opponentArchetypeOptions={opponentArchetypeOptions}
            initialDeckVersionId={currentMatch.deck_version_id}
            initialEventType={currentMatch.event_type ?? undefined}
            initialOpponentArchetype={currentMatch.opponent_archetype}
            initialOpponentVariant={currentMatch.opponent_variant ?? undefined}
            initialResult={currentMatch.result}
            initialWentFirst={
              currentMatch.went_first === null
                ? undefined
                : currentMatch.went_first
                  ? "true"
                  : "false"
            }
            initialNotes={currentMatch.notes ?? undefined}
            initialTags={currentTags}
            initialMetadata={parseMatchMetadata(currentMatch.metadata)}
            secondaryHref="/matches"
            secondaryLabel="Back to matches"
            submitLabel="Save match"
            wasSuccessful={false}
          />
        </div>
      </section>
    </main>
  );
}
