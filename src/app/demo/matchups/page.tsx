import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoConversionCta } from "@/components/demo/DemoConversionCta";
import { DemoShell } from "@/components/demo/DemoShell";
import {
  cardLarge,
  pageCopy,
  pageHeaderCard,
  pageTitle,
  primaryButton,
} from "@/components/brand-styles";
import {
  getConfidenceLabel,
  getConfidenceTone,
  getDemoActiveVersion,
  getDemoCurrentDeck,
  getDemoDeckLab,
  getDemoDeckMatches,
  getDemoMatchups,
} from "@/lib/demo-data";
import { formatMatchRecord } from "@/lib/match-types";

function pct(wins: number, games: number) {
  return games ? Math.round((wins / games) * 100) : 0;
}

export default function DemoMatchupsPage() {
  const currentDeck = getDemoCurrentDeck();
  const activeVersion = getDemoActiveVersion(currentDeck);
  const deckMatches = currentDeck ? getDemoDeckMatches(currentDeck.id) : [];
  const matchups = getDemoMatchups(deckMatches);
  const deckLab = currentDeck ? getDemoDeckLab(currentDeck.id) : null;
  const biggestLeak =
    matchups.find((matchup) => matchup.games.length >= 2) ?? matchups[0];

  if (!currentDeck || !activeVersion || !deckLab || !biggestLeak) {
    return null;
  }

  return (
    <DemoShell current="matchups">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Matchup intelligence</p>
          <h1 className={pageTitle}>Demo matchup report</h1>
          <p className={pageCopy}>
            Supporting matchup evidence for the current test deck, not pooled across every deck in the demo workspace.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log game
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[22px] bg-[#2A1320]/84 p-3 shadow-[0_20px_56px_rgba(244,63,94,0.12),inset_0_0_0_1px_rgba(244,63,94,0.26)] backdrop-blur sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-rose-200">
            Biggest weakness
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ArchetypeSprites archetype={biggestLeak.archetype} size="md" />
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-[#F8FAFC]">{biggestLeak.archetype}</h2>
                <p className="text-sm text-rose-100/78">
                  {formatMatchRecord(
                    biggestLeak.wins,
                    biggestLeak.losses,
                    biggestLeak.ties
                  )}, {biggestLeak.winRate}% win rate
                </p>
                <p className="mt-1 text-xs text-rose-100/72">
                  {currentDeck.name} · {activeVersion.name}
                </p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${getConfidenceTone(biggestLeak.games.length)}`}>
              {getConfidenceLabel(biggestLeak.games.length)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-[12px] bg-[#0B1020]/42 px-3 py-1.5">
              <span className="text-xs text-rose-100/70">First</span>
              <span className="text-sm font-bold text-[#F8FAFC]">{pct(biggestLeak.firstWins, biggestLeak.firstGames)}%</span>
            </div>
            <div className="flex items-center gap-2 rounded-[12px] bg-[#0B1020]/42 px-3 py-1.5">
              <span className="text-xs text-rose-100/70">Second</span>
              <span className="text-sm font-bold text-[#F43F5E]">{pct(biggestLeak.secondWins, biggestLeak.secondGames)}%</span>
            </div>
            <div className="flex items-center gap-2 rounded-[12px] bg-[#0B1020]/42 px-3 py-1.5">
              <span className="text-xs text-rose-100/70">Samples</span>
              <span className="text-sm font-bold text-[#F8FAFC]">{biggestLeak.games.length}</span>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-rose-100/82">
            {deckLab.nextObservation}
          </p>
        </article>

        <article className={cardLarge}>
          <h2 className="text-xl font-bold text-[#F8FAFC]">What to watch next</h2>
          <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
            {deckLab.recommendation}
          </p>
          <div className="mt-4 grid gap-3">
            {[deckLab.versionConclusion, deckLab.sampleCaution, deckLab.nextObservation].map((item, index) => (
              <div key={item} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[16px] bg-[#07111F]/52 p-3">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#4F8CFF]/18 text-sm font-bold text-[#B8D1FF]">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-[#F8FAFC]/90">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={cardLarge}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">Watchlist</h2>
            <p className="text-sm leading-6 text-[#94A3B8]/76">
              If these show up on ladder, log them cleanly. They are not required targets.
            </p>
          </div>
          <span className="rounded-full bg-[#F5C84C]/12 px-2 py-1 text-xs font-semibold text-[#F5C84C]">
            Current deck watchlist
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {deckLab.metaWatchlist.slice(0, 4).map((matchup) => (
            <article key={matchup.archetype} className="rounded-[16px] bg-[#07111F]/52 p-3 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <ArchetypeSprites archetype={matchup.archetype} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#F8FAFC]">{matchup.archetype}</p>
                    <p className="text-xs text-[#94A3B8]/70">
                      {matchup.count} game{matchup.count === 1 ? "" : "s"} · {matchup.recentLabel}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#0B1020]/72 px-2 py-1 text-xs font-semibold text-[#DCE8FF]">
                  {matchup.statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#94A3B8]/76">
                If this matchup appears, log it cleanly before you decide whether the current version needs another change.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={cardLarge}>
        <h2 className="text-xl font-bold text-[#F8FAFC]">All demo matchups</h2>
        <div className="mt-4 grid gap-3">
          {matchups.map((matchup) => (
            <article
              key={matchup.archetype}
              className="grid gap-3 rounded-md bg-[#07111F]/52 p-3 lg:grid-cols-[minmax(0,1fr)_120px_120px_minmax(0,1fr)] lg:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <ArchetypeSprites archetype={matchup.archetype} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">{matchup.archetype}</p>
                  <p className="text-xs text-[#94A3B8]/70">{matchup.games.length} games</p>
                </div>
              </div>
              <p className={`text-2xl font-bold ${matchup.winRate < 45 ? "text-[#F43F5E]" : matchup.winRate > 58 ? "text-[#22C55E]" : "text-[#F8FAFC]"}`}>
                {matchup.winRate}%
              </p>
              <div>
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${getConfidenceTone(matchup.games.length)}`}>
                  {matchup.games.length < 6 ? "Needs more games" : getConfidenceLabel(matchup.games.length)}
                </span>
                <p className="mt-1 text-sm text-[#94A3B8]/76">
                  1st {pct(matchup.firstWins, matchup.firstGames)}% / 2nd {pct(matchup.secondWins, matchup.secondGames)}%
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchup.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-[#0B1020]/62 px-1.5 py-0.5 text-[11px] text-[#94A3B8]">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
      <DemoConversionCta />
    </DemoShell>
  );
}
