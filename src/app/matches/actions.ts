"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EVENT_TYPES, MATCH_RESULTS, parseSelectedTags } from "@/lib/match-options";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const results = new Set<string>(MATCH_RESULTS);
const eventTypes = new Set<string>(EVENT_TYPES);

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

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
    .select("id")
    .eq("id", matchId)
    .eq("user_id", user.id)
    .single();

  if (error || !match) {
    throw new Error("Match not found.");
  }

  return { supabase, user };
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
  const eventType = optionalText(formData.get("event_type"));
  const wentFirstValue = optionalText(formData.get("went_first"));

  if (!deckVersionId) {
    throw new Error("Deck version is required.");
  }

  if (!opponentArchetype) {
    throw new Error("Opponent archetype is required.");
  }

  if (!results.has(result)) {
    throw new Error("Result must be win or loss.");
  }

  if (eventType && !eventTypes.has(eventType)) {
    throw new Error("Invalid event type.");
  }

  return {
    deckVersionId,
    tags: parseSelectedTags(formData.getAll("tags")),
    match: {
      deck_version_id: deckVersionId,
      opponent_archetype: opponentArchetype,
      opponent_variant: optionalText(formData.get("opponent_variant")),
      result,
      went_first: wentFirstValue === null ? null : wentFirstValue === "true",
      event_type: eventType,
      notes: optionalText(formData.get("notes")),
    },
  };
}

function revalidateMatchViews() {
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  revalidatePath("/matchups");
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

export async function updateMatch(matchId: string, formData: FormData) {
  const { supabase, user } = await verifyMatchOwner(matchId);
  const payload = getMatchPayload(formData);

  await verifyDeckVersionOwner(payload.deckVersionId);

  const { error: updateError } = await supabase
    .from("matches")
    .update(payload.match)
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
    const { error: insertTagsError } = await supabase.from("match_tags").insert(
      payload.tags.map((tag) => ({
        match_id: matchId,
        tag,
      }))
    );

    if (insertTagsError) {
      throw new Error(insertTagsError.message);
    }
  }

  revalidateMatchViews();
  revalidatePath(`/matches/${matchId}/edit`);
  redirect("/matches?updated=1");
}
