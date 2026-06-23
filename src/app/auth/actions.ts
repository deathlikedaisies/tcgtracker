"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { SupabaseConfigError } from "@/lib/supabase-config";

export type AuthMode = "login" | "signup";

export type AuthResult = {
  ok: boolean;
  message?: string;
  needsEmailConfirmation?: boolean;
  emailNotConfirmed?: boolean;
};

export type AuthFormState = {
  message: string;
  variant?: "error" | "success" | "email-unconfirmed";
  emailForResend?: string;
};

const AUTH_MESSAGES = {
  network:
    "Could not connect to SixPrizer. Check your connection and try again.",
  invalidCredentials: "Email or password is incorrect.",
  missingConfig: "SixPrizer is not configured correctly. Please contact support.",
  emailNotConfirmed:
    "Your email has not been confirmed yet. Please check your inbox and spam folder for the SixPrizer confirmation email, then try logging in again.",
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
      const lowerMsg = error.message?.toLowerCase() ?? "";
      const emailNotConfirmed = lowerMsg.includes("email not confirmed");
      return {
        ok: false,
        message: emailNotConfirmed ? AUTH_MESSAGES.emailNotConfirmed : normalizeAuthError(error),
        emailNotConfirmed,
      };
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

export async function submitAuthFormAction(
  mode: AuthMode,
  authConfigured: boolean,
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (!authConfigured) {
    return {
      message:
        "SixPrizer is not configured correctly. Please contact support.",
      variant: "error",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm-password") ?? "");

  if (!email || !password) {
    return {
      message: "Enter your email and password.",
      variant: "error",
    };
  }

  if (mode === "signup" && password !== confirmPassword) {
    return {
      message: "Passwords do not match.",
      variant: "error",
    };
  }

  const result = await submitAuthForm(mode, email, password);

  if (!result.ok) {
    if (result.emailNotConfirmed) {
      return {
        message: result.message ?? AUTH_MESSAGES.emailNotConfirmed,
        variant: "email-unconfirmed",
        emailForResend: email,
      };
    }

    return {
      message: result.message ?? AUTH_MESSAGES.fallback,
      variant: "error",
    };
  }

  if (result.needsEmailConfirmation) {
    // TODO: Supabase confirmation email subject/body and sender branding should be customized in the Supabase dashboard/custom SMTP.
    return {
      message:
        "Account created. Please check your inbox and spam folder for the SixPrizer confirmation email before logging in.",
      variant: "success",
    };
  }

  redirect("/dashboard");
}

export async function resendConfirmationEmail(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resend({ type: "signup", email });
  } catch {
    // Return the same generic message regardless of outcome to prevent account enumeration.
  }

  return {
    message:
      "If an account exists for this email, we sent a new confirmation email. Please check your inbox and spam folder.",
    variant: "success",
  };
}
