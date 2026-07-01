import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  appFrame,
  appMain,
  appShell,
  cardLarge,
  emptyCard,
  interactiveTile,
  premiumInset,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  subtlePill,
} from "@/components/brand-styles";
import {
  buildEventReviewSummary,
  getMatchStructureLabel,
  getEventRecord,
  parseEventTags,
} from "@/lib/events";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { MatchResult } from "@/lib/match-types";

type EventRoundRow = {
  opponent_deck_name: string | null;
  result: MatchResult;
  tags: unknown;
};

type EventRow = {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  match_structure: string | null;
  placement: string | null;
  decks:
    | { name: string; archetype: string | null }
    | { name: string; archetype: string | null }[]
    | null;
  deck_versions: { name: string } | { name: string }[] | null;
  event_rounds: EventRoundRow[] | null;
};

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value ?? null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function topIssueTag(rounds: EventRoundRow[]) {
  const counts = new Map<string, number>();

  rounds
    .filter((round) => round.result !== "win")
    .flatMap((round) => parseEventTags(round.tags))
    .forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));

  return Array.from(counts.entries()).sort(
    (first, second) => second[1] - first[1] || first[0].localeCompare(second[0])
  )[0]?.[0] ?? null;
}

export default async function EventsPage() {
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
      "id, name, event_date, event_type, match_structure, placement, decks(name, archetype), deck_versions(name), event_rounds(opponent_deck_name, result, tags)"
    )
    .eq("user_id", user.id)
    .order("event_date", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  const events = (data ?? []) as unknown as EventRow[];
  const totalRounds = events.reduce(
    (sum, event) => sum + (event.event_rounds?.length ?? 0),
    0
  );
  const recentEvent = events[0];

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar
          current="events"
          insight={{
            label: "Events",
            value: `${events.length} logged`,
            helper: totalRounds ? `${totalRounds} rounds linked to matches` : "Rounds feed analytics",
          }}
        />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="events"
            title="Events"
            eyebrow="Testing archive"
            subtitle="Log locals, league cups, ladder sessions, and testing blocks as match-linked event reviews."
            userEmail={user.email ?? "Unknown email"}
            actions={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/events/new" className={primaryButton}>
                  New event
                </Link>
                <Link
                  href="/events/new?eventType=Testing%20block"
                  className={secondaryButton}
                >
                  New testing block
                </Link>
              </div>
            }
          />

          <section className={`${cardLarge} overflow-hidden`}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className={`${premiumInset} px-3 py-3`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Events
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#F8FAFC]">
                  {events.length}
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Recent event logs
                </p>
              </div>
              <div className={`${premiumInset} px-3 py-3`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Rounds
                </p>
                <p className="mt-1 text-2xl font-semibold text-[#F8FAFC]">
                  {totalRounds}
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Feeding Match history
                </p>
              </div>
              <div className={`${premiumInset} px-3 py-3`}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
                  Latest
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-[#F8FAFC]">
                  {recentEvent ? recentEvent.name : "None yet"}
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  {recentEvent ? formatDate(recentEvent.event_date) : "Create your first event"}
                </p>
              </div>
            </div>
          </section>

          {events.length ? (
            <section className={`${cardLarge} overflow-hidden`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className={sectionTitle}>Recent events</h2>
                  <p className={sectionCopy}>
                    Each event round is linked to normal match analytics.
                  </p>
                </div>
                <Link href="/events/new" className={secondaryButton}>
                  Add another event
                </Link>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {events.map((event) => {
                  const deck = one(event.decks);
                  const version = one(event.deck_versions);
                  const rounds = event.event_rounds ?? [];
                  const issueTag = topIssueTag(rounds);
                  const summaryRounds = rounds.map((round) => ({
                    opponent_deck_name: round.opponent_deck_name,
                    result: round.result,
                    tags: parseEventTags(round.tags),
                  }));
                  const record = getEventRecord(summaryRounds);
                  const review = buildEventReviewSummary({
                    deckName: deck?.name,
                    rounds: summaryRounds,
                  });

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className={`${interactiveTile} block rounded-[22px] p-4 sm:p-5`}
                    >
                      <div className="flex min-w-0 gap-3">
                        <ArchetypeSprites archetype={deck?.archetype ?? deck?.name ?? null} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={subtlePill}>{event.event_type}</span>
                            <span className={subtlePill}>
                              {getMatchStructureLabel(event.match_structure)}
                            </span>
                            <span className={subtlePill}>{formatDate(event.event_date)}</span>
                            {event.placement ? (
                              <span className="rounded-full bg-[#F5C84C]/14 px-2.5 py-1 text-xs font-semibold text-[#FFE28A]">
                                {event.placement}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 truncate text-xl font-semibold text-[#F8FAFC]">
                            {event.name}
                          </h3>
                          <p className="mt-1 truncate text-sm text-[#94A3B8]">
                            {deck?.name ?? "No deck"} {version ? `- ${version.name}` : ""}
                          </p>
                          <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            <div className={premiumInset + " px-3 py-2"}>
                              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#94A3B8]">
                                Record
                              </p>
                              <p className="mt-1 font-semibold text-[#F8FAFC]">{record}</p>
                            </div>
                            <div className={premiumInset + " px-3 py-2"}>
                              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#94A3B8]">
                                Rounds
                              </p>
                              <p className="mt-1 font-semibold text-[#F8FAFC]">
                                {rounds.length}
                              </p>
                            </div>
                            <div className={premiumInset + " px-3 py-2"}>
                              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#94A3B8]">
                                Top issue
                              </p>
                              <p className="mt-1 truncate font-semibold text-[#F8FAFC]">
                                {issueTag ?? review.problemMatchup ?? "No issue yet"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 rounded-2xl bg-[#07111F]/50 px-3 py-2">
                            <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[#94A3B8]">
                              Suggested next test
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-[#D7E0EF]">
                              {review.suggestedNextTest}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className={`${emptyCard} overflow-hidden`}>
              <div className="mb-5 h-1.5 w-28 rounded-full bg-[linear-gradient(90deg,#F5C84C,#4F8CFF)]" />
              <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                No events logged yet.
              </h2>
              <p className={`mt-3 max-w-xl ${sectionCopy}`}>
                Add a local, league cup, online tournament, TCG Live ladder session,
                or testing block. Rounds will appear in Match history and feed your
                matchup reads.
              </p>
              <Link href="/events/new" className={`mt-6 ${primaryButton}`}>
                Create your first event
              </Link>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
