import Link from "next/link";
import { Beaker, CheckCircle2, Target } from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoConversionCta } from "@/components/demo/DemoConversionCta";
import { DemoShell } from "@/components/demo/DemoShell";
import { BetaFeedbackPrompt } from "@/components/feedback/BetaFeedbackPrompt";
import {
  cardLarge,
  pageCopy,
  pageHeaderCard,
  pageTitle,
  premiumInset,
  premiumInsetStrong,
  primaryButton,
  sectionCopy,
  sectionTitle,
  secondaryButton,
} from "@/components/brand-styles";
import {
  formatDemoDate,
  getDemoActiveVersion,
  getDemoDeck,
  getDemoTestingBlock,
  getDemoTestingBlockMatches,
} from "@/lib/demo-data";
import { countMatchResults, getMatchResultLabel } from "@/lib/match-types";

function getIssueTags(matches: ReturnType<typeof getDemoTestingBlockMatches>) {
  const counts = new Map<string, number>();

  matches
    .flatMap((match) => match.metadata.issue_tags ?? [])
    .forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([tag, count]) => ({ tag, count }));
}

export default function DemoTestingPage() {
  const block = getDemoTestingBlock();
  const matches = block ? getDemoTestingBlockMatches(block) : [];
  const deck = block ? getDemoDeck(block.deckId) : null;
  const activeVersion = getDemoActiveVersion(deck);
  const resultCounts = countMatchResults(matches);
  const issueTags = getIssueTags(matches);
  const progress = block ? `${matches.length} / ${block.targetGames} games` : "0 / 5 games";
  const blockRecord =
    resultCounts.ties > 0
      ? `${resultCounts.wins}W / ${resultCounts.losses}L / ${resultCounts.ties}T`
      : `${resultCounts.wins}W / ${resultCounts.losses}L`;
  const topIssue = issueTags[0]
    ? `${issueTags[0].tag} (${issueTags[0].count})`
    : "No tags yet";

  return (
    <DemoShell current="testing">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Focused testing block</p>
          <h1 className={pageTitle}>Focused testing demo</h1>
          <p className={pageCopy}>
            This sample block shows how a review insight becomes a concrete 5-game
            plan with progress, record, tags, and next-step coaching.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log next demo game
        </Link>
      </section>

      {block && deck ? (
        <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <article className={cardLarge}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F5C84C]/12 px-2.5 py-1 text-xs font-semibold text-[#F5C84C]">
                  Active demo block
                </span>
                <span className="rounded-full bg-[#4F8CFF]/12 px-2.5 py-1 text-xs font-semibold text-[#B8D1FF]">
                  Review-generated plan
                </span>
              </div>
              <div className="mt-4 flex min-w-0 items-center gap-3">
                <div className={`${premiumInsetStrong} shrink-0 p-2.5`}>
                  <ArchetypeSprites archetype={block.targetMatchup} size="md" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                    {block.targetMatchup}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-[#94A3B8]/78">
                    {block.notes}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className={`${premiumInsetStrong} min-w-0 p-4`}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Progress
                </p>
                <p className="mt-2 text-2xl font-bold text-[#F8FAFC]">
                  {progress}
                </p>
              </div>
              <div className={`${premiumInset} min-w-0 p-4`}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Block record
                </p>
                <p className="mt-2 text-2xl font-bold text-[#F8FAFC]">
                  {blockRecord}
                </p>
              </div>
              <div className={`${premiumInset} min-w-0 p-4 sm:col-span-2 xl:col-span-1`}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Top issue
                </p>
                <p className="mt-2 text-lg font-bold leading-7 text-[#FFE28A] sm:text-xl">
                  {topIssue}
                </p>
              </div>
            </div>

            <div className={`${premiumInsetStrong} mt-5 p-4`}>
              <div className="flex items-start gap-3">
                <Target className="mt-1 size-5 shrink-0 text-[#F5C84C]" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-[#F8FAFC]">
                    What this block is testing
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
                    This block is designed to test whether the Mega Greninja issue is
                    real. Finish the 5-game sample before changing more cards.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link href="/demo/matches/new" className={primaryButton}>
                Log next game
              </Link>
              <Link href="/demo/review" className={secondaryButton}>
                Back to review
              </Link>
            </div>
          </article>

          <article className={cardLarge}>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
              Current test context
            </p>
            <h2 className={sectionTitle}>{deck.name}</h2>
            <p className={sectionCopy}>
              {activeVersion?.name ?? "Active version"} is being checked before
              the next deck change.
            </p>
            <div className="mt-4 grid gap-3">
              {block.focusTags.map((tag) => (
                <div key={tag} className={`${premiumInset} flex items-center gap-3 p-3`}>
                  <CheckCircle2 className="size-4 shrink-0 text-[#22C55E]" aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#F8FAFC]">{tag}</p>
                </div>
              ))}
            </div>
            <div className={`${premiumInsetStrong} mt-4 p-3`}>
              <p className="text-sm font-semibold text-[#F8FAFC]">Source review</p>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
                {block.sourceReviewReason}
              </p>
            </div>
          </article>
        </section>
      ) : null}

      <section className={cardLarge}>
        <div className="flex items-center gap-3">
          <Beaker className="size-5 text-[#F5C84C]" aria-hidden="true" />
          <div>
            <h2 className={sectionTitle}>Games already in this block</h2>
            <p className={sectionCopy}>
              These are normal match logs in the demo fixture, scoped to the active
              focused test.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          {matches.map((match) => (
            <article
              key={match.id}
              className={`${premiumInset} grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  vs {match.opponentArchetype}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#94A3B8]/76">
                  {match.notes}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(match.metadata.issue_tags ?? match.tags).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#0B1020]/62 px-2 py-0.5 text-[11px] text-[#94A3B8]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                <p
                  className={`text-sm font-bold ${
                    match.result === "win"
                      ? "text-[#22C55E]"
                      : match.result === "loss"
                        ? "text-[#F43F5E]"
                        : "text-[#F5C84C]"
                  }`}
                >
                  {getMatchResultLabel(match.result)}
                </p>
                <p className="text-xs text-[#94A3B8]/70">{formatDemoDate(match.playedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BetaFeedbackPrompt
        mode="cta"
        pageContext="demo-testing"
        pagePath="/demo/testing"
        defaultCategory="Demo"
        question="Did this testing block demo show what to do next?"
      />

      <DemoConversionCta />
    </DemoShell>
  );
}
