"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function getSignedInUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}

async function verifyDeckOwnership(deckId: string) {
  const { supabase, userId } = await getSignedInUserId();
  const { data: deck, error } = await supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("user_id", userId)
    .single();

  if (error || !deck) {
    throw new Error("Deck not found.");
  }

  return supabase;
}

export async function createDeckVersion(deckId: string, formData: FormData) {
  const supabase = await verifyDeckOwnership(deckId);
  const name = String(formData.get("name") ?? "").trim();
  const decklist = String(formData.get("decklist") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const isActive = formData.get("is_active") === "on";

  if (!name) {
    throw new Error("Version name is required.");
  }

  if (isActive) {
    const { error } = await supabase
      .from("deck_versions")
      .update({ is_active: false })
      .eq("deck_id", deckId);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { error } = await supabase.from("deck_versions").insert({
    deck_id: deckId,
    name,
    decklist: decklist || null,
    notes: notes || null,
    is_active: isActive,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/decks/${deckId}`);
}

export async function markDeckVersionActive(
  deckId: string,
  versionId: string
) {
  const supabase = await verifyDeckOwnership(deckId);
  const { data: version, error: versionError } = await supabase
    .from("deck_versions")
    .select("id")
    .eq("id", versionId)
    .eq("deck_id", deckId)
    .single();

  if (versionError || !version) {
    throw new Error("Deck version not found.");
  }

  const { error: deactivateError } = await supabase
    .from("deck_versions")
    .update({ is_active: false })
    .eq("deck_id", deckId);

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error: activateError } = await supabase
    .from("deck_versions")
    .update({ is_active: true })
    .eq("id", versionId)
    .eq("deck_id", deckId);

  if (activateError) {
    throw new Error(activateError.message);
  }

  revalidatePath(`/decks/${deckId}`);
}
