"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoConversionCta } from "@/components/demo/DemoConversionCta";
import { cardLarge, pageCopy, pageHeader, pageTitle, primaryButton } from "@/components/brand-styles";
import { demoDecks, demoMatches, formatDemoDate, type DemoMatch } from "@/lib/demo-data";
import { getMatchResultLabel } from "@/lib/match-types";

type FilterKey =
  | "mission"
  | "losses"
  | "review"
  | "greninja"
  | "second"
  | "missed setup"
  | "bench pressure";

const filters: { key: FilterKey; label: string }[] = [
  { key: "mission", label: "Current mission" },
  { key: "losses", label: "Losses only" },
  { key: "review", label: "Review-tagged" },
  { key: "greninja", label: "Mega Greninja" },
  { key: "second", label: "Went second" },
  { key: "missed setup", label: "missed setup" },
  { key: "bench pressure", label: "bench pressure" },
];

const deckById = new Map(demoDecks.map((deck) => [deck.id, deck]));

function isMissionGame(match: DemoMatch) {
  return (
    match.opponentArchetype === "Mega Greninja" &&
    !match.wentFirst &&
    (match.result === "loss" ||
      match.tags.includes("missed setup") ||
      match.tags.includes("bench pressure"))
  );
}

function matchesFilter(match: DemoMatch, filter: FilterKey) {
  if (filter === "mission") {
    return isMissionGame(match);
  }

  if (filter === "losses") {
    return match.result === "loss";
  }

  if (filter === "review") {
    return match.tags.includes("review");
  }

  if (filter === "greninja") {
    return match.opponentArchetype === "Mega Greninja";
  }

  if (filter === "second") {
    return !match.wentFirst;
  }

  return match.tags.includes(filter);
}

function filterSummary(activeFilters: FilterKey[], filteredMatches: DemoMatch[]) {
  if (!activeFilters.length) {
    return `Showing all ${filteredMatches.length} seeded demo games in chronological order.`;
  }

  const labels = filters
    .filter((filter) => activeFilters.includes(filter.key))
    .map((filter) => filter.label.toLowerCase());

  if (activeFilters.includes("mission")) {
    return `Showing ${filteredMatches.length} Mega Greninja review games matching ${labels.join(", ")}.`;
  }

  return `Showing ${filteredMatches.length} games matching ${labels.join(", ")}.`;
}

export function DemoMatchesReview() {
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>(["mission"]);

  const missionGames = useMemo(() => demoMatches.filter(isMissionGame), []);
  const filteredMatches = useMemo(
    () =>
      activeFilters.length
        ? demoMatches.filter((match) => activeFilters.every((filter) => matchesFilter(match, filter)))
        : demoMatches,
    [activeFilters]
  );

  const missionLosses = missionGames.filter((match) => match.result === "loss");
  const missedSetupCount = missionGames.filter((match) => match.tags.includes("missed setup")).length;
  const benchPressureCount = missionGames.filter((match) => match.tags.includes("bench pressure")).length;

  function toggleFilter(filter: FilterKey) {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((candidate) => candidate !== filter)
        : [...current, filter]
    );
  }

  return (
    <>
      <section className={pageHeader}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Review mode</p>
          <h1 className={pageTitle}>Mission match review</h1>
          <p className={pageCopy}>
            Start with the games that explain the current leak, then widen into the full seeded archive.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log fake game
        </Link>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-md bg-[#0F1A2D]/78 p-4 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(245,200,76,0.18)] backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                Review queue
              </p>
              <div className="mt-3 flex items-center gap-3">
                <ArchetypeSprites archetype="Mega Greninja" size="md" />
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold text-[#F8FAFC]">
                    Mega Greninja going second
                  </h2>
                  <p className="text-sm leading-6 text-[#94A3B8]/78">
                    Current mission from the demo coaching loop.
                  </p>
                </div>
              </div>
            </div>
            <span className="w-fit rounded-md bg-[#F5C84C]/12 px-2.5 py-1 text-xs font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.20)]">
              {missionGames.length} relevant games
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className="rounded-md bg-[#07111F]/58 p-3">
              <p className="text-xs text-[#94A3B8]/72">Mission losses</p>
              <p className="mt-1 text-2xl font-bold text-[#F43F5E]">{missionLosses.length}</p>
            </div>
            <div className="rounded-md bg-[#07111F]/58 p-3">
              <p className="text-xs text-[#94A3B8]/72">missed setup</p>
              <p className="mt-1 text-2xl font-bold text-[#F8FAFC]">{missedSetupCount}</p>
            </div>
            <div className="rounded-md bg-[#07111F]/58 p-3">
              <p className="text-xs text-[#94A3B8]/72">bench pressure</p>
              <p className="mt-1 text-2xl font-bold text-[#F8FAFC]">{benchPressureCount}</p>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-[#07111F]/58 p-3">
            <p className="text-sm font-semibold text-[#F8FAFC]">
              Key pattern: losses often involve slow setup or exposed bench pressure.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
              Suggested review action: scan the going-second losses first, then compare whether the
              first prize deficit started from missed setup, bench pressure, or both.
            </p>
          </div>
        </article>

        <article className={cardLarge}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
            Review filters
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#F8FAFC]">Find the games that explain it</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active = activeFilters.includes(filter.key);

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => toggleFilter(filter.key)}
                  className={`min-h-10 rounded-md px-3 text-sm font-semibold transition active:scale-[0.98] ${
                    active
                      ? "bg-[#F5C84C] text-[#07111F] shadow-[0_12px_28px_rgba(245,200,76,0.18)]"
                      : "bg-[#07111F]/58 text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] hover:text-[#F8FAFC]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setActiveFilters([])}
            className="mt-4 text-sm font-semibold text-[#B8D1FF] hover:text-[#F8FAFC]"
          >
            Show full archive
          </button>
        </article>
      </section>

      <section className={cardLarge}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
              Filtered queue
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#F8FAFC]">
              {filterSummary(activeFilters, filteredMatches)}
            </h2>
          </div>
          <span className="w-fit rounded-md bg-[#4F8CFF]/12 px-2.5 py-1 text-xs font-semibold text-[#B8D1FF]">
            {demoMatches.length} seeded games total
          </span>
        </div>

        <div className="mt-4 grid gap-2">
          {filteredMatches.map((match) => {
            const deck = deckById.get(match.deckId);
            const missionGame = isMissionGame(match);

            return (
              <article
                key={match.id}
                className={`grid gap-3 rounded-md p-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] sm:items-center ${
                  missionGame
                    ? "bg-[#1A1824]/78 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.22)]"
                    : "bg-[#07111F]/52"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ArchetypeSprites archetype={match.opponentArchetype} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                      vs {match.opponentArchetype}
                    </p>
                    <p className="truncate text-xs text-[#94A3B8]/70">
                      {deck?.name} - {match.wentFirst ? "First" : "Second"}
                    </p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs leading-5 text-[#94A3B8]/76">{match.notes}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {missionGame ? (
                      <span className="rounded bg-[#F5C84C]/14 px-1.5 py-0.5 text-[11px] font-semibold text-[#F5C84C]">
                        Mission game
                      </span>
                    ) : null}
                    {match.tags.includes("review") ? (
                      <span className="rounded bg-[#F43F5E]/14 px-1.5 py-0.5 text-[11px] font-semibold text-rose-200">
                        Review
                      </span>
                    ) : null}
                    {!match.wentFirst ? (
                      <span className="rounded bg-[#4F8CFF]/14 px-1.5 py-0.5 text-[11px] font-semibold text-[#B8D1FF]">
                        Going second sample
                      </span>
                    ) : null}
                    {match.tags.map((tag) => (
                      <span key={tag} className="rounded bg-[#0B1020]/62 px-1.5 py-0.5 text-[11px] text-[#94A3B8]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                  <p
                    className={`text-sm font-bold ${
                      match.result === "win"
                        ? "text-[#22C55E]"
                        : match.result === "loss"
                          ? "text-[#F43F5E]"
                          : "text-[#94A3B8]"
                    }`}
                  >
                    {getMatchResultLabel(match.result).toUpperCase()}
                  </p>
                  <p className="text-xs text-[#94A3B8]/70">{formatDemoDate(match.playedAt)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <DemoConversionCta />
    </>
  );
}
