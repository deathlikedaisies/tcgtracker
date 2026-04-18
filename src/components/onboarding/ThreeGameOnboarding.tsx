"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

type Result = "win" | "loss";
type TurnOrder = "first" | "second";
type FlowStep = "log" | "analyzing" | "aha";

type GameEntry = {
  opponentArchetype: string;
  result: Result;
  turnOrder: TurnOrder;
};

type ThreeGameOnboardingProps = {
  archetypeOptions: string[];
  continueHref: string;
};

type MatchupGroup = {
  archetype: string;
  games: GameEntry[];
  wins: number;
  losses: number;
  winRate: number;
  firstLosses: number;
  secondLosses: number;
};

const emptyGame: GameEntry = {
  opponentArchetype: "",
  result: "loss",
  turnOrder: "second",
};

function getLossSummary(matchup: MatchupGroup) {
  return matchup.losses === 1
    ? `Lost 1 of ${matchup.games.length} games`
    : `Lost ${matchup.losses} of ${matchup.games.length} games`;
}

function getRecommendation(matchup: MatchupGroup) {
  if (matchup.losses === 0) {
    return `Play 5 more games vs ${matchup.archetype}`;
  }

  if (matchup.secondLosses > matchup.firstLosses) {
    return `Play 5 more games vs ${matchup.archetype} going second`;
  }

  if (matchup.firstLosses > matchup.secondLosses) {
    return `Try going second vs ${matchup.archetype}`;
  }

  return `Play 5 more games vs ${matchup.archetype}`;
}

function getTurnPattern(matchup: MatchupGroup) {
  if (matchup.losses === 0) {
    return "So far, keep testing until a weakness appears.";
  }

  if (matchup.secondLosses > matchup.firstLosses) {
    return "Your losses are showing up more when you go second.";
  }

  if (matchup.firstLosses > matchup.secondLosses) {
    return "Your losses are showing up more when you go first.";
  }

  return "The matchup is the signal right now, not turn order.";
}

function analyzeGames(games: GameEntry[]) {
  const groups = Array.from(
    games
      .reduce((summary, game) => {
        const current = summary.get(game.opponentArchetype) ?? [];
        current.push(game);
        summary.set(game.opponentArchetype, current);
        return summary;
      }, new Map<string, GameEntry[]>())
      .entries()
  ).map<MatchupGroup>(([archetype, groupedGames]) => {
    const wins = groupedGames.filter((game) => game.result === "win").length;
    const losses = groupedGames.length - wins;

    return {
      archetype,
      games: groupedGames,
      wins,
      losses,
      winRate: groupedGames.length ? wins / groupedGames.length : 0,
      firstLosses: groupedGames.filter(
        (game) => game.result === "loss" && game.turnOrder === "first"
      ).length,
      secondLosses: groupedGames.filter(
        (game) => game.result === "loss" && game.turnOrder === "second"
      ).length,
    };
  });

  return groups.sort((first, second) => {
    if (first.losses !== second.losses) {
      return second.losses - first.losses;
    }

    if (first.winRate !== second.winRate) {
      return first.winRate - second.winRate;
    }

    return second.games.length - first.games.length;
  })[0];
}

export function ThreeGameOnboarding({
  archetypeOptions,
  continueHref,
}: ThreeGameOnboardingProps) {
  const [step, setStep] = useState<FlowStep>("log");
  const [currentGame, setCurrentGame] = useState<GameEntry>(emptyGame);
  const [games, setGames] = useState<GameEntry[]>([]);
  const gameNumber = Math.min(games.length + 1, 3);
  const analysis = useMemo(() => analyzeGames(games), [games]);
  const canContinue = currentGame.opponentArchetype.trim().length > 0;

  function saveGame() {
    if (!canContinue) {
      return;
    }

    const nextGames = [...games, currentGame];
    setGames(nextGames);

    if (nextGames.length === 3) {
      setStep("analyzing");
      window.setTimeout(() => {
        setStep("aha");
      }, 1000);
      return;
    }

    setCurrentGame({
      ...emptyGame,
      opponentArchetype: currentGame.opponentArchetype,
      turnOrder: currentGame.turnOrder,
    });
  }

  if (step === "analyzing") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B1020] bg-[radial-gradient(ellipse_at_center,rgba(79,140,255,0.14),transparent_46%)] px-4 py-8 text-[#F8FAFC]">
        <section className="flex flex-col items-center text-center">
          <PrizeMapLogo
            variant="app-icon"
            showText={false}
            className="prizemap-glow-pulse"
            markClassName="size-14 bg-[#11182C]"
          />
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            Analyzing your games...
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#94A3B8]">
            Checking matchups, losses, and turn-order signal.
          </p>
        </section>
      </main>
    );
  }

  if (step === "aha" && analysis) {
    const hasLeak = analysis.losses > 0;

    return (
      <main className="min-h-screen bg-[#0B1020] bg-[radial-gradient(ellipse_at_top,rgba(79,140,255,0.14),transparent_42%),linear-gradient(180deg,#0B1020_0%,#10172A_52%,#0B1020_100%)] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8">
        <section className="prizemap-fade-in mx-auto flex max-w-3xl flex-col gap-5">
          <PrizeMapLogo
            variant="app-icon"
            textClassName="text-base text-[#F8FAFC]"
            markClassName="bg-[#1A2238]"
          />

          <div className="rounded bg-[#11182C]/74 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-7">
            <p className="text-sm font-semibold text-[#4F8CFF]">
              Early signal from 3 games
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {hasLeak ? "You're already leaking games." : "You're already seeing signal."}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#94A3B8]">
              You don&apos;t need more games. You need better direction.
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-[1fr_1.05fr]">
            <article className="rounded bg-[#2A1320]/92 p-4 shadow-[0_16px_42px_rgba(244,63,94,0.12),inset_0_0_0_1px_rgba(244,63,94,0.28)]">
              <p className="text-xs font-medium uppercase text-rose-200">
                Worst matchup so far
              </p>
              <div className="mt-3 flex min-w-0 items-center gap-3">
                <ArchetypeSprites archetype={analysis.archetype} size="md" />
                <h2 className="min-w-0 text-2xl font-semibold text-[#F8FAFC]">
                  {analysis.archetype}
                </h2>
              </div>
              <p className="mt-4 text-lg font-semibold text-rose-100">
                {hasLeak
                  ? getLossSummary(analysis)
                  : `${analysis.wins} wins from ${analysis.games.length} games`}
              </p>
              <p className="mt-2 text-sm leading-6 text-rose-100/78">
                {hasLeak
                  ? "This is already your biggest problem."
                  : "This is your strongest early lane right now."}
              </p>
            </article>

            <article className="rounded bg-[#11182C]/92 p-4 shadow-[0_18px_48px_rgba(245,200,76,0.1),inset_0_0_0_1px_rgba(245,200,76,0.32)] sm:p-5">
              <div className="flex items-center gap-3">
                <PrizeMapLogo
                  variant="app-icon"
                  showText={false}
                  markClassName="size-8 bg-transparent shadow-none"
                />
                <p className="text-xs font-medium uppercase tracking-wide text-[#F5C84C]/86">
                  Recommended next test
                </p>
              </div>
              <h2 className="mt-4 text-2xl font-semibold leading-tight text-[#F8FAFC]">
                {getRecommendation(analysis)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#94A3B8]">
                {getTurnPattern(analysis)}
              </p>
            </article>
          </section>

          <Link
            href={continueHref}
            className="inline-flex h-12 items-center justify-center rounded bg-[#F5C84C] px-5 text-sm font-semibold text-[#0B1020] shadow-[0_18px_44px_rgba(245,200,76,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98]"
          >
            Continue tracking this matchup
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1020] bg-[radial-gradient(ellipse_at_top,rgba(79,140,255,0.14),transparent_42%),linear-gradient(180deg,#0B1020_0%,#10172A_52%,#0B1020_100%)] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8">
      <section className="mx-auto flex max-w-2xl flex-col gap-5">
        <PrizeMapLogo
          variant="app-icon"
          textClassName="text-base text-[#F8FAFC]"
          markClassName="bg-[#1A2238]"
        />

        <div className="rounded bg-[#11182C]/74 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-7">
          <p className="text-sm font-semibold text-[#4F8CFF]">
            Game {gameNumber}/3
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Log your last 3 games
            <span className="block text-[#94A3B8]">(takes ~10 seconds)</span>
          </h1>
          <div className="mt-5 h-2 rounded-full bg-[#0B1020]/70">
            <div
              className="h-2 rounded-full bg-[#F5C84C] transition-all"
              style={{ width: `${(gameNumber / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded bg-[#11182C]/68 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-5">
          <ArchetypePicker
            id="onboarding_opponent"
            name="onboarding_opponent"
            label="Opponent archetype"
            options={archetypeOptions}
            value={currentGame.opponentArchetype}
            onValueChange={(opponentArchetype) =>
              setCurrentGame((game) => ({ ...game, opponentArchetype }))
            }
            required
            autoFocus
            maxOptions={6}
            listMaxHeightClassName="max-h-48"
          />

          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-[#F8FAFC]">Result</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["win", "loss"] as const).map((result) => (
                <button
                  key={result}
                  type="button"
                  onClick={() => setCurrentGame((game) => ({ ...game, result }))}
                  className={`h-12 rounded text-sm font-semibold capitalize transition active:scale-[0.98] ${
                    currentGame.result === result
                      ? result === "win"
                        ? "bg-emerald-500/18 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.38)]"
                        : "bg-[#F43F5E]/18 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.38)]"
                      : "bg-[#0B1020]/50 text-[#94A3B8] hover:bg-[#1A2238]/58 hover:text-[#F8FAFC]"
                  }`}
                >
                  {result}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium text-[#F8FAFC]">
              Turn order
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["first", "second"] as const).map((turnOrder) => (
                <button
                  key={turnOrder}
                  type="button"
                  onClick={() =>
                    setCurrentGame((game) => ({ ...game, turnOrder }))
                  }
                  className={`h-12 rounded text-sm font-semibold capitalize transition active:scale-[0.98] ${
                    currentGame.turnOrder === turnOrder
                      ? "bg-[#4F8CFF]/22 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.38)]"
                      : "bg-[#0B1020]/50 text-[#94A3B8] hover:bg-[#1A2238]/58 hover:text-[#F8FAFC]"
                  }`}
                >
                  {turnOrder}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            disabled={!canContinue}
            onClick={saveGame}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded bg-[#F5C84C] px-5 text-sm font-semibold text-[#0B1020] shadow-[0_18px_44px_rgba(245,200,76,0.3)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#94A3B8] disabled:shadow-none"
          >
            {games.length === 2 ? "Analyze my games" : "Save game"}
          </button>
        </div>
      </section>
    </main>
  );
}
