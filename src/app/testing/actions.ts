"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isTestingBlockStatus } from "@/lib/testing-blocks";

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function getFocusTags(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("focus_tags")
        .map((value) => String(value).trim())
        .filter(Boolean)
        .slice(0, 6)
    )
  );
}

async function getOwnedDeckVersion(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  deckVersionId: string | null
) {
  if (!deckVersionId) {
    return { deckId: null, deckVersionId: null };
  }

  const { data, error } = await supabase
    .from("deck_versions")
    .select("id, deck_id, decks!inner(user_id)")
    .eq("id", deckVersionId)
    .eq("decks.user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Deck version not found.");
  }

  return {
    deckId: typeof data.deck_id === "string" ? data.deck_id : null,
    deckVersionId: data.id,
  };
}

export async function createTestingBlock(
  formData: FormData
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const deckId = optionalText(formData.get("deck_id"));
  const deckVersionIdInput = optionalText(formData.get("deck_version_id"));
  const targetMatchup = optionalText(formData.get("target_matchup"));
  const targetGamesInput = Number.parseInt(
    String(formData.get("target_games") ?? "5"),
    10
  );
  const targetGames =
    Number.isFinite(targetGamesInput) && targetGamesInput > 0
      ? Math.min(targetGamesInput, 50)
      : 5;
  const notes = optionalText(formData.get("notes"));
  const sourceReviewReason = optionalText(formData.get("source_review_reason"));
  const focusTags = getFocusTags(formData);
  const ownedVersion = await getOwnedDeckVersion(
    supabase,
    user.id,
    deckVersionIdInput
  );

  if (!targetMatchup && focusTags.length === 0) {
    throw new Error("Add a target matchup or at least one focus tag.");
  }

  const resolvedDeckId = ownedVersion.deckId ?? deckId;

  if (resolvedDeckId) {
    const { data: ownedDeck, error: deckError } = await supabase
      .from("decks")
      .select("id")
      .eq("id", resolvedDeckId)
      .eq("user_id", user.id)
      .single();

    if (deckError || !ownedDeck) {
      throw new Error("Deck not found.");
    }
  }

  const { error } = await supabase.from("testing_blocks").insert({
    user_id: user.id,
    deck_id: resolvedDeckId,
    deck_version_id: ownedVersion.deckVersionId,
    target_matchup: targetMatchup,
    focus_tags: focusTags,
    target_games: targetGames,
    notes,
    source_review_reason: sourceReviewReason,
    status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/testing");
  revalidatePath("/dashboard");
  revalidatePath("/review");
  redirect("/testing?created=1");
}

export async function updateTestingBlockStatus(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const blockId = optionalText(formData.get("testing_block_id"));
  const status = optionalText(formData.get("status"));

  if (!blockId || !status || !isTestingBlockStatus(status)) {
    throw new Error("Invalid testing block status.");
  }

  const { error } = await supabase
    .from("testing_blocks")
    .update({
      status,
      updated_at: new Date().toISOString(),
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", blockId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/testing");
  revalidatePath("/dashboard");
  revalidatePath("/review");
}
