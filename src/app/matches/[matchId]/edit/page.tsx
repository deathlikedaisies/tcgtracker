import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getArchetypeOptions } from "@/lib/archetypes";
import { LATEST_FORMAT, MATCH_FORMATS } from "@/lib/formats";
import { MATCH_TAGS } from "@/lib/match-options";
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
  format: string | null;
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
  result: "win" | "loss";
  went_first: boolean | null;
  event_type: string | null;
  format: string | null;
  notes: string | null;
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
      "id, deck_version_id, opponent_archetype, opponent_variant, result, went_first, event_type, format, notes, match_tags(tag)"
    )
    .eq("id", matchId)
    .eq("user_id", user.id)
    .single();

  if (matchError || !match) {
    notFound();
  }

  const { data: decks, error: decksError } = await supabase
    .from("decks")
    .select("id, name, archetype, format, deck_versions(id, name, is_active)")
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
    .eq("user_id", user.id);

  if (previousMatchesError) {
    throw new Error(previousMatchesError.message);
  }

  const currentMatch = match as unknown as MatchRow;
  const userDecks = (decks ?? []) as DeckWithVersions[];
  const deckOptions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => ({
      id: version.id,
      label: `${deck.name} - ${version.name}`,
      detail: `${deck.archetype}${deck.format ? ` · ${deck.format}` : ""}`,
      isActive: version.is_active,
    }))
  );
  const currentTags = currentMatch.match_tags?.map((tag) => tag.tag) ?? [];
  const tagOptions = Array.from(new Set([...MATCH_TAGS, ...currentTags]));
  const selectedFormat = MATCH_FORMATS.includes(currentMatch.format as never)
    ? currentMatch.format ?? LATEST_FORMAT
    : "custom";
  const customFormat = selectedFormat === "custom" ? currentMatch.format ?? "" : "";
  const opponentArchetypeOptions = getArchetypeOptions(currentMatch.format, [
    ...((previousMatches ?? []) as { opponent_archetype: string }[]).map(
      (previousMatch) => previousMatch.opponent_archetype
    ),
    ...userDecks.map((deck) => deck.archetype),
    currentMatch.opponent_archetype,
  ]);
  const saveMatch = updateMatch.bind(null, currentMatch.id);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-2xl">
        <AppNav current="matches" />

        <div className="mt-5 border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium text-zinc-500">Match History</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            Edit Match
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Update match details and tags.
          </p>
        </div>

        <form
          action={saveMatch}
          className="mt-8 rounded-md border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="deck_version_id"
                className="text-sm font-medium text-zinc-800"
              >
                Deck version
              </label>
              <select
                id="deck_version_id"
                name="deck_version_id"
                required
                defaultValue={currentMatch.deck_version_id}
                className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
              >
                {deckOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                    {option.isActive ? " (active)" : ""} - {option.detail}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="opponent_archetype"
                  className="text-sm font-medium text-zinc-800"
                >
                  Opponent archetype
                </label>
                <input
                  id="opponent_archetype"
                  name="opponent_archetype"
                  list="edit-opponent-archetypes"
                  required
                  defaultValue={currentMatch.opponent_archetype}
                  className="h-11 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
                />
                <datalist id="edit-opponent-archetypes">
                  {opponentArchetypeOptions.map((archetype) => (
                    <option key={archetype} value={archetype} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="opponent_variant"
                  className="text-sm font-medium text-zinc-800"
                >
                  Opponent variant
                </label>
                <input
                  id="opponent_variant"
                  name="opponent_variant"
                  defaultValue={currentMatch.opponent_variant ?? ""}
                  className="h-11 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
                />
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-zinc-800">
                Result
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(["win", "loss"] as const).map((result) => (
                  <label
                    key={result}
                    className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium capitalize text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
                  >
                    <input
                      type="radio"
                      name="result"
                      value={result}
                      defaultChecked={currentMatch.result === result}
                      className="sr-only"
                    />
                    {result}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium text-zinc-800">
                  Went first
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white">
                    <input
                      type="radio"
                      name="went_first"
                      value="true"
                      defaultChecked={currentMatch.went_first !== false}
                      className="sr-only"
                    />
                    Yes
                  </label>
                  <label className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white">
                    <input
                      type="radio"
                      name="went_first"
                      value="false"
                      defaultChecked={currentMatch.went_first === false}
                      className="sr-only"
                    />
                    No
                  </label>
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium text-zinc-800">
                  Event type
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {(["casual", "testing", "tournament"] as const).map(
                    (eventType) => (
                      <label
                        key={eventType}
                        className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-2 text-sm font-medium capitalize text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
                      >
                        <input
                          type="radio"
                          name="event_type"
                          value={eventType}
                          defaultChecked={currentMatch.event_type === eventType}
                          className="sr-only"
                        />
                        {eventType}
                      </label>
                    )
                  )}
                </div>
              </fieldset>
            </div>

            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="format"
                  className="text-sm font-medium text-zinc-800"
                >
                  Format
                </label>
                <select
                  id="format"
                  name="format"
                  defaultValue={selectedFormat ?? LATEST_FORMAT}
                  className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
                >
                  {MATCH_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="format_custom"
                  className="text-sm font-medium text-zinc-800"
                >
                  Custom format
                </label>
                <input
                  id="format_custom"
                  name="format_custom"
                  defaultValue={customFormat}
                  placeholder="Optional"
                  className="h-11 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
                />
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium text-zinc-800">
                Tags
              </legend>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <label
                    key={tag}
                    className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      defaultChecked={currentTags.includes(tag)}
                      className="sr-only"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor="notes" className="text-sm font-medium text-zinc-800">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                defaultValue={currentMatch.notes ?? ""}
                className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </div>

            <button
              type="submit"
              className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Save match
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
