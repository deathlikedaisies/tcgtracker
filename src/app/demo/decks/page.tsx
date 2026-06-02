import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoConversionCta } from "@/components/demo/DemoConversionCta";
import { DemoShell } from "@/components/demo/DemoShell";
import {
  cardLarge,
  pageCopy,
  pageHeaderCard,
  pageTitle,
  primaryButton,
  sectionCopy,
} from "@/components/brand-styles";
import { demoDecks, demoMatches, getDeckMatchCount, getWinRate } from "@/lib/demo-data";

export default function DemoDecksPage() {
  return (
    <DemoShell current="decks">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Deck experiments</p>
          <h1 className={pageTitle}>Demo decks</h1>
          <p className={pageCopy}>
            Three seeded deck families with versions, notes, and linked match history.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Try fake logging
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {demoDecks.map((deck) => {
          const matches = demoMatches.filter((match) => match.deckId === deck.id);

          return (
            <article key={deck.id} className={cardLarge}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ArchetypeSprites archetype={deck.archetype} size="md" />
                  <h2 className="mt-3 truncate text-xl font-bold text-[#F8FAFC]">{deck.name}</h2>
                  <p className="mt-1 text-sm font-medium text-[#F5C84C]">{deck.archetype}</p>
                </div>
                <span className="rounded-full bg-[#07111F]/58 px-2 py-1 text-xs text-[#94A3B8]">
                  {deck.versions.length} versions
                </span>
              </div>
              <p className={`mt-3 ${sectionCopy}`}>{deck.notes}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[16px] bg-[#07111F]/52 p-3">
                  <p className="text-xs text-[#94A3B8]/70">Matches</p>
                  <p className="text-2xl font-bold text-[#F8FAFC]">{getDeckMatchCount(deck.id)}</p>
                </div>
                <div className="rounded-[16px] bg-[#07111F]/52 p-3">
                  <p className="text-xs text-[#94A3B8]/70">Win rate</p>
                  <p className="text-2xl font-bold text-[#F8FAFC]">{getWinRate(matches)}%</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {deck.versions.map((version) => (
                  <div key={version.id} className="rounded-[14px] bg-[#07111F]/44 p-2.5">
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      {version.name}
                      {version.isActive ? <span className="ml-2 text-xs text-[#22C55E]">Active</span> : null}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">{version.notes}</p>
                  </div>
                ))}
              </div>
              <Link href={`/demo/decks/${deck.id}`} className="mt-4 inline-flex items-center text-sm font-semibold text-[#F5C84C]">
                Open deck
                <ArrowRight className="ml-1 size-4" aria-hidden="true" />
              </Link>
            </article>
          );
        })}
      </section>
      <DemoConversionCta />
    </DemoShell>
  );
}
