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
    Math.round((insight.missionProgress / insight.missionTargetCount) * 100)
  );
  const progressDots = Array.from({ length: insight.missionTargetCount }).map(
    (_, index) => index < insight.missionProgress
  );
  const patternText = insight.commonIssue
    ? `🔁 ${insight.commonIssue.tag} (${insight.commonIssue.count}x)`
    : null;
  const contextProgress =
    insight.missionContextSeenCount > 0
      ? `Focus evidence: ${insight.missionContextSeenCount} game${
          insight.missionContextSeenCount === 1 ? "" : "s"
        }`
      : "Focus evidence: none yet";
  const actionLabel =
    ctaLabel ??
    (insight.missionState === "complete" ? "Review mission" : "Log next game");

  return (
    <section className="rounded-md bg-[#11182C]/88 p-3 shadow-[0_24px_64px_rgba(0,0,0,0.30),0_0_42px_rgba(245,200,76,0.045),inset_0_0_0_1px_rgba(245,200,76,0.14)] sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-[#F5C84C]/12 text-base text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
              🧪
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/78">
              Current mission
            </span>
            <span className="rounded-md bg-[#4F8CFF]/10 px-2 py-1 text-xs font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
              {insight.missionConfidence}
            </span>
          </div>
          <h2 className="mt-3 truncate text-2xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-3xl">
            {insight.missionTitle}
          </h2>
          <div className="mt-2 flex min-w-0 items-center gap-2 rounded-md bg-[#0B1020]/26 px-2.5 py-2 sm:w-fit">
            <ArchetypeSprites archetype={insight.archetype} className="shrink-0" />
            <p className="min-w-0 truncate text-sm font-medium text-[#94A3B8]">
              {insight.missionContextLabel}
            </p>
          </div>
        </div>
        {showCta ? (
          <Link
            href={insight.continueHref}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center rounded-md bg-[#F5C84C] px-5 text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:w-fit"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#94A3B8]/70">
            Mission progress
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className="flex items-center gap-1.5 rounded-md bg-[#0B1020]/40 px-2.5 py-2 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]"
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
            <span className="text-xs font-medium text-[#94A3B8]/82">
              {contextProgress}
            </span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#1A2238]/45">
            <div
              className={`h-1 rounded-full bg-[#F5C84C]/70 transition-all duration-500 ${
                isPostSave ? "animate-pulse" : ""
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
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
        <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-md px-2 text-xs font-semibold text-[#94A3B8] transition hover:bg-[#0B1020]/34 hover:text-[#F8FAFC] marker:hidden">
          Why this mission
        </summary>
        <div className="mt-2 grid gap-2 rounded-md bg-[#0B1020]/42 p-3 text-sm text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:grid-cols-2">
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
