import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { MatchStrip } from "@/components/MatchStrip";
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
    ? `🔁 ${insight.commonIssue.tag} (${insight.commonIssue.count}x)`
    : "🔁 No pattern yet";
  const contextProgress =
    insight.missionContextSeenCount > 0
      ? `Seen in focus: ${insight.missionContextSeenCount}/${insight.missionContextTargetCount}`
      : "Focus not seen yet";

  return (
    <section className="rounded-md bg-[#11182C]/84 p-3 shadow-[0_18px_46px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(245,200,76,0.13)] sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-[#F5C84C]/10 text-base text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
              🧪
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/78">
              Current mission
            </span>
            <span className="rounded-md bg-[#4F8CFF]/12 px-2 py-1 text-xs font-semibold text-[#B8D1FF]">
              {insight.missionConfidence}
            </span>
          </div>
          <h2 className="mt-2 truncate text-xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-2xl">
            {insight.missionTitle}
          </h2>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <ArchetypeSprites archetype={insight.archetype} className="shrink-0" />
            <p className="min-w-0 truncate text-sm font-medium text-[#94A3B8]">
              {insight.missionContextLabel}
            </p>
          </div>
        </div>
        {showCta ? (
          <Link
            href={insight.continueHref}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020] shadow-[0_12px_28px_rgba(245,200,76,0.20)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:w-fit"
          >
            {ctaLabel ?? insight.ctaLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-1.5"
              aria-label={`${insight.missionProgress} of ${insight.missionTargetCount} games completed`}
            >
              {progressDots.map((complete, index) => (
                <span
                  key={index}
                  className={`size-2.5 rounded-full ${
                    complete ? "bg-[#F5C84C]" : "bg-[#1A2238]"
                  } ${isPostSave && complete ? "animate-pulse" : ""}`}
                />
              ))}
              <span className="ml-1 text-xs font-semibold text-[#F8FAFC]">
                {insight.missionProgress}/{insight.missionTargetCount} games
              </span>
            </div>
            <span className="text-xs font-semibold text-[#94A3B8]">
              {contextProgress}
            </span>
            <span className="text-xs font-semibold text-[#94A3B8]">
              {patternText}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1A2238]/72">
            <div
              className={`h-1.5 rounded-full bg-[#F5C84C] transition-all duration-500 ${
                isPostSave ? "animate-pulse" : ""
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <MatchStrip matches={insight.missionResults} />
      </div>

      {!showCta ? (
        <div className="mt-3">
          <p className="text-xs font-semibold text-[#94A3B8]">
            {insight.missionNextAction}
          </p>
        </div>
      ) : null}

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

      <details className="mt-3">
        <summary className="cursor-pointer list-none text-xs font-semibold text-[#94A3B8] marker:hidden">
          Why this mission
        </summary>
        <div className="mt-2 grid gap-2 rounded-md bg-[#0B1020]/42 p-3 text-sm text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:grid-cols-2">
          <p>{insight.missionReason}</p>
          <p>{insight.evidence}</p>
          <p>{insight.criteria}</p>
          <p>{insight.issueTrend ?? "🔁 No pattern yet"}</p>
        </div>
      </details>
    </section>
  );
}
