"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { SupabaseConfigError } from "@/lib/supabase-config";

type AuthMode = "login" | "signup";

export type AuthResult = {
  ok: boolean;
  message?: string;
  needsEmailConfirmation?: boolean;
};

const AUTH_MESSAGES = {
  network:
    "Could not connect to PrizeMap. Check your connection and try again.",
  invalidCredentials: "Email or password is incorrect.",
  missingConfig: "PrizeMap is not configured correctly. Please contact support.",
  fallback: "Authentication failed. Please try again.",
} as const;

function normalizeAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lowerMessage = message.toLowerCase();

  if (error instanceof SupabaseConfigError) {
    return AUTH_MESSAGES.missingConfig;
  }

  if (
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("failed to fetch") ||
    lowerMessage.includes("network request failed") ||
    lowerMessage.includes("typeerror")
  ) {
    return AUTH_MESSAGES.network;
  }

  if (
    lowerMessage.includes("invalid login credentials") ||
    lowerMessage.includes("invalid credentials")
  ) {
    return AUTH_MESSAGES.invalidCredentials;
  }

  return AUTH_MESSAGES.fallback;
}

function logSafeAuthError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(context, {
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error(context, { error });
}

export async function submitAuthForm(
  mode: AuthMode,
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const credentials = { email, password };

    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (error) {
      logSafeAuthError("Supabase auth returned an error", error);
      return { ok: false, message: normalizeAuthError(error) };
    }

    return {
      ok: true,
      needsEmailConfirmation: mode === "signup" && !data.session,
    };
  } catch (error) {
    logSafeAuthError("Supabase auth request failed", error);
    return { ok: false, message: normalizeAuthError(error) };
  }
}
