import { SupabaseConfigError } from "@/lib/supabase-config";

export const AUTH_SUPPORT_LINE =
  "If this keeps happening, send a screenshot to the beta organiser.";

export const AUTH_ERROR_MESSAGES = {
  network:
    "Could not connect to SixPrizer. Check your connection and try again.",
  missingConfig: "SixPrizer is not configured correctly. Please contact support.",
  rateLimit: "Too many email requests. Please wait a few minutes and try again.",
  signupRateLimit:
    "Signup email sending is temporarily rate limited. Please wait a few minutes and try again. If it keeps happening, contact the beta organiser.",
  emailDelivery:
    "SixPrizer could not send the authentication email. Please try again in a few minutes.",
  existingAccount:
    "An account may already exist for this email. Try logging in instead.",
  invalidCredentials: "Email or password is incorrect.",
  emailNotConfirmed:
    "Please confirm your email before logging in. Check your inbox and spam folder.",
  expiredOrInvalidLink:
    "This login or confirmation link has expired. Please request a new one.",
  invalidEmail: "Enter a valid email address.",
  weakPassword: "Use a password with at least 8 characters.",
  passwordsDoNotMatch: "Passwords do not match.",
  missingCredentials: "Enter your email and password.",
  signupFallback:
    "We could not create your account. Please check your details and try again.",
  fallback: "Something went wrong with authentication. Please try again.",
} as const;

export type AuthErrorContext =
  | "login"
  | "signup"
  | "resend-confirmation"
  | "forgot-password"
  | "auth-link"
  | "generic";

function getErrorText(error: unknown) {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`.trim();
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const maybeMessage = "message" in error ? String(error.message ?? "") : "";
    const maybeCode = "code" in error ? String(error.code ?? "") : "";
    const maybeStatus = "status" in error ? String(error.status ?? "") : "";
    return `${maybeCode} ${maybeStatus} ${maybeMessage}`.trim();
  }

  return "";
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

export function normalizeAuthError(
  error: unknown,
  context: AuthErrorContext = "generic"
) {
  if (error instanceof SupabaseConfigError) {
    return AUTH_ERROR_MESSAGES.missingConfig;
  }

  const lower = getErrorText(error).toLowerCase();

  if (
    includesAny(lower, [
      "fetch failed",
      "failed to fetch",
      "network request failed",
      "typeerror",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.network;
  }

  if (
    includesAny(lower, [
      "email rate limit",
      "email_send_rate_limit",
      "over_email_send_rate_limit",
      "rate limit exceeded",
      "too many requests",
      "for security purposes",
      "security purposes",
      "429",
    ])
  ) {
    return context === "signup"
      ? AUTH_ERROR_MESSAGES.signupRateLimit
      : AUTH_ERROR_MESSAGES.rateLimit;
  }

  if (
    includesAny(lower, [
      "smtp",
      "email provider",
      "email not sent",
      "error sending",
      "failed to send",
      "could not send",
      "send email",
      "email delivery",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.emailDelivery;
  }

  if (
    includesAny(lower, [
      "user already registered",
      "already registered",
      "already been registered",
      "already exists",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.existingAccount;
  }

  if (
    includesAny(lower, [
      "invalid login credentials",
      "invalid credentials",
      "invalid grant",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.invalidCredentials;
  }

  if (
    includesAny(lower, [
      "email not confirmed",
      "email_not_confirmed",
      "not confirmed",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.emailNotConfirmed;
  }

  if (
    includesAny(lower, [
      "expired",
      "otp expired",
      "token has expired",
      "invalid token",
      "invalid link",
      "bad jwt",
      "invalid flow state",
      "flow state expired",
      "access_denied",
      "otp_disabled",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.expiredOrInvalidLink;
  }

  if (
    includesAny(lower, [
      "invalid email",
      "unable to validate email",
      "valid email address",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.invalidEmail;
  }

  if (
    includesAny(lower, [
      "password should be",
      "password is too short",
      "weak password",
      "at least 6 character",
      "at least 8 character",
    ])
  ) {
    return AUTH_ERROR_MESSAGES.weakPassword;
  }

  if (context === "signup") {
    return AUTH_ERROR_MESSAGES.signupFallback;
  }

  return AUTH_ERROR_MESSAGES.fallback;
}

export function isEmailNotConfirmedError(error: unknown) {
  return normalizeAuthError(error, "login") === AUTH_ERROR_MESSAGES.emailNotConfirmed;
}
