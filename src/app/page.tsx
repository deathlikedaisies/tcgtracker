import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bolt,
  ClipboardList,
  Layers3,
  ListChecks,
  Target,
  TrendingUp,
} from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import {
  glassPanel,
  marketingShell,
  primaryButton,
  secondaryButton,
} from "@/components/brand-styles";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const matchupRows = [
  { archetype: "Dragapult ex", winRate: 64, tone: "bg-[#22C55E]" },
  { archetype: "Mega Greninja", winRate: 43, tone: "bg-[#F43F5E]" },
  { archetype: "Ogerpon Meganium", winRate: 53, tone: "bg-[#22C55E]" },
  { archetype: "Mega Lucario", winRate: 50, tone: "bg-[#F5C84C]" },
];

function ProductPreview() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-md bg-[#0D1728]/88 p-4 shadow-[0_34px_96px_rgba(0,0,0,0.46),0_0_78px_rgba(79,140,255,0.14),inset_0_0_0_1px_rgba(148,163,184,0.14)] backdrop-blur sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-[#4F8CFF]/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-8 size-44 rounded-full bg-[#F5C84C]/10 blur-3xl" />

      <div className="relative rounded-md bg-[#07111F]/90 p-5 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4F8CFF]">
              Overview
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#F8FAFC] sm:text-3xl">
              Your testing at a glance
            </h2>
          </div>
          <span className="rounded-md bg-[#F5C84C]/14 px-2.5 py-1 text-xs font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.22)]">
            Live sample
          </span>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.86fr]">
          <section className="min-w-0 rounded-md bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                Matchup Win Rates
              </h3>
              <BarChart3 className="size-4 text-[#4F8CFF]" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-3.5">
              {matchupRows.map((row) => (
                <div
                  key={row.archetype}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] items-center gap-3"
                >
                  <div className="min-w-0">
                    <div className="mb-1.5 flex min-w-0 items-center gap-2">
                      <ArchetypeSprites archetype={row.archetype} />
                      <span className="truncate text-sm font-medium text-[#F8FAFC]">
                        vs {row.archetype}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1A2238]">
                      <div
                        className={`h-full rounded-full ${row.tone} shadow-[0_0_14px_rgba(79,140,255,0.14)]`}
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
          </section>

          <section className="rounded-md bg-[#1A1020]/44 p-4 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.20),0_0_30px_rgba(244,63,94,0.05)]">
            <div className="flex min-w-0 items-center gap-2">
              <ArchetypeSprites archetype="Mega Greninja" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-rose-200">
                  Focus Matchup
                </p>
                <h3 className="truncate text-sm font-bold text-[#F8FAFC]">
                  vs Mega Greninja
                </h3>
              </div>
            </div>
            <p className="mt-4 text-5xl font-black tracking-tight text-[#F43F5E]">
              43%
            </p>
            <p className="mt-2 text-sm leading-6 text-[#C7D2E5]">
              Run five focused games and tag every loss pattern.
            </p>
          </section>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[0.82fr_1.18fr]">
          <section className="rounded-md bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
              Deck Version Comparison
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["Current version", "51%"],
                ["Test version", "58%"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-[#07111F]/70 p-3">
                  <p className="text-[11px] leading-4 text-[#94A3B8]/76">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-[#F8FAFC]">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-emerald-200">
              Version 3 is improving your focus matchup.
            </p>
          </section>

          <section className="rounded-md bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16),0_0_30px_rgba(79,140,255,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
              Testing Insight
            </p>
            <p className="mt-3 text-sm leading-6 text-[#F8FAFC]">
              You are losing more often going second into Mega Greninja. Review
              missed setup games before changing your list.
            </p>
          </section>
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
    <main className={`${marketingShell} relative`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(79,140,255,0.16),transparent_42%)]" />
      <header className="relative px-4 py-4 sm:px-6">
        <div className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 ${glassPanel}`}>
          <SixPrizerLogo
            variant="app-icon"
            size="lg"
            hideTextOnMobile
            className="group transition hover:scale-[1.02]"
            markClassName="bg-[#1A2238] transition group-hover:shadow-[0_0_28px_rgba(79,140,255,0.28)]"
            textClassName="tracking-tight"
          />
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <Link
              href="/demo"
              className="hidden h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-[#B8D1FF] transition hover:bg-[#4F8CFF]/10 hover:text-[#F8FAFC] active:scale-[0.98] sm:inline-flex"
            >
              Preview demo
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-white/5 hover:text-[#F8FAFC] active:scale-[0.98]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 max-w-full items-center justify-center rounded-md bg-[#F5C84C]/92 px-3 text-xs font-bold text-[#07111F] shadow-[0_10px_24px_rgba(245,200,76,0.16)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:h-10 sm:px-4 sm:text-sm"
            >
              Start tracking games
            </Link>
          </div>
        </div>
      </header>

      <section className="relative px-4 pb-10 pt-5 sm:px-6 sm:pb-14 sm:pt-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="sixprizer-fade-in min-w-0">
            <p className="inline-flex items-center gap-2 rounded-md bg-[#4F8CFF]/12 px-3 py-1.5 text-sm font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]">
              <Bolt className="size-4" aria-hidden="true" />
              Built for competitive Pokémon TCG testing
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-[#F8FAFC] min-[390px]:text-5xl sm:text-6xl xl:text-7xl">
              <span className="block">From testing games to</span>
              <span className="block whitespace-nowrap text-[#F5C84C] drop-shadow-[0_0_22px_rgba(245,200,76,0.20)]">
                six-prize turns.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#C7D2E5] sm:text-lg sm:leading-8">
              SixPrizer helps competitive Pokémon TCG players log games, spot the matchups costing them wins, compare deck versions, and decide what to test next.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={`${primaryButton} min-h-12 px-7 text-base shadow-[0_18px_44px_rgba(245,200,76,0.30)]`}>
                Start tracking games
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/demo"
                className={`${secondaryButton} h-12 px-6`}
              >
                Preview demo
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#94A3B8]/82">
              No account needed to preview. Demo data is provided.
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              {[
                [ClipboardList, "Fast logging"],
                [BarChart3, "Matchup intelligence"],
                [Target, "Testing insights"],
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

      <section className="relative px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            [ClipboardList, "Fast game logging", "Log in seconds after each game."],
            [
              Layers3,
              "Deck versions",
              "Compare builds side by side and find what actually works.",
            ],
            [
              ListChecks,
              "Review mode",
              "Find the games that explain your toughest matchups.",
            ],
            [
              TrendingUp,
              "Matchup insight",
              "See your true win rates and know what to test next.",
            ],
          ].map(([Icon, title, copy]) => (
            <article
              key={title as string}
              className="group rounded-md bg-[#0F1A2D]/70 p-4 shadow-[0_18px_54px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(148,163,184,0.10)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_34px_rgba(79,140,255,0.10),inset_0_0_0_1px_rgba(79,140,255,0.22)] focus-within:-translate-y-1 focus-within:shadow-[0_24px_70px_rgba(0,0,0,0.34),0_0_34px_rgba(79,140,255,0.10),inset_0_0_0_1px_rgba(79,140,255,0.22)] sm:p-5"
            >
              <div className="inline-flex size-12 items-center justify-center rounded-md bg-[#07111F] text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.22),0_0_28px_rgba(245,200,76,0.10)] transition group-hover:text-[#FFE27A] group-hover:shadow-[inset_0_0_0_1px_rgba(245,200,76,0.32),0_0_32px_rgba(79,140,255,0.10)]">
                <Icon className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#F8FAFC]">
                {title as string}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
                {copy as string}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
