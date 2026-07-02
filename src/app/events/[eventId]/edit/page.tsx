import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import {
  EventForm,
  type EventFormInitialValue,
} from "@/components/events/EventForm";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  primaryButton,
  sectionCopy,
} from "@/components/brand-styles";
import {
  getDefaultMatchStructure,
  isEventFormat,
  isEventMatchStructure,
  isEventType,
  parseEventTags,
  type EventMatchStructure,
} from "@/lib/events";
import { isMatchResult } from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { updateEvent } from "../../actions";

type EditEventPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

type DeckRow = {
  id: string;
  name: string;
  archetype: string | null;
  deck_versions: {
    id: string;
    name: string;
    is_active: boolean;
  }[] | null;
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
};

type EventRow = {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  format: string;
  match_structure: string | null;
  deck_id: string | null;
  deck_version_id: string | null;
  placement: string | null;
  notes: string | null;
  event_rounds: EventRoundRow[] | null;
};

function getInitialMatchStructure(event: EventRow): EventMatchStructure {
  if (event.match_structure && isEventMatchStructure(event.match_structure)) {
    return event.match_structure;
  }

  return getDefaultMatchStructure(
    isEventType(event.event_type) ? event.event_type : "Local"
  );
}

function getWentFirstValue(value: boolean | null) {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

function buildInitialEvent(event: EventRow): EventFormInitialValue {
  return {
    name: event.name,
    eventDate: event.event_date,
    eventType: isEventType(event.event_type) ? event.event_type : "Local",
    format: isEventFormat(event.format) ? event.format : "Standard",
    matchStructure: getInitialMatchStructure(event),
    deckId: event.deck_id ?? "",
    deckVersionId: event.deck_version_id ?? "",
    placement: event.placement,
    notes: event.notes,
    rounds: [...(event.event_rounds ?? [])]
      .sort(
        (first, second) =>
          (first.round_number ?? 0) - (second.round_number ?? 0)
      )
      .filter((round) => isMatchResult(round.result))
      .map((round, index) => ({
        id: round.id,
        roundNumber: round.round_number ?? index + 1,
        opponent: round.opponent_deck_name ?? "",
        result: round.result as "win" | "loss" | "tie",
        score: round.match_score,
        wentFirst: getWentFirstValue(round.went_first),
        tags: parseEventTags(round.tags),
        notes: round.notes,
      })),
  };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { eventId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: eventData, error: eventError }, { data: deckData, error: deckError }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, name, event_date, event_type, format, match_structure, deck_id, deck_version_id, placement, notes, event_rounds(id, round_number, opponent_deck_name, result, match_score, went_first, tags, notes)"
        )
        .eq("id", eventId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("decks")
        .select("id, name, archetype, deck_versions(id, name, is_active)")
        .eq("user_id", user.id)
        .order("name", { ascending: true })
        .order("is_active", {
          referencedTable: "deck_versions",
          ascending: false,
        }),
    ]);

  if (eventError || !eventData) {
    notFound();
  }

  if (deckError) {
    throw new Error(deckError.message);
  }

  const event = eventData as unknown as EventRow;
  const decks = ((deckData ?? []) as DeckRow[])
    .map((deck) => ({
      id: deck.id,
      name: deck.name,
      archetype: deck.archetype,
      versions: (deck.deck_versions ?? []).map((version) => ({
        id: version.id,
        name: version.name,
        isActive: version.is_active,
      })),
    }))
    .filter((deck) => deck.versions.length > 0);

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="events" />
        <div className={`${appMain} mx-auto w-full max-w-6xl`}>
          <AuthenticatedPageHeader
            current="events"
            title="Edit event"
            eyebrow="Event corrections"
            subtitle="Update the event run and keep linked Match history entries in sync."
            userEmail={user.email ?? "Unknown email"}
            actions={
              <Link href={`/events/${event.id}`} className={primaryButton}>
                Back to event
              </Link>
            }
          />

          {decks.length ? (
            <EventForm
              action={updateEvent.bind(null, event.id)}
              decks={decks}
              initialEvent={buildInitialEvent(event)}
              mode="edit"
              submitLabel="Save changes"
            />
          ) : (
            <section className={`${emptyCard} overflow-hidden`}>
              <div className="mb-5 h-1.5 w-28 rounded-full bg-[linear-gradient(90deg,#F5C84C,#4F8CFF)]" />
              <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                Add a deck version first.
              </h2>
              <p className={`mt-3 max-w-xl ${sectionCopy}`}>
                Event edits need a deck version so linked Match history entries
                stay scoped correctly.
              </p>
              <Link href="/decks" className={`mt-6 ${primaryButton}`}>
                Go to decks
              </Link>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
