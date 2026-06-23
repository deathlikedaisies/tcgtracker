"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ShieldAlert,
  Target,
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
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import {
  formatMatchRecord,
  type MatchResult,
} from "@/lib/match-types";
import type {
  SessionCoachInsight,
  TrainingProgressSummary,
} from "@/lib/session-coach";

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
  hasAnyDeckVersions: boolean;
  hasProfile: boolean;
  profileIsPrivate: boolean;
  firstDeckId?: string;
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
}: {
  insight: SessionCoachInsight;
  nextActionTitle: string;
  nextActionCopy: string;
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
            <h1 className="text-[1.55rem] font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
              {insight.missionTitle}
            </h1>
            <p className="mt-1.5 text-sm leading-5 text-[#D6E0F0]/82 sm:mt-2 sm:text-base sm:leading-6">
              {insight.missionStatusReason}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-3">
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
          <Link href="/review" className={`${secondaryButton} h-11`}>
            Open review
          </Link>
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
  const reviewSignalHref = matchLoggingHref;
  const steps = [
    {
      label: "Create your SixPrizer profile",
      complete: hasProfile,
      helper: "It can stay private until you want to share a summary.",
      href: "/profile",
      ariaLabel: "Go to profile setup",
    },
    {
      label: "Create your first deck",
      complete: hasDecks,
      helper: "Name the list you want to test first.",
      href: "/decks",
      ariaLabel: "Create your first deck",
    },
    {
      label: "Add a test version",
      complete: hasAnyDeckVersions,
      helper: "Paste a version so matchup signal can start.",
      href: deckSetupHref,
      ariaLabel: "Add a test version",
    },
    {
      label: "Log your first game",
      complete: false,
      helper: "One logged game unlocks the coaching loop.",
      href: matchLoggingHref,
      ariaLabel: "Log your first game",
    },
    {
      label: "Build first signal",
      complete: false,
      helper: "Three to five games is enough to start seeing direction.",
      href: reviewSignalHref,
      ariaLabel: "Open review",
    },
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
    <section className={emptyCard}>
      <SixPrizerLogo
        variant="app-icon"
        showText={false}
        className="mb-5"
        markClassName="size-12 bg-[linear-gradient(180deg,rgba(11,18,32,0.84),rgba(8,14,26,0.74))] shadow-[0_0_28px_rgba(79,140,255,0.16),inset_0_0_0_1px_rgba(79,140,255,0.22)]"
      />
      <p className="text-sm font-semibold text-[#4F8CFF]">First setup</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
        Build your coaching home.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/72">
        Start with one deck, one version, and a few logged games. The dashboard gets useful quickly once signal starts forming.
      </p>

      <div className="mt-4 grid gap-2.5 sm:mt-6 sm:gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            aria-label={step.ariaLabel}
            className={`${premiumInset} group rounded-[18px] p-3 transition-transform transition-colors duration-150 ease-out hover:-translate-y-0.5 hover:text-inherit hover:shadow-[0_14px_30px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(79,140,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F] active:scale-[0.99] sm:rounded-[20px] sm:p-4`}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  step.complete
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-[#4F8CFF]/10 text-[#DCE8FF]"
                }`}
              >
                {step.complete ? "Done" : "Next"}
              </span>
              <ArrowRight
                className="size-4 text-[#94A3B8]/68 transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-[#DCE8FF] group-focus-visible:translate-x-0.5 group-focus-visible:text-[#DCE8FF]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2.5 text-base font-semibold text-[#F8FAFC]">{step.label}</p>
            <p className="mt-1 text-sm leading-5 text-[#94A3B8]/72 sm:leading-6">{step.helper}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 sm:mt-6">
        <Link href={cta.href} className={`${primaryButton} h-12 w-full sm:w-auto`}>
          {cta.label}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
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
}: {
  title: string;
  copy: string;
  href: string;
  ctaLabel: string;
  eyebrow?: string;
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
        <Link href={href} className={`${primaryButton} h-11 shrink-0`}>
          {ctaLabel}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function DashboardContent({
  email,
  decks,
  hasAnyMatches,
  hasAnyDeckVersions,
  hasProfile,
  profileIsPrivate,
  firstDeckId,
  stats,
  recentMatches,
  matchupSummary,
  sessionCoach,
  trainingProgress,
}: DashboardContentProps) {
  const sampledMatchups = matchupSummary.filter((matchup) => matchup.matches >= 3);
  const worstMatchup = sampledMatchups.reduce<MatchupSummary | null>(
    (currentWorst, matchup) => {
      if (!currentWorst) {
        return matchup;
      }

      const matchupRate = parseRate(matchup.winRate);
      const worstRate = parseRate(currentWorst.winRate);

      if (matchupRate < worstRate) {
        return matchup;
      }

      if (matchupRate === worstRate && matchup.matches > currentWorst.matches) {
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
            eyebrow="Testing overview"
            title="Overview"
            subtitle="See what improved, what is hurting you, and what to test next."
            userEmail={email}
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
              {sessionCoach ? (
                <MissionHeroCard
                  insight={sessionCoach}
                  nextActionTitle={nextAction.title}
                  nextActionCopy={nextAction.copy}
                />
              ) : null}
              {nextSetupStep ? <NextSetupStepCard {...nextSetupStep} /> : null}

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
                    <Link href={nextAction.href} className={`${primaryButton} h-11`}>
                      {nextAction.title}
                      <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                    </Link>
                    <Link href="/review" className={`${secondaryButton} h-11`}>
                      Review all insights
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
