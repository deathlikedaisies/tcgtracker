import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createDeckVersion, markDeckVersionActive } from "./actions";

type DeckDetailPageProps = {
  params: Promise<{
    deckId: string;
  }>;
};

type DeckVersion = {
  id: string;
  name: string;
  decklist: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function DeckDetailPage({ params }: DeckDetailPageProps) {
  const { deckId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id, name, archetype, format, notes")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (deckError || !deck) {
    notFound();
  }

  const { data: versions, error: versionsError } = await supabase
    .from("deck_versions")
    .select("id, name, decklist, notes, is_active, created_at")
    .eq("deck_id", deck.id)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const deckVersions = (versions ?? []) as DeckVersion[];
  const createVersion = createDeckVersion.bind(null, deck.id);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div>
          <AppNav current="decks" />
          <div className="mt-5 border-b border-zinc-200 pb-6">
            <p className="text-sm font-medium text-zinc-500">
              {deck.archetype}
              {deck.format ? ` · ${deck.format}` : ""}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {deck.name}
            </h1>
            {deck.notes ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                {deck.notes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-950">
                Versions
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Keep history for each list and choose the current active build.
              </p>
            </div>

            {deckVersions.length ? (
              <div className="flex flex-col gap-4">
                {deckVersions.map((version) => {
                  const markActive = markDeckVersionActive.bind(
                    null,
                    deck.id,
                    version.id
                  );

                  return (
                    <article
                      key={version.id}
                      className="rounded-md border border-zinc-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-medium text-zinc-950">
                              {version.name}
                            </h3>
                            {version.is_active ? (
                              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            Created{" "}
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(new Date(version.created_at))}
                          </p>
                        </div>
                        {!version.is_active ? (
                          <form action={markActive}>
                            <button
                              type="submit"
                              className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
                            >
                              Mark active
                            </button>
                          </form>
                        ) : null}
                      </div>

                      {version.decklist ? (
                        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
                          {version.decklist}
                        </pre>
                      ) : null}
                      {version.notes ? (
                        <p className="mt-4 text-sm leading-6 text-zinc-600">
                          {version.notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 bg-white p-6">
                <p className="text-sm text-zinc-600">
                  No versions yet. Create the first list for this deck.
                </p>
              </div>
            )}
          </section>

          <aside>
            <form
              action={createVersion}
              className="rounded-md border border-zinc-200 bg-white p-5"
            >
              <h2 className="text-lg font-semibold text-zinc-950">
                New Version
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
                    htmlFor="decklist"
                    className="text-sm font-medium text-zinc-800"
                  >
                    Decklist
                  </label>
                  <textarea
                    id="decklist"
                    name="decklist"
                    rows={8}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950"
                  />
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
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  Make this version active
                </label>
                <button
                  type="submit"
                  className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  Create version
                </button>
              </div>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
