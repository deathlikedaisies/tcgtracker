import Link from "next/link";
import { ArrowRight, ClipboardList, Layers3, Target, Trophy } from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { DemoShell } from "@/components/demo/DemoShell";
import { card, cardLarge, pageCopy, pageHeader, pageTitle, primaryButton, sectionCopy, sectionTitle } from "@/components/brand-styles";
import {
  demoDecks,
  demoMatches,
  formatDemoDate,
  getConfidenceLabel,
  getConfidenceTone,
  getDemoInsights,
  getDemoMatchups,
  getRecentSession,
  getWinRate,
} from "@/lib/demo-data";

export default function DemoPage() {
  const insights = getDemoInsights();
  const missionMatchup = insights.biggestStatisticalLeak;
  const matchups = getDemoMatchups();
  const recent = getRecentSession();
  const recentWins = recent.filter((match) => match.result === "win").length;

  return (
    <DemoShell current="dashboard">
      <section className={pageHeader}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Reviewer playtest</p>
          <h1 className={pageTitle}>PrizeMap demo workspace</h1>
          <p className={pageCopy}>
            Explore realistic seeded testing data without creating an account.
          </p>
        </div>
        <Link href="/demo/matches/new" className={`${primaryButton} h-12`}>
          Log fake game
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [Layers3, "Sample decks", String(demoDecks.length), "3 deck families"],
          [ClipboardList, "Logged matches", String(demoMatches.length), "Seeded test history"],
          [Trophy, "Overall win rate", `${getWinRate(demoMatches)}%`, "Across all decks"],
          [Target, "Recent session", `${recentWins}-${recent.length - recentWins}`, "Last 12 games"],
        ].map(([Icon, label, value, helper]) => (
          <article key={label as string} className={card}>
            <Icon className="size-5 text-[#F5C84C]" aria-hidden="true" />
            <p className="mt-3 text-sm text-[#94A3B8]/72">{label as string}</p>
            <p className="mt-1 text-3xl font-bold text-[#F8FAFC]">{value as string}</p>
            <p className="mt-1 text-xs text-[#94A3B8]/64">{helper as string}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.82fr]">
        <article className={cardLarge}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]/82">
                Current mission
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC]">
                {insights.currentMission.title}
              </h2>
              <p className={sectionCopy}>
                {insights.currentMission.explanation}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <ArchetypeSprites archetype={insights.currentMission.archetype} size="md" />
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getConfidenceTone(missionMatchup.games.length)}`}>
                {getConfidenceLabel(missionMatchup.games.length)}
              </span>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_220px] sm:items-end">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#F8FAFC]">Progress</span>
                <span className="text-[#94A3B8]">{insights.currentMission.progressLabel}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#07111F]/78">
                <div className="h-full w-3/5 rounded-full bg-[#F5C84C]" />
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#94A3B8]/76">
                Why this recommendation? {insights.currentMission.why}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {missionMatchup.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-md bg-[#F43F5E]/10 px-2 py-1 text-xs font-medium text-rose-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/demo/matchups" className={`${primaryButton} h-12`}>
              Review matchup
            </Link>
          </div>
        </article>

        <article className={cardLarge}>
          <h2 className={sectionTitle}>Recent testing session</h2>
          <div className="mt-4 grid gap-2">
            {recent.slice(0, 6).map((match) => (
              <div key={match.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-[#07111F]/52 p-2.5">
                <span className={`size-2.5 rounded-full ${match.result === "win" ? "bg-[#22C55E]" : "bg-[#F43F5E]"}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#F8FAFC]">{match.opponentArchetype}</p>
                  <p className="truncate text-xs text-[#94A3B8]/70">{match.tags.join(", ")}</p>
                </div>
                <p className="text-xs text-[#94A3B8]/70">{formatDemoDate(match.playedAt)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={cardLarge}>
        <h2 className={sectionTitle}>Matchup intelligence snapshot</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {matchups.slice(0, 5).map((matchup) => (
            <Link key={matchup.archetype} href="/demo/matchups" className="rounded-md bg-[#07111F]/52 p-3 transition hover:-translate-y-0.5">
              <ArchetypeSprites archetype={matchup.archetype} />
              <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-[#F8FAFC]">{matchup.archetype}</p>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${getConfidenceTone(matchup.games.length)}`}>
                  {matchup.games.length < 6 ? "Needs more games" : getConfidenceLabel(matchup.games.length)}
                </span>
              </div>
              <p className={`mt-1 text-2xl font-bold ${matchup.winRate < 45 ? "text-[#F43F5E]" : matchup.winRate > 58 ? "text-[#22C55E]" : "text-[#F8FAFC]"}`}>
                {matchup.winRate}%
              </p>
              <p className="text-xs text-[#94A3B8]/70">{matchup.wins}-{matchup.losses}</p>
            </Link>
          ))}
        </div>
      </section>
    </DemoShell>
  );
}
