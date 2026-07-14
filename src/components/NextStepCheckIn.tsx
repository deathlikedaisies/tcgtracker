"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import type { NextStepCheckInContent } from "@/lib/next-step-check-in";

const DISMISS_KEY = "sixprizer-next-step-dismissed";

type NextStepCheckInProps = {
  content: NextStepCheckInContent;
  className?: string;
};

export function NextStepCheckIn({ content, className = "" }: NextStepCheckInProps) {
  const [dismissedState, setDismissedState] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(DISMISS_KEY);
  });

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, content.state);
    setDismissedState(content.state);
  }

  if (dismissedState === content.state) {
    return null;
  }

  return (
    <section
      data-testid="next-step-check-in"
      className={`overflow-hidden rounded-[22px] border border-[#4F8CFF]/18 bg-[radial-gradient(circle_at_14%_0%,rgba(79,140,255,0.22),transparent_30%),linear-gradient(135deg,rgba(12,24,48,0.94),rgba(7,13,26,0.9))] p-3.5 shadow-[0_18px_46px_rgba(0,0,0,0.26)] sm:p-4 ${className}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.2)]">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#9DB8E8]">
                {content.title}
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[0.68rem] font-semibold text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.14)]">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Coaching setup
              </span>
            </div>
            <p className="mt-1 text-base font-semibold text-[#F8FAFC] sm:text-lg">
              {content.question}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#A8B3CF]">
              SixPrizer gets sharper when your deck, TCG Live logs, and tags turn into review signal.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href={content.primaryHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#F5C84C] px-4 py-2 text-sm font-semibold text-[#111827] shadow-[0_14px_30px_rgba(245,200,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#FFE28A]"
          >
            {content.primaryLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href={content.secondaryHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#DCE8FF] transition hover:border-[#4F8CFF]/30 hover:bg-[#4F8CFF]/10"
          >
            {content.secondaryLabel}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#94A3B8] transition hover:bg-white/[0.05] hover:text-[#F8FAFC]"
            aria-label="Not now"
          >
            <X className="size-4" aria-hidden="true" />
            <span>Not now</span>
          </button>
        </div>
      </div>
    </section>
  );
}
