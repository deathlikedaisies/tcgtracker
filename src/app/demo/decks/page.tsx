import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoConversionCta } from "@/components/demo/DemoConversionCta";
import { DemoShell } from "@/components/demo/DemoShell";
import {
  cardLarge,
  pageCopy,
  pageHeaderCard,
  pageTitle,
  premiumInset,
  primaryButton,
  secondaryButton,
  sectionCopy,
} from "@/components/brand-styles";
import {
  demoDecks,
  getDeckMatchCount,
  getDemoActiveVersion,
  getDemoCurrentDeck,
  getDemoDeckLab,
  getDemoDeckMatches,
  getWinRate,
} from "@/lib/demo-data";

export default function DemoDecksPage() {
  const currentDeck = getDemoCurrentDeck();
  const currentDeckLab = currentDeck ? getDemoDeckLab(currentDeck.id) : null;

  return (
    <DemoShell current="decks">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Deck experiments</p>
          <h1 className={pageTitle}>Demo decks</h1>
          <p className={pageCopy}>
            See one active test deck, alternate lists, and how Deck Lab stays tied
            to the current version.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log game
        </Link>
      </section>

      {currentDeck && currentDeckLab ? (
        <section className={cardLarge}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                Deck Lab preview
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#F8FAFC]">
                {currentDeck.name}
              </h2>
              <p className={sectionCopy}>
                {currentDeckLab.versionConclusion}
              </p>
            </div>
            <Link href={`/demo/decks/${currentDeck.id}`} className={`${secondaryButton} h-11`}>
              Open full Deck Lab
            </Link>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Version read</p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                {currentDeckLab.versionReadLabel}
              </p>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Current sample</p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                {currentDeckLab.currentVersionSampleDisplay}
              </p>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Testing discipline</p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                {currentDeckLab.versionPatienceLabel}
              </p>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Meta watchlist</p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                {currentDeckLab.metaWatchlist[0]?.archetype ?? "No data yet"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {demoDecks.map((deck) => {
          const matches = getDemoDeckMatches(deck.id);
          const activeVersion = getDemoActiveVersion(deck);

          return (
            <article key={deck.id} className={cardLarge}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <ArchetypeSprites archetype={deck.archetype} size="md" />
                  <h2 className="mt-3 truncate text-xl font-bold text-[#F8FAFC]">
                    {deck.name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#F5C84C]">
                    {deck.archetype}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-full bg-[#07111F]/58 px-2 py-1 text-xs text-[#94A3B8]">
                    {deck.versions.length} versions
                  </span>
                  {deck.isCurrentTest ? (
                    <span className="rounded-full bg-[#F5C84C]/12 px-2 py-1 text-xs font-semibold text-[#F5C84C]">
                      Current test deck
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#94A3B8]/76">{deck.notes}</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-[16px] bg-[#07111F]/52 p-3">
                  <p className="text-xs text-[#94A3B8]/70">Matches</p>
                  <p className="text-2xl font-bold text-[#F8FAFC]">
                    {getDeckMatchCount(deck.id)}
                  </p>
                </div>
                <div className="rounded-[16px] bg-[#07111F]/52 p-3">
                  <p className="text-xs text-[#94A3B8]/70">Win rate</p>
                  <p className="text-2xl font-bold text-[#F8FAFC]">
                    {getWinRate(matches)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[16px] bg-[#07111F]/44 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                  Active version
                </p>
                <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                  {activeVersion?.name ?? "No version yet"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                  {activeVersion?.notes ?? "Add a version to start testing."}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href={`/demo/decks/${deck.id}`} className={`${secondaryButton} h-11 sm:flex-1`}>
                  Open deck
                </Link>
                {deck.isCurrentTest ? (
                  <Link href="/demo/matches/new" className={`${primaryButton} h-11 sm:flex-1`}>
                    Log game
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`${secondaryButton} h-11 sm:flex-1`}
                  >
                    Demo set active
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
      <DemoConversionCta />
    </DemoShell>
  );
}
