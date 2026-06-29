"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Layers3,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
  Target,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  glassPanel,
  insightCard,
  metallicBadge,
  missionHeroCard,
  premiumInset,
  premiumInsetStrong,
  primaryButton,
  secondaryButton,
  statCard,
} from "@/components/brand-styles";
import {
  formatMatchRecord,
  type MatchResult,
} from "@/lib/match-types";
import type {
  SessionCoachInsight,
  TrainingProgressSummary,
} from "@/lib/session-coach";
import { evaluateMatchupSignal } from "@/lib/session-coach";

type DeckSummary = {
  id: string;
  name: string;
  archetype: string;
  created_at: string;
  deck_versions?: {
    id: string;
    name?: string | null;
    is_active?: boolean | null;
  }[] | null;
};

type DashboardStats = {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  totalTies: number;
  overallWinRate: string;
  wentFirstWinRate: string;
  wentSecondWinRate: string;
};

type RecentMatch = {
  id: string;
  playedAt: string;
  deckVersionName: string;
  opponentArchetype: string;
  result: MatchResult;
  eventType: string | null;
};

type SummaryRow = {
  matches: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: string;
};

type MatchupSummary = SummaryRow & {
  opponentArchetype: string;
};

type DashboardContentProps = {
  email: string;
  decks: DeckSummary[];
  hasAnyMatches: boolean;
  hasScopedMatches: boolean;
  hasAnyDeckVersions: boolean;
  hasProfile: boolean;
  profileIsPrivate: boolean;
  firstDeckId?: string;
  currentDeckId?: string | null;
  currentDeckName?: string | null;
  currentDeckArchetype?: string | null;
  currentDeckVersionName?: string | null;
  reviewHref: string;
  stats: DashboardStats;
  recentMatches: RecentMatch[];
  matchupSummary: MatchupSummary[];
  sessionCoach: SessionCoachInsight | null;
  trainingProgress: TrainingProgressSummary;
};

type Tone = "blue" | "gold" | "green" | "rose";

function parseRate(value: string) {
  return Number.parseInt(value.replace("%", ""), 10) || 0;
}

function toneClass(tone: Tone) {
  return {
    blue: "bg-[#4F8CFF]/10 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]",
    gold: "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]",
    green: "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]",
    rose: "bg-[#F43F5E]/10 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]",
  }[tone];
}

function getLowDataLabel(matches: number, threshold: number, label: string) {
  const remaining = Math.max(threshold - matches, 0);

  if (remaining <= 0) {
    return label;
  }

  return `Log ${remaining} more game${remaining === 1 ? "" : "s"} to unlock this`;
}

function getMissionBadge(insight: SessionCoachInsight) {
  if (insight.missionStatus === "actionable_signal") {
    return { label: "Actionable signal", tone: "green" as const };
  }

  if (insight.missionStatus === "building_signal") {
    return { label: "Building signal", tone: "blue" as const };
  }

  if (insight.missionStatus === "needs_more_focused_games") {
    return {
      label:
        insight.missionGuidanceMode === "priority_watchlist"
          ? "Needs more games"
          : "Needs focus games",
      tone: "gold" as const,
    };
  }

  if (insight.missionStatus === "pattern_rejected") {
    return { label: "Pattern rejected", tone: "rose" as const };
  }

  return { label: "Needs more games", tone: "gold" as const };
}

function RecentFormDots({ matches }: { matches: RecentMatch[] }) {
  const recent = matches.slice(0, 6);
  const dots = recent.length
    ? recent
    : Array.from({ length: 6 }).map((_, index) => ({
        id: `empty-${index}`,
        result: null,
      }));

  return (
    <div className="flex items-center gap-1.5" aria-label="Recent form">
      {dots.map((match) => (
        <span
          key={match.id}
          className={`size-2.5 rounded-full ${
            match.result === "win"
              ? "bg-[#22C55E]"
              : match.result === "loss"
                ? "bg-[#F43F5E]"
                : match.result === "tie"
                  ? "bg-[#F5C84C]"
                  : "bg-[#1A2238]"
          }`}
        />
      ))}
    </div>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={`${statCard} min-w-0 p-3`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
        {label}
      </p>
      <div className="mt-2">
        <span
          className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-sm font-semibold leading-5 whitespace-normal ${toneClass(
            tone
          )}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  tone: Tone;
  children?: ReactNode;
}) {
  return (
    <div className={`${statCard} p-3 sm:p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${toneClass(tone)}`}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#94A3B8]/76">
              {label}
            </p>
          </div>
          <p className="mt-2.5 text-lg font-bold tracking-tight text-[#F8FAFC] sm:mt-3 sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-xs leading-4 text-[#94A3B8]/72 sm:text-sm sm:leading-5">
            {helper}
          </p>
        </div>
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function ChangeCard({
  label,
  title,
  detail,
  tone,
}: {
  label: string;
  title: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className={`${insightCard} p-3 sm:p-4`}>
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass(
          tone
        )}`}
      >
        {label}
      </span>
      <p className="mt-2.5 text-base font-semibold text-[#F8FAFC]">{title}</p>
      <p className="mt-1 text-sm leading-5 text-[#94A3B8]/72 sm:leading-6">{detail}</p>
    </div>
  );
}

function MissionHeroCard({
  insight,
  nextActionTitle,
  nextActionCopy,
  reviewHref,
}: {
  insight: SessionCoachInsight;
  nextActionTitle: string;
  nextActionCopy: string;
  reviewHref: string;
}) {
  const badge = getMissionBadge(insight);
  const progressPercent = Math.min(
    100,
    Math.round((insight.missionProgress / insight.missionTargetCount) * 100)
  );
  const progressDots = Array.from({ length: insight.missionTargetCount }).map(
    (_, index) => index < insight.missionProgress
  );
  const primaryHref = insight.continueHref;
  const primaryLabel = insight.ctaLabel;
  const primaryReviewPath = primaryHref.split("?")[0];
  const secondaryReviewPath = reviewHref.split("?")[0];
  const showSecondaryReviewCta =
    primaryReviewPath !== secondaryReviewPath &&
    primaryLabel.trim().toLowerCase() !== "open review";

  return (
    <section className={`grid gap-3 p-3 sm:gap-4 sm:p-5 xl:grid-cols-[minmax(0,1.5fr)_280px] ${missionHeroCard} bg-[linear-gradient(180deg,rgba(14,24,42,0.94),rgba(8,17,31,0.90))]`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-1.5 sm:gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)] sm:size-10 sm:rounded-2xl">
            <Target className="size-4 sm:size-5" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/76">
            Next best action
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] leading-5 whitespace-normal ${toneClass(
              badge.tone
            )}`}
          >
            {badge.label}
          </span>
          <span className={`${metallicBadge} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] leading-5 text-[#DCE8FF] whitespace-normal`}>
            {insight.missionGuidanceLabel}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2.5 sm:mt-4 sm:gap-3">
          <ArchetypeSprites archetype={insight.archetype} size="md" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[1.35rem] font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
              {insight.missionTitle}
            </h1>
            <p className="mt-1 text-sm leading-5 text-[#D6E0F0]/82 sm:mt-2 sm:text-base sm:leading-6">
              {insight.missionStatusReason}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-3">
          <StatusChip
            label="Current focus"
            value={insight.missionContextLabel}
            tone="blue"
          />
          <StatusChip
            label="Evidence"
            value={`${insight.missionContextSeenCount}/${insight.missionContextTargetCount} ${insight.missionContextLabel.toLowerCase()}`}
            tone="gold"
          />
          <StatusChip
            label="Signal"
            value={badge.label}
            tone="green"
          />
        </div>

        <details className="mt-3 sm:mt-4">
          <summary className={`${premiumInset} flex w-full cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-[#DCE8FF] transition-colors hover:text-[#F8FAFC] marker:hidden`}>
            <span>Why this?</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </summary>
          <div className={`${premiumInset} mt-2.5 grid gap-2 p-3 text-sm leading-5 text-[#94A3B8]/76 sm:mt-3 sm:p-4 sm:leading-6`}>
            <p>{insight.missionReason}</p>
            <p>{insight.evidence}</p>
          </div>
        </details>
      </div>

      <div className={`${premiumInsetStrong} flex flex-col p-3 sm:p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Progress
            </p>
            <p className="mt-1 text-base font-semibold text-[#F8FAFC] sm:text-lg">
              {insight.missionProgress}/{insight.missionTargetCount} games
            </p>
          </div>
          <span className={`${metallicBadge} px-3 py-1 text-xs font-semibold leading-5 text-[#DCE8FF] whitespace-normal`}>
            {insight.missionStatusLabel}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 sm:mt-4 sm:gap-2" aria-label="Focus progress">
          {progressDots.map((complete, index) => (
            <span
              key={index}
              className={`h-2.5 flex-1 rounded-full ${
                complete ? "bg-[#F5C84C]" : "bg-[#1A2238]"
              }`}
            />
          ))}
        </div>

        <div className="mt-3 h-2 rounded-full bg-[#11182C]">
          <div
            className="h-2 rounded-full bg-[#F5C84C] shadow-[0_0_10px_rgba(245,200,76,0.14)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-2.5 text-sm font-medium leading-5 text-[#D6E0F0] sm:mt-3">
          {insight.progressFeedback}
        </p>

        <div className={`${premiumInset} mt-2.5 p-3`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Next move
          </p>
          <p className="mt-1.5 text-base font-semibold text-[#F8FAFC]">
            {nextActionTitle}
          </p>
          <p className="mt-1 text-sm leading-5 text-[#94A3B8]/72 sm:leading-6">
            {nextActionCopy}
          </p>
        </div>

        {insight.completionLesson ? (
          <div className="mt-2 rounded-2xl bg-emerald-500/8 p-3 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
              Read unlocked
            </p>
            <p className="mt-1 text-sm leading-5 text-[#F8FAFC]">
              {insight.completionLesson}
            </p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-2 sm:mt-5">
          <Link href={primaryHref} className={`${primaryButton} h-12`}>
            {primaryLabel}
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
          {showSecondaryReviewCta ? (
            <Link href={reviewHref} className={`${secondaryButton} h-11`}>
              Open review
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SetupChecklist({
  hasProfile,
  hasDecks,
  hasAnyDeckVersions,
  firstDeckId,
}: {
  hasProfile: boolean;
  hasDecks: boolean;
  hasAnyDeckVersions: boolean;
  firstDeckId?: string;
}) {
  const deckSetupHref = firstDeckId ? `/decks/${firstDeckId}` : "/decks";
  const matchLoggingHref = hasAnyDeckVersions ? "/matches/new" : deckSetupHref;
  const steps = [
    {
      label: "Profile",
      complete: hasProfile,
      helper: "Set your player name and basic preferences.",
      href: "/profile/setup",
      icon: UserRound,
    },
    {
      label: "Deck",
      complete: hasDecks,
      helper: "Add the list you are currently testing.",
      href: "/decks",
      icon: Layers3,
    },
    {
      label: "Version",
      complete: hasAnyDeckVersions,
      helper: "Save the build you want to track.",
      href: deckSetupHref,
      icon: ClipboardCheck,
    },
    {
      label: "Games",
      complete: false,
      helper: "Log matches to start seeing patterns.",
      href: matchLoggingHref,
      icon: Activity,
    },
  ];
  const nextStepIndex = steps.findIndex((step) => !step.complete);
  const unlocks = [
    "Matchup trends",
    "Repeated issues",
    "Turn-order signal",
    "Deck Lab reads",
    "Version comparison",
  ];

  const cta = !hasProfile
    ? {
        label: "Create your profile",
        href: "/profile/setup",
      }
    : !hasDecks
    ? {
        label: "Create your first deck",
        href: "/decks",
      }
    : !hasAnyDeckVersions
      ? {
          label: "Add a deck version",
          href: firstDeckId ? `/decks/${firstDeckId}` : "/decks",
        }
      : {
          label: "Log your first game",
          href: "/matches/new",
        };

  return (
    <section
      className={`${emptyCard} overflow-hidden p-0 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_8%,rgba(79,140,255,0.18),transparent_32%),radial-gradient(circle_at_88%_18%,rgba(245,200,76,0.12),transparent_28%)] before:content-['']`}
    >
      <div className="relative grid gap-3.5 p-3.5 sm:gap-5 sm:p-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-stretch">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#4F8CFF]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            New workspace
          </div>
          <h2 className="mt-3 max-w-2xl text-[1.75rem] font-black leading-[1.04] tracking-tight text-[#F8FAFC] sm:text-4xl">
            Set up your testing workspace
          </h2>
          <p className="mt-2.5 max-w-2xl text-sm leading-5 text-[#D6E0F0]/82 sm:text-base sm:leading-6">
            Add your deck, save a version, and start logging games. SixPrizer turns your testing data into matchup trends, review prompts, and Deck Lab reads.
          </p>

          <div className="mt-3.5 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center">
            <Link href={cta.href} className={`${primaryButton} h-11 w-full sm:w-auto`}>
              {cta.label}
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
            <span className="text-center text-xs leading-5 text-[#94A3B8]/70 sm:text-left">
              One deck and one version are enough to begin.
            </span>
          </div>
        </div>

        <div className={`${premiumInsetStrong} relative min-w-0 p-3.5 sm:p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#F5C84C]">
                Testing command center
              </p>
              <p className="mt-0.5 text-sm text-[#94A3B8]/76">
                Build signal in order.
              </p>
            </div>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
              <Target className="size-5" aria-hidden="true" />
            </span>
          </div>

          <div className="mt-3.5 grid gap-2.5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isNext = index === nextStepIndex;
              const isLocked = !step.complete && !isNext;
              const statusLabel = step.complete ? "Done" : isNext ? "Next" : "Locked";
              const StatusIcon = step.complete
                ? CheckCircle2
                : isLocked
                  ? LockKeyhole
                  : CircleDot;

              return (
                <Link
                  key={step.label}
                  href={isLocked ? cta.href : step.href}
                  className={`${premiumInset} group relative grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[16px] p-2.5 transition-transform transition-colors hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F] sm:p-3 ${
                    isNext
                      ? "shadow-[0_14px_30px_rgba(245,200,76,0.08),inset_0_0_0_1px_rgba(245,200,76,0.22)]"
                      : ""
                  }`}
                >
                  <span
                    className={`inline-flex size-9 shrink-0 items-center justify-center rounded-2xl ${
                      step.complete
                        ? "bg-emerald-500/10 text-emerald-200"
                        : isNext
                          ? "bg-[#F5C84C]/12 text-[#F5C84C]"
                          : "bg-[#1A2238]/70 text-[#94A3B8]"
                    }`}
                  >
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#F8FAFC]">{step.label}</p>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                          step.complete
                            ? "bg-emerald-500/10 text-emerald-200"
                            : isNext
                              ? "bg-[#F5C84C]/12 text-[#FFE28A]"
                              : "bg-[#94A3B8]/10 text-[#94A3B8]"
                        }`}
                      >
                        <StatusIcon className="size-3" aria-hidden="true" />
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-4 text-[#94A3B8]/74 sm:text-sm sm:leading-5">
                      {step.helper}
                    </p>
                  </div>
                  <ArrowRight
                    className={`size-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      isLocked ? "text-[#94A3B8]/36" : "text-[#DCE8FF]/72"
                    }`}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/6 bg-[#07111F]/42 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#4F8CFF]">
              What you unlock
            </p>
            <p className="mt-0.5 text-sm leading-5 text-[#94A3B8]/76">
              Logged games unlock focused testing reads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unlocks.map((unlock) => (
              <span
                key={unlock}
                className={`${metallicBadge} rounded-full px-3 py-1.5 text-xs font-semibold text-[#DCE8FF]`}
              >
                {unlock}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NextSetupStepCard({
  title,
  copy,
  href,
  ctaLabel,
  eyebrow = "Next setup step",
  ctaVariant = "primary",
}: {
  title: string;
  copy: string;
  href: string;
  ctaLabel: string;
  eyebrow?: string;
  ctaVariant?: "primary" | "secondary";
}) {
  return (
    <section className={`${glassPanel} p-3.5 sm:p-5`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]/86">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-[#F8FAFC] sm:text-xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#94A3B8]/76 sm:mt-2 sm:leading-6">
            {copy}
          </p>
        </div>
        <Link
          href={href}
          className={`${ctaVariant === "primary" ? primaryButton : secondaryButton} h-11 shrink-0`}
        >
          {ctaLabel}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function CurrentDeckSummaryCard({
  deckName,
  archetype,
  versionName,
  isAllDecks,
}: {
  deckName: string | null | undefined;
  archetype: string | null | undefined;
  versionName: string | null | undefined;
  isAllDecks: boolean;
}) {
  const title = isAllDecks ? "All decks" : deckName ?? "No active deck yet";
  const subtitle = isAllDecks
    ? "Combined testing scope"
    : archetype?.trim() || "Archetype not set yet";
  const detail = versionName
    ? `Testing: ${versionName}`
    : isAllDecks
      ? "Review all active logs together."
      : "Add or activate a version to keep this deck focused.";
  const scopeIndicator = isAllDecks
    ? "Showing combined insights across all decks"
    : "Showing insights for this deck";

  return (
    <section className={`${glassPanel} overflow-hidden p-4 sm:p-5`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3.5 sm:gap-5">
          <span className="inline-flex shrink-0 rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(79,140,255,0.28),rgba(11,16,32,0.16)_62%,transparent_100%)] p-3.5 shadow-[0_18px_38px_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(148,163,184,0.10)]">
            <ArchetypeSprites
              archetype={isAllDecks ? null : archetype}
              size="lg"
              variant="bare"
              className="shrink-0"
              imageClassName="scale-[1.08]"
            />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                {isAllDecks ? "Current test scope" : "Current test deck"}
              </p>
              <span className={`${metallicBadge} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] leading-5 text-[#DCE8FF] whitespace-normal`}>
                {isAllDecks ? "All decks" : "Active test"}
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#F8FAFC] sm:text-[1.35rem]">
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium text-[#D6E0F0]/84 sm:text-base">
              {subtitle}
            </p>
            <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/72">
              {detail}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:max-w-[240px] sm:justify-end">
          <span className={`${premiumInset} inline-flex rounded-full px-3 py-1.5 text-xs font-semibold text-[#DCE8FF]`}>
            {scopeIndicator}
          </span>
        </div>
      </div>
    </section>
  );
}

export function DashboardContent({
  email,
  decks,
  hasAnyMatches,
  hasScopedMatches,
  hasAnyDeckVersions,
  hasProfile,
  profileIsPrivate,
  firstDeckId,
  currentDeckId,
  currentDeckName,
  currentDeckArchetype,
  currentDeckVersionName,
  reviewHref,
  stats,
  recentMatches,
  matchupSummary,
  sessionCoach,
  trainingProgress,
}: DashboardContentProps) {
  const sampledMatchups = matchupSummary.filter((matchup) => matchup.matches >= 3);
  const actionableMatchups = sampledMatchups.filter((matchup) => {
    const signal = evaluateMatchupSignal({
      matches: matchup.matches,
      wins: matchup.wins,
      losses: matchup.losses,
      ties: matchup.ties,
    });

    return signal.actionable || (matchup.matches >= 5 && matchup.losses >= 3);
  });
  const worstMatchupSource = actionableMatchups.length
    ? actionableMatchups
    : sampledMatchups;
  const worstMatchup = worstMatchupSource.reduce<MatchupSummary | null>(
    (currentWorst, matchup) => {
      if (!currentWorst) {
        return matchup;
      }

      const matchupSignal = evaluateMatchupSignal({
        matches: matchup.matches,
        wins: matchup.wins,
        losses: matchup.losses,
        ties: matchup.ties,
      });
      const currentSignal = evaluateMatchupSignal({
        matches: currentWorst.matches,
        wins: currentWorst.wins,
        losses: currentWorst.losses,
        ties: currentWorst.ties,
      });

      if (matchupSignal.score > currentSignal.score) {
        return matchup;
      }

      if (
        matchupSignal.score === currentSignal.score &&
        matchup.matches > currentWorst.matches
      ) {
        return matchup;
      }

      return currentWorst;
    },
    null
  );

  const bestMatchup = sampledMatchups.reduce<MatchupSummary | null>(
    (currentBest, matchup) => {
      if (!currentBest) {
        return matchup;
      }

      const matchupRate = parseRate(matchup.winRate);
      const bestRate = parseRate(currentBest.winRate);

      if (matchupRate > bestRate) {
        return matchup;
      }

      if (matchupRate === bestRate && matchup.matches > currentBest.matches) {
        return matchup;
      }

      return currentBest;
    },
    null
  );

  const recentRecord = recentMatches.slice(0, 5).reduce(
    (record, match) => {
      if (match.result === "win") {
        return { ...record, wins: record.wins + 1 };
      }

      if (match.result === "loss") {
        return { ...record, losses: record.losses + 1 };
      }

      return { ...record, ties: record.ties + 1 };
    },
    { wins: 0, losses: 0, ties: 0 }
  );

  const recentFormValue = recentMatches.length
    ? formatMatchRecord(recentRecord.wins, recentRecord.losses, recentRecord.ties)
    : "No games yet";
  const lossPatternValue =
    trainingProgress.lossPatternTrend ?? "No repeated issue yet";
  const nextSetupStep = !hasProfile
    ? {
        title: "Create your SixPrizer profile",
        copy: "Set your player identity now. It can stay private until you are ready to share a testing summary or matchup report.",
        href: "/profile/setup",
        ctaLabel: "Create profile",
        eyebrow: "Start here",
      }
    : decks.length === 0
      ? {
          title: "Add your first deck",
          copy: "Version tracking starts with one real deck family. Add the list you want to test first, then log games against it.",
          href: "/decks",
          ctaLabel: "Open decks",
          eyebrow: "Next setup step",
        }
      : !hasAnyDeckVersions
        ? {
            title: "Add a test version",
            copy: "A version gives SixPrizer something concrete to compare. Paste the build you actually want to log games with first.",
            href: firstDeckId ? `/decks/${firstDeckId}` : "/decks",
            ctaLabel: "Add version",
            eyebrow: "Next setup step",
          }
        : !hasAnyMatches
          ? {
              title: "Log your first game",
              copy: "One clean log starts the coaching loop. Use matchup, quality, and issue tags so the first signal is useful.",
              href: "/matches/new",
              ctaLabel: "Log a game",
              eyebrow: "Next setup step",
            }
          : stats.totalMatches < 5
            ? {
                title: "Build your first signal",
                copy: "Five to ten games is usually enough for the first useful read. Keep logging cleanly before you change the list.",
                href: "/matches/new",
                ctaLabel: "Log another game",
                eyebrow: "Build your testing signal",
                ctaVariant: "secondary" as const,
              }
            : profileIsPrivate
              ? {
                  title: "Your profile is private",
                  copy: "Keep it private if you want. When you are ready, you can share a public identity or aggregate testing summary without exposing raw logs or notes.",
                    href: "/profile",
                    ctaLabel: "Review profile settings",
                    eyebrow: "Optional sharing",
                }
              : null;
  const focusMatchup = sessionCoach?.missionFocusOpponent
    ? matchupSummary.find(
        (matchup) => matchup.opponentArchetype === sessionCoach.missionFocusOpponent
      ) ??
      worstMatchup
    : worstMatchup;
  const actionableMatchupTitle =
    sessionCoach?.missionFocusOpponent ?? focusMatchup?.opponentArchetype ?? "No clear leak yet";
  const actionableMatchupDetail = focusMatchup
    ? `${focusMatchup.winRate} across ${focusMatchup.matches} games`
    : sessionCoach?.missionFocusOpponent
      ? "This is the current coaching target. Log more games to validate the leak."
      : getLowDataLabel(stats.totalMatches, 3, "Matchup signal ready");
  const actionableMatchupTone: Tone = focusMatchup
    ? parseRate(focusMatchup.winRate) <= 45
      ? "rose"
      : parseRate(focusMatchup.winRate) >= 55
        ? "green"
        : "gold"
    : "blue";
  const whatChangedCard = trainingProgress.currentWeakestImproved
    ? {
        label: "What changed",
        title: "Matchup trending better",
        detail: "The weakest recurring matchup is trending better in recent logs.",
        tone: "green" as const,
      }
    : sessionCoach?.commonIssue
      ? {
          label: "What changed",
          title: `${sessionCoach.commonIssue.tag} is the repeat leak`,
          detail: `${sessionCoach.commonIssue.count} recent losses tagged.`,
          tone: "rose" as const,
      }
      : lossPatternValue !== "No repeated issue yet"
        ? {
            label: "What changed",
            title: lossPatternValue,
            detail: "This is the clearest repeated loss note in recent games.",
            tone: "gold" as const,
          }
        : bestMatchup
          ? {
              label: "What changed",
              title: `Best sample: ${bestMatchup.opponentArchetype}`,
              detail: `${bestMatchup.winRate} across ${bestMatchup.matches} games.`,
              tone: "blue" as const,
            }
      : {
          label: "What changed",
          title: "No clear shift yet",
          detail: "Log a few more games to reveal movement.",
          tone: "gold" as const,
      };

  const nextAction = sessionCoach
    ? {
        title: sessionCoach.missionNextAction,
        copy: sessionCoach.nextAction,
        href: sessionCoach.continueHref,
      }
    : {
        title: "Log your next game",
        copy: "A few more games will unlock a real coaching loop.",
        href: "/matches/new",
      };
  return (
    <main className={appShell}>
      <section className={`${appFrame} sixprizer-fade-in`}>
        <AppSidebar current="dashboard" />

        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="dashboard"
            eyebrow="Current workspace"
            title="Overview"
            subtitle={
              hasAnyMatches
                ? "See what to log next, what is hurting the current deck, and what changed."
                : "Finish setup to start tracking games."
            }
            userEmail={email}
            className={!hasAnyMatches ? "xl:py-4" : ""}
          />

          {!hasAnyMatches ? (
            <SetupChecklist
              hasProfile={hasProfile}
              hasDecks={decks.length > 0}
              hasAnyDeckVersions={hasAnyDeckVersions}
              firstDeckId={firstDeckId}
            />
          ) : (
            <div className="grid gap-4 sm:gap-6">
              <section className="grid gap-3">
                <CurrentDeckSummaryCard
                  deckName={currentDeckName}
                  archetype={currentDeckArchetype}
                  versionName={currentDeckVersionName}
                  isAllDecks={!currentDeckId}
                />
              </section>

              {!hasScopedMatches && currentDeckName ? (
                <section className={emptyCard}>
                  <p className="text-sm font-semibold text-[#4F8CFF]">Current deck</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                    {currentDeckName} needs games.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/72">
                    This overview is scoped to your current deck. Log a few games with {currentDeckName} before SixPrizer starts surfacing reliable patterns.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Link href="/matches/new" className={`${primaryButton} h-11`}>
                      Log first game
                      <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                    </Link>
                    <Link href={reviewHref} className={`${secondaryButton} h-11`}>
                      Open review
                    </Link>
                  </div>
                </section>
              ) : null}

              {sessionCoach && hasScopedMatches ? (
                <MissionHeroCard
                  insight={sessionCoach}
                  nextActionTitle={nextAction.title}
                  nextActionCopy={nextAction.copy}
                  reviewHref={reviewHref}
                />
              ) : null}
              {nextSetupStep ? <NextSetupStepCard {...nextSetupStep} /> : null}

              {hasScopedMatches ? (
                <>
                  <section className="grid gap-2.5 sm:gap-3 lg:grid-cols-3">
                    <KpiCard
                      icon={Activity}
                      label="Recent form"
                      value={recentFormValue}
                      helper={`Last ${Math.min(recentMatches.length, 5)} logged matches`}
                      tone="green"
                    >
                      <RecentFormDots matches={recentMatches} />
                    </KpiCard>
                    <KpiCard
                      icon={ShieldAlert}
                      label="Biggest actionable matchup"
                      value={actionableMatchupTitle}
                      helper={actionableMatchupDetail}
                      tone={actionableMatchupTone}
                    />
                    <ChangeCard
                      label={whatChangedCard.label}
                      title={whatChangedCard.title}
                      detail={whatChangedCard.detail}
                      tone={whatChangedCard.tone}
                    />
                  </section>

                  <section className={`${glassPanel} p-3.5 sm:p-5`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                          Review details
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                          Use Review for supporting evidence
                        </h2>
                        <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/72 sm:mt-2 sm:leading-6">
                          Overview stays focused on what to do now. Open Review to inspect matchup pressure, repeated tags, and other supporting patterns from your logs.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Link href={reviewHref} className={`${secondaryButton} h-11`}>
                          Open review
                        </Link>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
