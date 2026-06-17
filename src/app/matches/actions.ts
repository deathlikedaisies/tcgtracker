"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildMatchMetadataFromFormData,
  getGameContextEventType,
  optionalText,
  parseWentFirstChoice,
} from "@/lib/match-form";
import {
  EVENT_TYPES,
  flattenStructuredMatchTags,
  MATCH_RESULTS,
} from "@/lib/match-options";
import { replaceKnownMatchMetadata } from "@/lib/match-types";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const results = new Set<string>(MATCH_RESULTS);
const eventTypes = new Set<string>(EVENT_TYPES);

async function getSignedInUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

async function verifyMatchOwner(matchId: string) {
  const { supabase, user } = await getSignedInUser();
  const { data: match, error } = await supabase
    .from("matches")
    .select("id, metadata")
    .eq("id", matchId)
    .eq("user_id", user.id)
    .single();

  if (error || !match) {
    throw new Error("Match not found.");
  }

  return { supabase, user, match };
}

async function verifyDeckVersionOwner(deckVersionId: string) {
  const { supabase, user } = await getSignedInUser();
  const { data: deckVersion, error } = await supabase
    .from("deck_versions")
    .select("id, decks!inner(user_id)")
    .eq("id", deckVersionId)
    .eq("decks.user_id", user.id)
    .single();

  if (error || !deckVersion) {
    throw new Error("Deck version not found.");
  }
}

function getMatchPayload(formData: FormData) {
  const deckVersionId = String(formData.get("deck_version_id") ?? "").trim();
  const opponentArchetype = String(
    formData.get("opponent_archetype") ?? ""
  ).trim();
  const result = String(formData.get("result") ?? "").trim();
  const wentFirstValue = optionalText(formData.get("went_first"));
  const wentFirst = parseWentFirstChoice(wentFirstValue);
  const metadata = buildMatchMetadataFromFormData(formData);
  const eventType = metadata.game_context
    ? getGameContextEventType(metadata.game_context)
    : optionalText(formData.get("event_type"));

  if (!deckVersionId) {
    throw new Error("Deck version is required.");
  }

  if (!opponentArchetype) {
    throw new Error("Opponent archetype is required.");
  }

  if (!results.has(result)) {
    throw new Error("Result must be win, loss, or tie.");
  }

  if (eventType && !eventTypes.has(eventType)) {
    throw new Error("Invalid event type.");
  }

  return {
    deckVersionId,
    tags: flattenStructuredMatchTags({
      issueTags: metadata.issue_tags ?? [],
      positiveTags: metadata.positive_tags ?? [],
    }),
    match: {
      deck_version_id: deckVersionId,
      opponent_archetype: opponentArchetype,
      opponent_variant: optionalText(formData.get("opponent_variant")),
      result,
      went_first: wentFirst,
      event_type: eventType,
      notes: optionalText(formData.get("notes")),
      metadata,
    },
  };
}

function revalidateMatchViews() {
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  revalidatePath("/matchups");
  revalidatePath("/review");
}

export async function deleteMatch(matchId: string) {
  const { supabase, user } = await verifyMatchOwner(matchId);
  const { error } = await supabase
    .from("matches")
    .delete()
    .eq("id", matchId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateMatchViews();
}

export async function updateMatch(
  matchId: string,
  _state: { error: string | null },
  formData: FormData
) {
  const { supabase, user, match } = await verifyMatchOwner(matchId);
  try {
    const payload = getMatchPayload(formData);

    await verifyDeckVersionOwner(payload.deckVersionId);

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        ...payload.match,
        metadata: replaceKnownMatchMetadata(
          match.metadata,
          payload.match.metadata
        ),
      })
      .eq("id", matchId)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const { error: deleteTagsError } = await supabase
      .from("match_tags")
      .delete()
      .eq("match_id", matchId);

    if (deleteTagsError) {
      throw new Error(deleteTagsError.message);
    }

    if (payload.tags.length) {
      const { error: insertTagsError } = await supabase
        .from("match_tags")
        .insert(
          payload.tags.map((tag) => ({
            match_id: matchId,
            tag,
          }))
        );

      if (insertTagsError) {
        throw new Error(insertTagsError.message);
      }
    }
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save this game.",
    };
  }

  revalidateMatchViews();
  revalidatePath(`/matches/${matchId}/edit`);
  redirect("/matches?updated=1");
}
