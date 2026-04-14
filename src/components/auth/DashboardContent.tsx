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
    <div className="rounded-md border border-zinc-200 bg-white p-5">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function RecordPill({ result }: { result: "win" | "loss" }) {
  const className =
    result === "win"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-rose-50 text-rose-700";

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium uppercase ${className}`}
    >
      {result}
    </span>
  );
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">TCG Tracker</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Dashboard
            </h1>
            <p className="mt-2 break-words text-sm text-zinc-600">{email}</p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <AppNav current="dashboard" />
            <button
              type="button"
              onClick={handleSignOut}
              className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-white lg:w-fit"
            >
              Sign out
            </button>
          </div>
        </div>

        <form
          action="/dashboard"
          className="rounded-md border border-zinc-200 bg-white p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2 sm:min-w-80">
              <label
                htmlFor="format"
                className="text-sm font-medium text-zinc-800"
              >
                Format
              </label>
              <select
                id="format"
                name="format"
                defaultValue={selectedFormat}
                className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
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
              className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
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
              <div className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold text-zinc-950">
                    Result Trend
                  </h2>
                  <p className="text-sm text-zinc-600">
                    Daily wins and losses for {selectedFormatLabel}.
                  </p>
                </div>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="#e4e4e7" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="wins"
                        stroke="#047857"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="losses"
                        stroke="#be123c"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold text-zinc-950">
                    Deck Comparison
                  </h2>
                  <p className="text-sm text-zinc-600">
                    Win rate by deck version, sorted by matches played.
                  </p>
                </div>
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deckPerformanceChart} layout="vertical">
                      <CartesianGrid stroke="#e4e4e7" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fill: "#71717a", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="winRate" fill="#18181b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-zinc-950">
                  Recent Matches
                </h2>
                <p className="text-sm text-zinc-600">
                  Your 10 most recent logged matches for {selectedFormatLabel}.
                </p>
              </div>
              <div className="mt-5 divide-y divide-zinc-200">
                {recentMatches.map((match) => (
                  <div
                    key={match.id}
                    className="grid gap-2 py-4 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_90px_120px] sm:items-center"
                  >
                    <p className="text-sm text-zinc-500">
                      {formatDate(match.playedAt)}
                    </p>
                    <p className="font-medium text-zinc-950">
                      {match.deckVersionName}
                    </p>
                    <p className="text-sm text-zinc-700">
                      vs {match.opponentArchetype}
                    </p>
                    <RecordPill result={match.result} />
                    <p className="text-sm capitalize text-zinc-500">
                      {match.eventType ?? "No event"}
                    </p>
                    {selectedFormat === "all" ? (
                      <p className="text-sm text-zinc-500">
                        {match.format ?? "No format"}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold text-zinc-950">
                    Matchups
                  </h2>
                  <Link
                    href="/matchups"
                    className="text-sm font-medium text-zinc-600 underline underline-offset-4"
                  >
                    Analyze matchups
                  </Link>
                </div>
                <div className="mt-5 divide-y divide-zinc-200">
                  {matchupSummary.map((matchup) => (
                    <div
                      key={matchup.opponentArchetype}
                      className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_80px] sm:items-center"
                    >
                      <p className="font-medium text-zinc-950">
                        {matchup.opponentArchetype}
                      </p>
                      <p className="text-sm text-zinc-600">
                        {matchup.matches} played
                      </p>
                      <p className="text-sm text-zinc-600">
                        {matchup.wins} W
                      </p>
                      <p className="text-sm text-zinc-600">
                        {matchup.losses} L
                      </p>
                      <p className="text-sm font-medium text-zinc-950">
                        {matchup.winRate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
                <h2 className="text-xl font-semibold text-zinc-950">
                  Deck Performance
                </h2>
                <div className="mt-5 divide-y divide-zinc-200">
                  {deckPerformance.map((deckVersion) => (
                    <div
                      key={deckVersion.deckVersionId}
                      className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_80px] sm:items-center"
                    >
                      <p className="font-medium text-zinc-950">
                        {deckVersion.deckVersionName}
                      </p>
                      <p className="text-sm text-zinc-600">
                        {deckVersion.matches} played
                      </p>
                      <p className="text-sm text-zinc-600">
                        {deckVersion.wins} W
                      </p>
                      <p className="text-sm text-zinc-600">
                        {deckVersion.losses} L
                      </p>
                      <p className="text-sm font-medium text-zinc-950">
                        {deckVersion.winRate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : !hasAnyMatches ? (
          <section className="rounded-md border border-dashed border-zinc-300 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              No matches logged yet.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
              Log your first match to see win rates, matchup records, recent
              results, and deck performance.
            </p>
            <Link
              href="/matches/new"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Log your first match
            </Link>
            <Link
              href="/decks"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 sm:ml-3 sm:mt-6"
            >
              Manage decks
            </Link>
          </section>
        ) : (
          <section className="rounded-md border border-dashed border-zinc-300 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              No matches in {selectedFormatLabel}.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
              Choose another format or log a match in this format to populate
              the dashboard.
            </p>
            <Link
              href="/matches/new"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Log match
            </Link>
            <Link
              href="/dashboard?format=all"
              className="mt-3 inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 sm:ml-3 sm:mt-6"
            >
              View all formats
            </Link>
          </section>
        )}

        <section className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-zinc-950">Decks</h2>
            <p className="text-sm text-zinc-600">
              Manage saved lists and versions.
            </p>
          </div>
          {decks.length ? (
            <div className="mt-5 divide-y divide-zinc-200">
              {decks.map((deck) => (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="block py-4 transition hover:bg-zinc-50"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-950">
                        {deck.name}
                      </h3>
                      <p className="text-sm text-zinc-600">
                        {deck.archetype}
                        {deck.format ? ` · ${deck.format}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-zinc-500">
                      Manage versions
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-dashed border-zinc-300 p-4">
              <p className="text-sm text-zinc-600">No decks found yet.</p>
              <Link
                href="/decks"
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800"
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
