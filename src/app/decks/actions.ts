"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

export async function createDeck(formData: FormData) {
  const { supabase, user } = await getSignedInUser();
  const name = String(formData.get("name") ?? "").trim();
  const archetype = String(formData.get("archetype") ?? "").trim();

  if (!name) {
    throw new Error("Deck name is required.");
  }

  if (!archetype) {
    throw new Error("Archetype is required.");
  }

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
    throw new Error(error?.message ?? "Could not create deck.");
  }

  revalidatePath("/decks");
  revalidatePath("/dashboard");
  redirect(`/decks/${deck.id}`);
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
