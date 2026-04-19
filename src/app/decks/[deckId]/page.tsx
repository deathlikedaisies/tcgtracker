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
import { SessionCoachPanel } from "@/components/SessionCoachPanel";
import { buildSessionCoachInsight } from "@/lib/session-coach";
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

function getVersionTestStatus(matches: { result: "win" | "loss" }[]) {
  const wins = matches.filter((match) => match.result === "win").length;
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;

  if (matches.length < 3) {
    return {
      label: "Unproven",
      detail: `${matches.length} game${matches.length === 1 ? "" : "s"} logged`,
      className: "bg-[#4F8CFF]/14 text-[#B8D1FF]",
    };
  }

  if (matches.length < 5) {
    return {
      label: "Early signal",
      detail: `${winRate}% over ${matches.length} games`,
      className: "bg-[#F5C84C]/14 text-[#F5C84C]",
    };
  }

  return {
    label: winRate >= 55 ? "Improving test" : "No clear improvement",
    detail: `${winRate}% over ${matches.length} games`,
    className:
      winRate >= 55
        ? "bg-emerald-500/14 text-emerald-200"
        : "bg-[#F43F5E]/14 text-rose-200",
  };
}

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
    .select("id, name, archetype, notes")
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
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("deck_version_id, opponent_archetype, result, went_first, event_type, played_at, match_tags(tag)")
    .eq("user_id", user.id)
    .order("played_at", { ascending: false });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const sessionCoach = buildSessionCoachInsight(
    (matches ?? []) as {
      opponent_archetype: string;
      result: "win" | "loss";
      went_first: boolean | null;
      event_type: string | null;
      played_at: string;
      match_tags: { tag: string }[] | null;
    }[]
  );

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

        {sessionCoach ? (
          <SessionCoachPanel insight={sessionCoach} />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="flex flex-col gap-4">
            <div>
              <h2 className={sectionTitle}>
                Test versions
              </h2>
              <p className={`mt-1 ${sectionCopy}`}>
                Mark the build you want future games to test.
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
                  const versionMatches = ((matches ?? []) as {
                    deck_version_id: string;
                    result: "win" | "loss";
                  }[]).filter((match) => match.deck_version_id === version.id);
                  const testStatus = getVersionTestStatus(versionMatches);

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
                            <span
                              className={`rounded-md px-2 py-1 text-xs font-medium ${testStatus.className}`}
                            >
                              {testStatus.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#94A3B8]">
                            Created{" "}
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(new Date(version.created_at))}
                          </p>
                          <p className="mt-2 text-xs font-medium text-[#94A3B8]">
                            {testStatus.detail}
                          </p>
                        </div>
                        {!version.is_active ? (
                          <form action={markActive}>
                            <button
                              type="submit"
                              className={`${secondaryButton} h-9 px-3`}
                            >
                              Test version
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
                New test version
              </h2>
              <p className={`mt-1 ${sectionCopy}`}>
                Save the change you want to measure.
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
                  Create test version
                </button>
              </div>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
