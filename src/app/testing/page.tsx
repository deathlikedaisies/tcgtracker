import Link from "next/link";
import { redirect } from "next/navigation";
import { Beaker, CheckCircle2, FlaskConical, Target } from "lucide-react";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  glassPanel,
  glassPanelStrong,
  inputH10,
  label,
  premiumInset,
  premiumInsetStrong,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  subtlePill,
  textarea,
} from "@/components/brand-styles";
import { getArchetypeOptions } from "@/lib/archetypes";
import { LATEST_FORMAT } from "@/lib/formats";
import { MATCH_ISSUE_TAG_OPTIONS } from "@/lib/match-options";
import type { MatchMetadata, MatchResult } from "@/lib/match-types";
import { startDevTimer } from "@/lib/dev-timing";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  buildTestingBlockSummary,
  getTestingBlockNextStepCopy,
  isTestingBlocksMissingError,
  type TestingBlockListRow,
  type TestingBlockMatchRow,
} from "@/lib/testing-blocks";
import { createTestingBlock, updateTestingBlockStatus } from "./actions";

type TestingPageProps = {
  searchParams: Promise<{
    created?: string;
    deck_id?: string;
    deck_version_id?: string;
    matchup?: string;
    focus_tags?: string | string[];
    notes?: string;
    target_games?: string;
  }>;
};

type DeckRow = {
  id: string;
  name: string;
  archetype: string | null;
  deck_versions: {
    id: string;
    name: string;
    is_active: boolean;
  }[];
};

type RawTestingBlockRow = Omit<TestingBlockListRow, "deck" | "deck_version">;

function getParamList(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getBlockMatches(
  matches: TestingBlockMatchRow[],
  blockId: string
) {
  return matches.filter((match) => match.testing_block_id === blockId);
}

function buildLogHref(summary: ReturnType<typeof buildTestingBlockSummary>) {
  const query = new URLSearchParams({
    testing_block_id: summary.block.id,
  });

  if (summary.block.deck_version_id) {
    query.set("deck_version_id", summary.block.deck_version_id);
  }

  if (summary.block.target_matchup) {
    query.set("opponent", summary.block.target_matchup);
  }

  return `/matches/new?${query.toString()}`;
}

function TestingBlockCard({
  summary,
  showStatusActions,
}: {
  summary: ReturnType<typeof buildTestingBlockSummary>;
  showStatusActions: boolean;
}) {
  const target = summary.block.target_matchup ?? "Focused issue";
  const commonIssue = summary.commonIssueTags[0];

  return (
    <article className={`${glassPanelStrong} p-4 sm:p-5`}>
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={subtlePill}>
              {summary.block.status === "active" ? "Active block" : summary.block.status}
            </span>
            <span className={subtlePill}>{summary.deckLabel}</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#F8FAFC]">
            {target}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#A8B3CF]">
            {getTestingBlockNextStepCopy(summary)}
          </p>
          {summary.block.notes ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#D6E0F0]/82">
              {summary.block.notes}
            </p>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-3 lg:w-[420px]">
          <div className={`${premiumInsetStrong} p-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Progress
            </p>
            <p className="mt-1 text-xl font-bold text-[#F8FAFC]">
              {summary.progressLabel}
            </p>
          </div>
          <div className={`${premiumInset} p-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Record
            </p>
            <p className="mt-1 text-xl font-bold text-[#F8FAFC]">
              {summary.record}
            </p>
          </div>
          <div className={`${premiumInset} p-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Top issue
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[#FFE28A]">
              {commonIssue ? `${commonIssue.tag} (${commonIssue.count})` : "No tags yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {summary.block.status === "active" ? (
          <Link href={buildLogHref(summary)} className={primaryButton}>
            Log next game
          </Link>
        ) : null}
        <Link href="/matches" className={secondaryButton}>
          Match history
        </Link>
        {showStatusActions ? (
          <>
            <form action={updateTestingBlockStatus}>
              <input type="hidden" name="testing_block_id" value={summary.block.id} />
              <input type="hidden" name="status" value="completed" />
              <button type="submit" className={secondaryButton}>
                Mark complete
              </button>
            </form>
            <form action={updateTestingBlockStatus}>
              <input type="hidden" name="testing_block_id" value={summary.block.id} />
              <input type="hidden" name="status" value="archived" />
              <button type="submit" className={secondaryButton}>
                Archive
              </button>
            </form>
          </>
        ) : null}
      </div>
    </article>
  );
}

export default async function TestingPage({ searchParams }: TestingPageProps) {
  const endTiming = startDevTimer("route:/testing");
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: decks, error: decksError },
    { data: blocks, error: blocksError },
    { data: blockMatches, error: matchesError },
  ] = await Promise.all([
    supabase
      .from("decks")
      .select("id, name, archetype, deck_versions(id, name, is_active)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("is_active", {
        referencedTable: "deck_versions",
        ascending: false,
      }),
    supabase
      .from("testing_blocks")
      .select(
        "id, user_id, deck_id, deck_version_id, target_matchup, focus_tags, target_games, notes, status, source_review_reason, created_at, completed_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("matches")
      .select(
        "id, testing_block_id, opponent_archetype, result, metadata, played_at, match_tags(tag)"
      )
      .eq("user_id", user.id)
      .not("testing_block_id", "is", null)
      .order("played_at", { ascending: false }),
  ]);

  if (decksError) throw new Error(decksError.message);
  if (blocksError && !isTestingBlocksMissingError(blocksError)) {
    throw new Error(blocksError.message);
  }
  if (matchesError && !isTestingBlocksMissingError(matchesError)) {
    throw new Error(matchesError.message);
  }

  const userDecks = (decks ?? []) as DeckRow[];
  const rawBlocks = blocksError ? [] : ((blocks ?? []) as RawTestingBlockRow[]);
  const matches = matchesError
    ? []
    : ((blockMatches ?? []) as {
        id: string;
        testing_block_id: string | null;
        opponent_archetype: string;
        result: MatchResult;
        metadata: MatchMetadata | Record<string, unknown> | null;
        played_at: string;
        match_tags: { tag: string }[] | null;
      }[]);
  const deckById = new Map(userDecks.map((deck) => [deck.id, deck]));
  const versionById = new Map(
    userDecks.flatMap((deck) =>
      deck.deck_versions.map((version) => [
        version.id,
        { ...version, deckId: deck.id, deckName: deck.name },
      ] as const)
    )
  );
  const summaries = rawBlocks.map((block) =>
    buildTestingBlockSummary(
      {
        ...block,
        deck: block.deck_id ? deckById.get(block.deck_id) ?? null : null,
        deck_version: block.deck_version_id
          ? versionById.get(block.deck_version_id) ?? null
          : null,
      },
      getBlockMatches(matches, block.id)
    )
  );
  const activeSummaries = summaries.filter(
    (summary) => summary.block.status === "active"
  );
  const inactiveSummaries = summaries.filter(
    (summary) => summary.block.status !== "active"
  );
  const defaultFocusTags = getParamList(params.focus_tags);
  const defaultTargetGames = params.target_games ?? "5";
  const deckOptions = userDecks.flatMap((deck) =>
    deck.deck_versions.map((version) => ({
      id: version.id,
      label: `${deck.name} · ${version.name}`,
      deckId: deck.id,
      isActive: version.is_active,
    }))
  );
  const archetypeOptions = getArchetypeOptions(LATEST_FORMAT, [
    ...(params.matchup ? [params.matchup] : []),
    ...rawBlocks.map((block) => block.target_matchup ?? ""),
  ]);

  endTiming();

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="testing"
          insight={{
            label: "Testing blocks",
            value: activeSummaries[0]?.block.target_matchup ?? "Focused reps",
            helper: activeSummaries[0]?.progressLabel ?? "Turn reads into plans",
          }}
        />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="testing"
            eyebrow="Coach plan"
            title="Focused Testing"
            subtitle="Turn Review reads into a small test plan, then finish the block before judging the change."
            userEmail={user.email ?? "Unknown email"}
          />

          {params.created === "1" ? (
            <section className="rounded-[18px] bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
              Testing block created. Log the next game from this page to attach it automatically.
            </section>
          ) : null}

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
            <div className="grid gap-4">
              {activeSummaries.length ? (
                activeSummaries.map((summary) => (
                  <TestingBlockCard
                    key={summary.block.id}
                    summary={summary}
                    showStatusActions
                  />
                ))
              ) : (
                <section className={emptyCard}>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]">
                    No active block
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#F8FAFC]">
                    Pick one thing to test next.
                  </h2>
                  <p className={`mt-2 max-w-2xl ${sectionCopy}`}>
                    A focused block keeps you from changing too many cards at once.
                    Choose a matchup or recurring issue, play the target games, then
                    review whether the pattern improved.
                  </p>
                </section>
              )}

              <section className={`${glassPanel} p-4 sm:p-5`}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[#4F8CFF]/12 text-[#B8D1FF]">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className={sectionTitle}>Completed and archived</h2>
                    <p className={sectionCopy}>
                      Past blocks stay here so you can compare future decisions.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3">
                  {inactiveSummaries.length ? (
                    inactiveSummaries.slice(0, 6).map((summary) => (
                      <TestingBlockCard
                        key={summary.block.id}
                        summary={summary}
                        showStatusActions={false}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-[#94A3B8]">
                      No completed testing blocks yet.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className={`${glassPanelStrong} p-4 sm:p-5`}>
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C]">
                    <FlaskConical className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F5C84C]">
                      New block
                    </p>
                    <h2 className={sectionTitle}>Start focused testing</h2>
                  </div>
                </div>
                <p className={`mt-3 ${sectionCopy}`}>
                  This block is designed to test whether the issue is real. Do
                  not change too many cards mid-block unless you start a new version.
                </p>

                <form action={createTestingBlock} className="mt-4 grid gap-3">
                  <input
                    type="hidden"
                    name="source_review_reason"
                    value={params.notes ?? ""}
                  />
                  <div className="grid gap-2">
                    <label htmlFor="deck_version_id" className={label}>
                      Deck version
                    </label>
                    <select
                      id="deck_version_id"
                      name="deck_version_id"
                      defaultValue={params.deck_version_id ?? ""}
                      className={inputH10}
                    >
                      <option value="">Any current deck</option>
                      {deckOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                          {option.isActive ? " (active)" : ""}
                        </option>
                      ))}
                    </select>
                    {params.deck_id ? (
                      <input type="hidden" name="deck_id" value={params.deck_id} />
                    ) : null}
                  </div>

                  <ArchetypePicker
                    id="target_matchup"
                    name="target_matchup"
                    label="Target matchup"
                    options={archetypeOptions}
                    value={params.matchup ?? ""}
                    placeholder="Mega Greninja, Raging Bolt..."
                    maxOptions={8}
                    suggestionsMode="popover"
                  />

                  <div className="grid gap-2">
                    <label htmlFor="target_games" className={label}>
                      Target games
                    </label>
                    <input
                      id="target_games"
                      name="target_games"
                      type="number"
                      min={1}
                      max={50}
                      defaultValue={defaultTargetGames}
                      className={inputH10}
                    />
                  </div>

                  <div className="grid gap-2">
                    <p className={label}>Focus tags</p>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                      {MATCH_ISSUE_TAG_OPTIONS.slice(0, 10).map((tag) => (
                        <label
                          key={tag}
                          className={`${premiumInset} flex items-center gap-2 px-3 py-2 text-sm text-[#DCE8FF]`}
                        >
                          <input
                            type="checkbox"
                            name="focus_tags"
                            value={tag}
                            defaultChecked={defaultFocusTags.includes(tag)}
                            className="size-4 accent-[#F5C84C]"
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="notes" className={label}>
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={4}
                      defaultValue={params.notes ?? ""}
                      className={textarea}
                      placeholder="What are you testing, and what should you track?"
                    />
                  </div>

                  <button type="submit" className={`${primaryButton} h-11`}>
                    Start testing block
                  </button>
                </form>
              </div>
            </aside>
          </section>

          <section className={`${glassPanel} p-4 sm:p-5`}>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: "Define the question",
                  copy: "Pick one matchup or issue before changing the list.",
                },
                {
                  icon: Beaker,
                  title: "Finish the sample",
                  copy: "Low sample: finish the block before drawing conclusions.",
                },
                {
                  icon: CheckCircle2,
                  title: "Review the signal",
                  copy: "Use record, tags, and notes to decide the next test.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={`${premiumInset} p-4`}>
                    <Icon className="size-5 text-[#F5C84C]" aria-hidden="true" />
                    <h3 className="mt-3 font-semibold text-[#F8FAFC]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#94A3B8]">
                      {item.copy}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
