"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";

type AuthMode = "login" | "signup";

export type AuthResult = {
  ok: boolean;
  message?: string;
  needsEmailConfirmation?: boolean;
};

function normalizeAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("fetch")) {
      return "Could not reach the authentication service. Check the Supabase URL/key configuration for this deployment.";
    }

    return error.message;
  }

  return "Authentication failed. Please try again.";
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
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      needsEmailConfirmation: mode === "signup" && !data.session,
    };
  } catch (error) {
    return { ok: false, message: normalizeAuthError(error) };
  }
}
