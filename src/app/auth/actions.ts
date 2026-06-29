"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  AUTH_ERROR_MESSAGES,
  isEmailNotConfirmedError,
  normalizeAuthError,
} from "@/lib/auth-errors";
import { validateBetaSignup } from "@/lib/beta-signup";

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
      const emailNotConfirmed = isEmailNotConfirmedError(error);
      return {
        ok: false,
        message: emailNotConfirmed
          ? AUTH_ERROR_MESSAGES.emailNotConfirmed
          : mode === "signup"
            ? normalizeAuthError(error, "signup")
            : normalizeAuthError(error, "login"),
        emailNotConfirmed,
      };
    }

    return {
      ok: true,
      needsEmailConfirmation: mode === "signup" && !data.session,
    };
  } catch (error) {
    logSafeAuthError("Supabase auth request failed", error);
    return { ok: false, message: normalizeAuthError(error, mode) };
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
      message: AUTH_ERROR_MESSAGES.missingConfig,
      variant: "error",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm-password") ?? "");
  const betaInviteCode = String(formData.get("beta-invite-code") ?? "").trim();

  if (!email || !password) {
    return {
      message: AUTH_ERROR_MESSAGES.missingCredentials,
      variant: "error",
    };
  }

  if (mode === "signup" && password.length < 8) {
    return {
      message: AUTH_ERROR_MESSAGES.weakPassword,
      variant: "error",
    };
  }

  if (mode === "signup" && password !== confirmPassword) {
    return {
      message: AUTH_ERROR_MESSAGES.passwordsDoNotMatch,
      variant: "error",
    };
  }

  if (mode === "signup") {
    const betaSignup = await validateBetaSignup(betaInviteCode);
    if (!betaSignup.ok) {
      return {
        message: betaSignup.message,
        variant: "error",
      };
    }
  }

  const result = await submitAuthForm(mode, email, password);

  if (!result.ok) {
    if (result.emailNotConfirmed) {
      return {
        message: result.message ?? AUTH_ERROR_MESSAGES.emailNotConfirmed,
        variant: "email-unconfirmed",
        emailForResend: email,
      };
    }

    return {
      message: result.message ?? AUTH_ERROR_MESSAGES.fallback,
      variant: "error",
    };
  }

  if (result.needsEmailConfirmation) {
    // TODO: Supabase confirmation email subject/body and sender branding should be customized in the Supabase dashboard/custom SMTP.
    redirect("/login?signup=success");
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
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      logSafeAuthError("Supabase confirmation resend failed", error);
      return {
        message: normalizeAuthError(error, "resend-confirmation"),
        variant: "error",
      };
    }
  } catch (error) {
    logSafeAuthError("Supabase confirmation resend request failed", error);
    return {
      message: normalizeAuthError(error, "resend-confirmation"),
      variant: "error",
    };
  }

  return {
    message:
      "If an account exists for this email, we sent a new confirmation email. Please check your inbox and spam folder.",
    variant: "success",
  };
}
