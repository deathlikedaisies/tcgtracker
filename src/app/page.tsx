import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bolt,
  CheckCircle2,
  ClipboardList,
  PlayCircle,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import {
  glassPanel,
  glassPanelStrong,
  marketingShell,
  primaryButton,
  secondaryButton,
} from "@/components/brand-styles";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const matchupRows = [
  { archetype: "Dragapult Dusknoir", winRate: 38, tone: "bg-[#F43F5E]" },
  { archetype: "Gardevoir", winRate: 57, tone: "bg-[#4F8CFF]" },
  { archetype: "Raging Bolt Ogerpon", winRate: 64, tone: "bg-[#22C55E]" },
  { archetype: "Charizard Pidgeot", winRate: 49, tone: "bg-[#F5C84C]" },
];

function ProductPreview() {
  return (
    <div className={`relative overflow-hidden p-2 ${glassPanelStrong}`}>
      <div className="pointer-events-none absolute inset-x-10 -top-10 h-24 bg-[#4F8CFF]/18 blur-3xl" />
      <div className="relative grid min-w-0 gap-3 rounded-md bg-[#07111F]/82 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)] sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/78">
              PrizeMap coach preview
            </p>
            <h2 className="mt-1 truncate text-lg font-bold text-[#F8FAFC]">
              What to test next
            </h2>
          </div>
          <span className="rounded-md bg-[#22C55E]/12 px-2 py-1 text-xs font-semibold text-emerald-200">
            Example
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-md bg-[#0B1020]/54 p-3 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.20)]">
            <div className="flex items-center gap-2">
              <ArchetypeSprites archetype="Dragapult Dusknoir" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-rose-200">
                  Biggest leak
                </p>
                <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                  vs Dragapult Dusknoir
                </p>
              </div>
            </div>
            <p className="mt-4 text-4xl font-bold tracking-tight text-[#F43F5E]">
              38%
            </p>
            <p className="mt-1 text-sm leading-6 text-[#94A3B8]/78">
              Run five focused games and tag every loss pattern.
            </p>
            <Link href="/signup" className={`mt-4 h-10 w-full ${primaryButton}`}>
              Start tracking
            </Link>
          </div>

          <div className="rounded-md bg-[#0B1020]/42 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
              Matchup overview
            </p>
            <div className="mt-3 grid gap-3">
              {matchupRows.map((row) => (
                <div key={row.archetype} className="grid grid-cols-[minmax(0,1fr)_44px] items-center gap-3">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-2">
                      <ArchetypeSprites archetype={row.archetype} />
                      <span className="truncate text-sm font-medium text-[#F8FAFC]">
                        {row.archetype}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#1A2238]/78">
                      <div
                        className={`h-full rounded-full ${row.tone}`}
                        style={{ width: `${row.winRate}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-right text-sm font-bold text-[#F8FAFC]">
                    {row.winRate}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {[
            ["Fast logging", "Under a minute after each game"],
            ["Deck versions", "Compare every build cleanly"],
            ["Coaching", "Know the next test before you queue"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-[#0B1020]/34 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#94A3B8]/72">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold leading-5 text-[#F8FAFC]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className={marketingShell}>
      <header className="px-4 py-4 sm:px-6">
        <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-3 ${glassPanel}`}>
          <PrizeMapLogo
            variant="app-icon"
            hideTextOnMobile
            className="group transition hover:scale-[1.02]"
            markClassName="bg-[#1A2238] transition group-hover:shadow-[0_0_22px_rgba(79,140,255,0.22)]"
            textClassName="text-base text-[#F8FAFC]"
          />
          <nav className="hidden items-center gap-7 text-sm font-medium text-[#94A3B8]/78 md:flex">
            <a href="#how-it-works" className="transition hover:text-[#F8FAFC]">
              How it works
            </a>
            <a href="#features" className="transition hover:text-[#F8FAFC]">
              Features
            </a>
            <a href="#why" className="transition hover:text-[#F8FAFC]">
              Why PrizeMap
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-white/5 hover:text-[#F8FAFC] active:scale-[0.98]"
            >
              Log in
            </Link>
            <Link href="/signup" className={`${primaryButton} h-10 px-3 sm:px-4`}>
              Start tracking
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="prizemap-fade-in min-w-0">
            <p className="inline-flex items-center gap-2 rounded-md bg-[#4F8CFF]/12 px-3 py-1.5 text-sm font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]">
              <Bolt className="size-4" aria-hidden="true" />
              Built for competitive Pokemon TCG testing
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-[0.95] tracking-tight text-[#F8FAFC] sm:text-7xl">
              Turn every game into better testing.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#C7D2E5]">
              PrizeMap logs games fast, tracks matchup truth, compares deck
              versions, and tells you what to test next.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={`${primaryButton} h-12 px-6`}>
                Start tracking
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
              <a href="#how-it-works" className={`${secondaryButton} h-12 px-6`}>
                <PlayCircle className="mr-2 size-4" aria-hidden="true" />
                See how it works
              </a>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {[
                [ClipboardList, "Fast logging"],
                [BarChart3, "Matchup intelligence"],
                [Target, "Actionable coaching"],
              ].map(([Icon, label]) => (
                <div key={label as string} className="inline-flex items-center gap-2 rounded-md bg-[#0B1020]/42 px-3 py-2 text-sm font-medium text-[#F8FAFC]/88 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
                  <Icon className="size-4 text-[#4F8CFF]" aria-hidden="true" />
                  {label as string}
                </div>
              ))}
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id="how-it-works" className="px-4 pb-8 sm:px-6">
        <div className={`mx-auto max-w-7xl p-4 sm:p-5 ${glassPanel}`}>
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Get better in <span className="text-[#4F8CFF]">3 simple steps</span>
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["1", "Pick your deck", "Create a deck family and version your lists."],
              ["2", "Log your games", "Record matchup, result, turn order, notes, and tags."],
              ["3", "Test the leak", "Use the current mission to focus the next session."],
            ].map(([step, title, copy]) => (
              <div key={step} className="rounded-md bg-[#0B1020]/38 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <div className="inline-flex size-9 items-center justify-center rounded-full bg-[#4F8CFF] text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#F8FAFC]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 pb-8 sm:px-6 sm:pb-12">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-4">
          {[
            [Trophy, "Tournament-ready review", "Spot the matchup and turn-order splits that matter."],
            [Users, "Team testing friendly", "Keep deck experiments and prep notes organized."],
            [CheckCircle2, "Private by account", "Your testing data stays tied to your login."],
            [Target, "No fake certainty", "Low samples stay labeled until the signal is real."],
          ].map(([Icon, title, copy]) => (
            <article key={title as string} className={`p-4 ${glassPanel}`}>
              <Icon className="size-5 text-[#F5C84C]" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-[#F8FAFC]">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">{copy as string}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="why" className="px-4 pb-10 sm:px-6 sm:pb-14">
        <div className={`mx-auto flex max-w-5xl flex-col gap-4 p-5 text-center sm:p-7 ${glassPanelStrong}`}>
          <h2 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Stop guessing your matchups.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-[#94A3B8]/78">
            PrizeMap is not official Pokemon branding. It is a focused testing
            workspace for players who want cleaner data and sharper practice.
          </p>
          <Link href="/signup" className={`mx-auto h-12 px-6 ${primaryButton}`}>
            Start tracking
          </Link>
        </div>
      </section>
    </main>
  );
}
