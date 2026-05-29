"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { submitAuthForm } from "@/app/auth/actions";
import {
  inputH11,
  label,
  primaryButton,
  sectionCopy,
} from "@/components/brand-styles";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  authConfigured?: boolean;
};

const missingConfigMessage =
  "SixPrizer is not configured correctly. Please contact support.";
const connectionMessage =
  "Could not connect to SixPrizer. Check your connection and try again.";

function getClientAuthErrorMessage(error: unknown) {
  const errorName = error instanceof Error ? error.name.toLowerCase() : "";
  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "");

  if (
    errorName.includes("typeerror") ||
    errorMessage.includes("fetch failed") ||
    errorMessage.includes("failed to fetch") ||
    errorMessage.includes("network request failed")
  ) {
    return connectionMessage;
  }

  return "Authentication failed. Please try again.";
}

export function AuthForm({ mode, authConfigured = true }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";
  const buttonLabel = isLogin ? "Log in" : "Create account";
  const pendingLabel = isLogin ? "Logging in..." : "Creating account...";
  const displayedMessage = authConfigured ? message : missingConfigMessage;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !authConfigured) {
      return;
    }

    setMessage("");

    if (!isLogin && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitAuthForm(mode, email, password);

      if (!result.ok) {
        setMessage(result.message ?? "Authentication failed. Please try again.");
        return;
      }

      if (result.needsEmailConfirmation) {
        // TODO: Supabase confirmation email subject/body and sender branding should be customized in the Supabase dashboard/custom SMTP.
        setMessage("Check your email to confirm your account, then log in.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(getClientAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={!authConfigured || isSubmitting}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={`${inputH11} disabled:cursor-not-allowed disabled:opacity-70`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={label}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          minLength={isLogin ? 6 : 8}
          disabled={!authConfigured || isSubmitting}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={`${inputH11} disabled:cursor-not-allowed disabled:opacity-70`}
        />
        {!isLogin ? (
          <p className="text-xs leading-5 text-[#94A3B8]/72">
            Use at least 8 characters.
          </p>
        ) : null}
      </div>
      {!isLogin ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="confirm-password" className={label}>
            Confirm password
          </label>
          <input
            id="confirm-password"
            name="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            disabled={!authConfigured || isSubmitting}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={`${inputH11} disabled:cursor-not-allowed disabled:opacity-70`}
          />
        </div>
      ) : null}
      {displayedMessage ? (
        <p
          role="alert"
          className="rounded-md bg-[#F43F5E]/10 px-3 py-2.5 text-sm leading-6 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]"
        >
          {displayedMessage}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting || !authConfigured}
        aria-busy={isSubmitting}
        className={`${primaryButton} h-11 gap-2`}
      >
        {isSubmitting ? (
          <span
            aria-hidden="true"
            className="size-4 rounded-full border-2 border-[#0B1020]/25 border-t-[#0B1020] motion-safe:animate-spin"
          />
        ) : null}
        {isSubmitting ? pendingLabel : buttonLabel}
      </button>
      <p className="text-center text-xs leading-5 text-[#94A3B8]/70">
        Your match data stays private to your account.
      </p>
      <p className={sectionCopy}>
        {isLogin ? "Need an account?" : "Already have an account?"}{" "}
        <Link
          href={isLogin ? "/signup" : "/login"}
          className="font-medium text-[#F5C84C] underline underline-offset-4"
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
