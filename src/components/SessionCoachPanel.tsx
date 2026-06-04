import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { missionHeroCard, statCard } from "@/components/brand-styles";
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
    Math.round((insight.missionProgress / insight.missionTargetCount) * 100)
  );
  const progressDots = Array.from({ length: insight.missionTargetCount }).map(
    (_, index) => index < insight.missionProgress
  );
  const patternText = insight.commonIssue
    ? `Pattern: ${insight.commonIssue.tag} (${insight.commonIssue.count}x)`
    : null;
  const contextProgress =
    insight.missionContextSeenCount > 0
      ? `${insight.missionContextLabel}: ${insight.missionContextSeenCount} game${
          insight.missionContextSeenCount === 1 ? "" : "s"
        }`
      : `${insight.missionContextLabel}: none yet`;
  const actionLabel =
    ctaLabel ?? insight.ctaLabel;

  return (
    <section className={`${missionHeroCard} p-3 shadow-[0_18px_42px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.11)] sm:p-4`}>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-[12px] bg-[#F5C84C]/12 text-xs font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
              TC
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/58">
              Current mission
            </span>
            <span className="rounded-full bg-[#4F8CFF]/10 px-2.5 py-1 text-xs font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
              {insight.missionStatusLabel}
            </span>
            <span className="rounded-full bg-[#07111F]/52 px-2.5 py-1 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
              {insight.missionGuidanceLabel}
            </span>
          </div>
          <h2 className="mt-2 truncate text-2xl font-bold leading-tight tracking-tight text-[#F8FAFC] sm:text-3xl">
            {insight.missionTitle}
          </h2>
          <p className="mt-1 text-sm leading-5 text-[#D6E0F0]/78">
            {insight.whyThisMatters}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 items-center gap-2 rounded-[14px] bg-[#0B1020]/46 px-2.5 py-1.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              <ArchetypeSprites archetype={insight.archetype} className="shrink-0" />
              <p className="min-w-0 truncate text-sm font-medium text-[#94A3B8]/78">
                {insight.missionContextLabel}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F5C84C]/8 px-2 py-1 text-[10px] font-semibold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
              {insight.rewardLabel}
            </span>
          </div>
        </div>
        {showCta ? (
          <Link
            href={insight.continueHref}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-[14px] bg-[#F5C84C] px-5 text-sm font-bold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:w-fit"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-2.5 grid gap-1.5">
        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/52">
            Mission progress
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`${statCard} flex items-center gap-1.5 px-2.5 py-1.5`}
              aria-label={`${insight.missionProgress} of ${insight.missionTargetCount} games completed`}
            >
              {progressDots.map((complete, index) => (
                <span
                  key={index}
                  className={`size-2.5 rounded-full transition-colors duration-500 ${
                    complete ? "bg-[#F5C84C]" : "bg-[#1A2238]/84"
                  } ${isPostSave && complete ? "animate-pulse" : ""}`}
                />
              ))}
              <span className="ml-1 text-xs font-semibold leading-none text-[#F8FAFC]">
                {insight.missionProgress}/{insight.missionTargetCount} games
              </span>
            </div>
            <span className="text-xs font-medium leading-none text-[#94A3B8]/64">
              {contextProgress}
            </span>
          </div>
          <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-[#1A2238]/54">
            <div
              className={`h-0.5 rounded-full bg-[#F5C84C]/58 transition-all duration-500 ${
                isPostSave ? "animate-pulse" : ""
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {!showCta ? (
        <div className="mt-2">
          <p className="text-xs font-medium text-[#94A3B8]/74">
            {insight.nextAction}
          </p>
        </div>
      ) : null}

      {insight.completionLesson ? (
        <div className={`${statCard} mt-3 bg-[linear-gradient(180deg,rgba(10,24,20,0.88),rgba(8,17,31,0.86))] p-3 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.14)]`}>
          <p className="text-xs font-semibold uppercase text-emerald-200">
            Read unlocked
          </p>
          <p className="mt-2 text-sm leading-6 text-[#F8FAFC]">
            {insight.completionLesson}
          </p>
          {insight.nextAction ? (
            <p className="mt-1 text-sm text-[#94A3B8]">
              {insight.nextAction}
            </p>
          ) : null}
        </div>
      ) : insight.completionStatus ? (
        <div className={`${statCard} mt-3 bg-[linear-gradient(180deg,rgba(10,24,20,0.88),rgba(8,17,31,0.86))] p-3 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.14)]`}>
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

      <details className="mt-2">
        <summary className="inline-flex h-7 cursor-pointer list-none items-center rounded-md px-1.5 text-[11px] font-medium text-[#94A3B8]/62 transition hover:bg-[#0B1020]/30 hover:text-[#F8FAFC] marker:hidden">
          Why this mission
        </summary>
        <div className={`${statCard} mt-2 grid gap-2 bg-[linear-gradient(180deg,rgba(11,18,32,0.72),rgba(8,14,26,0.66))] p-3 text-sm text-[#94A3B8] sm:grid-cols-2`}>
          <p>{insight.missionReason}</p>
          <p>{insight.evidence}</p>
          <p>{insight.criteria}</p>
          {patternText || insight.issueTrend ? (
            <p>{patternText ?? insight.issueTrend}</p>
          ) : null}
        </div>
      </details>
    </section>
  );
}
