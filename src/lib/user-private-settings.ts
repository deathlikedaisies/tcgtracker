import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase-server";

export type UserPrivateSettings = {
  user_id: string;
  pokemon_tcg_live_username: string | null;
  created_at: string;
  updated_at: string;
};

const tcgLiveUsernamePattern = /^[A-Za-z0-9_]{2,32}$/;

function isMissingPrivateSettingsTable(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    message.includes("user_private_settings") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

function toUserPrivateSettings(value: unknown): UserPrivateSettings | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (
    typeof row.user_id !== "string" ||
    typeof row.created_at !== "string" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }

  return {
    user_id: row.user_id,
    pokemon_tcg_live_username:
      typeof row.pokemon_tcg_live_username === "string"
        ? row.pokemon_tcg_live_username
        : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function normalizePokemonTcgLiveUsername(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();

  return trimmed || null;
}

export function validatePokemonTcgLiveUsername(value: string | null | undefined) {
  const normalized = normalizePokemonTcgLiveUsername(value);

  if (!normalized) {
    return null;
  }

  if (!tcgLiveUsernamePattern.test(normalized)) {
    return "TCG Live username must be 2-32 characters and use only letters, numbers, or underscores.";
  }

  return null;
}

export async function getOwnUserPrivateSettings(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_private_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingPrivateSettingsTable(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return toUserPrivateSettings(data);
}

export async function savePokemonTcgLiveUsername(userId: string, value: string) {
  const username = normalizePokemonTcgLiveUsername(value);
  const validationError = validatePokemonTcgLiveUsername(username);

  if (validationError) {
    return {
      ok: false as const,
      error: validationError,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("user_private_settings").upsert(
    {
      user_id: userId,
      pokemon_tcg_live_username: username,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    if (isMissingPrivateSettingsTable(error)) {
      return {
        ok: false as const,
        error: "TCG Live username could not be saved until the latest beta migration is applied.",
      };
    }

    return {
      ok: false as const,
      error: "TCG Live username could not be saved.",
    };
  }

  return {
    ok: true as const,
    error: null,
  };
}
