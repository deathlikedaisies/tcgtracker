import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import type { SessionCoachInsight } from "@/lib/session-coach";

type SessionCoachPanelProps = {
  insight: SessionCoachInsight;
  ctaLabel?: string;
  isPostSave?: boolean;
  showCta?: boolean;
};

export function SessionCoachPanel({
  insight,
  ctaLabel,
  isPostSave = false,
  showCta = true,
}: SessionCoachPanelProps) {
  const progressPercent = Math.min(
    100,
    Math.round((insight.progressCompleted / insight.progressGoal) * 100)
  );

  return (
    <section className="rounded-md bg-[#11182C]/84 p-3 shadow-[0_22px_64px_rgba(0,0,0,0.28),0_0_38px_rgba(245,200,76,0.07),inset_0_0_0_1px_rgba(245,200,76,0.16)] sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#F5C84C]/84">
              {insight.missionState === "complete" ? "Completed test" : "Current mission"}
            </p>
            <span className="rounded-md bg-[#0B1020]/58 px-2 py-1 text-xs font-semibold text-[#F8FAFC]">
              {insight.confidence}
            </span>
          </div>
          <div className="mt-3 flex min-w-0 items-start gap-3">
            <ArchetypeSprites archetype={insight.archetype} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-2xl">
                {insight.missionTitle}
              </h2>
              <p className="mt-1 text-sm font-medium text-[#94A3B8]">
                {insight.reasoning}
              </p>
            </div>
          </div>
        </div>

        {showCta ? (
          <Link
            href={insight.continueHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020] shadow-[0_14px_32px_rgba(245,200,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] lg:w-fit"
          >
            {ctaLabel ?? insight.ctaLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-md bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.14)]">
          <p className="text-xs font-semibold uppercase text-[#F43F5E]/84">
            Biggest leak
          </p>
          <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
            {insight.condition}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
            {insight.evidence}
          </p>
        </div>
        <div className="rounded-md bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
          <p className="text-xs font-semibold uppercase text-[#4F8CFF]">
            Recommended test
          </p>
          <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
            {insight.exactTest}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
            {insight.criteria}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md bg-[#0B1020]/42 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold uppercase text-[#94A3B8]/78">
            Test progress
          </p>
          <p className="text-sm font-semibold text-[#F8FAFC]">
            {insight.progressCompleted} / {insight.progressGoal} games completed
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1A2238]/72">
          <div
            className={`h-2 rounded-full bg-[#F5C84C] transition-all duration-500 ${
              isPostSave ? "animate-pulse" : ""
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <p className="text-sm font-medium text-[#F8FAFC]">
            {insight.progressFeedback}
          </p>
          <p className="text-sm text-[#94A3B8]">
            Common issue in losses:{" "}
            <span className="font-medium text-[#F8FAFC]">
              {insight.commonIssue ?? "Tag losses to reveal it."}
            </span>
          </p>
        </div>
      </div>

      {insight.completionStatus ? (
        <div className="mt-3 rounded-md bg-emerald-500/10 p-3 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
          <p className="text-xs font-semibold uppercase text-emerald-200">
            {insight.completionStatus}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#F8FAFC]">
            {insight.completionSummary}
          </p>
          <p className="mt-1 text-sm text-[#94A3B8]">
            {insight.nextAction}
          </p>
        </div>
      ) : null}

      {insight.issueTrend ? (
        <p className="mt-3 text-sm font-medium text-[#94A3B8]">
          Pattern trend:{" "}
          <span className="text-[#F8FAFC]">{insight.issueTrend}</span>
        </p>
      ) : null}
    </section>
  );
}
