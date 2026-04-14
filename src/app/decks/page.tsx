import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getArchetypeOptions } from "@/lib/archetypes";
import { LATEST_FORMAT, MATCH_FORMATS } from "@/lib/formats";
import { createDeck, deleteDeck } from "./actions";

type Deck = {
  id: string;
  name: string;
  archetype: string;
  format: string | null;
  notes: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DecksPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: decks, error } = await supabase
    .from("decks")
    .select("id, name, archetype, format, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const userDecks = (decks ?? []) as Deck[];
  const archetypeOptions = getArchetypeOptions(
    LATEST_FORMAT,
    userDecks.map((deck) => deck.archetype)
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">TCG Tracker</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Decks
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Create decks, manage lists, and keep version history organized.
            </p>
          </div>
          <AppNav current="decks" />
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                Your Decks
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Select a deck to manage its versions.
              </p>
            </div>

            {userDecks.length ? (
              <div className="flex flex-col gap-4">
                {userDecks.map((deck) => {
                  const removeDeck = deleteDeck.bind(null, deck.id);

                  return (
                    <article
                      key={deck.id}
                      className="rounded-md border border-zinc-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase text-zinc-500">
                            {deck.archetype}
                            {deck.format ? ` · ${deck.format}` : ""}
                          </p>
                          <h3 className="mt-2 text-lg font-semibold text-zinc-950">
                            {deck.name}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-500">
                            Created {formatDate(deck.created_at)}
                          </p>
                          {deck.notes ? (
                            <p className="mt-3 text-sm leading-6 text-zinc-600">
                              {deck.notes}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-2 sm:min-w-32">
                          <Link
                            href={`/decks/${deck.id}`}
                            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                          >
                            Manage
                          </Link>
                          <form action={removeDeck}>
                            <button
                              type="submit"
                              className="h-10 w-full rounded-md border border-rose-200 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 bg-white p-6">
                <h3 className="text-lg font-semibold text-zinc-950">
                  No decks yet.
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Create your first deck, then add versions for match logging.
                </p>
              </div>
            )}
          </section>

          <aside>
            <form
              action={createDeck}
              className="rounded-md border border-zinc-200 bg-white p-5"
            >
              <h2 className="text-lg font-semibold text-zinc-950">
                New Deck
              </h2>
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="archetype"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Archetype
                  </label>
                  <input
                    id="archetype"
                    name="archetype"
                    list="deck-archetypes"
                    required
                    placeholder="Choose or type an archetype"
                    className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
                  />
                  <datalist id="deck-archetypes">
                    {archetypeOptions.map((archetype) => (
                      <option key={archetype} value={archetype} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="format"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Format
                  </label>
                  <input
                    id="format"
                    name="format"
                    list="deck-formats"
                    defaultValue={LATEST_FORMAT}
                    className="h-10 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
                  />
                  <datalist id="deck-formats">
                    {MATCH_FORMATS.map((format) => (
                      <option key={format} value={format} />
                    ))}
                  </datalist>
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="notes"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Create deck
                </button>
              </div>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
