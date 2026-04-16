"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  inputH10,
  label,
  logoOnDark,
  pageCopy,
  pageHeader,
  pageTitle,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
} from "@/components/brand-styles";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { ShareReportButton, type ShareReport } from "@/components/ShareReportButton";
import { createClient } from "@/lib/supabase";

type DeckSummary = {
  id: string;
  name: string;
  archetype: string;
  format: string | null;
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
  format: string | null;
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
  selectedFormat: string;
  formatOptions: string[];
  hasAnyMatches: boolean;
  stats: DashboardStats;
  recentMatches: RecentMatch[];
  matchupSummary: MatchupSummary[];
  deckPerformance: DeckPerformance[];
  trendData: TrendPoint[];
  deckPerformanceChart: DeckPerformanceChartPoint[];
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
    <div className={card}>
      <p className="text-xs font-medium uppercase text-[#94A3B8]/74">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[#F8FAFC] sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function RecordPill({ result }: { result: "win" | "loss" }) {
  const className =
    result === "win"
      ? "bg-emerald-500/15 text-emerald-300"
      : "bg-[#F43F5E]/15 text-rose-200";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium uppercase ${className}`}
    >
      {result}
    </span>
  );
}

function parseRate(value: string) {
  return Number.parseInt(value.replace("%", ""), 10) || 0;
}

export function DashboardContent({
  email,
  decks,
  selectedFormat,
  formatOptions,
  hasAnyMatches,
  stats,
  recentMatches,
  matchupSummary,
  deckPerformance,
  trendData,
  deckPerformanceChart,
}: DashboardContentProps) {
  const router = useRouter();
  const supabase = createClient();
  const hasMatches = stats.totalMatches > 0;
  const selectedFormatLabel =
    selectedFormat === "all" ? "Saved history" : selectedFormat;
  const worstMatchup = matchupSummary.reduce<MatchupSummary | null>(
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
  const bestMatchup = matchupSummary.reduce<MatchupSummary | null>(
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
      value: worstMatchup?.opponentArchetype ?? "No matchup yet",
      detail: worstMatchup
        ? `${worstMatchup.winRate} across ${worstMatchup.matches} games`
        : "Log more games to find pressure points",
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
    title: `${selectedFormatLabel} Matchup Report`,
    deckName: bestDeckVersion?.deckVersionName ?? "All decks",
    winRate: stats.overallWinRate,
    worstMatchup: worstMatchup?.opponentArchetype ?? "No matchup yet",
    bestMatchup: bestMatchup?.opponentArchetype ?? "No matchup yet",
    totalMatches: stats.totalMatches,
    context: selectedFormatLabel,
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className={appShell}>
      <section className={`${appContainer} max-w-6xl`}>
        <div className={pageHeader}>
          <div>
            <PrizeMapLogo {...logoOnDark} />
            <h1 className={pageTitle}>
              Dashboard
            </h1>
            <p className={pageCopy}>{email}</p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <AppNav current="dashboard" />
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-white/5 hover:text-[#F8FAFC] lg:w-fit"
            >
              Sign out
            </button>
          </div>
        </div>

        {hasMatches ? (
          <section className="rounded-md bg-[#11182C]/78 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28),0_0_50px_rgba(79,140,255,0.08),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#4F8CFF]">
                  Insight strip
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                  Testing signal for {selectedFormatLabel}.
                </h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href="/matches/new"
                  className={primaryButton}
                >
                  Log match
                </Link>
                <ShareReportButton report={shareReport} />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {insights.map((insight) => (
                <div
                  key={insight.label}
                  className="rounded-md bg-[#0B1020]/44 p-4 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]"
                >
                  <p className="text-xs font-medium uppercase text-[#94A3B8]">
                    {insight.label}
                  </p>
                  <p className="mt-2 truncate text-lg font-semibold text-[#F8FAFC] sm:text-xl">
                    {insight.value}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#94A3B8] sm:text-sm">
                    {insight.detail}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <form action="/dashboard" className="rounded-md bg-[#11182C]/48 p-4 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2 sm:min-w-80">
              <label
                htmlFor="format"
                className={label}
              >
                Match set
              </label>
              <select
                id="format"
                name="format"
                defaultValue={selectedFormat}
                className={inputH10}
              >
                {formatOptions.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
                <option value="all">Saved history</option>
              </select>
            </div>
            <button type="submit" className={secondaryButton}>
              Apply
            </button>
          </div>
        </form>

        {hasMatches ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <StatCard label="Matches" value={stats.totalMatches} />
              <StatCard label="Wins" value={stats.totalWins} />
              <StatCard label="Losses" value={stats.totalLosses} />
              <StatCard label="Win rate" value={stats.overallWinRate} />
              <StatCard label="Went first" value={stats.wentFirstWinRate} />
              <StatCard label="Went second" value={stats.wentSecondWinRate} />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className={cardLarge}>
                <div className="flex flex-col gap-1">
                  <h2 className={sectionTitle}>
                    Result Trend
                  </h2>
                  <p className={sectionCopy}>
                    Daily wins and losses for {selectedFormatLabel}.
                  </p>
                </div>
                <div className="mt-5 h-72">
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

              <div className={cardLarge}>
                <div className="flex flex-col gap-1">
                  <h2 className={sectionTitle}>
                    Deck Comparison
                  </h2>
                  <p className={sectionCopy}>
                    Win rate by deck version, sorted by matches played.
                  </p>
                </div>
                <div className="mt-5 h-72">
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

            <section className={cardLarge}>
              <div className="flex flex-col gap-1">
                <h2 className={sectionTitle}>
                  Recent Matches
                </h2>
                <p className={sectionCopy}>
                  Latest games for {selectedFormatLabel}.
                </p>
              </div>
              <div className={`mt-5 ${divider}`}>
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="grid gap-2 py-4 sm:grid-cols-[110px_minmax(0,1fr)_minmax(0,1.1fr)_76px_110px] sm:items-center"
                  >
                    <p className="text-sm text-[#94A3B8]">
                      {formatDate(match.playedAt)}
                    </p>
                    <p className="font-medium text-[#F8FAFC]">
                      {match.deckVersionName}
                    </p>
                    <div className="flex min-w-0 items-center gap-2 text-sm text-[#94A3B8]">
                      <ArchetypeSprites archetype={match.opponentArchetype} />
                      <span className="truncate">vs {match.opponentArchetype}</span>
                    </div>
                    <RecordPill result={match.result} />
                    <p className="text-sm capitalize text-[#94A3B8]">
                      {match.eventType ?? "No event"}
                    </p>
                    {selectedFormat === "all" ? (
                      <p className="text-sm text-[#94A3B8]">
                        {match.format ?? "No format"}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className={cardLarge}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className={sectionTitle}>
                    Matchups
                  </h2>
                  <Link href="/matchups" className="text-sm font-medium text-[#4F8CFF]">
                    Analyze matchups
                  </Link>
                </div>
                <div className={`mt-5 ${divider}`}>
                  {matchupSummary.map((matchup) => (
                    <div
                      key={matchup.opponentArchetype}
                      className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_80px] sm:items-center"
                    >
                      <div className="flex items-center gap-2">
                        <ArchetypeSprites archetype={matchup.opponentArchetype} />
                        <p className="font-medium text-[#F8FAFC]">
                          {matchup.opponentArchetype}
                        </p>
                      </div>
                      <p className="text-sm text-[#94A3B8]">
                        {matchup.matches} played
                      </p>
                      <p className="text-sm text-[#94A3B8]">
                        {matchup.wins} W
                      </p>
                      <p className="text-sm text-[#94A3B8]">
                        {matchup.losses} L
                      </p>
                      <p className="text-sm font-medium text-[#F8FAFC]">
                        {matchup.winRate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cardLarge}>
                <h2 className={sectionTitle}>
                  Deck Performance
                </h2>
                <div className={`mt-5 ${divider}`}>
                  {deckPerformance.map((deckVersion) => (
                    <div
                      key={deckVersion.deckVersionId}
                      className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_80px] sm:items-center"
                    >
                      <p className="font-medium text-[#F8FAFC]">
                        {deckVersion.deckVersionName}
                      </p>
                      <p className="text-sm text-[#94A3B8]">
                        {deckVersion.matches} played
                      </p>
                      <p className="text-sm text-[#94A3B8]">
                        {deckVersion.wins} W
                      </p>
                      <p className="text-sm text-[#94A3B8]">
                        {deckVersion.losses} L
                      </p>
                      <p className="text-sm font-medium text-[#F8FAFC]">
                        {deckVersion.winRate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : !hasAnyMatches ? (
          <section className={emptyCard}>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              No matches logged yet.
            </h2>
            <p className={`mt-3 max-w-xl ${sectionCopy}`}>
              Start tracking to uncover what&apos;s actually costing you games.
            </p>
            <Link
              href="/matches/new"
              className={`mt-6 ${primaryButton}`}
            >
              Log your first match
            </Link>
            <Link
              href="/decks"
              className={`mt-3 sm:ml-3 sm:mt-6 ${secondaryButton}`}
            >
              Manage decks
            </Link>
          </section>
        ) : (
          <section className={emptyCard}>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              No matches in {selectedFormatLabel}.
            </h2>
            <p className={`mt-3 max-w-xl ${sectionCopy}`}>
              Log a current Standard match or view saved history to see older
              records.
            </p>
            <Link
              href="/matches/new"
              className={`mt-6 ${primaryButton}`}
            >
              Log match
            </Link>
            <Link
              href="/dashboard?format=all"
              className={`mt-3 sm:ml-3 sm:mt-6 ${secondaryButton}`}
            >
              View saved history
            </Link>
          </section>
        )}

        <section className={cardLarge}>
          <div className="flex flex-col gap-1">
            <h2 className={sectionTitle}>Decks</h2>
            <p className={sectionCopy}>
              Manage saved lists and versions.
            </p>
          </div>
          {decks.length ? (
            <div className={`mt-5 ${divider}`}>
              {decks.map((deck) => (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="block rounded-md px-3 py-4 transition hover:bg-[#0B1020]/52"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <ArchetypeSprites archetype={deck.archetype} />
                      <div>
                        <h3 className="font-medium text-[#F8FAFC]">
                          {deck.name}
                        </h3>
                        <p className="text-sm text-[#94A3B8]">
                          {deck.archetype}
                          {deck.format ? ` · ${deck.format}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[#4F8CFF]">
                      Manage versions
                    </span>
                  </div>
                </Link>
              ))}
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
