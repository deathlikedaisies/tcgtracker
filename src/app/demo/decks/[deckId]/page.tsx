import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoShell } from "@/components/demo/DemoShell";
import { cardLarge, pageCopy, pageHeader, pageTitle, primaryButton } from "@/components/brand-styles";
import { demoMatches, formatDemoDate, getDemoDeck, getDemoMatchups, getWinRate } from "@/lib/demo-data";

type DemoDeckDetailPageProps = {
  params: Promise<{ deckId: string }>;
};

export default async function DemoDeckDetailPage({ params }: DemoDeckDetailPageProps) {
  const { deckId } = await params;
  const deck = getDemoDeck(deckId);

  if (!deck) {
    notFound();
  }

  const matches = demoMatches.filter((match) => match.deckId === deck.id);
  const matchups = getDemoMatchups(matches);

  return (
    <DemoShell current="decks">
      <section className={pageHeader}>
        <div className="flex min-w-0 gap-3">
          <ArchetypeSprites archetype={deck.archetype} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#4F8CFF]">Demo deck detail</p>
            <h1 className={pageTitle}>{deck.name}</h1>
            <p className={pageCopy}>{deck.archetype} - {deck.notes}</p>
          </div>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log fake game
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className={cardLarge}>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Versions</h2>
          <div className="mt-4 grid gap-3">
            {deck.versions.map((version) => (
              <div key={version.id} className="rounded-md bg-[#07111F]/52 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#F8FAFC]">{version.name}</p>
                  {version.isActive ? (
                    <span className="rounded-md bg-[#22C55E]/12 px-2 py-1 text-xs font-semibold text-emerald-200">
                      Active
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">{version.notes}</p>
                <p className="mt-2 text-xs text-[#94A3B8]/60">Created {formatDemoDate(version.createdAt)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className={cardLarge}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#F8FAFC]">Deck performance</h2>
            <p className="text-3xl font-bold text-[#F8FAFC]">{getWinRate(matches)}%</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {matchups.slice(0, 6).map((matchup) => (
              <div key={matchup.archetype} className="rounded-md bg-[#07111F]/52 p-3">
                <div className="flex items-center gap-2">
                  <ArchetypeSprites archetype={matchup.archetype} />
                  <p className="min-w-0 truncate text-sm font-semibold text-[#F8FAFC]">{matchup.archetype}</p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-[#1A2238]">
                  <div className="h-full rounded-full bg-[#4F8CFF]" style={{ width: `${matchup.winRate}%` }} />
                </div>
                <p className="mt-2 text-sm text-[#94A3B8]/72">
                  {matchup.wins}-{matchup.losses}, {matchup.winRate}%
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={cardLarge}>
        <h2 className="text-xl font-bold text-[#F8FAFC]">Recent matches with this deck</h2>
        <div className="mt-4 grid gap-2">
          {matches.slice(0, 10).map((match) => (
            <div key={match.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-[#07111F]/52 p-3">
              <span className={`size-2.5 rounded-full ${match.result === "win" ? "bg-[#22C55E]" : "bg-[#F43F5E]"}`} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#F8FAFC]">{match.opponentArchetype}</p>
                <p className="truncate text-xs text-[#94A3B8]/70">{match.notes}</p>
              </div>
              <p className="text-xs text-[#94A3B8]/70">{formatDemoDate(match.playedAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </DemoShell>
  );
}
