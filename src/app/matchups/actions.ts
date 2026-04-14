"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function readRequiredText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

export async function saveMatchupNote(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const yourArchetype = readRequiredText(formData, "your_archetype");
  const opponentArchetype = readRequiredText(formData, "opponent_archetype");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { data: existingNote, error: existingError } = await supabase
    .from("matchup_notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("your_archetype", yourArchetype)
    .eq("opponent_archetype", opponentArchetype)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingNote?.[0]) {
    const { error } = await supabase
      .from("matchup_notes")
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingNote[0].id)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("matchup_notes").insert({
      user_id: user.id,
      your_archetype: yourArchetype,
      opponent_archetype: opponentArchetype,
      notes,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/matchups");
}
