"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LATEST_FORMAT } from "@/lib/formats";
import { EVENT_TYPES, MATCH_RESULTS, parseSelectedTags } from "@/lib/match-options";

const results = new Set<string>(MATCH_RESULTS);
const eventTypes = new Set<string>(EVENT_TYPES);

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function logMatch(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  const { data: ownedDeckVersion, error: ownershipError } = await supabase
    .from("deck_versions")
    .select("id, decks!inner(user_id)")
    .eq("id", deckVersionId)
    .eq("decks.user_id", user.id)
    .single();

  if (ownershipError || !ownedDeckVersion) {
    throw new Error("Deck version not found.");
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      user_id: user.id,
      deck_version_id: deckVersionId,
      opponent_archetype: opponentArchetype,
      opponent_variant: optionalText(formData.get("opponent_variant")),
      result,
      went_first: wentFirstValue === null ? null : wentFirstValue === "true",
      event_type: eventType,
      format: LATEST_FORMAT,
      notes: optionalText(formData.get("notes")),
    })
    .select("id")
    .single();

  if (matchError || !match) {
    throw new Error(matchError?.message ?? "Could not log match.");
  }

  const tags = parseSelectedTags(formData.getAll("tags"));

  if (tags.length) {
    const { error: tagsError } = await supabase.from("match_tags").insert(
      tags.map((tag) => ({
        match_id: match.id,
        tag,
      }))
    );

    if (tagsError) {
      throw new Error(tagsError.message);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/matchups");
  revalidatePath("/matches/new");
  redirect(
    `/matches/new?success=1&opponent=${encodeURIComponent(
      opponentArchetype
    )}&result=${encodeURIComponent(result)}&event=${encodeURIComponent(eventType ?? "testing")}&went_first=${encodeURIComponent(
      wentFirstValue ?? ""
    )}`
  );
}
