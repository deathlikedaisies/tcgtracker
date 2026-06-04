"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronDown,
  LogOut,
  ShieldAlert,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  appFrame,
  appMain,
  appShell,
  emptyCard,
  insightCard,
  missionHeroCard,
  logoOnDark,
  pageCopy,
  primaryButton,
  secondaryPanel,
  sectionTitle,
  secondaryButton,
  statCard,
} from "@/components/brand-styles";
import { ShareReportButton, type ShareReport } from "@/components/ShareReportButton";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import {
  formatMatchRecord,
  getMatchResultLabel,
  type MatchResult,
} from "@/lib/match-types";
import type {
  SessionCoachInsight,
  TrainingProgressSummary,
} from "@/lib/session-coach";
import type { ReviewInsightCard } from "@/lib/review-analysis";
import { createClient } from "@/lib/supabase";

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

type DeckPerformance = SummaryRow & {
  deckVersionId: string;
  deckVersionName: string;
};

type TrendPoint = {
  date: string;
  label: string;
  wins: number;
  losses: number;
  ties: number;
};

type DeckPerformanceChartPoint = {
  name: string;
  matches: number;
  winRate: number;
};

type DashboardContentProps = {
  email: string;
  decks: DeckSummary[];
  hasAnyMatches: boolean;
  hasAnyDeckVersions: boolean;
  firstDeckId?: string;
  stats: DashboardStats;
  recentMatches: RecentMatch[];
  matchupSummary: MatchupSummary[];
  deckPerformance: DeckPerformance[];
  trendData: TrendPoint[];
  deckPerformanceChart: DeckPerformanceChartPoint[];
  sessionCoach: SessionCoachInsight | null;
  trainingProgress: TrainingProgressSummary;
  deckCoachInsight?: ReviewInsightCard | null;
};

type Tone = "blue" | "gold" | "green" | "rose";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

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

function ChartPlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 flex min-h-[220px] items-center justify-center rounded-2xl bg-[#07111F]/40 px-4 py-6 text-center text-sm leading-6 text-[#94A3B8]/76 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
      {children}
    </div>
  );
}

function RecordPill({ result }: { result: MatchResult }) {
  const className =
    result === "win"
      ? "bg-emerald-500/14 text-emerald-200"
      : result === "loss"
        ? "bg-[#F43F5E]/14 text-rose-200"
        : "bg-[#F5C84C]/12 text-[#FFE28A]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${className}`}
    >
      {getMatchResultLabel(result)}
    </span>
  );
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

function SectionCard({
  eyebrow,
  title,
  copy,
  action,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${secondaryPanel} p-4 sm:p-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]/86">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl">
            {title}
          </h2>
          {copy ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#94A3B8]/76">
              {copy}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
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
    <div className={statCard}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
        {label}
      </p>
      <p className={`mt-2 text-sm font-semibold ${toneClass(tone)}`}>
        <span className="inline-flex rounded-full px-2.5 py-1">{value}</span>
      </p>
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
    <div className={`${statCard} p-4`}>
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
          <p className="mt-3 text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72 sm:text-sm">
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
    <div className={`${insightCard} bg-[#07111F]/42 p-4`}>
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass(
          tone
        )}`}
      >
        {label}
      </span>
      <p className="mt-3 text-base font-semibold text-[#F8FAFC]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">{detail}</p>
    </div>
  );
}

function MetricBar({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className={statCard}>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-[#F8FAFC]">{label}</p>
        <p className="shrink-0 text-sm font-bold text-[#F8FAFC]">{value}%</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#10192B]">
        <div
          className={`h-2 rounded-full ${
            tone === "green"
              ? "bg-emerald-400"
              : tone === "rose"
                ? "bg-[#F43F5E]"
                : tone === "gold"
                  ? "bg-[#F5C84C]"
                  : "bg-[#4F8CFF]"
          }`}
          style={{ width: `${Math.max(value, value > 0 ? 6 : 0)}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-[#94A3B8]/72">{detail}</p>
    </div>
  );
}

function RecentFormPanel({ matches }: { matches: RecentMatch[] }) {
  const preview = matches.slice(0, 4);

  if (!preview.length) {
    return (
      <div className={`${statCard} p-4 text-sm text-[#94A3B8]/72`}>
        First test in progress. Log 3 more games to unlock a real trend.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <RecentFormDots matches={matches} />
        <p className="text-xs font-medium text-[#94A3B8]/72">
          Last {Math.min(matches.length, 6)} logged
        </p>
      </div>
      {preview.map((match) => (
        <div key={match.id} className={statCard}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                vs {match.opponentArchetype}
              </p>
              <p className="mt-1 truncate text-xs text-[#94A3B8]/72">
                {match.deckVersionName} / {formatDate(match.playedAt)}
              </p>
            </div>
            <RecordPill result={match.result} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TurnOrderPanel({
  firstRate,
  secondRate,
}: {
  firstRate: string;
  secondRate: string;
}) {
  const rows = [
    {
      label: "First",
      value: firstRate,
      width: parseRate(firstRate),
      tone: "bg-[#4F8CFF]",
    },
    {
      label: "Second",
      value: secondRate,
      width: parseRate(secondRate),
      tone: "bg-[#F5C84C]",
    },
  ];

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label} className={statCard}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#F8FAFC]">{row.label}</p>
            <p className="text-sm font-bold text-[#F8FAFC]">{row.value}</p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#10192B]">
            <div
              className={`h-2 rounded-full ${row.tone}`}
              style={{ width: `${Math.max(row.width, row.width > 0 ? 8 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function MissionHeroCard({
  insight,
  nextActionTitle,
  nextActionCopy,
  deckCoachInsight,
}: {
  insight: SessionCoachInsight;
  nextActionTitle: string;
  nextActionCopy: string;
  deckCoachInsight?: ReviewInsightCard | null;
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
    <section className={`grid gap-4 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.5fr)_360px] ${missionHeroCard} bg-[linear-gradient(180deg,rgba(14,24,42,0.96),rgba(8,17,31,0.91))] shadow-[0_22px_52px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.12)]`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
            <Target className="size-5" aria-hidden="true" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/76">
            Current mission
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass(
              badge.tone
            )}`}
          >
            {badge.label}
          </span>
          <span className="rounded-full bg-[#07111F]/58 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
            {insight.missionGuidanceLabel}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ArchetypeSprites archetype={insight.archetype} size="md" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
              {insight.missionTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#D6E0F0]/82 sm:text-base">
              {insight.missionStatusReason}
            </p>
          </div>
        </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatusChip
            label="Mission mode"
            value={insight.missionGuidanceLabel}
            tone="blue"
          />
          <StatusChip
            label="Evidence"
            value={`${insight.missionContextSeenCount}/${insight.missionContextTargetCount} ${insight.missionContextLabel.toLowerCase()}`}
            tone="gold"
          />
          <StatusChip
            label="Signal state"
            value={insight.missionStatusLabel}
            tone="green"
          />
        </div>

        <details className="mt-4">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-xl bg-[#07111F]/42 px-3 py-2 text-sm font-semibold text-[#DCE8FF] transition hover:bg-[#07111F]/58 marker:hidden">
            Why this mission
            <ChevronDown className="size-4" aria-hidden="true" />
          </summary>
          <div className="mt-3 grid gap-2 rounded-2xl bg-[#0B1020]/52 p-4 text-sm leading-6 text-[#94A3B8]/76 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] lg:grid-cols-2">
            <p>{insight.missionReason}</p>
            <p>{insight.evidence}</p>
          </div>
        </details>
      </div>

      <div className="flex flex-col rounded-[24px] bg-[linear-gradient(180deg,rgba(11,18,32,0.76),rgba(8,15,28,0.70))] p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              Progress
            </p>
            <p className="mt-1 text-lg font-semibold text-[#F8FAFC]">
              {insight.missionProgress}/{insight.missionTargetCount} games
            </p>
          </div>
          <span className="rounded-full bg-[#0B1020]/72 px-3 py-1 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
            {insight.missionStatusLabel}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2" aria-label="Mission progress">
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

        <p className="mt-3 text-sm font-medium text-[#D6E0F0]">
          {insight.progressFeedback}
        </p>

        <div className="mt-3 rounded-2xl bg-[#0B1020]/60 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Why this matters
          </p>
          <p className="mt-1 text-sm leading-5 text-[#D6E0F0]/82">
            {insight.whyThisMatters}
          </p>
        </div>

        <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#F5C84C]/8 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#F5C84C]/72">
            Reward
          </span>
          <span className="text-xs font-semibold text-[#F5C84C]">
            {insight.rewardLabel}
          </span>
        </div>

        <div className="mt-3 rounded-2xl bg-[#0B1020]/60 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            Next move
          </p>
          <p className="mt-2 text-base font-semibold text-[#F8FAFC]">
            {nextActionTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
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

        <div className="mt-5 grid gap-2">
          <Link href={primaryHref} className={`${primaryButton} h-12`}>
            {primaryLabel}
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
          <Link href="/matchups" className={`${secondaryButton} h-11`}>
            Review matchup data
          </Link>
        </div>
      </div>

      {deckCoachInsight ? (
        <div className="xl:col-span-2 mt-0 rounded-[18px] bg-[#0B1020]/60 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="inline-flex size-6 items-center justify-center rounded-[8px] bg-[#F5C84C]/12 text-[10px] font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                  TC
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/52">
                  Coach says
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                  {deckCoachInsight.title}
                </p>
                <p className={`mt-0.5 truncate text-xs font-medium ${
                  deckCoachInsight.tone === "rose" ? "text-rose-300" :
                  deckCoachInsight.tone === "emerald" ? "text-emerald-300" :
                  deckCoachInsight.tone === "gold" ? "text-[#F5C84C]" :
                  "text-[#B8D1FF]"
                }`}>
                  {deckCoachInsight.evidence}
                </p>
              </div>
            </div>
            <Link
              href="/review"
              className="shrink-0 inline-flex h-8 items-center justify-center rounded-[10px] bg-[#F5C84C] px-3 text-xs font-bold text-[#0B1020] shadow-[0_8px_20px_rgba(245,200,76,0.18)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0"
            >
              Open Review
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SetupChecklist({
  hasDecks,
  hasAnyDeckVersions,
  firstDeckId,
}: {
  hasDecks: boolean;
  hasAnyDeckVersions: boolean;
  firstDeckId?: string;
}) {
  const steps = [
    {
      label: "Create your first deck",
      complete: hasDecks,
      helper: "Name the list you want to test first.",
    },
    {
      label: "Add a test version",
      complete: hasAnyDeckVersions,
      helper: "Paste a version so matchup signal can start.",
    },
    {
      label: "Log your first game",
      complete: false,
      helper: "One logged game unlocks the coaching loop.",
    },
    {
      label: "Build first signal",
      complete: false,
      helper: "Three to five games is enough to start seeing direction.",
    },
  ];

  const cta = !hasDecks
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
        markClassName="size-12 bg-[#0B1020]/72 shadow-[0_0_28px_rgba(79,140,255,0.16),inset_0_0_0_1px_rgba(79,140,255,0.22)]"
      />
      <p className="text-sm font-semibold text-[#4F8CFF]">First setup</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
        Build your coaching home.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/72">
        Start with one deck, one version, and a few logged games. The dashboard gets useful quickly once signal starts forming.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.label}
            className="rounded-[20px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
          >
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                  step.complete
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-[#4F8CFF]/10 text-[#DCE8FF]"
                }`}
              >
                {step.complete ? "Done" : "Next"}
              </span>
            </div>
            <p className="mt-3 text-base font-semibold text-[#F8FAFC]">{step.label}</p>
            <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">{step.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href={cta.href} className={`${primaryButton} h-12 w-full sm:w-auto`}>
          {cta.label}
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
  firstDeckId,
  stats,
  recentMatches,
  matchupSummary,
  deckPerformance,
  trendData,
  deckPerformanceChart,
  sessionCoach,
  trainingProgress,
  deckCoachInsight,
}: DashboardContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const [insightsOpen, setInsightsOpen] = useState(false);

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

  const bestDeckVersion = deckPerformance.reduce<DeckPerformance | null>(
    (currentBest, deckVersion) => {
      if (!currentBest) {
        return deckVersion;
      }

      const deckRate = parseRate(deckVersion.winRate);
      const bestRate = parseRate(currentBest.winRate);

      if (deckRate > bestRate) {
        return deckVersion;
      }

      if (deckRate === bestRate && deckVersion.matches > currentBest.matches) {
        return deckVersion;
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
  const turnOrderDelta =
    stats.wentFirstWinRate === "N/A" || stats.wentSecondWinRate === "N/A"
      ? null
      : parseRate(stats.wentFirstWinRate) - parseRate(stats.wentSecondWinRate);
  const activeDeck =
    decks.find((deck) => deck.deck_versions?.some((version) => version.is_active)) ??
    decks[0] ??
    null;
  const activeVersion =
    activeDeck?.deck_versions?.find((version) => version.is_active) ??
    activeDeck?.deck_versions?.[0] ??
    null;
  const focusMatchup = sessionCoach?.missionFocusOpponent
    ? matchupSummary.find(
        (matchup) => matchup.opponentArchetype === sessionCoach.missionFocusOpponent
      ) ??
      worstMatchup
    : worstMatchup;
  const matchupPreview = matchupSummary.slice(0, 5);
  const deckPreview = deckPerformance.slice(0, 4);
  const issueChips = [
    sessionCoach?.commonIssue?.tag,
    trainingProgress.lossPatternTrend,
  ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);
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

  const shareReport: ShareReport = {
    title: "Matchup Report",
    deckName: bestDeckVersion?.deckVersionName ?? "All decks",
    winRate: stats.overallWinRate,
    worstMatchup: worstMatchup?.opponentArchetype ?? "No 3-game sample",
    bestMatchup: bestMatchup?.opponentArchetype ?? "No 3-game sample",
    totalMatches: stats.totalMatches,
    context: "Your testing",
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className={appShell}>
      <section className={`${appFrame} sixprizer-fade-in`}>
        <AppSidebar
          current="dashboard"
          insight={{
            label: "Next action",
            value: sessionCoach?.missionTitle ?? "Log games to unlock coaching",
            helper: sessionCoach
              ? `${sessionCoach.missionProgress}/${sessionCoach.missionTargetCount} games`
              : "Start with a five-game sample",
          }}
        />

        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <header className="rounded-[24px] bg-[linear-gradient(180deg,rgba(11,16,32,0.92),rgba(7,17,31,0.84))] p-4 shadow-[0_18px_46px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(148,163,184,0.10)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <SixPrizerLogo {...logoOnDark} />
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
                  Overview
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]/72">
                  See what improved, what is hurting you, and what to test next.
                </p>
                <p className="mt-1 truncate text-xs text-[#94A3B8]/62">{email}</p>
              </div>

              <div className="flex min-w-0 flex-col gap-2 lg:items-end">
                <div className="lg:hidden">
                  <AppNav current="dashboard" />
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[#94A3B8]/72 transition hover:bg-white/5 hover:text-[#F8FAFC] lg:w-fit"
                >
                  <LogOut className="size-3.5" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>
          </header>

          {!hasAnyMatches ? (
            <SetupChecklist
              hasDecks={decks.length > 0}
              hasAnyDeckVersions={hasAnyDeckVersions}
              firstDeckId={firstDeckId}
            />
          ) : (
            <div className="grid gap-6">
              {sessionCoach ? (
                <MissionHeroCard
                  insight={sessionCoach}
                  nextActionTitle={nextAction.title}
                  nextActionCopy={nextAction.copy}
                  deckCoachInsight={deckCoachInsight}
                />
              ) : deckCoachInsight ? (
                <section className="rounded-[24px] bg-[linear-gradient(180deg,rgba(12,20,36,0.94),rgba(8,16,29,0.90))] p-5 shadow-[0_18px_46px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(245,200,76,0.22)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-[12px] bg-[#F5C84C]/12 text-xs font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                      TC
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/58">
                      Coach says
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-tight text-[#F8FAFC]">
                    {deckCoachInsight.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#D6E0F0]/82">
                    {deckCoachInsight.explanation}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={`text-sm font-medium ${deckCoachInsight.tone === "rose" ? "text-rose-200" : deckCoachInsight.tone === "emerald" ? "text-emerald-300" : deckCoachInsight.tone === "gold" ? "text-[#F5C84C]" : "text-[#B8D1FF]"}`}>
                      {deckCoachInsight.evidence}
                    </p>
                    <Link href="/review" className="shrink-0 inline-flex h-10 items-center justify-center rounded-[14px] bg-[#F5C84C] px-4 text-sm font-bold text-[#0B1020] shadow-[0_10px_28px_rgba(245,200,76,0.20)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0">
                      Open Review
                    </Link>
                  </div>
                </section>
              ) : null}

              <section className="grid gap-3 lg:grid-cols-3">
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setInsightsOpen((value) => !value)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#4F8CFF]/18 bg-[#0B1020]/42 px-3.5 text-sm font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.10)] transition hover:-translate-y-0.5 hover:bg-[#10192B] active:translate-y-0 active:scale-[0.98]"
                  aria-expanded={insightsOpen}
                >
                  {insightsOpen ? "Hide insights" : "More insights"}
                  <ChevronDown
                    className={`size-4 transition-transform ${insightsOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <SectionCard
                eyebrow="Analytics overview"
                title="Visible coaching signal"
                copy="Useful analytics stay on the page. Deep charts stay below."
                className={insightsOpen ? "" : "hidden"}
                action={
                  <Link href={nextAction.href} className={`${primaryButton} h-11`}>
                    {nextAction.title}
                    <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                  </Link>
                }
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <div className="grid gap-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                              Matchup pressure
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                              Top matchup samples
                            </h3>
                          </div>
                          <Link href="/matchups" className="text-sm font-semibold text-[#B8D1FF]">
                            Review
                          </Link>
                        </div>
                        <div className="mt-4 grid gap-3">
                          {matchupPreview.length ? (
                            matchupPreview.map((matchup) => (
                              <MetricBar
                                key={matchup.opponentArchetype}
                                label={matchup.opponentArchetype}
                                value={parseRate(matchup.winRate)}
                                detail={`${matchup.matches} games / ${matchup.wins}W ${matchup.losses}L ${matchup.ties}T`}
                                tone={
                                  parseRate(matchup.winRate) >= 55
                                    ? "green"
                                    : parseRate(matchup.winRate) <= 45
                                      ? "rose"
                                      : "blue"
                                }
                              />
                            ))
                          ) : (
                            <div className="rounded-2xl bg-[#07111F]/42 p-4 text-sm text-[#94A3B8]/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              {getLowDataLabel(stats.totalMatches, 3, "Matchup signal ready")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                          Turn-order split
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                          First vs second
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                          {turnOrderDelta === null
                            ? "No meaningful split yet. Keep logging clean first and second samples."
                            : turnOrderDelta >= 0
                              ? "You are currently performing better going first."
                              : "Going second is currently holding up better."}
                        </p>
                        <div className="mt-4">
                          <TurnOrderPanel
                            firstRate={stats.wentFirstWinRate}
                            secondRate={stats.wentSecondWinRate}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                            Deck version trend
                          </p>
                          <h3 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                            Current experiment read
                          </h3>
                        </div>
                        <Link href="/decks" className="text-sm font-semibold text-[#B8D1FF]">
                          Manage
                        </Link>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {deckPreview.length ? (
                          deckPreview.map((deckVersion) => (
                            <MetricBar
                              key={deckVersion.deckVersionId}
                              label={deckVersion.deckVersionName}
                              value={parseRate(deckVersion.winRate)}
                              detail={`${deckVersion.matches} games / ${deckVersion.wins}W ${deckVersion.losses}L ${deckVersion.ties}T`}
                              tone={
                                parseRate(deckVersion.winRate) >= 55
                                  ? "green"
                                  : parseRate(deckVersion.winRate) <= 45
                                    ? "rose"
                                    : "blue"
                              }
                            />
                          ))
                        ) : (
                          <div className="rounded-2xl bg-[#07111F]/42 p-4 text-sm text-[#94A3B8]/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] sm:col-span-2">
                            Needs another version to compare.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                        Current signal
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                        What is hurting you
                      </h3>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {issueChips.length ? (
                          issueChips.map((chip) => (
                            <span
                              key={chip}
                              className="rounded-full bg-[#F43F5E]/10 px-3 py-1.5 text-xs font-semibold text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.14)]"
                            >
                              {chip}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-[#4F8CFF]/10 px-3 py-1.5 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                            No repeated issue yet
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#94A3B8]/72">
                        {sessionCoach?.commonIssue
                          ? `${sessionCoach.commonIssue.count} recent losses point to the clearest repeatable leak.`
                          : "Keep using tags after matches to sharpen recurring issue detection."}
                      </p>
                    </div>

                    <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                        Recent form
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                        Last logged games
                      </h3>
                      <div className="mt-4">
                        <RecentFormPanel matches={recentMatches} />
                      </div>
                    </div>

                    <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                        Next best action
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                        {nextAction.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                        {nextAction.copy}
                      </p>
                      <Link href={nextAction.href} className={`${secondaryButton} mt-4 h-11`}>
                        Open next step
                      </Link>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Active experiment"
                title="Decks and versions"
                copy="Keep the current list visible, then manage deeper deck records below."
                className={insightsOpen ? "" : "hidden"}
                action={
                  <Link href="/decks" className={`${secondaryButton} h-11`}>
                    Manage decks
                  </Link>
                }
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(12,20,36,0.84),rgba(8,16,29,0.82))] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    {activeDeck ? (
                      <div className="grid gap-4">
                        <div className="flex items-start gap-3">
                          <ArchetypeSprites archetype={activeDeck.archetype} size="md" className="shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                              Active deck
                            </p>
                            <h3 className="mt-1 truncate text-xl font-semibold text-[#F8FAFC]">
                              {activeDeck.name}
                            </h3>
                            <p className="mt-1 text-sm text-[#94A3B8]/72">
                              {activeDeck.archetype}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[#07111F]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Current version
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                              {activeVersion?.name ?? "No active version set"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[#07111F]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Current read
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                              {bestDeckVersion?.deckVersionName === activeVersion?.name
                                ? "Leading version"
                                : activeVersion
                                  ? "Under active test"
                                  : "Needs version setup"}
                            </p>
                          </div>
                        </div>

                        <Link href={`/decks/${activeDeck.id}`} className={`${primaryButton} h-11 w-full sm:w-auto`}>
                          Manage active deck
                        </Link>
                      </div>
                    ) : (
                      <div className="text-sm text-[#94A3B8]/72">
                        No decks yet. Create one to start version testing.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {decks.slice(0, 6).map((deck) => {
                      const deckActiveVersion =
                        deck.deck_versions?.find((version) => version.is_active) ??
                        deck.deck_versions?.[0] ??
                        null;

                      return (
                        <Link
                          key={deck.id}
                          href={`/decks/${deck.id}`}
                          className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.08)] transition hover:-translate-y-0.5 hover:bg-[#0B1020]/58"
                        >
                          <div className="flex items-center gap-3">
                            <ArchetypeSprites archetype={deck.archetype} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                                {deck.name}
                              </p>
                              <p className="truncate text-xs text-[#94A3B8]/72">
                                {deck.archetype}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                              Active version
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-[#F8FAFC]">
                              {deckActiveVersion?.name ?? "No active version set"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                    {!decks.length ? (
                      <div className="rounded-[22px] bg-[#07111F]/42 p-4 text-sm text-[#94A3B8]/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        Create your first deck to unlock experiment tracking.
                      </div>
                    ) : null}
                  </div>
                </div>
              </SectionCard>

              <details
                className={`rounded-[26px] bg-[linear-gradient(180deg,rgba(14,24,42,0.92),rgba(8,17,31,0.88))] p-4 shadow-[0_16px_38px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(148,163,184,0.09)] ${insightsOpen ? "" : "hidden"}`}
                onToggle={(event) => setInsightsOpen(event.currentTarget.open)}
              >
                <summary className="cursor-pointer list-none marker:hidden">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#4F8CFF]/10 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                        <BarChart3 className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]/86">
                          Deep records
                        </p>
                        <h2 className="truncate text-lg font-bold tracking-tight text-[#F8FAFC]">
                          Full charts and tables
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShareReportButton report={shareReport} />
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#94A3B8]/68">
                        More
                        <ChevronDown className="size-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </summary>

                <div className="mt-5 grid gap-4">
                  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                    {[
                      { label: "Matches", value: stats.totalMatches },
                      { label: "Wins", value: stats.totalWins },
                      { label: "Losses", value: stats.totalLosses },
                      { label: "Ties", value: stats.totalTies },
                      { label: "Win rate", value: stats.overallWinRate },
                      { label: "Went first", value: stats.wentFirstWinRate },
                      { label: "Went second", value: stats.wentSecondWinRate },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                          {stat.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold tracking-tight text-[#F8FAFC]">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </section>

                  <section className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <h2 className={sectionTitle}>Result trend</h2>
                      <p className={pageCopy}>Daily wins, losses, and ties from your logged matches.</p>
                      {insightsOpen && trendData.length ? (
                        <div className="mt-4 h-64 min-h-[256px] min-w-0">
                          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                            <LineChart data={trendData}>
                              <CartesianGrid stroke="rgba(148,163,184,0.22)" vertical={false} />
                              <XAxis
                                dataKey="label"
                                tick={{ fill: "#94A3B8", fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fill: "#94A3B8", fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  background: "#0B1020",
                                  border: "1px solid rgba(148,163,184,0.18)",
                                  borderRadius: 12,
                                  color: "#F8FAFC",
                                }}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="wins" stroke="#22C55E" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="losses" stroke="#F43F5E" strokeWidth={2} dot={false} />
                              <Line type="monotone" dataKey="ties" stroke="#F5C84C" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <ChartPlaceholder>
                          {insightsOpen
                            ? "Log more games to build a result trend."
                            : "Open this section to view charts."}
                        </ChartPlaceholder>
                      )}
                    </div>

                    <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <h2 className={sectionTitle}>Deck comparison</h2>
                      <p className={pageCopy}>Win rate by deck version, sorted by matches played.</p>
                      {insightsOpen && deckPerformanceChart.length ? (
                        <div className="mt-4 h-64 min-h-[256px] min-w-0">
                          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                            <BarChart data={deckPerformanceChart} layout="vertical">
                              <CartesianGrid stroke="rgba(148,163,184,0.22)" horizontal={false} />
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fill: "#94A3B8", fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={120}
                                tick={{ fill: "#94A3B8", fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  background: "#0B1020",
                                  border: "1px solid rgba(148,163,184,0.18)",
                                  borderRadius: 12,
                                  color: "#F8FAFC",
                                }}
                              />
                              <Bar dataKey="winRate" fill="#4F8CFF" radius={[0, 10, 10, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <ChartPlaceholder>
                          {insightsOpen
                            ? "Add another deck version to compare testing results."
                            : "Open this section to view charts."}
                        </ChartPlaceholder>
                      )}
                    </div>
                  </section>

                  <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className={sectionTitle}>Recent matches</h2>
                        <Link href="/matches" className="text-sm font-semibold text-[#B8D1FF]">
                          All matches
                        </Link>
                      </div>
                      <div className="mt-4 grid gap-3">
                        {recentMatches.length ? (
                          recentMatches.map((match) => (
                            <div
                              key={match.id}
                              className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                                    {match.deckVersionName}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-[#94A3B8]/72">
                                    vs {match.opponentArchetype} / {formatDate(match.playedAt)}
                                  </p>
                                </div>
                                <RecordPill result={match.result} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-[#0B1020]/66 p-3 text-sm text-[#94A3B8]/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                            No logged matches yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        <div className="flex items-center justify-between gap-3">
                          <h2 className={sectionTitle}>Matchups</h2>
                          <Link href="/matchups" className="text-sm font-semibold text-[#B8D1FF]">
                            Analyze
                          </Link>
                        </div>
                        <div className="mt-4 grid gap-3">
                          {matchupSummary.slice(0, 6).length ? (
                            matchupSummary.slice(0, 6).map((matchup) => (
                              <MetricBar
                                key={matchup.opponentArchetype}
                                label={matchup.opponentArchetype}
                                value={parseRate(matchup.winRate)}
                                detail={`${matchup.matches} games / ${matchup.wins}W ${matchup.losses}L ${matchup.ties}T`}
                                tone={
                                  parseRate(matchup.winRate) >= 55
                                    ? "green"
                                    : parseRate(matchup.winRate) <= 45
                                      ? "rose"
                                      : "blue"
                                }
                              />
                            ))
                          ) : (
                            <div className="rounded-2xl bg-[#0B1020]/66 p-3 text-sm text-[#94A3B8]/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              {getLowDataLabel(stats.totalMatches, 3, "Matchup summary ready")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                        <h2 className={sectionTitle}>Deck performance</h2>
                        <div className="mt-4 grid gap-3">
                          {deckPerformance.slice(0, 6).length ? (
                            deckPerformance.slice(0, 6).map((deckVersion) => (
                              <div
                                key={deckVersion.deckVersionId}
                                className="rounded-2xl bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                                    {deckVersion.deckVersionName}
                                  </p>
                                  <p className="text-sm font-bold text-[#F8FAFC]">
                                    {deckVersion.winRate}
                                  </p>
                                </div>
                                <p className="mt-1 text-xs text-[#94A3B8]/72">
                                  {deckVersion.matches} games / {deckVersion.wins}W {deckVersion.losses}L {deckVersion.ties}T
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl bg-[#0B1020]/66 p-3 text-sm text-[#94A3B8]/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                              Needs another version to compare.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </details>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
