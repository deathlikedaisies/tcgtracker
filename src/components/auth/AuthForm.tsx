"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  submitAuthFormAction,
  type AuthFormState,
  type AuthMode,
} from "@/app/auth/actions";
import {
  inputH11,
  label,
  primaryButton,
  sectionCopy,
} from "@/components/brand-styles";

type AuthFormProps = {
  mode: AuthMode;
  authConfigured?: boolean;
};

const missingConfigMessage =
  "SixPrizer is not configured correctly. Please contact support.";
const initialState: AuthFormState = { message: "" };

export function AuthForm({ mode, authConfigured = true }: AuthFormProps) {
  const isLogin = mode === "login";
  const authAction = submitAuthFormAction.bind(null, mode, authConfigured);
  const [state, formAction, isSubmitting] = useActionState(
    authAction,
    initialState
  );
  const buttonLabel = isLogin ? "Log in" : "Create account";
  const pendingLabel = isLogin ? "Logging in..." : "Creating account...";
  const displayedMessage = authConfigured ? state.message : missingConfigMessage;
  const messageTone =
    state.variant === "success"
      ? "rounded-md bg-emerald-500/10 px-3 py-2.5 text-sm leading-6 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]"
      : "rounded-md bg-[#F43F5E]/10 px-3 py-2.5 text-sm leading-6 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]";

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
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
            className={`${inputH11} disabled:cursor-not-allowed disabled:opacity-70`}
          />
        </div>
      ) : null}
      {displayedMessage ? (
        <p role="alert" aria-live="polite" className={messageTone}>
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
