import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoShell } from "@/components/demo/DemoShell";
import { cardLarge, pageCopy, pageHeader, pageTitle, primaryButton } from "@/components/brand-styles";
import { getBiggestLeak, getDemoMatchups } from "@/lib/demo-data";

function pct(wins: number, games: number) {
  return games ? Math.round((wins / games) * 100) : 0;
}

export default function DemoMatchupsPage() {
  const matchups = getDemoMatchups();
  const biggestLeak = getBiggestLeak();

  return (
    <DemoShell current="matchups">
      <section className={pageHeader}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Matchup intelligence</p>
          <h1 className={pageTitle}>Demo matchup report</h1>
          <p className={pageCopy}>
            Clear weak spots, going-first/second splits, and repeated loss patterns.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Test this matchup
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-md bg-[#2A1320]/84 p-4 shadow-[0_20px_56px_rgba(244,63,94,0.12),inset_0_0_0_1px_rgba(244,63,94,0.26)] backdrop-blur sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-rose-200">
            Biggest leak
          </p>
          <div className="mt-3 flex items-center gap-3">
            <ArchetypeSprites archetype={biggestLeak.archetype} size="md" />
            <div>
              <h2 className="text-3xl font-bold text-[#F8FAFC]">{biggestLeak.archetype}</h2>
              <p className="text-sm text-rose-100/78">
                {biggestLeak.wins}-{biggestLeak.losses}, {biggestLeak.winRate}% win rate
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md bg-[#0B1020]/42 p-3">
              <p className="text-xs text-rose-100/70">Going first</p>
              <p className="text-2xl font-bold text-[#F8FAFC]">
                {pct(biggestLeak.firstWins, biggestLeak.firstGames)}%
              </p>
            </div>
            <div className="rounded-md bg-[#0B1020]/42 p-3">
              <p className="text-xs text-rose-100/70">Going second</p>
              <p className="text-2xl font-bold text-[#F43F5E]">
                {pct(biggestLeak.secondWins, biggestLeak.secondGames)}%
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-rose-100/82">
            Recommendation: run five more games going second and tag every early setup miss.
          </p>
        </article>

        <article className={cardLarge}>
          <h2 className="text-xl font-bold text-[#F8FAFC]">What to test next</h2>
          <div className="mt-4 grid gap-3">
            {[
              "Keep one extra switching card in the active Dragapult build.",
              "Track whether bench pressure or missed setup causes the first prize deficit.",
              "Compare Dragapult v2 against v3 after five Mega Greninja games.",
            ].map((item, index) => (
              <div key={item} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-md bg-[#07111F]/52 p-3">
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
              <p className="text-sm text-[#94A3B8]/76">
                1st {pct(matchup.firstWins, matchup.firstGames)}% / 2nd {pct(matchup.secondWins, matchup.secondGames)}%
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchup.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-[#0B1020]/62 px-1.5 py-0.5 text-[11px] text-[#94A3B8]">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </DemoShell>
  );
}
