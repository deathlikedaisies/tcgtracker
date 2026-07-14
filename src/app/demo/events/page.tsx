import Link from "next/link";
import { CalendarDays, ClipboardList, Target, Trophy } from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoConversionCta } from "@/components/demo/DemoConversionCta";
import { DemoShell } from "@/components/demo/DemoShell";
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
  demoEvents,
  formatDemoDate,
  getDemoActiveVersion,
  getDemoDeck,
} from "@/lib/demo-data";
import {
  buildEventReviewSummary,
  getMatchStructureLabel,
} from "@/lib/events";
import { getMatchResultLabel } from "@/lib/match-types";

export default function DemoEventsPage() {
  const event = demoEvents[0];
  const deck = getDemoDeck(event.deckId);
  const activeVersion = getDemoActiveVersion(deck);
  const review = buildEventReviewSummary({
    deckName: deck?.name ?? null,
    rounds: event.rounds.map((round) => ({
      opponent_deck_name: round.opponentDeck,
      result: round.result,
      went_first: round.wentFirst,
      tags: round.tags,
    })),
  });

  return (
    <DemoShell current="events">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Event review demo</p>
          <h1 className={pageTitle}>Sample event run</h1>
          <p className={pageCopy}>
            See how a local run becomes linked match history, matchup patterns,
            event review, and a next focused test.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log demo round
        </Link>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className={cardLarge}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`${premiumInsetStrong} shrink-0 p-2.5`}>
                <ArchetypeSprites archetype={deck?.archetype ?? event.name} size="md" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                  {event.eventType} - {getMatchStructureLabel(event.matchStructure)}
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F8FAFC]">
                  {event.name}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#94A3B8]/78">
                  {deck?.name ?? "Demo deck"} - {activeVersion?.name ?? "Active version"}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-[#22C55E]/12 px-2.5 py-1 text-xs font-semibold text-emerald-200">
              {review.record}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Final record", value: review.record, icon: Trophy },
              { label: "Rounds", value: String(event.rounds.length), icon: ClipboardList },
              { label: "Date", value: formatDemoDate(event.eventDate), icon: CalendarDays },
              { label: "Placement", value: event.placement, icon: Trophy },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={`${premiumInset} p-3`}>
                <Icon className="size-4 text-[#F5C84C]" aria-hidden="true" />
                <p className="mt-2 text-xs text-[#94A3B8]/72">{label as string}</p>
                <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-[#94A3B8]/78">{event.notes}</p>
        </article>

        <article className={cardLarge}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
            Event Review
          </p>
          <h2 className={sectionTitle}>What this run says</h2>
          <div className="mt-4 grid gap-3">
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Problem matchup</p>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <ArchetypeSprites archetype={review.problemMatchup ?? "Unknown"} />
                <p className="min-w-0 text-sm font-semibold text-[#F8FAFC]">
                  {review.problemMatchupLabel ?? "No problem matchup yet"}
                </p>
              </div>
            </div>
            <div className={`${premiumInset} p-3`}>
              <p className="text-xs text-[#94A3B8]/72">Common tags</p>
              <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                {review.commonTagsLabel}
              </p>
            </div>
            <div className={`${premiumInsetStrong} p-3`}>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                Suggested next test
              </p>
              <p className="mt-2 text-sm leading-6 text-[#F8FAFC]/90">
                {review.suggestedNextTest}
              </p>
              <Link href="/demo/testing" className={`${secondaryButton} mt-3 h-10`}>
                Open demo testing block
              </Link>
            </div>
          </div>
        </article>
      </section>

      <section className={cardLarge}>
        <div className="flex items-center gap-3">
          <Target className="size-5 text-[#F5C84C]" aria-hidden="true" />
          <div>
            <h2 className={sectionTitle}>Round-by-round sample</h2>
            <p className={sectionCopy}>
              Every demo round is shaped like a normal match log, so it can feed
              matchup reads and review prompts.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {event.rounds.map((round) => (
            <article
              key={round.id}
              className={`${premiumInset} grid gap-3 p-3 lg:grid-cols-[84px_minmax(0,1fr)_110px_110px_minmax(0,1fr)] lg:items-center`}
            >
              <p className="text-sm font-bold text-[#F5C84C]">R{round.roundNumber}</p>
              <div className="flex min-w-0 items-center gap-2">
                <ArchetypeSprites archetype={round.opponentDeck} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                    {round.opponentDeck}
                  </p>
                  <p className="text-xs text-[#94A3B8]/70">
                    {round.wentFirst === null
                      ? "Turn order unknown"
                      : round.wentFirst
                        ? "Went first"
                        : "Went second"}
                  </p>
                </div>
              </div>
              <p
                className={`text-sm font-bold ${
                  round.result === "win"
                    ? "text-[#22C55E]"
                    : round.result === "loss"
                      ? "text-[#F43F5E]"
                      : "text-[#F5C84C]"
                }`}
              >
                {getMatchResultLabel(round.result)}
              </p>
              <p className="text-sm font-semibold text-[#F8FAFC]">{round.matchScore}</p>
              <div className="min-w-0">
                <p className="text-xs leading-5 text-[#94A3B8]/76">{round.notes}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {round.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#0B1020]/62 px-2 py-0.5 text-[11px] text-[#94A3B8]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DemoConversionCta />
    </DemoShell>
  );
}
