import { notFound, redirect } from "next/navigation";
import { Beaker } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DeckVersionForm } from "@/components/decks/DeckVersionForm";
import {
  appFrame,
  appMain,
  appShell,
  card,
  emptyCard,
  glassPanel,
  glassPanelStrong,
  logoOnDark,
  pageCopy,
  pageTitle,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
} from "@/components/brand-styles";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { SessionCoachPanel } from "@/components/SessionCoachPanel";
import { analyzeDeckList } from "@/lib/decklist";
import { buildSessionCoachInsight } from "@/lib/session-coach";
import { enrichDeckAnalysis } from "@/lib/card-data/deck-enrichment";
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
  const versionInsights = await Promise.all(
    deckVersions.map(async (version) => {
      const analysis = analyzeDeckList(version.decklist);
      const enrichment = version.decklist
        ? await enrichDeckAnalysis(analysis)
        : null;

      return {
        analysis,
        enrichment,
        versionId: version.id,
      };
    })
  );
  const versionInsightById = new Map(
    versionInsights.map((insight) => [insight.versionId, insight])
  );

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="decks"
          deckLabel={deck.name}
          insight={{
            label: "Version test",
            value: sessionCoach?.missionSkill ?? "Build a sample",
            helper: `${deckVersions.length} version${deckVersions.length === 1 ? "" : "s"}`,
          }}
        />
        <div className={`${appMain} mx-auto w-full max-w-6xl gap-6`}>
        <div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <PrizeMapLogo {...logoOnDark} />
            <div className="lg:hidden">
              <AppNav current="decks" />
            </div>
          </div>
          <div className={`mt-5 p-4 sm:p-5 ${glassPanelStrong}`}>
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
            <div className={`p-4 ${glassPanel}`}>
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                  <Beaker className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className={sectionTitle}>
                    Test versions
                  </h2>
                  <p className={`mt-1 ${sectionCopy}`}>
                    Mark the build you want future games to test.
                  </p>
                </div>
              </div>
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
                  const insight = versionInsightById.get(version.id);
                  const analysis = insight?.analysis;
                  const enrichment = insight?.enrichment;

                  return (
                    <article
                      key={version.id}
                      className={`${card} transition hover:bg-[#11182C]/84 hover:shadow-[0_20px_54px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(79,140,255,0.10)]`}
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
                        <div className="mt-4 rounded-md bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.035)]">
                          <div className="flex flex-wrap gap-2 text-xs font-medium text-[#94A3B8]">
                            <span>{analysis?.totalCards ?? 0} cards</span>
                            <span>{analysis?.pokemonCount ?? 0} Pokémon</span>
                            <span>{analysis?.trainerCount ?? 0} Trainer</span>
                            <span>{analysis?.energyCount ?? 0} Energy</span>
                            {enrichment ? (
                              <span
                                className={
                                  enrichment.available
                                    ? "text-emerald-200"
                                    : "text-[#F5C84C]"
                                }
                              >
                                {enrichment.available
                                  ? `${enrichment.resolvedCount} resolved · ${enrichment.unresolvedCount} unresolved`
                                  : "Card lookup unavailable"}
                              </span>
                            ) : null}
                          </div>

                          {analysis?.suggestion.confidence !== "unknown" ? (
                            <div className="mt-3 flex items-center gap-2 rounded-md bg-[#11182C]/70 p-3">
                              <ArchetypeSprites
                                archetype={analysis?.suggestion.archetype}
                                className="shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase text-[#94A3B8]/70">
                                  Suggested archetype
                                </p>
                                <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                                  {analysis?.suggestion.archetype}
                                </p>
                              </div>
                            </div>
                          ) : null}

                          {analysis?.keyPokemon.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {analysis.keyPokemon.map((pokemon) => (
                                <span
                                  key={pokemon}
                                  className="rounded-md bg-[#4F8CFF]/10 px-2 py-1 text-xs font-medium text-[#B8D1FF]"
                                >
                                  {pokemon}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {enrichment?.legalityWarnings.length ? (
                            <div className="mt-3 rounded-md bg-[#F5C84C]/10 p-3 text-xs leading-5 text-[#F5C84C]">
                              {enrichment.legalityWarnings[0]}
                            </div>
                          ) : null}

                          {enrichment?.error ? (
                            <p className="mt-3 text-xs font-medium text-[#94A3B8]">
                              {enrichment.error}
                            </p>
                          ) : null}

                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-[#94A3B8]">
                              Deck list
                            </summary>
                            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-[#0B1020]/58 p-4 text-sm leading-6 text-[#F8FAFC]">
                              {version.decklist}
                            </pre>
                          </details>
                        </div>
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
                <h3 className="text-lg font-semibold text-[#F8FAFC]">
                  Add the first test version.
                </h3>
                <p className={sectionCopy}>
                  Add a version before logging matches with this deck. Versions
                  are what PrizeMap uses to compare builds over time.
                </p>
                <a href="#add-version" className={`mt-5 ${primaryButton}`}>
                  Add first version
                </a>
              </div>
            )}
          </section>

          <aside id="add-version" className="scroll-mt-6 lg:sticky lg:top-6">
            <DeckVersionForm action={createVersion} />
          </aside>
        </div>
        </div>
      </section>
    </main>
  );
}
