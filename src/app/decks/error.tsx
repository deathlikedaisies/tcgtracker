"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import {
  appFrame,
  appMain,
  appShell,
  glassPanelStrong,
  primaryButton,
  secondaryButton,
} from "@/components/brand-styles";

type DecksErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DecksError({ error, reset }: DecksErrorProps) {
  return (
    <main className={appShell}>
      <section className={appFrame}>
        <div className={`${appMain} mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center`}>
          <div className={`w-full p-6 sm:p-8 ${glassPanelStrong}`}>
            <div className="flex items-start gap-4">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#F43F5E]/12 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-200/88">
                  Deck load error
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                  Decks could not load
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#94A3B8]/78">
                  One deck may have invalid data. Try again or open another page.
                </p>
                {error.digest ? (
                  <p className="mt-2 text-xs text-[#94A3B8]/60">
                    Error digest: {error.digest}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={reset} className={primaryButton}>
                <RefreshCcw className="mr-2 size-4" aria-hidden="true" />
                Try again
              </button>
              <Link href="/dashboard" className={secondaryButton}>
                Back to dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
