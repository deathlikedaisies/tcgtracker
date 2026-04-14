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
      <p className="text-sm font-medium text-[#94A3B8]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#F8FAFC]">
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
    selectedFormat === "all" ? "All formats" : selectedFormat;
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
              className={`${secondaryButton} lg:w-fit`}
            >
              Sign out
            </button>
          </div>
        </div>

        <form
          action="/dashboard"
          className={card}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2 sm:min-w-80">
              <label
                htmlFor="format"
                className={label}
              >
                Format
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
                <option value="all">All formats</option>
              </select>
            </div>
            <button
              type="submit"
              className={primaryButton}
            >
              Apply
            </button>
          </div>
        </form>

        {hasMatches ? (
          <>
            <section className="rounded-md border border-[#4F8CFF]/20 bg-[#4F8CFF]/10 p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#4F8CFF]">
                    Current read
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                    Your testing signal for {selectedFormatLabel}.
                  </h2>
                </div>
                <Link
                  href="/matches/new"
                  className="text-sm font-medium text-[#F5C84C] underline underline-offset-4"
                >
                  Log another match
                </Link>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {insights.map((insight) => (
                  <div
                    key={insight.label}
                    className="rounded-md border border-white/10 bg-[#0B1020]/45 p-4"
                  >
                    <p className="text-xs font-medium uppercase text-[#94A3B8]">
                      {insight.label}
                    </p>
                    <p className="mt-2 truncate text-xl font-semibold text-[#F8FAFC]">
                      {insight.value}
                    </p>
                    <p className="mt-2 text-sm text-[#94A3B8]">
                      {insight.detail}
                    </p>
                  </div>
                ))}
              </div>
            </section>

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
                      <Tooltip />
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
                      <Tooltip formatter={(value) => `${value}%`} />
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
                  Your 10 most recent logged matches for {selectedFormatLabel}.
                </p>
              </div>
              <div className={`mt-5 ${divider}`}>
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="grid gap-2 py-4 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_90px_120px] sm:items-center"
                  >
                    <p className="text-sm text-[#94A3B8]">
                      {formatDate(match.playedAt)}
                    </p>
                    <p className="font-medium text-[#F8FAFC]">
                      {match.deckVersionName}
                    </p>
                    <p className="text-sm text-[#94A3B8]">
                      vs {match.opponentArchetype}
                    </p>
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
                  <Link
                    href="/matchups"
                    className="text-sm font-medium text-[#F5C84C] underline underline-offset-4"
                  >
                    Analyze matchups
                  </Link>
                </div>
                <div className={`mt-5 ${divider}`}>
                  {matchupSummary.map((matchup) => (
                    <div
                      key={matchup.opponentArchetype}
                      className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_80px] sm:items-center"
                    >
                      <p className="font-medium text-[#F8FAFC]">
                        {matchup.opponentArchetype}
                      </p>
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
              Start tracking to uncover your real matchups, deck performance,
              and testing trends.
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
              Choose another format or log a match in this format to populate
              the dashboard.
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
              View all formats
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
                  className="block rounded-md px-3 py-4 transition hover:bg-[#0B1020]/45"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium text-[#F8FAFC]">
                        {deck.name}
                      </h3>
                      <p className="text-sm text-[#94A3B8]">
                        {deck.archetype}
                        {deck.format ? ` · ${deck.format}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#F5C84C]">
                      Manage versions
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-[#4F8CFF]/30 p-4">
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
