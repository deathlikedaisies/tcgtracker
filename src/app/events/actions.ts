"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createMatchWithTags } from "@/lib/match-write";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_TYPE_OPTIONS,
  getDefaultMatchStructure,
  isEventFormat,
  isEventMatchStructure,
  isEventType,
  normalizeEventMatchType,
  type EventType,
} from "@/lib/events";
import { flattenStructuredMatchTags } from "@/lib/match-options";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isMatchResult, type MatchMetadata, type MatchResult } from "@/lib/match-types";

export type CreateEventState = {
  error: string | null;
};

type ParsedEventRound = {
  id: string | null;
  roundNumber: number;
  opponentDeckName: string | null;
  result: MatchResult | null;
  matchScore: string | null;
  wentFirst: boolean | null;
  roundNotes: string | null;
  tags: string[];
  hasData: boolean;
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

function parseRoundDraft(
  formData: FormData,
  index: number,
  matchStructure: string
): ParsedEventRound {
  const roundNumber =
    Number.parseInt(String(formData.get(`round_${index}_number`) ?? index + 1), 10) ||
    index + 1;
  const id = optionalText(formData.get(`round_${index}_id`));
  const opponentDeckName = optionalText(formData.get(`round_${index}_opponent`));
  const resultText = optionalText(formData.get(`round_${index}_result`));
  const matchScore = optionalText(formData.get(`round_${index}_score`));
  const wentFirst = parseWentFirst(
    optionalText(formData.get(`round_${index}_went_first`))
  );
  const roundNotes = optionalText(formData.get(`round_${index}_notes`));
  const tags = getTags(formData, `round_${index}_tags`);

  if (resultText && !isMatchResult(resultText)) {
    throw new Error(`Round ${roundNumber}: result is required.`);
  }

  const scoreChanged =
    matchStructure === "bo3" && Boolean(matchScore && matchScore !== "2-0");
  const hasData = Boolean(
    opponentDeckName ||
      resultText ||
      wentFirst !== null ||
      roundNotes ||
      tags.length ||
      scoreChanged
  );

  return {
    id,
    roundNumber,
    opponentDeckName,
    result: resultText && isMatchResult(resultText) ? resultText : null,
    matchScore,
    wentFirst,
    roundNotes,
    tags,
    hasData,
  };
}

function validateCompletedRounds(
  rounds: ParsedEventRound[],
  matchStructure: string
) {
  const completedRounds: (ParsedEventRound & {
    opponentDeckName: string;
    result: MatchResult;
  })[] = [];

  for (const round of rounds) {
    if (!round.hasData) continue;

    if (!round.opponentDeckName) {
      throw new Error(`Round ${round.roundNumber}: opponent deck is required.`);
    }

    if (!round.result) {
      throw new Error(`Round ${round.roundNumber}: result is required.`);
    }

    if (matchStructure === "bo3" && !round.matchScore) {
      throw new Error(`Round ${round.roundNumber}: match score is required.`);
    }

    completedRounds.push({
      ...round,
      opponentDeckName: round.opponentDeckName,
      result: round.result,
    });
  }

  if (completedRounds.length === 0) {
    throw new Error("Complete at least one event round before saving.");
  }

  return completedRounds;
}

function revalidateEventViews(eventId?: string | null) {
  revalidatePath("/events");
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/edit`);
  }
  revalidatePath("/matches");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath("/matchups");
}

async function verifyDeckVersionOwner(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  deckVersionId: string
) {
  const { data, error } = await supabase
    .from("deck_versions")
    .select("id, deck_id, decks!inner(user_id)")
    .eq("id", deckVersionId)
    .eq("decks.user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Deck version not found.");
  }
}

function getEventPayload(formData: FormData) {
  const name = optionalText(formData.get("name"));
  const eventDate = optionalText(formData.get("event_date"));
  const eventType = optionalText(formData.get("event_type"));
  const format = optionalText(formData.get("format"));
  const matchStructureInput = optionalText(formData.get("match_structure"));
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
  const matchStructure =
    matchStructureInput && isEventMatchStructure(matchStructureInput)
      ? matchStructureInput
      : getDefaultMatchStructure(eventType);
  if (!deckId || !deckVersionId) {
    throw new Error("Choose the deck and version used for this event.");
  }
  if (!Number.isFinite(roundCount) || roundCount < 1) {
    throw new Error("Add at least one round.");
  }

  const parsedRounds = Array.from({ length: roundCount }, (_, index) =>
    parseRoundDraft(formData, index, matchStructure)
  );
  const completedRounds = validateCompletedRounds(parsedRounds, matchStructure);

  return {
    name,
    eventDate,
    eventType,
    format,
    matchStructure,
    deckId,
    deckVersionId,
    placement,
    notes,
    completedRounds,
  };
}

async function replaceMatchTags(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  matchId: string,
  tags: string[]
) {
  const { error: deleteTagsError } = await supabase
    .from("match_tags")
    .delete()
    .eq("match_id", matchId);

  if (deleteTagsError) {
    throw new Error(deleteTagsError.message);
  }

  if (!tags.length) return;

  const { error: insertTagsError } = await supabase
    .from("match_tags")
    .insert(tags.map((tag) => ({ match_id: matchId, tag })));

  if (insertTagsError) {
    throw new Error(insertTagsError.message);
  }
}

async function updateLinkedMatch({
  supabase,
  matchId,
  userId,
  deckVersionId,
  opponentDeckName,
  result,
  wentFirst,
  eventType,
  eventDate,
  roundNotes,
  metadata,
}: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  matchId: string;
  userId: string;
  deckVersionId: string;
  opponentDeckName: string;
  result: MatchResult;
  wentFirst: boolean | null;
  eventType: EventType;
  eventDate: string;
  roundNotes: string | null;
  metadata: MatchMetadata & Record<string, unknown>;
}) {
  const { error: matchError } = await supabase
    .from("matches")
    .update({
      deck_version_id: deckVersionId,
      opponent_archetype: opponentDeckName,
      opponent_variant: null,
      result,
      went_first: wentFirst,
      event_type: normalizeEventMatchType(eventType),
      notes: roundNotes,
      metadata,
      played_at: `${eventDate}T12:00:00.000Z`,
    })
    .eq("id", matchId)
    .eq("user_id", userId);

  if (matchError) {
    throw new Error(matchError.message);
  }

  const tags = flattenStructuredMatchTags({
    issueTags: metadata.issue_tags ?? [],
    positiveTags: metadata.positive_tags ?? [],
  });
  await replaceMatchTags(supabase, matchId, tags);
}

function buildRoundMetadata({
  eventId,
  eventName,
  eventType,
  matchStructure,
  roundId,
  roundNumber,
  result,
  matchScore,
  tags,
}: {
  eventId: string;
  eventName: string;
  eventType: string;
  matchStructure: string;
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
    match_structure: matchStructure,
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
    const payload = getEventPayload(formData);

    await verifyDeckVersionOwner(supabase, user.id, payload.deckVersionId);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        name: payload.name,
        event_date: payload.eventDate,
        event_type: payload.eventType,
        format: payload.format,
        match_structure: payload.matchStructure,
        deck_id: payload.deckId,
        deck_version_id: payload.deckVersionId,
        placement: payload.placement,
        notes: payload.notes,
      })
      .select("id")
      .single();

    if (eventError || !event) {
      throw new Error(eventError?.message ?? "Could not create event.");
    }

    savedEventId = event.id;

    for (const completedRound of payload.completedRounds) {
      const { data: round, error: roundError } = await supabase
        .from("event_rounds")
        .insert({
          event_id: event.id,
          user_id: user.id,
          round_number: completedRound.roundNumber,
          opponent_deck_name: completedRound.opponentDeckName,
          result: completedRound.result,
          match_score: completedRound.matchScore,
          went_first: completedRound.wentFirst,
          tags: completedRound.tags,
          notes: completedRound.roundNotes,
        })
        .select("id")
        .single();

      if (roundError || !round) {
        throw new Error(
          roundError?.message ?? `Could not save round ${completedRound.roundNumber}.`
        );
      }

      const metadata = buildRoundMetadata({
        eventId: event.id,
        eventName: payload.name,
        eventType: payload.eventType,
        matchStructure: payload.matchStructure,
        roundId: round.id,
        roundNumber: completedRound.roundNumber,
        result: completedRound.result,
        matchScore: completedRound.matchScore,
        tags: completedRound.tags,
      });
      const match = await createMatchWithTags(supabase, {
        userId: user.id,
        deckVersionId: payload.deckVersionId,
        opponentArchetype: completedRound.opponentDeckName,
        result: completedRound.result,
        wentFirst: completedRound.wentFirst,
        eventType: normalizeEventMatchType(payload.eventType),
        notes: completedRound.roundNotes,
        metadata,
        playedAt: `${payload.eventDate}T12:00:00.000Z`,
      });

      const { error: linkError } = await supabase
        .from("event_rounds")
        .update({ match_id: match.id })
        .eq("id", round.id);

      if (linkError) {
        throw new Error(linkError.message);
      }
    }

    revalidateEventViews(event.id);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not save event.",
    };
  }

  redirect(`/events/${savedEventId}`);
}

export async function updateEvent(
  eventId: string,
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

  try {
    const payload = getEventPayload(formData);

    await verifyDeckVersionOwner(supabase, user.id, payload.deckVersionId);

    const { data: existingEvent, error: eventLookupError } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("user_id", user.id)
      .single();

    if (eventLookupError || !existingEvent) {
      throw new Error("Event not found.");
    }

    const { data: existingRounds, error: roundsLookupError } = await supabase
      .from("event_rounds")
      .select("id, match_id")
      .eq("event_id", eventId)
      .eq("user_id", user.id);

    if (roundsLookupError) {
      throw new Error(roundsLookupError.message);
    }

    const existingRoundsById = new Map(
      (existingRounds ?? []).map((round) => [
        round.id,
        { id: round.id, matchId: round.match_id as string | null },
      ])
    );
    const submittedExistingRoundIds = new Set(
      payload.completedRounds
        .map((round) => round.id)
        .filter((id): id is string => Boolean(id))
    );
    const removedRounds = (existingRounds ?? []).filter(
      (round) => !submittedExistingRoundIds.has(round.id)
    );
    const removedRoundIds = removedRounds.map((round) => round.id);
    const removedMatchIds = removedRounds
      .map((round) => round.match_id)
      .filter((matchId): matchId is string => Boolean(matchId));

    // Delete linked matches before event_rounds; the FK otherwise nulls match_id.
    if (removedMatchIds.length) {
      const { error: deleteMatchesError } = await supabase
        .from("matches")
        .delete()
        .in("id", removedMatchIds)
        .eq("user_id", user.id);

      if (deleteMatchesError) {
        throw new Error(deleteMatchesError.message);
      }
    }

    if (removedRoundIds.length) {
      const { error: deleteRoundsError } = await supabase
        .from("event_rounds")
        .delete()
        .in("id", removedRoundIds)
        .eq("user_id", user.id);

      if (deleteRoundsError) {
        throw new Error(deleteRoundsError.message);
      }
    }

    const { error: updateEventError } = await supabase
      .from("events")
      .update({
        name: payload.name,
        event_date: payload.eventDate,
        event_type: payload.eventType,
        format: payload.format,
        match_structure: payload.matchStructure,
        deck_id: payload.deckId,
        deck_version_id: payload.deckVersionId,
        placement: payload.placement,
        notes: payload.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("user_id", user.id);

    if (updateEventError) {
      throw new Error(updateEventError.message);
    }

    for (const completedRound of payload.completedRounds) {
      const matchScore =
        payload.matchStructure === "bo3" ? completedRound.matchScore : null;

      if (completedRound.id && !existingRoundsById.has(completedRound.id)) {
        throw new Error(`Round ${completedRound.roundNumber}: event round not found.`);
      }

      let roundId = completedRound.id;
      let linkedMatchId = roundId
        ? existingRoundsById.get(roundId)?.matchId ?? null
        : null;

      if (roundId) {
        const { error: updateRoundError } = await supabase
          .from("event_rounds")
          .update({
            round_number: completedRound.roundNumber,
            opponent_deck_name: completedRound.opponentDeckName,
            result: completedRound.result,
            match_score: matchScore,
            went_first: completedRound.wentFirst,
            tags: completedRound.tags,
            notes: completedRound.roundNotes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roundId)
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (updateRoundError) {
          throw new Error(updateRoundError.message);
        }
      } else {
        const { data: insertedRound, error: insertRoundError } = await supabase
          .from("event_rounds")
          .insert({
            event_id: eventId,
            user_id: user.id,
            round_number: completedRound.roundNumber,
            opponent_deck_name: completedRound.opponentDeckName,
            result: completedRound.result,
            match_score: matchScore,
            went_first: completedRound.wentFirst,
            tags: completedRound.tags,
            notes: completedRound.roundNotes,
          })
          .select("id")
          .single();

        if (insertRoundError || !insertedRound) {
          throw new Error(
            insertRoundError?.message ??
              `Could not save round ${completedRound.roundNumber}.`
          );
        }

        roundId = insertedRound.id;
      }

      if (!roundId) {
        throw new Error(`Round ${completedRound.roundNumber}: event round not found.`);
      }

      const metadata = buildRoundMetadata({
        eventId,
        eventName: payload.name,
        eventType: payload.eventType,
        matchStructure: payload.matchStructure,
        roundId,
        roundNumber: completedRound.roundNumber,
        result: completedRound.result,
        matchScore,
        tags: completedRound.tags,
      });

      if (linkedMatchId) {
        await updateLinkedMatch({
          supabase,
          matchId: linkedMatchId,
          userId: user.id,
          deckVersionId: payload.deckVersionId,
          opponentDeckName: completedRound.opponentDeckName,
          result: completedRound.result,
          wentFirst: completedRound.wentFirst,
          eventType: payload.eventType,
          eventDate: payload.eventDate,
          roundNotes: completedRound.roundNotes,
          metadata,
        });
      } else {
        const match = await createMatchWithTags(supabase, {
          userId: user.id,
          deckVersionId: payload.deckVersionId,
          opponentArchetype: completedRound.opponentDeckName,
          result: completedRound.result,
          wentFirst: completedRound.wentFirst,
          eventType: normalizeEventMatchType(payload.eventType),
          notes: completedRound.roundNotes,
          metadata,
          playedAt: `${payload.eventDate}T12:00:00.000Z`,
        });

        linkedMatchId = match.id;
      }

      const { error: linkError } = await supabase
        .from("event_rounds")
        .update({ match_id: linkedMatchId })
        .eq("id", roundId)
        .eq("user_id", user.id);

      if (linkError) {
        throw new Error(linkError.message);
      }
    }

    revalidateEventViews(eventId);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update event.",
    };
  }

  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: event, error: eventLookupError } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("user_id", user.id)
    .single();

  if (eventLookupError || !event) {
    throw new Error("Event not found.");
  }

  const { data: rounds, error: roundsLookupError } = await supabase
    .from("event_rounds")
    .select("match_id")
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (roundsLookupError) {
    throw new Error(roundsLookupError.message);
  }

  const linkedMatchIds = (rounds ?? [])
    .map((round) => round.match_id)
    .filter((matchId): matchId is string => Boolean(matchId));

  if (linkedMatchIds.length) {
    const { error: deleteMatchesError } = await supabase
      .from("matches")
      .delete()
      .in("id", linkedMatchIds)
      .eq("user_id", user.id);

    if (deleteMatchesError) {
      throw new Error(deleteMatchesError.message);
    }
  }

  const { error: deleteEventError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (deleteEventError) {
    throw new Error(deleteEventError.message);
  }

  revalidateEventViews(eventId);
  redirect("/events");
}
