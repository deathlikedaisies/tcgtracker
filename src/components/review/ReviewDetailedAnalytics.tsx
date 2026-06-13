"use client";

import { type ReactNode, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  glassPanel,
  premiumInset,
  premiumInsetStrong,
  sectionTitle,
} from "@/components/brand-styles";

type RecentMatchItem = {
  id: string;
  deckVersionName: string;
  opponentArchetype: string;
  playedAtLabel: string;
  result: "win" | "loss" | "tie";
};

type TrendPoint = {
  label: string;
  wins: number;
  losses: number;
  ties: number;
};

type MatchupRow = {
  opponent: string;
  matches: number;
  record: string;
  winRate: number;
};

type TagRow = {
  tag: string;
  count: number;
  total: number;
  rate: number;
};

type TurnOrderRow = {
  label: string;
  matches: number;
  record: string;
  winRate: number | null;
};

type VersionRow = {
  id: string;
  name: string;
  matches: number;
  record: string;
  winRate: number;
  openingRate: number | null;
  sequencingRate: number | null;
  commonLossTag: string | null;
};

type ReviewDetailedAnalyticsProps = {
  recentMatches: RecentMatchItem[];
  trendData: TrendPoint[];
  matchupRows: MatchupRow[];
  turnOrderRows: TurnOrderRow[];
  unknownTurnOrderCount: number;
  winTags: TagRow[];
  lossTags: TagRow[];
  versionRows: VersionRow[];
  versionSummary: {
    bestLabel: string;
    explanation: string;
  } | null;
};

type PanelKey = "trends" | "matchups" | "turn-order" | "tags" | "versions";

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value}%`;
}

function getBarTone(value: number) {
  if (value >= 55) {
    return "bg-emerald-400";
  }

  if (value <= 45) {
    return "bg-[#F43F5E]";
  }

  return "bg-[#4F8CFF]";
}

function RecentFormDots({ matches }: { matches: RecentMatchItem[] }) {
  const recent = matches.slice(0, 10);

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Recent form">
      {recent.map((match) => (
        <span
          key={match.id}
          className={`size-3 rounded-full ${
            match.result === "win"
              ? "bg-emerald-400"
              : match.result === "loss"
                ? "bg-[#F43F5E]"
                : "bg-[#F5C84C]"
          }`}
          title={`${match.deckVersionName} vs ${match.opponentArchetype}`}
        />
      ))}
    </div>
  );
}

function MetricBar({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className={`${premiumInset} p-3`}>
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-[#F8FAFC]">{label}</p>
        <p className="text-sm font-bold text-[#F8FAFC]">{value}%</p>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#10192B]">
        <div
          className={`h-2 rounded-full ${getBarTone(value)}`}
          style={{ width: `${Math.max(value, value > 0 ? 6 : 0)}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-5 text-[#94A3B8]/72">{detail}</p>
    </div>
  );
}

function SectionFrame({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: ReactNode;
}) {
  return (
    <section className={`${glassPanel} p-5`}>
      <div className="flex flex-col gap-2">
        <h3 className={sectionTitle}>{title}</h3>
        <p className="text-sm leading-6 text-[#94A3B8]/72">{copy}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ReviewDetailedAnalytics({
  recentMatches,
  trendData,
  matchupRows,
  turnOrderRows,
  unknownTurnOrderCount,
  winTags,
  lossTags,
  versionRows,
  versionSummary,
}: ReviewDetailedAnalyticsProps) {
  const availablePanels: { key: PanelKey; label: string }[] = [];

  if (recentMatches.length || trendData.length) {
    availablePanels.push({ key: "trends", label: "Trends" });
  }
  if (matchupRows.length) {
    availablePanels.push({ key: "matchups", label: "Matchups" });
  }
  if (turnOrderRows.length || unknownTurnOrderCount) {
    availablePanels.push({ key: "turn-order", label: "Turn order" });
  }
  if (winTags.length || lossTags.length) {
    availablePanels.push({ key: "tags", label: "Tags" });
  }
  if (versionRows.length) {
    availablePanels.push({ key: "versions", label: "Deck versions" });
  }

  const [activePanel, setActivePanel] = useState<PanelKey>(
    availablePanels[0]?.key ?? "trends"
  );

  if (!availablePanels.length) {
    return null;
  }

  const renderPanel = (key: PanelKey) => {
    if (key === "trends") {
      return (
        <SectionFrame
          title="Recent form"
          copy="Use this after reading the main coach recommendation. The last games tell you whether the pattern is holding or changing."
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className={`${premiumInsetStrong} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                  Last 10 games
                </p>
                <span className="text-xs text-[#94A3B8]/72">
                  Wins, losses, and ties
                </span>
              </div>
              <div className="mt-3">
                <RecentFormDots matches={recentMatches} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {recentMatches.slice(0, 4).map((match) => (
                  <div
                    key={match.id}
                    className="rounded-[16px] bg-white/[0.03] p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                        vs {match.opponentArchetype}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                          match.result === "win"
                            ? "bg-emerald-500/10 text-emerald-200"
                            : match.result === "loss"
                              ? "bg-[#F43F5E]/10 text-rose-200"
                              : "bg-[#F5C84C]/12 text-[#FFE28A]"
                        }`}
                      >
                        {match.result}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#94A3B8]/72">
                      {match.deckVersionName} / {match.playedAtLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${premiumInsetStrong} min-h-[280px] p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                Result trend
              </p>
              <div className="mt-4 h-64 min-h-[256px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid
                      stroke="rgba(148,163,184,0.22)"
                      vertical={false}
                    />
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
                    <Line
                      type="monotone"
                      dataKey="ties"
                      stroke="#F5C84C"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </SectionFrame>
      );
    }

    if (key === "matchups") {
      return (
        <SectionFrame
          title="Matchup analytics"
          copy="This is the broader matchup evidence behind the current coach read. Use sample size before changing your list."
        >
          <div className="grid gap-3 xl:grid-cols-2">
            {matchupRows.map((matchup) => (
              <MetricBar
                key={matchup.opponent}
                label={matchup.opponent}
                value={matchup.winRate}
                detail={`${matchup.record} across ${matchup.matches} games`}
              />
            ))}
          </div>
        </SectionFrame>
      );
    }

    if (key === "turn-order") {
      return (
        <SectionFrame
          title="Turn-order analytics"
          copy="Compare the known first and second games. Unknown turn order stays out of the split."
        >
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="grid gap-3">
              {turnOrderRows.map((row) => (
                <MetricBar
                  key={row.label}
                  label={row.label}
                  value={row.winRate ?? 0}
                  detail={`${row.record} across ${row.matches} known games`}
                />
              ))}
            </div>
            <div className={`${premiumInsetStrong} p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Unknown turn order
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC]">
                {unknownTurnOrderCount}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                These games are excluded from the split until turn order is logged.
              </p>
            </div>
          </div>
        </SectionFrame>
      );
    }

    if (key === "tags") {
      return (
        <SectionFrame
          title="Tag pressure"
          copy="These bars show where tags cluster most often. They support the coach read, but they do not prove causality by themselves."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className={`${premiumInsetStrong} p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#F43F5E]">
                Leading loss tags
              </p>
              <div className="mt-3 grid gap-3">
                {lossTags.map((tag) => (
                  <MetricBar
                    key={`loss-${tag.tag}`}
                    label={tag.tag}
                    value={tag.rate}
                    detail={`${tag.count} of ${tag.total} losses`}
                  />
                ))}
              </div>
            </div>
            <div className={`${premiumInsetStrong} p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
                Leading win tags
              </p>
              <div className="mt-3 grid gap-3">
                {winTags.map((tag) => (
                  <MetricBar
                    key={`win-${tag.tag}`}
                    label={tag.tag}
                    value={tag.rate}
                    detail={`${tag.count} of ${tag.total} wins`}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionFrame>
      );
    }

    return (
      <SectionFrame
        title="Deck-version analytics"
        copy="Compare versions carefully. Stronger so far is useful; definitive better still needs enough games."
      >
        <div className="grid gap-4">
          {versionSummary ? (
            <div className={`${premiumInsetStrong} p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                Best current signal
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                {versionSummary.bestLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                {versionSummary.explanation}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3">
            {versionRows.map((row) => (
              <div key={row.id} className={`${premiumInset} p-4`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-[#F8FAFC]">
                      {row.name}
                    </p>
                    <p className="mt-1 text-xs text-[#94A3B8]/72">
                      {row.record} across {row.matches} games
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#F8FAFC]">
                    {row.winRate}% win rate
                  </span>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                  <MetricBar
                    label="Win rate"
                    value={row.winRate}
                    detail={`${row.matches} logged games`}
                  />
                  <MetricBar
                    label="Good/great openings"
                    value={row.openingRate ?? 0}
                    detail={
                      row.openingRate === null
                        ? "No opening-quality tags yet"
                        : `${formatPercent(row.openingRate)} of tagged starts`
                    }
                  />
                  <MetricBar
                    label="Good/great sequencing"
                    value={row.sequencingRate ?? 0}
                    detail={
                      row.sequencingRate === null
                        ? "No sequencing-quality tags yet"
                        : `${formatPercent(row.sequencingRate)} of tagged games`
                    }
                  />
                </div>
                <p className="mt-3 text-xs text-[#94A3B8]/72">
                  {row.commonLossTag
                    ? `Most common loss tag: ${row.commonLossTag}.`
                    : "No repeated loss tag on this version yet."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionFrame>
    );
  };

  return (
    <section className={`${glassPanel} p-5`}>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
          Detailed analytics
        </p>
        <h2 className={sectionTitle}>Detailed analytics</h2>
        <p className="text-sm leading-6 text-[#94A3B8]/72">
          Use these charts after reading the main coach recommendation.
        </p>
      </div>

      <div className="mt-4 hidden lg:block">
        <div className="flex flex-wrap gap-2">
          {availablePanels.map((panel) => (
            <button
              key={panel.key}
              type="button"
              onClick={() => setActivePanel(panel.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                activePanel === panel.key
                  ? "bg-[#4F8CFF]/16 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]"
                  : "bg-[#0B1020]/70 text-[#94A3B8]/82 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] hover:text-[#F8FAFC]"
              }`}
            >
              {panel.label}
            </button>
          ))}
        </div>
        <div className="mt-4">{renderPanel(activePanel)}</div>
      </div>

      <div className="mt-4 grid gap-3 lg:hidden">
        {availablePanels.map((panel) => (
          <details key={panel.key} className={`${premiumInsetStrong} group p-4`}>
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#F8FAFC] marker:hidden">
              {panel.label}
            </summary>
            <div className="mt-4">{renderPanel(panel.key)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
