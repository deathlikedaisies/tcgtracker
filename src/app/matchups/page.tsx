import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { getArchetypeOptions } from "@/lib/archetypes";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getFormatOptions } from "@/lib/formats";
import { saveMatchupNote } from "./actions";

type SortKey = "most_played" | "highest_win_rate" | "lowest_win_rate" | "az";

type MatchupsPageProps = {
  searchParams: Promise<{
    deck_id?: string;
    deck_version_id?: string;
    start_date?: string;
    end_date?: string;
    format?: string;
    opponent_archetype?: string;
    sort?: string;
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
  result: "win" | "loss";
  format: string | null;
  played_at: string;
  deck_versions:
    | {
        id: string;
        deck_id: string;
      }
    | {
        id: string;
        deck_id: string;
      }[]
    | null;
};

type MatchupNote = {
  id: string;
  your_archetype: string;
  opponent_archetype: string;
  notes: string | null;
  updated_at: string;
};

function formatWinRateValue(wins: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((wins / total) * 100);
}

function formatWinRate(wins: number, total: number) {
  return `${formatWinRateValue(wins, total)}%`;
}

function getDeckVersion(match: MatchRow) {
  return Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function parseDateStart(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export default async function MatchupsPage({
  searchParams,
}: MatchupsPageProps) {
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

  const userDecks = (decks ?? []) as DeckWithVersions[];
  const allVersions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => ({
      ...version,
      deckId: deck.id,
      deckName: deck.name,
    }))
  );
  const selectedDeck = userDecks.find((deck) => deck.id === params.deck_id);
  const selectedDeckId = selectedDeck?.id ?? "";
  const visibleVersions = selectedDeckId
    ? allVersions.filter((version) => version.deckId === selectedDeckId)
    : allVersions;
  const selectedVersion = visibleVersions.find(
    (version) => version.id === params.deck_version_id
  );
  const selectedVersionId = selectedVersion?.id ?? "";
  const sort = (
    ["most_played", "highest_win_rate", "lowest_win_rate", "az"].includes(
      params.sort ?? ""
    )
      ? params.sort
      : "most_played"
  ) as SortKey;
  const startDate = parseDateStart(params.start_date);
  const endDate = parseDateEnd(params.end_date);

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id, deck_version_id, opponent_archetype, result, format, played_at, deck_versions(id, deck_id)"
    )
    .eq("user_id", user.id);

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const { data: notes, error: notesError } = await supabase
    .from("matchup_notes")
    .select("id, your_archetype, opponent_archetype, notes, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (notesError) {
    throw new Error(notesError.message);
  }

  const matchRows = (matches ?? []) as unknown as MatchRow[];
  const matchupNotes = (notes ?? []) as MatchupNote[];
  const formatOptions = getFormatOptions(matchRows.map((match) => match.format));
  const selectedFormat =
    params.format && formatOptions.includes(params.format)
      ? params.format
      : "all";
  const archetypeOptions = getArchetypeOptions(
    selectedFormat === "all" ? null : selectedFormat,
    matchRows.map((match) => match.opponent_archetype)
  );
  const selectedOpponentArchetype = archetypeOptions.includes(
    params.opponent_archetype ?? ""
  )
    ? params.opponent_archetype ?? ""
    : "";
  const filteredMatches = matchRows.filter((match) => {
    const deckVersion = getDeckVersion(match);
    const playedAt = new Date(match.played_at);

    if (selectedFormat !== "all" && match.format !== selectedFormat) {
      return false;
    }

    if (
      selectedOpponentArchetype &&
      match.opponent_archetype !== selectedOpponentArchetype
    ) {
      return false;
    }

    if (selectedVersionId && match.deck_version_id !== selectedVersionId) {
      return false;
    }

    if (
      !selectedVersionId &&
      selectedDeckId &&
      deckVersion?.deck_id !== selectedDeckId
    ) {
      return false;
    }

    if (startDate && playedAt < startDate) {
      return false;
    }

    if (endDate && playedAt >= endDate) {
      return false;
    }

    return true;
  });
  const deckById = new Map(userDecks.map((deck) => [deck.id, deck]));
  const yourArchetypesForView = Array.from(
    new Set([
      ...filteredMatches
        .map((match) => {
          const deckId = getDeckVersion(match)?.deck_id;
          return deckId ? deckById.get(deckId)?.archetype : null;
        })
        .filter((archetype): archetype is string => Boolean(archetype)),
      ...matchupNotes
        .map((note) => note.your_archetype)
        .filter((archetype): archetype is string => Boolean(archetype)),
      ...userDecks.map((deck) => deck.archetype),
    ])
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
  ).map(([opponentArchetype, groupedMatches]) => {
    const wins = groupedMatches.filter((match) => match.result === "win").length;
    const losses = groupedMatches.filter(
      (match) => match.result === "loss"
    ).length;

    return {
      opponentArchetype,
      matches: groupedMatches.length,
      wins,
      losses,
      winRate: formatWinRate(wins, groupedMatches.length),
      winRateValue: formatWinRateValue(wins, groupedMatches.length),
    };
  });

  matchupSummary.sort((first, second) => {
    if (sort === "highest_win_rate") {
      return (
        second.winRateValue - first.winRateValue ||
        second.matches - first.matches ||
        first.opponentArchetype.localeCompare(second.opponentArchetype)
      );
    }

    if (sort === "lowest_win_rate") {
      return (
        first.winRateValue - second.winRateValue ||
        second.matches - first.matches ||
        first.opponentArchetype.localeCompare(second.opponentArchetype)
      );
    }

    if (sort === "az") {
      return first.opponentArchetype.localeCompare(second.opponentArchetype);
    }

    return (
      second.matches - first.matches ||
      first.opponentArchetype.localeCompare(second.opponentArchetype)
    );
  });

  const hasMatches = matchRows.length > 0;
  const hasFilteredMatches = matchupSummary.length > 0;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">TCG Tracker</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Matchups
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Compare your records against each opponent archetype.
            </p>
          </div>
          <AppNav current="matchups" />
        </header>

        <form
          action="/matchups"
          className="rounded-md border border-zinc-200 bg-white p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label
                htmlFor="deck_id"
                className="text-sm font-medium text-zinc-800"
              >
                Deck
              </label>
              <select
                id="deck_id"
                name="deck_id"
                defaultValue={selectedDeckId}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
              >
                <option value="">All decks</option>
                {userDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label
                htmlFor="deck_version_id"
                className="text-sm font-medium text-zinc-800"
              >
                Deck version
              </label>
              <select
                id="deck_version_id"
                name="deck_version_id"
                defaultValue={selectedVersionId}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
              >
                <option value="">All versions</option>
                {visibleVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.deckName} - {version.name}
                    {version.is_active ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="start_date"
                className="text-sm font-medium text-zinc-800"
              >
                From
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={params.start_date ?? ""}
                className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="end_date"
                className="text-sm font-medium text-zinc-800"
              >
                To
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={params.end_date ?? ""}
                className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
              />
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label
                htmlFor="sort"
                className="text-sm font-medium text-zinc-800"
              >
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
              >
                <option value="most_played">Most played</option>
                <option value="highest_win_rate">Highest win rate</option>
                <option value="lowest_win_rate">Lowest win rate</option>
                <option value="az">Opponent A-Z</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label
                htmlFor="format"
                className="text-sm font-medium text-zinc-800"
              >
                Format
              </label>
              <select
                id="format"
                name="format"
                defaultValue={selectedFormat}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
              >
                <option value="all">All formats</option>
                {formatOptions.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label
                htmlFor="opponent_archetype"
                className="text-sm font-medium text-zinc-800"
              >
                Opponent archetype
              </label>
              <select
                id="opponent_archetype"
                name="opponent_archetype"
                defaultValue={selectedOpponentArchetype}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
              >
                <option value="">All archetypes</option>
                {archetypeOptions.map((archetype) => (
                  <option key={archetype} value={archetype}>
                    {archetype}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 lg:col-span-4 lg:items-end lg:justify-end">
              <button
                type="submit"
                className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Apply filters
              </button>
              <Link
                href="/matchups"
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
              >
                Clear
              </Link>
            </div>
          </div>
        </form>

        {!hasMatches ? (
          <section className="rounded-md border border-dashed border-zinc-300 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              No matches logged yet.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
              Log matches to build matchup records for each opponent archetype.
            </p>
            <Link
              href="/matches/new"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Log your first match
            </Link>
          </section>
        ) : hasFilteredMatches ? (
          <section className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold text-zinc-950">
                Matchup Summary
              </h2>
              <p className="text-sm text-zinc-600">
                {filteredMatches.length} match
                {filteredMatches.length === 1 ? "" : "es"} in this view.
              </p>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="py-3 pr-4 font-medium">
                      Opponent archetype
                    </th>
                    <th className="px-4 py-3 font-medium">Played</th>
                    <th className="px-4 py-3 font-medium">Wins</th>
                    <th className="px-4 py-3 font-medium">Losses</th>
                    <th className="py-3 pl-4 font-medium">Win rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {matchupSummary.map((matchup) => (
                    <tr key={matchup.opponentArchetype}>
                      <td
                        colSpan={5}
                        className="py-5 align-top"
                      >
                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
                          <div>
                            <p className="font-medium text-zinc-950">
                              {matchup.opponentArchetype}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-zinc-700 sm:grid-cols-4">
                              <p>{matchup.matches} played</p>
                              <p>{matchup.wins} wins</p>
                              <p>{matchup.losses} losses</p>
                              <div>
                                <p className="font-medium text-zinc-950">
                                  {matchup.winRate}
                                </p>
                                <div className="mt-2 h-2 rounded-full bg-zinc-100">
                                  <div
                                    className="h-2 rounded-full bg-zinc-950"
                                    style={{
                                      width: `${matchup.winRateValue}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
                            <h3 className="text-sm font-semibold text-zinc-950">
                              Preparation Notes
                            </h3>
                            <div className="mt-4 flex flex-col gap-4">
                              {yourArchetypesForView.length ? (
                                yourArchetypesForView.map((yourArchetype) => {
                                  const note = matchupNotes.find(
                                    (candidate) =>
                                      candidate.your_archetype ===
                                        yourArchetype &&
                                      candidate.opponent_archetype ===
                                        matchup.opponentArchetype
                                  );

                                  return (
                                    <form
                                      key={`${yourArchetype}-${matchup.opponentArchetype}`}
                                      action={saveMatchupNote}
                                      className="rounded-md border border-zinc-200 bg-white p-3"
                                    >
                                      <input
                                        type="hidden"
                                        name="your_archetype"
                                        value={yourArchetype}
                                      />
                                      <input
                                        type="hidden"
                                        name="opponent_archetype"
                                        value={matchup.opponentArchetype}
                                      />
                                      <div className="flex flex-col gap-1">
                                        <p className="text-xs font-medium uppercase text-zinc-500">
                                          {yourArchetype} vs{" "}
                                          {matchup.opponentArchetype}
                                        </p>
                                        {note ? (
                                          <p className="text-xs text-zinc-500">
                                            Updated{" "}
                                            {formatUpdatedAt(note.updated_at)}
                                          </p>
                                        ) : null}
                                      </div>
                                      <textarea
                                        name="notes"
                                        rows={4}
                                        defaultValue={note?.notes ?? ""}
                                        placeholder="Plan, tech cards, sequencing, side notes..."
                                        className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-950 outline-none focus:border-zinc-950"
                                      />
                                      <button
                                        type="submit"
                                        className="mt-3 h-9 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                                      >
                                        {note ? "Update note" : "Save note"}
                                      </button>
                                    </form>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-zinc-600">
                                  Create a deck before saving prep notes.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="rounded-md border border-dashed border-zinc-300 bg-white p-6">
            <h2 className="text-xl font-semibold text-zinc-950">
              No matchups match these filters.
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Try a different deck, deck version, archetype, format, date
              range, or clear the filters.
            </p>
            <Link
              href="/matchups"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
            >
              Clear filters
            </Link>
          </section>
        )}
      </section>
    </main>
  );
}
