"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type DeckCreateState = {
  error: string | null;
};

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

export async function createDeck(
  _state: DeckCreateState,
  formData: FormData
): Promise<DeckCreateState> {
  // getSignedInUser calls redirect("/login") when unauthenticated — must stay outside
  // any try/catch so the redirect signal propagates correctly to Next.js.
  const { supabase, user } = await getSignedInUser();

  const name = String(formData.get("name") ?? "").trim();
  const archetype = String(formData.get("archetype") ?? "").trim();

  if (!name) {
    return { error: "Deck name is required." };
  }

  if (!archetype) {
    return { error: "Archetype is required." };
  }

  let deckId: string;

  try {
    const { data: deck, error } = await supabase
      .from("decks")
      .insert({
        user_id: user.id,
        name,
        archetype,
        format: optionalText(formData.get("format")),
        notes: optionalText(formData.get("notes")),
      })
      .select("id")
      .single();

    if (error || !deck) {
      console.error("createDeck: insert failed", { message: error?.message });
      return { error: "Could not create deck. Please try again." };
    }

    deckId = deck.id;
  } catch (err) {
    console.error("createDeck: unexpected error", err instanceof Error ? { message: err.message } : err);
    return { error: "Could not create deck. Please try again." };
  }

  revalidatePath("/decks");
  revalidatePath("/dashboard");
  // redirect() is outside all try/catch so Next.js can handle the NEXT_REDIRECT signal.
  redirect(`/decks/${deckId}?created=1`);
}

export async function deleteDeck(deckId: string) {
  const { supabase, user } = await getSignedInUser();
  const { error } = await supabase
    .from("decks")
    .delete()
    .eq("id", deckId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/decks");
  revalidatePath("/dashboard");
}

export async function setActiveDeck(deckId: string) {
  const { supabase, user } = await getSignedInUser();

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id")
    .eq("id", deckId)
    .eq("user_id", user.id)
    .single();

  if (deckError || !deck) {
    throw new Error("Deck not found.");
  }

  const { data: versions, error: versionsError } = await supabase
    .from("deck_versions")
    .select("id, is_active, created_at")
    .eq("deck_id", deckId)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const targetVersion = versions?.[0] ?? null;

  if (!targetVersion?.id) {
    redirect(`/decks/${deckId}#versions`);
  }

  const { data: userDecks, error: userDecksError } = await supabase
    .from("decks")
    .select("id")
    .eq("user_id", user.id);

  if (userDecksError) {
    throw new Error(userDecksError.message);
  }

  const userDeckIds = (userDecks ?? []).map((row) => row.id).filter(Boolean);

  if (userDeckIds.length) {
    const { error: clearError } = await supabase
      .from("deck_versions")
      .update({ is_active: false })
      .in("deck_id", userDeckIds);

    if (clearError) {
      throw new Error(clearError.message);
    }
  }

  const { error: activateError } = await supabase
    .from("deck_versions")
    .update({ is_active: true })
    .eq("id", targetVersion.id)
    .eq("deck_id", deckId);

  if (activateError) {
    throw new Error(activateError.message);
  }

  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath("/matches/new");
}
