"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMatchWithTags } from "@/lib/match-write";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_TYPE_OPTIONS,
  isEventFormat,
  isEventType,
  normalizeEventMatchType,
} from "@/lib/events";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isMatchResult, type MatchMetadata, type MatchResult } from "@/lib/match-types";

export type CreateEventState = {
  error: string | null;
};

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function getTags(formData: FormData, name: string) {
  return Array.from(
    new Set(
      formData
        .getAll(name)
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  );
}

function parseWentFirst(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function buildRoundMetadata({
  eventId,
  eventName,
  eventType,
  roundId,
  roundNumber,
  result,
  matchScore,
  tags,
}: {
  eventId: string;
  eventName: string;
  eventType: string;
  roundId: string;
  roundNumber: number;
  result: MatchResult;
  matchScore: string | null;
  tags: string[];
}) {
  const metadata: MatchMetadata & Record<string, unknown> = {
    game_context:
      eventType === "Testing block" || eventType === "TCG Live ladder session"
        ? "testing"
        : "competitive",
    event_name: eventName,
    round_number: String(roundNumber),
    source: "event_round",
    event_id: eventId,
    event_round_id: roundId,
  };

  if (matchScore) {
    metadata.match_score = matchScore;
  }

  if (tags.length) {
    if (result === "win") {
      metadata.positive_tags = tags;
    } else {
      metadata.issue_tags = tags;
    }
  }

  return metadata;
}

export async function createEvent(
  _state: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let savedEventId: string | null = null;

  try {
    const name = optionalText(formData.get("name"));
    const eventDate = optionalText(formData.get("event_date"));
    const eventType = optionalText(formData.get("event_type"));
    const format = optionalText(formData.get("format"));
    const deckId = optionalText(formData.get("deck_id"));
    const deckVersionId = optionalText(formData.get("deck_version_id"));
    const placement = optionalText(formData.get("placement"));
    const notes = optionalText(formData.get("notes"));
    const roundCount = Number.parseInt(String(formData.get("round_count") ?? "0"), 10);

    if (!name) throw new Error("Event name is required.");
    if (!eventDate) throw new Error("Event date is required.");
    if (!eventType || !isEventType(eventType)) {
      throw new Error(`Event type must be one of ${EVENT_TYPE_OPTIONS.join(", ")}.`);
    }
    if (!format || !isEventFormat(format)) {
      throw new Error(`Format must be one of ${EVENT_FORMAT_OPTIONS.join(", ")}.`);
    }
    if (!deckId || !deckVersionId) {
      throw new Error("Choose the deck and version used for this event.");
    }
    if (!Number.isFinite(roundCount) || roundCount < 1) {
      throw new Error("Add at least one round.");
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        name,
        event_date: eventDate,
        event_type: eventType,
        format,
        deck_id: deckId,
        deck_version_id: deckVersionId,
        placement,
        notes,
      })
      .select("id")
      .single();

    if (eventError || !event) {
      throw new Error(eventError?.message ?? "Could not create event.");
    }

    savedEventId = event.id;

    for (let index = 0; index < roundCount; index += 1) {
      const roundNumber =
        Number.parseInt(String(formData.get(`round_${index}_number`) ?? index + 1), 10) ||
        index + 1;
      const opponentDeckName = optionalText(formData.get(`round_${index}_opponent`));
      const result = optionalText(formData.get(`round_${index}_result`));
      const matchScore = optionalText(formData.get(`round_${index}_score`));
      const wentFirst = parseWentFirst(
        optionalText(formData.get(`round_${index}_went_first`))
      );
      const roundNotes = optionalText(formData.get(`round_${index}_notes`));
      const tags = getTags(formData, `round_${index}_tags`);

      if (!opponentDeckName) {
        throw new Error(`Round ${roundNumber}: opponent deck is required.`);
      }

      if (!result || !isMatchResult(result)) {
        throw new Error(`Round ${roundNumber}: result is required.`);
      }

      const { data: round, error: roundError } = await supabase
        .from("event_rounds")
        .insert({
          event_id: event.id,
          user_id: user.id,
          round_number: roundNumber,
          opponent_deck_name: opponentDeckName,
          result,
          match_score: matchScore,
          went_first: wentFirst,
          tags,
          notes: roundNotes,
        })
        .select("id")
        .single();

      if (roundError || !round) {
        throw new Error(roundError?.message ?? `Could not save round ${roundNumber}.`);
      }

      const metadata = buildRoundMetadata({
        eventId: event.id,
        eventName: name,
        eventType,
        roundId: round.id,
        roundNumber,
        result,
        matchScore,
        tags,
      });
      const match = await createMatchWithTags(supabase, {
        userId: user.id,
        deckVersionId,
        opponentArchetype: opponentDeckName,
        result,
        wentFirst,
        eventType: normalizeEventMatchType(eventType),
        notes: roundNotes,
        metadata,
        playedAt: `${eventDate}T12:00:00.000Z`,
      });

      const { error: linkError } = await supabase
        .from("event_rounds")
        .update({ match_id: match.id })
        .eq("id", round.id);

      if (linkError) {
        throw new Error(linkError.message);
      }
    }

    revalidatePath("/events");
    revalidatePath("/matches");
    revalidatePath("/dashboard");
    revalidatePath("/review");
    revalidatePath("/matchups");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save event.",
    };
  }

  redirect(`/events/${savedEventId}`);
}
