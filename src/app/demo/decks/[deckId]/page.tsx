import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoShell } from "@/components/demo/DemoShell";
import {
  cardLarge,
  pageCopy,
  pageHeaderCard,
  pageTitle,
  premiumInset,
  primaryButton,
  sectionCopy,
  secondaryButton,
} from "@/components/brand-styles";
import {
  formatDemoDate,
  getDemoActiveVersion,
  getDemoDeck,
  getDemoDeckLab,
  getDemoDeckMatches,
  getDemoMatchups,
  getWinRate,
} from "@/lib/demo-data";
import { formatMatchRecord } from "@/lib/match-types";

type DemoDeckDetailPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function DemoDeckDetailPage({
  params,
}: DemoDeckDetailPageProps) {
  const { deckId } = await params;
  const deck = getDemoDeck(deckId);

  if (!deck) {
    notFound();
  }

  const activeVersion = getDemoActiveVersion(deck);
  const matches = getDemoDeckMatches(deck.id);
  const matchups = getDemoMatchups(matches);
  const deckLab = getDemoDeckLab(deck.id);

  if (!activeVersion || !deckLab) {
    notFound();
  }

  const visibleHabits = deckLab.disciplineHabits.slice(0, 3);
  const visibleWatchlist = deckLab.metaWatchlist.slice(0, 4);

  return (
    <DemoShell current="decks">
      <section className={pageHeaderCard}>
        <div className="flex min-w-0 gap-3">
          <div className={`${premiumInset} shrink-0 p-2.5`}>
            <ArchetypeSprites archetype={deck.archetype} size="md" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#4F8CFF]">Current test deck</p>
            <h1 className={`${pageTitle} truncate`}>{deck.name}</h1>
            <p className={pageCopy}>
              {deck.archetype} · Testing: {activeVersion.name}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
            Log game
          </Link>
          <Link href="/demo/review" className={`${secondaryButton} h-12`}>
            Open review
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <article className={cardLarge}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
            Deck Lab
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#F8FAFC]">
            Test this version before changing the list.
          </h2>
          <p className={sectionCopy}>{deckLab.recommendation}</p>

          <div className="mt-4 grid gap-3 xl:grid-cols-3">
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
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleHabits.map((habit) => (
                  <span
                    key={`${habit.label}-${habit.statusLabel}`}
                    className="rounded-full bg-[#07111F]/58 px-2 py-1 text-xs font-semibold text-[#DCE8FF]"
                  >
                    {habit.statusLabel}
                  </span>
                ))}
              </div>
            </div>

            <div className={`${premiumInset} p-3`}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                Meta watchlist
              </p>
              <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                If these show up on ladder, log them cleanly.
              </p>
              <div className="mt-3 grid gap-2">
                {visibleWatchlist.map((item) => (
                  <div key={item.archetype} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#F8FAFC]">
                        {item.archetype}
                      </p>
                      <p className="text-xs text-[#94A3B8]/70">
                        {item.count} game{item.count === 1 ? "" : "s"} · {item.recentLabel}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#0B1020]/72 px-2 py-1 text-xs font-semibold text-[#DCE8FF]">
                      {item.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className={cardLarge}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Deck snapshot
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#F8FAFC]">
                {getWinRate(matches)}% with {matches.length} games
              </h2>
            </div>
            {deck.isCurrentTest ? (
              <span className="rounded-full bg-[#F5C84C]/12 px-2 py-1 text-xs font-semibold text-[#F5C84C]">
                Current test deck
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Active version</p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                {activeVersion.name}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]/70">
                {activeVersion.notes}
              </p>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Version comparison</p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                {deckLab.previousVersionName
                  ? `${deckLab.activeVersionName} vs ${deckLab.previousVersionName}`
                  : "First version baseline"}
              </p>
              <p className="mt-1 text-xs text-[#94A3B8]/70">
                {deckLab.versionConclusion}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <article className={cardLarge}>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Version list</h2>
          <div className="mt-4 grid gap-3">
            {deck.versions.map((version) => {
              const versionMatches = matches.filter(
                (match) => match.deckVersionId === version.id
              );

              return (
                <div key={version.id} className={`${premiumInset} p-3`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      {version.name}
                    </p>
                    {version.isActive ? (
                      <span className="rounded-full bg-[#22C55E]/12 px-2 py-1 text-xs font-semibold text-emerald-200">
                        Active test
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                    {version.notes}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#94A3B8]/70">
                    <span>{versionMatches.length} games</span>
                    <span>·</span>
                    <span>{getWinRate(versionMatches)}% win rate</span>
                    <span>·</span>
                    <span>Created {formatDemoDate(version.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className={cardLarge}>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Matchup snapshot</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {matchups.slice(0, 6).map((matchup) => (
              <div key={matchup.archetype} className={`${premiumInset} p-3`}>
                <div className="flex items-center gap-2">
                  <ArchetypeSprites archetype={matchup.archetype} />
                  <p className="min-w-0 truncate text-sm font-semibold text-[#F8FAFC]">
                    {matchup.archetype}
                  </p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-[#1A2238]">
                  <div
                    className="h-full rounded-full bg-[#4F8CFF]"
                    style={{ width: `${matchup.winRate}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-[#94A3B8]/72">
                  {formatMatchRecord(matchup.wins, matchup.losses, matchup.ties)},
                  {" "}
                  {matchup.winRate}%
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DemoShell>
  );
}
