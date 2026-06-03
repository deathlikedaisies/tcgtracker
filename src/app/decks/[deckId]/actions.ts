"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type DeckVersionActionState = {
  error: string | null;
  success: null | {
    versionId: string;
    versionName: string;
    isActive: boolean;
    submittedAt: string;
    mode: "created" | "updated";
  };
};

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

export async function createDeckVersion(
  deckId: string,
  _state: DeckVersionActionState,
  formData: FormData
): Promise<DeckVersionActionState> {
  try {
    const supabase = await verifyDeckOwnership(deckId);
    const name = String(formData.get("name") ?? "").trim();
    const decklist = String(formData.get("decklist") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const requestedActive = formData.get("is_active") === "on";

    if (!name) {
      return { error: "Version name is required.", success: null };
    }

    const { data: existingVersions, error: existingVersionsError } = await supabase
      .from("deck_versions")
      .select("id, name, decklist")
      .eq("deck_id", deckId);

    if (existingVersionsError) {
      return { error: existingVersionsError.message, success: null };
    }

    const hasExistingVersions = Boolean(existingVersions?.length);
    const exactDuplicate = existingVersions?.find(
      (version) =>
        String(version.name ?? "").trim().toLowerCase() === name.toLowerCase() &&
        String(version.decklist ?? "").trim() === decklist
    );

    if (exactDuplicate) {
      return {
        error:
          "This deck already has a version with the same name and deck list. Edit the existing version instead of creating a duplicate.",
        success: null,
      };
    }

    const isActive = requestedActive || !hasExistingVersions;

    if (isActive) {
      const { error } = await supabase
        .from("deck_versions")
        .update({ is_active: false })
        .eq("deck_id", deckId);

      if (error) {
        return { error: error.message, success: null };
      }
    }

    const { data: createdVersion, error } = await supabase
      .from("deck_versions")
      .insert({
        deck_id: deckId,
        name,
        decklist: decklist || null,
        notes: notes || null,
        is_active: isActive,
      })
      .select("id, name, is_active, created_at")
      .single();

    if (error || !createdVersion) {
      return { error: error?.message ?? "Could not create version.", success: null };
    }

    revalidatePath("/decks");
    revalidatePath("/dashboard");
    revalidatePath(`/decks/${deckId}`);
    revalidatePath("/matches/new");

    return {
      error: null,
      success: {
        versionId: createdVersion.id,
        versionName: String(createdVersion.name ?? "").trim() || "Untitled version",
        isActive: Boolean(createdVersion.is_active),
        submittedAt: createdVersion.created_at,
        mode: "created",
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not create version.",
      success: null,
    };
  }
}

export async function updateDeckVersion(
  deckId: string,
  versionId: string,
  _state: DeckVersionActionState,
  formData: FormData
): Promise<DeckVersionActionState> {
  try {
    const supabase = await verifyDeckOwnership(deckId);
    const name = String(formData.get("name") ?? "").trim();
    const decklist = String(formData.get("decklist") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const requestedActive = formData.get("is_active") === "on";

    if (!name) {
      return { error: "Version name is required.", success: null };
    }

    const { data: currentVersion, error: currentVersionError } = await supabase
      .from("deck_versions")
      .select("id, is_active")
      .eq("id", versionId)
      .eq("deck_id", deckId)
      .single();

    if (currentVersionError || !currentVersion) {
      return { error: "Deck version not found.", success: null };
    }

    const { data: siblingVersions, error: siblingVersionsError } = await supabase
      .from("deck_versions")
      .select("id, name, decklist")
      .eq("deck_id", deckId)
      .neq("id", versionId);

    if (siblingVersionsError) {
      return { error: siblingVersionsError.message, success: null };
    }

    const exactDuplicate = siblingVersions?.find(
      (version) =>
        String(version.name ?? "").trim().toLowerCase() === name.toLowerCase() &&
        String(version.decklist ?? "").trim() === decklist
    );

    if (exactDuplicate) {
      return {
        error:
          "Another version already uses this exact name and deck list. Edit that version instead of saving a duplicate.",
        success: null,
      };
    }

    if (requestedActive && !currentVersion.is_active) {
      const { error: deactivateError } = await supabase
        .from("deck_versions")
        .update({ is_active: false })
        .eq("deck_id", deckId);

      if (deactivateError) {
        return { error: deactivateError.message, success: null };
      }
    }

    const { data: updatedVersion, error } = await supabase
      .from("deck_versions")
      .update({
        name,
        decklist: decklist || null,
        notes: notes || null,
        is_active: requestedActive ? true : currentVersion.is_active,
      })
      .eq("id", versionId)
      .eq("deck_id", deckId)
      .select("id, name, is_active")
      .single();

    if (error || !updatedVersion) {
      return { error: error?.message ?? "Could not update version.", success: null };
    }

    revalidatePath("/decks");
    revalidatePath("/dashboard");
    revalidatePath(`/decks/${deckId}`);
    revalidatePath("/matches/new");

    return {
      error: null,
      success: {
        versionId: updatedVersion.id,
        versionName: String(updatedVersion.name ?? "").trim() || "Untitled version",
        isActive: Boolean(updatedVersion.is_active),
        submittedAt: new Date().toISOString(),
        mode: "updated",
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update version.",
      success: null,
    };
  }
}

export async function updateDeckArchetype(deckId: string, formData: FormData) {
  const supabase = await verifyDeckOwnership(deckId);
  const archetype = String(formData.get("archetype") ?? "").trim();

  if (!archetype) {
    throw new Error("Archetype is required.");
  }

  const { error } = await supabase
    .from("decks")
    .update({ archetype })
    .eq("id", deckId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/matches");
  revalidatePath("/matches/new");
  revalidatePath("/matchups");
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

  revalidatePath("/decks");
  revalidatePath("/dashboard");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/matches/new");
}

export async function deleteDeckVersion(deckId: string, versionId: string) {
  const supabase = await verifyDeckOwnership(deckId);
  const { data: version, error: versionError } = await supabase
    .from("deck_versions")
    .select("id, is_active, created_at")
    .eq("id", versionId)
    .eq("deck_id", deckId)
    .single();

  if (versionError || !version) {
    throw new Error("Deck version not found.");
  }

  const { count, error: matchesError } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("deck_version_id", versionId);

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "This version has logged games. Delete is blocked until archive support exists."
    );
  }

  const { error: deleteError } = await supabase
    .from("deck_versions")
    .delete()
    .eq("id", versionId)
    .eq("deck_id", deckId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (version.is_active) {
    const { data: fallbackVersion, error: fallbackError } = await supabase
      .from("deck_versions")
      .select("id")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    if (fallbackVersion?.id) {
      const { error: activateFallbackError } = await supabase
        .from("deck_versions")
        .update({ is_active: true })
        .eq("id", fallbackVersion.id)
        .eq("deck_id", deckId);

      if (activateFallbackError) {
        throw new Error(activateFallbackError.message);
      }
    }
  }

  revalidatePath("/decks");
  revalidatePath("/dashboard");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath("/matches/new");
}
