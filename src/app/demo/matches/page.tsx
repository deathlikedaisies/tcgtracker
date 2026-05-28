import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoShell } from "@/components/demo/DemoShell";
import { cardLarge, pageCopy, pageHeader, pageTitle, primaryButton } from "@/components/brand-styles";
import { demoDecks, demoMatches, formatDemoDate } from "@/lib/demo-data";

export default function DemoMatchesPage() {
  const deckById = new Map(demoDecks.map((deck) => [deck.id, deck]));

  return (
    <DemoShell current="matches">
      <section className={pageHeader}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Testing history</p>
          <h1 className={pageTitle}>Demo match log</h1>
          <p className={pageCopy}>
            {demoMatches.length} seeded games across matchups, turn order, notes, and tags.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log fake game
        </Link>
      </section>

      <section className={cardLarge}>
        <div className="grid gap-2">
          {demoMatches.map((match) => {
            const deck = deckById.get(match.deckId);

            return (
              <article
                key={match.id}
                className="grid gap-3 rounded-md bg-[#07111F]/52 p-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ArchetypeSprites archetype={match.opponentArchetype} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                      vs {match.opponentArchetype}
                    </p>
                    <p className="truncate text-xs text-[#94A3B8]/70">
                      {deck?.name} - {match.wentFirst ? "First" : "Second"}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-[#94A3B8]/70">{match.notes}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {match.tags.map((tag) => (
                      <span key={tag} className="rounded bg-[#0B1020]/62 px-1.5 py-0.5 text-[11px] text-[#94A3B8]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  <p className={`text-sm font-bold ${match.result === "win" ? "text-[#22C55E]" : "text-[#F43F5E]"}`}>
                    {match.result.toUpperCase()}
                  </p>
                  <p className="text-xs text-[#94A3B8]/70">{formatDemoDate(match.playedAt)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </DemoShell>
  );
}
