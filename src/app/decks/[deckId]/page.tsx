import { notFound, redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  appContainer,
  appShell,
  card,
  emptyCard,
  inputH10,
  label,
  logoOnDark,
  pageCopy,
  pageTitle,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  textarea,
} from "@/components/brand-styles";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
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
    <main className={appShell}>
      <section className={`${appContainer} max-w-4xl gap-8`}>
        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PrizeMapLogo {...logoOnDark} />
            <AppNav current="decks" />
          </div>
          <div className="mt-5 rounded-md bg-[#11182C]/64 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-5">
            <div className="flex gap-4">
              <ArchetypeSprites
                archetype={deck.archetype}
                size="md"
                className="mt-1 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-[#94A3B8]">
                  {deck.archetype}
                  {deck.format ? ` · ${deck.format}` : ""}
                </p>
                <h1 className={pageTitle}>
                  {deck.name}
                </h1>
                {deck.notes ? (
                  <p className={pageCopy}>
                    {deck.notes}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className={sectionTitle}>
                Versions
              </h2>
              <p className={`mt-1 ${sectionCopy}`}>Choose the current active build.</p>
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
                      className={card}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-medium text-[#F8FAFC]">
                              {version.name}
                            </h3>
                            {version.is_active ? (
                              <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-[#94A3B8]">
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
                              className={`${secondaryButton} h-9 px-3`}
                            >
                              Mark active
                            </button>
                          </form>
                        ) : null}
                      </div>

                      {version.decklist ? (
                        <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-[#0B1020]/58 p-4 text-sm leading-6 text-[#F8FAFC]">
                          {version.decklist}
                        </pre>
                      ) : null}
                      {version.notes ? (
                        <p className={`mt-4 ${sectionCopy}`}>
                          {version.notes}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={emptyCard}>
                <p className={sectionCopy}>
                  No versions yet. Create the first list for this deck.
                </p>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-6">
            <form
              action={createVersion}
              className={card}
            >
              <h2 className="text-lg font-semibold text-[#F8FAFC]">
                New Version
              </h2>
              <p className={`mt-1 ${sectionCopy}`}>
                Save a list snapshot for testing.
              </p>
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="name"
                    className={label}
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className={inputH10}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="decklist"
                    className={label}
                  >
                    Decklist
                  </label>
                  <textarea
                    id="decklist"
                    name="decklist"
                    rows={8}
                    className={textarea}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="notes"
                    className={label}
                  >
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className={textarea}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
                  <input
                    type="checkbox"
                    name="is_active"
                    className="h-4 w-4 rounded border-white/20 accent-[#F5C84C]"
                  />
                  Make this version active
                </label>
                <button
                  type="submit"
                  className={primaryButton}
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
