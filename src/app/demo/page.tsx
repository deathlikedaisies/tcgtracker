import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  CalendarDays,
  ClipboardList,
  Layers3,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoConversionCta } from "@/components/demo/DemoConversionCta";
import { DemoShell } from "@/components/demo/DemoShell";
import { BetaFeedbackPrompt } from "@/components/feedback/BetaFeedbackPrompt";
import {
  card,
  cardLarge,
  interactiveTile,
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
  demoDecks,
  demoEvents,
  demoMatches,
  demoTestingBlocks,
  formatDemoDate,
  getConfidenceLabel,
  getConfidenceTone,
  getDemoActiveVersion,
  getDemoCurrentDeck,
  getDemoCurrentDeckLab,
  getDemoDeckMatches,
  getDemoMatchups,
  getRecentSession,
  getWinRate,
} from "@/lib/demo-data";
import { countMatchResults, formatMatchRecord } from "@/lib/match-types";

function isCleanLog(match: (typeof demoMatches)[number]) {
  const metadata = match.metadata;
  const hasQuality =
    Boolean(metadata.start_quality) &&
    Boolean(metadata.opening_hand_quality) &&
    Boolean(metadata.sequencing_quality);
  const hasReason =
    match.result === "win"
      ? Boolean(metadata.positive_tags?.length)
      : match.result === "loss"
        ? Boolean(metadata.issue_tags?.length)
        : Boolean(metadata.issue_tags?.length || metadata.positive_tags?.length);

  return hasQuality && hasReason;
}

export default function DemoPage() {
  const currentDeck = getDemoCurrentDeck();
  const activeVersion = getDemoActiveVersion(currentDeck);
  const deckLab = getDemoCurrentDeckLab();
  const currentDeckMatches = currentDeck ? getDemoDeckMatches(currentDeck.id) : [];
  const currentDeckMatchups = getDemoMatchups(currentDeckMatches);
  const recent = currentDeck ? getRecentSession(currentDeck.id).slice(0, 8) : [];
  const recentRecord = countMatchResults(recent);
  const cleanRecentCount = recent.filter(isCleanLog).length;
  const watchlistPreview = deckLab?.metaWatchlist.filter((item) =>
    ["Mega Greninja", "Dragapult Dusknoir", "N's Zoroark", "Slowking"].includes(
      item.archetype
    )
  ) ?? [];
  const comparisonPreview = deckLab?.comparisonRows.slice(0, 3) ?? [];

  if (!currentDeck || !activeVersion || !deckLab) {
    return (
      <DemoShell current="dashboard">
        <section className={pageHeaderCard}>
          <div>
            <p className="text-sm font-semibold text-[#4F8CFF]">Demo workspace</p>
            <h1 className={pageTitle}>Explore a realistic testing workspace.</h1>
            <p className={pageCopy}>
              Demo data only. Create a workspace to save your own games.
            </p>
          </div>
        </section>
      </DemoShell>
    );
  }

  return (
    <DemoShell current="dashboard">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">
            Realistic workspace preview
          </p>
          <h1 className={pageTitle}>Explore a realistic testing workspace.</h1>
          <p className={pageCopy}>
            See how SixPrizer tracks deck versions, matchup trends, and testing
            discipline. Demo data only. Create a workspace to save your own games.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
            Log game
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
          <Link href="/signup" className={`${secondaryButton} h-12`}>
            Create your workspace
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Layers3, "Decks", String(demoDecks.length), "One current test deck"],
          [ClipboardList, "Match history", String(demoMatches.length), "Seeded local archive"],
          [CalendarDays, "Events", String(demoEvents.length), "Rounds linked to analytics"],
          [Trophy, "Current deck win rate", `${getWinRate(currentDeckMatches)}%`, activeVersion.name],
          [
            Target,
            "Recent session",
            formatMatchRecord(recentRecord.wins, recentRecord.losses, recentRecord.ties),
            `${cleanRecentCount} clean logs in the last ${recent.length} games`,
          ],
        ].map(([Icon, labelText, value, helper]) => (
          <article key={labelText as string} className={card}>
            <Icon className="size-5 text-[#F5C84C]" aria-hidden="true" />
            <p className="mt-3 text-sm text-[#94A3B8]/72">{labelText as string}</p>
            <p className="mt-1 text-3xl font-bold text-[#F8FAFC]">{value as string}</p>
            <p className="mt-1 text-xs text-[#94A3B8]/64">{helper as string}</p>
          </article>
        ))}
      </section>

      <section className={cardLarge}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
              Guided demo loop
            </p>
            <h2 className={sectionTitle}>Follow the full smart-coaching workflow.</h2>
            <p className={sectionCopy}>
              Deck versions create the baseline, logged games reveal the problem,
              review starts the block, and events feed the next test.
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#4F8CFF]/12 px-2.5 py-1 text-xs font-semibold text-[#B8D1FF]">
            Sample data only
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            {
              href: `/demo/decks/${currentDeck.id}`,
              icon: Layers3,
              title: "1. Compare versions",
              copy: `${activeVersion.name} has a cleaner setup read.`,
            },
            {
              href: "/demo/review",
              icon: ClipboardList,
              title: "2. Review losses",
              copy: "Mega Greninja games show repeated bench pressure.",
            },
            {
              href: "/demo/testing",
              icon: Beaker,
              title: "3. Start the block",
              copy: `${demoTestingBlocks[0]?.targetGames ?? 5}-game focused test into Mega Greninja.`,
            },
            {
              href: "/demo/events",
              icon: CalendarDays,
              title: "4. Review an event",
              copy: "Round logs become an event takeaway and next test.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} className={`${interactiveTile} p-3`}>
                <Icon className="size-5 text-[#F5C84C]" aria-hidden="true" />
                <h3 className="mt-3 text-sm font-semibold text-[#F8FAFC]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#94A3B8]/76">
                  {item.copy}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className={cardLarge}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`${premiumInsetStrong} shrink-0 p-2.5`}>
                <ArchetypeSprites archetype={currentDeck.archetype} size="md" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                  Current test deck
                </p>
                <h2 className="mt-2 truncate text-2xl font-bold text-[#F8FAFC]">
                  {currentDeck.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#B8D1FF]">
                  {currentDeck.archetype}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                  Testing: {activeVersion.name}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#94A3B8]/76">
                  Showing insights for this deck.
                </p>
              </div>
            </div>
            <span
              className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getConfidenceTone(
                currentDeckMatches.length
              )}`}
            >
              {getConfidenceLabel(currentDeckMatches.length)}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Current version sample</p>
              <p className="mt-1 text-2xl font-bold text-[#F8FAFC]">
                {deckLab.currentVersionSampleDisplay}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]/70">
                {deckLab.currentVersionSampleSummary}
              </p>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Clean logs</p>
              <p className="mt-1 text-2xl font-bold text-[#F8FAFC]">
                {deckLab.cleanLogDisplay}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]/70">
                {deckLab.cleanLogSummary}
              </p>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Supporting evidence</p>
              <p className="mt-1 text-2xl font-bold text-[#F8FAFC]">
                {currentDeckMatchups.length}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]/70">
                Matchups logged for this deck
              </p>
            </div>
          </div>
        </article>

        <article className={cardLarge}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
            Next best action
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#F8FAFC]">
            {deckLab.versionReadStatus === "baseline_ready"
              ? "You have a usable baseline."
              : deckLab.recommendation}
          </h2>
          <p className={sectionCopy}>
            {deckLab.versionReadStatus === "baseline_ready"
              ? "Create a new version when you have a specific list change to test."
              : deckLab.nextObservation}
          </p>
          <div className={`${premiumInsetStrong} mt-4 p-3.5`}>
            <p className="text-sm font-semibold text-[#F8FAFC]">Deck Lab preview</p>
            <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
              {deckLab.versionConclusion}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#4F8CFF]/12 px-2 py-1 text-xs font-semibold text-[#B8D1FF]">
                {deckLab.versionReadLabel}
              </span>
              <span className="rounded-full bg-[#07111F]/58 px-2 py-1 text-xs font-semibold text-[#DCE8FF]">
                {deckLab.versionPatienceLabel}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/demo/review" className={`${secondaryButton} h-12 sm:flex-1`}>
              Open review
            </Link>
            <Link href="/demo/matches/new" className={`${primaryButton} h-12 sm:flex-1`}>
              Keep logging
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className={cardLarge}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Deck Lab
              </p>
              <h2 className={sectionTitle}>Test this version before changing the list.</h2>
              <p className={sectionCopy}>
                Version read, testing discipline, and meta watchlist stay tied to
                the current active deck.
              </p>
            </div>
            <Link href={`/demo/decks/${currentDeck.id}`} className="text-sm font-semibold text-[#F5C84C]">
              Open full Deck Lab
            </Link>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                Version read
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                {deckLab.versionReadSummary}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                {deckLab.sampleCaution}
              </p>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                Testing discipline
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                {deckLab.versionPatienceSummary}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                Clean logs: {deckLab.cleanLogDisplay}.
              </p>
            </div>
          </div>

          {comparisonPreview.length ? (
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {comparisonPreview.map((row) => (
                <div key={row.label} className={`${premiumInset} p-3`}>
                  <p className="text-xs text-[#94A3B8]/72">{row.label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                    {row.current} vs {row.previous}
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]/68">{row.insight}</p>
                </div>
              ))}
            </div>
          ) : null}
        </article>

        <article className={cardLarge}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Meta watchlist
              </p>
              <h2 className={sectionTitle}>If these show up on ladder, log them cleanly.</h2>
            </div>
            <Swords className="size-5 text-[#F5C84C]" aria-hidden="true" />
          </div>
          <div className="mt-4 grid gap-2">
            {watchlistPreview.map((item) => (
              <div key={item.archetype} className={`${premiumInset} flex items-center justify-between gap-3 p-3`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                    {item.archetype}
                  </p>
                  <p className="text-xs text-[#94A3B8]/70">
                    {item.count} game{item.count === 1 ? "" : "s"} · {item.recentLabel}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#07111F]/58 px-2 py-1 text-xs font-semibold text-[#DCE8FF]">
                  {item.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <article className={cardLarge}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={sectionTitle}>Recent testing session</h2>
              <p className={sectionCopy}>
                Clean logs, current version evidence, and matchup trends for the
                active deck.
              </p>
            </div>
            <span className="rounded-full bg-[#4F8CFF]/12 px-2 py-1 text-xs font-semibold text-[#B8D1FF]">
              {formatMatchRecord(recentRecord.wins, recentRecord.losses, recentRecord.ties)}
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {recent.slice(0, 6).map((match) => (
              <div
                key={match.id}
                className={`${premiumInset} grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[16px] p-2.5`}
              >
                <span
                  className={`size-2.5 rounded-full ${
                    match.result === "win"
                      ? "bg-[#22C55E]"
                      : match.result === "loss"
                        ? "bg-[#F43F5E]"
                        : "bg-[#94A3B8]"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                    vs {match.opponentArchetype}
                  </p>
                  <p className="truncate text-xs text-[#94A3B8]/70">
                    {match.tags.join(", ") || "clean log"}
                  </p>
                </div>
                <p className="text-xs text-[#94A3B8]/70">{formatDemoDate(match.playedAt)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className={cardLarge}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className={sectionTitle}>Matchup intelligence snapshot</h2>
              <p className={sectionCopy}>
                Supporting evidence for the current deck, not pooled across every
                list in the demo workspace.
              </p>
            </div>
            <Link href="/demo/matchups" className="text-sm font-semibold text-[#F5C84C]">
              Open matchups
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {currentDeckMatchups.slice(0, 4).map((matchup) => (
              <Link
                key={matchup.archetype}
                href="/demo/matchups"
                className={`${interactiveTile} p-3`}
              >
                <ArchetypeSprites archetype={matchup.archetype} />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                    {matchup.archetype}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${getConfidenceTone(
                      matchup.games.length
                    )}`}
                  >
                    {getConfidenceLabel(matchup.games.length)}
                  </span>
                </div>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    matchup.winRate < 45
                      ? "text-[#F43F5E]"
                      : matchup.winRate > 58
                        ? "text-[#22C55E]"
                        : "text-[#F8FAFC]"
                  }`}
                >
                  {matchup.winRate}%
                </p>
                <p className="text-xs text-[#94A3B8]/70">{matchup.record}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <BetaFeedbackPrompt
        mode="cta"
        pageContext="demo"
        pagePath="/demo"
        defaultCategory="Demo"
        question="Did this demo make the coaching workflow clear?"
      />

      <DemoConversionCta />
    </DemoShell>
  );
}
