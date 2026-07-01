import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  appFrame,
  appMain,
  appShell,
  cardLarge,
  glassPanel,
  premiumInset,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  subtlePill,
} from "@/components/brand-styles";
import {
  buildEventReviewSummary,
  getEventRecord,
  parseEventTags,
} from "@/lib/events";
import {
  getMatchResultLabel,
  isMatchResult,
  type MatchResult,
} from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type EventDetailPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type EventRoundRow = {
  id: string;
  round_number: number | null;
  opponent_deck_name: string | null;
  result: string | null;
  match_score: string | null;
  went_first: boolean | null;
  tags: unknown;
  notes: string | null;
  match_id: string | null;
};

type EventRoundView = {
  id: string;
  round_number: number;
  opponent_deck_name: string | null;
  result: MatchResult | null;
  match_score: string | null;
  went_first: boolean | null;
  tags: unknown;
  notes: string | null;
  match_id: string | null;
};

type EventRow = {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  format: string;
  placement: string | null;
  notes: string | null;
  decks:
    | { name: string; archetype: string | null }
    | { name: string; archetype: string | null }[]
    | null;
  deck_versions: { name: string } | { name: string }[] | null;
  event_rounds: EventRoundRow[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

function normalizeEventRound(
  round: EventRoundRow,
  index: number
): EventRoundView {
  return {
    ...round,
    round_number: round.round_number ?? index + 1,
    result: isMatchResult(round.result) ? round.result : null,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getResultBadgeClass(result: MatchResult | null) {
  if (result === "win") {
    return "bg-emerald-500/15 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]";
  }

  if (result === "loss") {
    return "bg-[#F43F5E]/15 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]";
  }

  return "bg-[#4F8CFF]/13 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16)]";
}

function getRoundResultLabel(result: MatchResult | null) {
  return result ? getMatchResultLabel(result) : "Unknown";
}

function turnOrderLabel(value: boolean | null) {
  if (value === null) return "Unknown";
  return value ? "Went first" : "Went second";
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, name, event_date, event_type, format, placement, notes, decks(name, archetype), deck_versions(name), event_rounds(id, round_number, opponent_deck_name, result, match_score, went_first, tags, notes, match_id)"
    )
    .eq("user_id", user.id)
    .eq("id", eventId)
    .single();

  if (error || !data) {
    notFound();
  }

  const event = data as unknown as EventRow;
  const deck = one(event.decks);
  const version = one(event.deck_versions);
  const rounds = [...(event.event_rounds ?? [])]
    .map(normalizeEventRound)
    .sort((first, second) => first.round_number - second.round_number);
  const summaryRounds = rounds
    .filter(
      (round): round is EventRoundView & { result: MatchResult } =>
        round.result !== null
    )
    .map((round) => ({
      opponent_deck_name: round.opponent_deck_name,
      result: round.result,
      went_first: round.went_first,
      tags: parseEventTags(round.tags),
    }));
  const review = buildEventReviewSummary({
    deckName: deck?.name,
    rounds: summaryRounds,
  });
  const record = getEventRecord(summaryRounds);

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="events"
          deckLabel={deck?.name}
          insight={{
            label: "Event record",
            value: record,
            helper: `${rounds.length} rounds linked`,
          }}
        />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="events"
            title={event.name}
            eyebrow="Event review"
            subtitle="Review the event, inspect round patterns, and decide what to test next."
            userEmail={user.email ?? "Unknown email"}
            actions={
              <Link href="/events/new" className={primaryButton}>
                Log another event
              </Link>
            }
          />

          <section className={`${glassPanel} overflow-hidden p-4 sm:p-6`}>
            <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
              <ArchetypeSprites archetype={deck?.archetype ?? deck?.name ?? null} />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className={subtlePill}>{event.event_type}</span>
                  <span className={subtlePill}>{event.format}</span>
                  <span className={subtlePill}>{formatDate(event.event_date)}</span>
                  {event.placement ? (
                    <span className="rounded-full bg-[#F5C84C]/14 px-2.5 py-1 text-xs font-semibold text-[#FFE28A]">
                      {event.placement}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 truncate text-2xl font-semibold text-[#F8FAFC]">
                  {deck?.name ?? "No deck"} {version ? `- ${version.name}` : ""}
                </h2>
                {event.notes ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#94A3B8]">
                    {event.notes}
                  </p>
                ) : null}
              </div>
              <div className={`${premiumInset} px-4 py-3 text-center`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Final record
                </p>
                <p className="mt-1 text-3xl font-semibold text-[#F8FAFC]">
                  {record}
                </p>
              </div>
            </div>
          </section>

          <section className={`${cardLarge} overflow-hidden`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={sectionTitle}>Event Review</h2>
                <p className={sectionCopy}>
                  SixPrizer reads this event through matchups, tags, and linked match history.
                </p>
              </div>
              <Link href="/review" className={secondaryButton}>
                Open Review
              </Link>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-4">
              <div className={`${premiumInset} px-3 py-3`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Best matchup
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-[#F8FAFC]">
                  {review.bestMatchup ?? "No repeat win yet"}
                </p>
              </div>
              <div className={`${premiumInset} px-3 py-3`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Problem matchup
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-[#F8FAFC]">
                  {review.problemMatchup ?? "No clear leak"}
                </p>
              </div>
              <div className={`${premiumInset} px-3 py-3`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Common tags
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-[#F8FAFC]">
                  {review.commonTags.map((item) => item.tag).join(", ") || "None yet"}
                </p>
              </div>
              <div className={`${premiumInset} px-3 py-3`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Version record
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-[#F8FAFC]">
                  {version?.name ?? "Version"}: {review.record}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-[18px] bg-[linear-gradient(135deg,rgba(245,200,76,0.16),rgba(79,140,255,0.10))] p-4 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#FFE28A]">
                Suggested next test
              </p>
              <p className="mt-2 text-base font-semibold leading-6 text-[#F8FAFC]">
                {review.suggestedNextTest}
              </p>
            </div>
          </section>

          <section className={`${cardLarge} overflow-hidden`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className={sectionTitle}>Rounds</h2>
                <p className={sectionCopy}>
                  Every round below also appears in Match history.
                </p>
              </div>
              <Link href="/matches" className={secondaryButton}>
                Match history
              </Link>
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-[18px] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#07111F]/80 text-xs uppercase tracking-[0.14em] text-[#94A3B8]">
                  <tr>
                    <th className="px-4 py-3">Round</th>
                    <th className="px-4 py-3">Opponent deck</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">First/second</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {rounds.map((round) => {
                    const tags = parseEventTags(round.tags);
                    return (
                      <tr key={round.id} className="bg-[#0B1020]/45">
                        <td className="px-4 py-3 font-semibold text-[#F8FAFC]">
                          R{round.round_number}
                        </td>
                        <td className="px-4 py-3 text-[#F8FAFC]">
                          {round.opponent_deck_name ?? "Unknown matchup"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getResultBadgeClass(round.result)}`}>
                            {getRoundResultLabel(round.result)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8]">
                          {round.match_score ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8]">
                          {turnOrderLabel(round.went_first)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {tags.length
                              ? tags.map((tag) => (
                                  <span key={tag} className={subtlePill}>
                                    {tag}
                                  </span>
                                ))
                              : <span className="text-[#94A3B8]">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8]">
                          {round.notes ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 lg:hidden">
              {rounds.map((round) => {
                const tags = parseEventTags(round.tags);
                return (
                  <article
                    key={round.id}
                    className="rounded-[18px] bg-[#07111F]/58 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={subtlePill}>Round {round.round_number}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${getResultBadgeClass(round.result)}`}>
                        {getRoundResultLabel(round.result)}
                      </span>
                      <span className={subtlePill}>{turnOrderLabel(round.went_first)}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[#F8FAFC]">
                      {round.opponent_deck_name ?? "Unknown matchup"}
                    </h3>
                    <p className="mt-1 text-sm text-[#94A3B8]">
                      Score: {round.match_score ?? "Not logged"}
                    </p>
                    {tags.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span key={tag} className={subtlePill}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {round.notes ? (
                      <p className="mt-3 text-sm leading-6 text-[#94A3B8]">
                        {round.notes}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
