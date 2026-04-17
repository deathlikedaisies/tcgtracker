import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import {
  appContainer,
  appShell,
  cardLarge,
  inputH11,
  label,
  logoOnDark,
  pageCopy,
  pageTitle,
  primaryButton,
  textarea,
} from "@/components/brand-styles";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { getArchetypeOptions } from "@/lib/archetypes";
import { LATEST_FORMAT, MATCH_FORMATS } from "@/lib/formats";
import { MATCH_TAGS } from "@/lib/match-options";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { updateMatch } from "../../actions";

const editToggleClass =
  "flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#0B1020]/38 px-3 text-sm font-medium text-[#F8FAFC] transition hover:bg-[#4F8CFF]/10 has-[:checked]:bg-[#4F8CFF]/22 has-[:checked]:text-[#F8FAFC]";

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
    <main className={appShell}>
      <section className={`${appContainer} max-w-2xl`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <PrizeMapLogo {...logoOnDark} />
            <p className="mt-5 text-sm font-medium text-[#94A3B8]">
              Match history
            </p>
            <h1 className={pageTitle}>
              Edit Match
            </h1>
            <p className={pageCopy}>
              Update match details and tags.
            </p>
          </div>
          <AppNav current="matches" />
        </div>

        <form
          action={saveMatch}
          className={cardLarge}
        >
          <div className="grid gap-5">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="deck_version_id"
                className={label}
              >
                Deck version
              </label>
              <select
                id="deck_version_id"
                name="deck_version_id"
                required
                defaultValue={currentMatch.deck_version_id}
                className={inputH11}
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
              <ArchetypePicker
                id="opponent_archetype"
                name="opponent_archetype"
                label="Opponent archetype"
                options={opponentArchetypeOptions}
                defaultValue={currentMatch.opponent_archetype}
                required
              />
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="opponent_variant"
                  className={label}
                >
                  Opponent variant
                </label>
                <input
                  id="opponent_variant"
                  name="opponent_variant"
                  defaultValue={currentMatch.opponent_variant ?? ""}
                  className={inputH11}
                />
              </div>
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className={label}>
                Result
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {(["win", "loss"] as const).map((result) => (
                  <label
                    key={result}
                    className={`${editToggleClass} capitalize`}
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
                <legend className={label}>
                  Went first
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className={editToggleClass}>
                    <input
                      type="radio"
                      name="went_first"
                      value="true"
                      defaultChecked={currentMatch.went_first !== false}
                      className="sr-only"
                    />
                    Yes
                  </label>
                  <label className={editToggleClass}>
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
                <legend className={label}>
                  Event type
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {(["casual", "testing", "tournament"] as const).map(
                    (eventType) => (
                      <label
                        key={eventType}
                        className={`${editToggleClass} px-2 capitalize`}
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

            <details className="rounded-md bg-[#0B1020]/30 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]">
              <summary className="cursor-pointer text-sm font-semibold text-[#F8FAFC]">
                Advanced history details
              </summary>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                PrizeMap defaults to current Standard. Use this only for older
                or imported records.
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="format"
                    className={label}
                  >
                    Saved format
                  </label>
                  <select
                    id="format"
                    name="format"
                    defaultValue={selectedFormat ?? LATEST_FORMAT}
                    className={inputH11}
                  >
                    {MATCH_FORMATS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                    <option value="custom">Custom saved format</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="format_custom"
                    className={label}
                  >
                    Custom saved format
                  </label>
                  <input
                    id="format_custom"
                    name="format_custom"
                    defaultValue={customFormat}
                    placeholder="Optional"
                    className={inputH11}
                  />
                </div>
              </div>
            </details>

            <fieldset className="flex flex-col gap-2">
              <legend className={label}>
                Tags
              </legend>
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => (
                  <label
                    key={tag}
                    className="cursor-pointer rounded-md bg-[#0B1020]/38 px-3 py-2 text-sm font-medium text-[#F8FAFC] transition hover:bg-[#4F8CFF]/10 has-[:checked]:bg-[#4F8CFF]/22"
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
              <label htmlFor="notes" className={label}>
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                defaultValue={currentMatch.notes ?? ""}
                className={textarea}
              />
            </div>

            <button
              type="submit"
              className={`${primaryButton} h-11`}
            >
              Save match
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
