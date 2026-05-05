"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ClipboardList,
  LogOut,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
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
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  appContainer,
  appShell,
  card,
  cardLarge,
  divider,
  emptyCard,
  logoOnDark,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
} from "@/components/brand-styles";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { ShareReportButton, type ShareReport } from "@/components/ShareReportButton";
import type {
  SessionCoachInsight,
  TrainingProgressSummary,
} from "@/lib/session-coach";
import { createClient } from "@/lib/supabase";

type DeckSummary = {
  id: string;
  name: string;
  archetype: string;
  created_at: string;
};

type DashboardStats = {
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: string;
  wentFirstWinRate: string;
  wentSecondWinRate: string;
};

type RecentMatch = {
  id: string;
  playedAt: string;
  deckVersionName: string;
  opponentArchetype: string;
  result: "win" | "loss";
  eventType: string | null;
};

type SummaryRow = {
  matches: number;
  wins: number;
  losses: number;
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
  stats: DashboardStats;
  recentMatches: RecentMatch[];
  matchupSummary: MatchupSummary[];
  deckPerformance: DeckPerformance[];
  trendData: TrendPoint[];
  deckPerformanceChart: DeckPerformanceChartPoint[];
  sessionCoach: SessionCoachInsight | null;
  trainingProgress: TrainingProgressSummary;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={`${card} min-h-20 p-3 sm:p-3.5`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#94A3B8]/62">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function RecordPill({ result }: { result: "win" | "loss" }) {
  const className =
    result === "win"
      ? "bg-emerald-500/12 text-emerald-300"
      : "bg-[#F43F5E]/12 text-rose-200";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${className}`}
    >
      {result}
    </span>
  );
}

function parseRate(value: string) {
  return Number.parseInt(value.replace("%", ""), 10) || 0;
}

function getMissionStatus(confidence: string) {
  const normalized = confidence.toLowerCase();

  if (normalized.includes("strong")) {
    return "Strong signal";
  }

  if (normalized.includes("building") || normalized.includes("read")) {
    return "Building signal";
  }

  return "Needs games";
}

function RecentFormDots({ matches }: { matches: RecentMatch[] }) {
  const recent = matches.slice(0, 5);
  const dots = recent.length
    ? recent
    : Array.from({ length: 5 }).map((_, index) => ({
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
                : "bg-[#1A2238]"
          }`}
        />
      ))}
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
  children,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  tone?: "blue" | "gold" | "green" | "rose";
  children?: ReactNode;
}) {
  const toneClass = {
    blue: "bg-[#4F8CFF]/10 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]",
    gold: "bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]",
    green: "bg-[#22C55E]/10 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.14)]",
    rose: "bg-[#F43F5E]/10 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]",
  }[tone];

  return (
    <div className="min-w-0 rounded-md bg-[#11182C]/62 p-3 shadow-[0_12px_34px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(248,250,252,0.035)] sm:p-3.5">
      <div className="flex items-center gap-2">
        <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md ${toneClass}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.09em] text-[#94A3B8]/76">
          {label}
        </p>
      </div>
      <p className="mt-2 truncate text-base font-bold leading-6 text-[#F8FAFC]">
        {value}
      </p>
      {children ? <div className="mt-2">{children}</div> : null}
      {helper ? (
        <p className="mt-1 text-xs leading-5 text-[#94A3B8]/66">{helper}</p>
      ) : null}
    </div>
  );
}

function MissionCoachCard({ insight }: { insight: SessionCoachInsight }) {
  const progressPercent = Math.min(
    100,
    Math.round((insight.missionProgress / insight.missionTargetCount) * 100)
  );
  const progressDots = Array.from({ length: insight.missionTargetCount }).map(
    (_, index) => index < insight.missionProgress
  );
  const status = getMissionStatus(insight.missionConfidence);
  const evidenceLabel =
    insight.missionContextSeenCount > 0
      ? `${insight.missionContextSeenCount} focus game${
          insight.missionContextSeenCount === 1 ? "" : "s"
        }`
      : "No focus evidence";

  return (
    <section className="grid gap-4 rounded-md bg-[#11182C]/82 p-4 shadow-[0_22px_58px_rgba(0,0,0,0.25),0_0_34px_rgba(245,200,76,0.045),inset_0_0_0_1px_rgba(245,200,76,0.12)] sm:p-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-md bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
            <Target className="size-4" aria-hidden="true" />
          </span>
          <ArchetypeSprites archetype={insight.archetype} className="shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/72">
            Current mission
          </span>
          <span className="rounded-md bg-[#4F8CFF]/10 px-2 py-1 text-xs font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
            {status}
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-[#F8FAFC] sm:text-3xl">
          {insight.missionTitle}
        </h2>
        <p className="mt-2 max-w-2xl truncate text-sm leading-6 text-[#94A3B8]/78">
          {insight.missionNextAction}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex max-w-full items-center gap-2 rounded-md bg-[#0B1020]/44 px-2.5 py-1.5 text-xs font-medium text-[#F8FAFC]/86 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]">
            <Sparkles className="size-3.5 shrink-0 text-[#F5C84C]" aria-hidden="true" />
            <span className="truncate">{evidenceLabel}</span>
          </span>
          <span className="inline-flex max-w-full items-center gap-2 rounded-md bg-[#0B1020]/44 px-2.5 py-1.5 text-xs font-medium text-[#94A3B8]/78 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]">
            <span className="truncate">{insight.missionContextLabel}</span>
          </span>
        </div>

        <details className="mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-[#94A3B8]/70 transition hover:bg-[#0B1020]/38 hover:text-[#F8FAFC] marker:hidden">
            Why this mission
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </summary>
          <div className="mt-2 grid gap-2 rounded-md bg-[#0B1020]/42 p-3 text-sm leading-6 text-[#94A3B8]/78 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)] sm:grid-cols-2">
            <p>{insight.missionReason}</p>
            <p>{insight.evidence}</p>
          </div>
        </details>
      </div>

      <div className="rounded-md bg-[#0B1020]/38 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.045)]">
        <Link
          href={insight.continueHref}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#F5C84C] px-5 text-sm font-bold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98]"
        >
          Log next game
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <div className="mt-4">
          <div
            className="flex items-center justify-between gap-2"
            aria-label={`${insight.missionProgress} of ${insight.missionTargetCount} games completed`}
          >
            <div className="flex items-center gap-1.5">
              {progressDots.map((complete, index) => (
                <span
                  key={index}
                  className={`size-2.5 rounded-full transition-colors ${
                    complete ? "bg-[#F5C84C]" : "bg-[#1A2238]"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-[#F8FAFC]">
              {insight.missionProgress}/{insight.missionTargetCount} games
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1A2238]/70">
            <div
              className="h-full rounded-full bg-[#F5C84C] shadow-[0_0_18px_rgba(245,200,76,0.22)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function DashboardContent({
  email,
  decks,
  hasAnyMatches,
  stats,
  recentMatches,
  matchupSummary,
  deckPerformance,
  trendData,
  deckPerformanceChart,
  sessionCoach,
  trainingProgress,
}: DashboardContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const hasMatches = stats.totalMatches > 0;
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

      return { ...record, losses: record.losses + 1 };
    },
    { wins: 0, losses: 0 }
  );
  const insights = [
    {
      label: "Overall win rate",
      value: stats.overallWinRate,
      detail: `${stats.totalMatches} match${stats.totalMatches === 1 ? "" : "es"} tracked`,
    },
    {
      label: "Worst matchup",
      value: worstMatchup?.opponentArchetype ?? "No 3-game sample",
      detail: worstMatchup
        ? `${worstMatchup.winRate} across ${worstMatchup.matches} games`
        : "Log more games to trust the signal",
    },
    {
      label: "Best deck version",
      value: bestDeckVersion?.deckVersionName ?? "No deck record yet",
      detail: bestDeckVersion
        ? `${bestDeckVersion.winRate} across ${bestDeckVersion.matches} games`
        : "Deck performance appears after logging",
    },
    {
      label: "Recent trend",
      value: `${recentRecord.wins}-${recentRecord.losses}`,
      detail: `Last ${Math.min(recentMatches.length, 5)} logged matches`,
    },
  ];
  const shareReport: ShareReport = {
    title: "Matchup Report",
    deckName: bestDeckVersion?.deckVersionName ?? "All decks",
    winRate: stats.overallWinRate,
    worstMatchup: worstMatchup?.opponentArchetype ?? "No 3-game sample",
    bestMatchup: bestMatchup?.opponentArchetype ?? "No 3-game sample",
    totalMatches: stats.totalMatches,
    context: "Your testing",
  };
  const recentFormValue = recentMatches.length
    ? `${recentRecord.wins}-${recentRecord.losses}`
    : "No games yet";
  const lossPatternValue =
    trainingProgress.lossPatternTrend ?? "No pattern yet";
  const lossPatternTone = trainingProgress.lossPatternTrend ? "rose" : "blue";
  const improvedValue = trainingProgress.improvedMatchups
    ? `${trainingProgress.improvedMatchups} improved`
    : "Awaiting comparison";
  const testsValue = trainingProgress.completedTestBlocks
    ? `${trainingProgress.completedTestBlocks} block${
        trainingProgress.completedTestBlocks === 1 ? "" : "s"
      }`
    : "First test";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className={appShell}>
      <section className={`${appContainer} prizemap-fade-in mx-auto max-w-6xl gap-4 px-0 sm:gap-5`}>
        <header className="rounded-md bg-[#0B1020]/26 p-3 shadow-[0_14px_46px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(248,250,252,0.04)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <PrizeMapLogo {...logoOnDark} />
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
                Coach home
              </h1>
              <p className="mt-1 truncate text-sm leading-6 text-[#94A3B8]/72">
                {email}
              </p>
            </div>
            <div className="flex min-w-0 flex-col gap-2 lg:items-end">
              <AppNav current="dashboard" />
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[#94A3B8]/72 transition hover:bg-white/5 hover:text-[#F8FAFC] lg:w-fit"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        {hasMatches && sessionCoach ? (
          <MissionCoachCard insight={sessionCoach} />
        ) : null}

        {hasMatches ? (
          <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <SignalCard
              icon={Activity}
              label="Recent form"
              value={recentFormValue}
              helper={`Last ${Math.min(recentMatches.length, 5)} games`}
              tone="green"
            >
              <RecentFormDots matches={recentMatches} />
            </SignalCard>
            <SignalCard
              icon={ClipboardList}
              label="Tests completed"
              value={testsValue}
              helper={
                trainingProgress.completedTestBlocks
                  ? "Stable samples banked"
                  : "Start with five games"
              }
              tone="gold"
            />
            <SignalCard
              icon={TrendingUp}
              label="Improved matchups"
              value={improvedValue}
              helper={
                trainingProgress.improvedMatchups
                  ? "Progress detected"
                  : "Finish a mission first"
              }
              tone={trainingProgress.improvedMatchups ? "green" : "blue"}
            />
            <SignalCard
              icon={ShieldAlert}
              label="Loss pattern"
              value={lossPatternValue}
              helper={
                trainingProgress.lossPatternTrend
                  ? "Review tagged losses"
                  : "No repeated issue"
              }
              tone={lossPatternTone}
            />
          </section>
        ) : null}

        {hasMatches ? (
          <details className="rounded-md bg-[#11182C]/46 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.14),inset_0_0_0_1px_rgba(248,250,252,0.032)] sm:p-4">
            <summary className="cursor-pointer list-none marker:hidden">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[#4F8CFF]/10 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)]">
                    <BarChart3 className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]/86">
                      Detailed stats
                    </p>
                    <h2 className="mt-0.5 truncate text-lg font-bold tracking-tight text-[#F8FAFC]">
                      Charts and totals
                    </h2>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[#94A3B8]/58">
                  Open
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </span>
              </div>
            </summary>
            <section className="mt-4 rounded-md bg-[#11182C]/64 p-3 shadow-[0_20px_58px_rgba(0,0,0,0.16),0_0_42px_rgba(79,140,255,0.035),inset_0_0_0_1px_rgba(248,250,252,0.035)] sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]/88">
                    Testing snapshot
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight text-[#F8FAFC]">
                    Logged games, condensed.
                  </h2>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/matches/new"
                    className={primaryButton}
                  >
                    <PrizeMapLogo
                      variant="favicon"
                      showText={false}
                      className="mr-2"
                      markClassName="size-5 bg-[#0B1020]/12 shadow-none"
                    />
                    Log next game
                  </Link>
                  <ShareReportButton report={shareReport} />
                </div>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {insights.map((insight) => (
                  <div
                    key={insight.label}
                    className="rounded-md bg-[#0B1020]/42 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.035)]"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#94A3B8]/64">
                      {insight.label}
                    </p>
                    <p className="mt-1 truncate text-lg font-bold text-[#F8FAFC] sm:text-xl">
                      {insight.value}
                    </p>
                    <p className="mt-1.5 text-xs leading-5 text-[#94A3B8]/68 sm:text-sm">
                      {insight.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </details>
        ) : null}

        {hasMatches ? (
          <details className="rounded-md bg-[#11182C]/46 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.035)] sm:p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#F8FAFC]/92 transition hover:text-[#F5C84C] marker:hidden">
              More records and charts
            </summary>
            <div className="mt-4 grid gap-4">
              <section className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
                <StatCard label="Matches" value={stats.totalMatches} />
                <StatCard label="Wins" value={stats.totalWins} />
                <StatCard label="Losses" value={stats.totalLosses} />
                <StatCard label="Win rate" value={stats.overallWinRate} />
                <StatCard label="Went first" value={stats.wentFirstWinRate} />
                <StatCard label="Went second" value={stats.wentSecondWinRate} />
              </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className={`${cardLarge} p-3 sm:p-4`}>
                <div className="flex flex-col gap-1">
                  <h2 className={sectionTitle}>
                    Result Trend
                  </h2>
                  <p className={sectionCopy}>
                    Daily wins and losses from your logged matches.
                  </p>
                </div>
                <div className="mt-3 h-64">
                  <ResponsiveContainer width="100%" height="100%">
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
                          borderRadius: 8,
                          color: "#F8FAFC",
                        }}
                        formatter={(value, name) => [
                          value,
                          name === "wins"
                            ? "Wins"
                            : name === "losses"
                              ? "Losses"
                              : name,
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="wins"
                        stroke="#22C55E"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="losses"
                        stroke="#F43F5E"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`${cardLarge} p-3 sm:p-4`}>
                <div className="flex flex-col gap-1">
                  <h2 className={sectionTitle}>
                    Deck Comparison
                  </h2>
                  <p className={sectionCopy}>
                    Win rate by deck version, sorted by matches played.
                  </p>
                </div>
                <div className="mt-3 h-64">
                  <ResponsiveContainer width="100%" height="100%">
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
                          borderRadius: 8,
                          color: "#F8FAFC",
                        }}
                        formatter={(value, name) => [
                          `${value}%`,
                          name === "winRate" ? "Win rate" : name,
                        ]}
                      />
                      <Bar dataKey="winRate" fill="#4F8CFF" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
            </div>

            <section className={`${cardLarge} p-3 sm:p-4`}>
              <div className="flex flex-col gap-1">
                <h2 className={sectionTitle}>
                  Recent Matches
                </h2>
                <p className={sectionCopy}>
                  Latest games from your testing.
                </p>
              </div>
              <div className={`mt-3 ${divider}`}>
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="grid gap-1.5 py-3 sm:grid-cols-[104px_minmax(0,1fr)_minmax(0,1.1fr)_64px_96px] sm:items-center"
                  >
                    <p className="text-sm text-[#94A3B8]/70">
                      {formatDate(match.playedAt)}
                    </p>
                    <p className="truncate font-medium text-[#F8FAFC]">
                      {match.deckVersionName}
                    </p>
                    <div className="flex min-w-0 items-center gap-2 text-sm text-[#94A3B8]/78">
                      <ArchetypeSprites archetype={match.opponentArchetype} />
                      <span className="truncate">vs {match.opponentArchetype}</span>
                    </div>
                    <RecordPill result={match.result} />
                    <p className="text-sm capitalize text-[#94A3B8]/70">
                      {match.eventType ?? "No event"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className={`${cardLarge} p-3 sm:p-4`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className={sectionTitle}>
                    Matchups
                  </h2>
                  <Link href="/matchups" className="text-sm font-medium text-[#4F8CFF]">
                    Analyze matchups
                  </Link>
                </div>
                <div className={`mt-3 ${divider}`}>
                  {matchupSummary.map((matchup) => (
                    <div
                      key={matchup.opponentArchetype}
                      className="grid gap-1.5 py-3 sm:grid-cols-[minmax(0,1fr)_64px_52px_52px_64px] sm:items-center"
                    >
                      <div className="flex items-center gap-2">
                        <ArchetypeSprites archetype={matchup.opponentArchetype} />
                        <p className="truncate font-semibold text-[#F8FAFC]">
                          {matchup.opponentArchetype}
                        </p>
                      </div>
                      <p className="text-right text-xs text-[#94A3B8]/62 sm:text-sm">
                        {matchup.matches}g
                      </p>
                      <p className="text-right text-xs text-[#94A3B8]/62 sm:text-sm">
                        {matchup.wins}W
                      </p>
                      <p className="text-right text-xs text-[#94A3B8]/62 sm:text-sm">
                        {matchup.losses}L
                      </p>
                      <p className="text-right text-sm font-bold text-[#F8FAFC]">
                        {matchup.winRate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${cardLarge} p-3 sm:p-4`}>
                <h2 className={sectionTitle}>
                  Deck Performance
                </h2>
                <div className={`mt-3 ${divider}`}>
                  {deckPerformance.map((deckVersion) => (
                    <div
                      key={deckVersion.deckVersionId}
                      className="grid gap-1.5 py-3 sm:grid-cols-[minmax(0,1fr)_64px_52px_52px_64px] sm:items-center"
                    >
                      <p className="truncate font-semibold text-[#F8FAFC]">
                        {deckVersion.deckVersionName}
                      </p>
                      <p className="text-right text-xs text-[#94A3B8]/62 sm:text-sm">
                        {deckVersion.matches}g
                      </p>
                      <p className="text-right text-xs text-[#94A3B8]/62 sm:text-sm">
                        {deckVersion.wins}W
                      </p>
                      <p className="text-right text-xs text-[#94A3B8]/62 sm:text-sm">
                        {deckVersion.losses}L
                      </p>
                      <p className="text-right text-sm font-bold text-[#F8FAFC]">
                        {deckVersion.winRate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </details>
        ) : !hasAnyMatches ? (
          <section className={emptyCard}>
            <PrizeMapLogo
              variant="app-icon"
              showText={false}
              className="mb-5"
              markClassName="size-12 bg-[#0B1020]/72 shadow-[0_0_28px_rgba(79,140,255,0.16),inset_0_0_0_1px_rgba(79,140,255,0.22)]"
            />
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              No matches logged yet.
            </h2>
            <p className={`mt-3 max-w-xl ${sectionCopy}`}>
              Log a few games and PrizeMap will point at the matchup to fix.
            </p>
            <Link
              href="/matches/new"
              className={`mt-6 ${primaryButton}`}
            >
              <PrizeMapLogo
                variant="favicon"
                showText={false}
                className="mr-2"
                markClassName="size-5 bg-[#0B1020]/12 shadow-none"
              />
              Log your next game
            </Link>
            <Link
              href="/decks"
              className={`mt-3 sm:ml-3 sm:mt-6 ${secondaryButton}`}
            >
              Manage decks
            </Link>
          </section>
        ) : null}

        <section className={`${cardLarge} p-3 sm:p-4`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={sectionTitle}>Decks</h2>
              <p className={sectionCopy}>Saved lists and versions.</p>
            </div>
            <Link href="/decks" className="inline-flex h-9 w-full items-center justify-center rounded-md bg-[#4F8CFF]/8 px-3 text-sm font-medium text-[#F8FAFC]/88 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.14)] transition hover:bg-[#4F8CFF]/14 sm:w-fit">
              Manage all
            </Link>
          </div>
          {decks.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {decks.slice(0, 6).map((deck) => (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="block min-w-0 rounded-md bg-[#0B1020]/34 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.035)] transition hover:bg-[#0B1020]/52"
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <ArchetypeSprites archetype={deck.archetype} />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[#F8FAFC]">
                          {deck.name}
                        </h3>
                        <p className="truncate text-xs text-[#94A3B8]/72">
                          {deck.archetype}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-[#4F8CFF]">
                      Manage
                    </span>
                  </div>
                </Link>
              ))}
              {decks.length > 6 ? (
                <Link
                  href="/decks"
                  className="flex min-h-16 items-center justify-center rounded-md bg-[#0B1020]/24 p-3 text-sm font-medium text-[#94A3B8]/74 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.03)] transition hover:bg-[#0B1020]/42 hover:text-[#F8FAFC]"
                >
                  View {decks.length - 6} more
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-5 rounded-md bg-[#0B1020]/38 p-4 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)]">
              <p className={sectionCopy}>No decks found yet.</p>
              <Link
                href="/decks"
                className={`mt-3 h-9 px-3 ${primaryButton}`}
              >
                Create a deck
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
