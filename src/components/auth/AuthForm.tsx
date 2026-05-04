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
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await submitAuthForm(mode, email, password);

      if (!result.ok) {
        setMessage(result.message ?? "Authentication failed. Please try again.");
        return;
      }

      if (result.needsEmailConfirmation) {
        setMessage("Check your email to confirm your account, then log in.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputH11}
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
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputH11}
        />
      </div>
      {message ? (
        <p className="rounded-md bg-[#4F8CFF]/10 px-3 py-2 text-sm text-[#F8FAFC]">
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`${primaryButton} h-11`}
      >
        {isSubmitting ? "Please wait..." : isLogin ? "Log in" : "Create account"}
      </button>
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
