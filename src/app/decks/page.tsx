import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  appContainer,
  appShell,
  card,
  dangerButton,
  emptyCard,
  inputH10,
  label,
  logoOnDark,
  pageCopy,
  pageHeader,
  pageTitle,
  primaryButton,
  sectionCopy,
  sectionTitle,
  textarea,
} from "@/components/brand-styles";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
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
    <main className={appShell}>
      <section className={`${appContainer} max-w-5xl gap-8`}>
        <header className={pageHeader}>
          <div>
            <PrizeMapLogo {...logoOnDark} />
            <h1 className={pageTitle}>
              Decks
            </h1>
            <p className={pageCopy}>
              Create decks, manage lists, and keep version history organized.
            </p>
          </div>
          <AppNav current="decks" />
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className={sectionTitle}>
                Your Decks
              </h2>
              <p className={`mt-1 ${sectionCopy}`}>Manage decks and versions.</p>
            </div>

            {userDecks.length ? (
              <div className="flex flex-col gap-4">
                {userDecks.map((deck) => {
                  const removeDeck = deleteDeck.bind(null, deck.id);

                  return (
                    <article key={deck.id} className={card}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <ArchetypeSprites
                            archetype={deck.archetype}
                            size="md"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase text-[#94A3B8]">
                              {deck.archetype}
                              {deck.format ? ` · ${deck.format}` : ""}
                            </p>
                            <h3 className="mt-2 truncate text-lg font-semibold text-[#F8FAFC]">
                              {deck.name}
                            </h3>
                            <p className="mt-1 text-xs text-[#94A3B8]">
                              Created {formatDate(deck.created_at)}
                            </p>
                            {deck.notes ? (
                              <p className={`mt-3 ${sectionCopy}`}>
                                {deck.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:min-w-32 sm:grid-cols-1">
                          <Link
                            href={`/decks/${deck.id}`}
                            className={primaryButton}
                          >
                            Manage
                          </Link>
                          <form action={removeDeck}>
                            <button
                              type="submit"
                              className={`w-full ${dangerButton}`}
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
              <div className={emptyCard}>
                <h3 className="text-lg font-semibold text-[#F8FAFC]">
                  No decks yet.
                </h3>
                <p className={`mt-2 ${sectionCopy}`}>
                  Create your first deck, then add versions for match logging.
                </p>
              </div>
            )}
          </section>

          <aside>
            <form
              action={createDeck}
              className={card}
            >
              <h2 className="text-lg font-semibold text-[#F8FAFC]">
                New Deck
              </h2>
              <p className={`mt-1 ${sectionCopy}`}>
                Add the list family first, then create versions.
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
                    htmlFor="archetype"
                    className={label}
                  >
                    Archetype
                  </label>
                  <input
                    id="archetype"
                    name="archetype"
                    list="deck-archetypes"
                    required
                    placeholder="Choose or type an archetype"
                    className={inputH10}
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
                    className={label}
                  >
                    Format
                  </label>
                  <input
                    id="format"
                    name="format"
                    list="deck-formats"
                    defaultValue={LATEST_FORMAT}
                    className={inputH10}
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
                <button
                  type="submit"
                  className={primaryButton}
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
