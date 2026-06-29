import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FlaskConical,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { BrandLogo } from "@/components/BrandLogo";
import {
  marketingShell,
  primaryButton,
  secondaryButton,
  sectionCopy,
} from "@/components/brand-styles";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const benefits = [
  {
    icon: ClipboardList,
    title: "Fast match logging",
    copy: "Log a game manually or paste a TCG Live battle log.",
  },
  {
    icon: BarChart3,
    title: "Matchup tracking",
    copy: "See which matchups, turn order, and patterns are costing wins.",
  },
  {
    icon: SearchCheck,
    title: "Review and improve",
    copy: "Use Review and Deck Lab to decide what to test before changing your list.",
  },
] as const;

const recentMatches = [
  { opponent: "Mega Greninja", result: "Win", tone: "text-emerald-200" },
  { opponent: "N's Zoroark", result: "Loss", tone: "text-rose-200" },
  { opponent: "Ogerpon Meganium", result: "Win", tone: "text-emerald-200" },
] as const;

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#0F1A2D]/86 px-3 py-1.5 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.11)]">
      {children}
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_20%_0%,rgba(79,140,255,0.20),transparent_34%),linear-gradient(180deg,rgba(15,25,44,0.98),rgba(8,17,31,0.94))] p-5 shadow-[0_34px_90px_rgba(0,0,0,0.42),0_0_0_1px_rgba(79,140,255,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6 lg:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(79,140,255,0.34),rgba(255,255,255,0.10),rgba(245,200,76,0.24))]" />
      <div className="pointer-events-none absolute -right-16 -top-20 size-48 rounded-full bg-[#F5C84C]/10 blur-3xl" />
      <div className="relative grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#B8D1FF]">
            SixPrizer workspace
          </p>
          <Pill>Scoped to current deck</Pill>
        </div>

        <div className="grid gap-4 rounded-[28px] bg-[#07111F]/64 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] sm:p-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="inline-flex shrink-0 rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(79,140,255,0.28),rgba(11,16,32,0.18)_62%,transparent_100%)] p-3.5 shadow-[0_12px_34px_rgba(79,140,255,0.10),inset_0_0_0_1px_rgba(79,140,255,0.20)]">
              <ArchetypeSprites
                archetype="Dragapult Blaziken"
                size="lg"
                variant="bare"
                imageClassName="scale-[1.16]"
              />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#4F8CFF]">
                Current test deck
              </p>
              <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#F8FAFC] sm:text-3xl">
                Dragapult Blaziken
              </h2>
              <p className="mt-1 text-sm font-medium text-[#D6E0F0]/86">
                Testing: v3 consistency build
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] bg-[#0F1A2D]/88 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
              <p className="text-xs text-[#94A3B8]">Current sample</p>
              <p className="mt-1 text-lg font-black text-[#F8FAFC]">12 games</p>
            </div>
            <div className="rounded-[18px] bg-[#0F1A2D]/88 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
              <p className="text-xs text-[#94A3B8]">Clean logs</p>
              <p className="mt-1 text-lg font-black text-[#F8FAFC]">8 of 12</p>
            </div>
            <div className="rounded-[18px] bg-[#0F1A2D]/88 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
              <p className="text-xs text-[#94A3B8]">Next read</p>
              <p className="mt-1 text-lg font-black text-[#FFE28A]">Review</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[26px] bg-[#0F1A2D]/88 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),0_14px_34px_rgba(0,0,0,0.18)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#F5C84C]">
                Recent logs
              </p>
              <span className="text-xs font-semibold text-[#94A3B8]">last session</span>
            </div>
            <div className="mt-4 grid gap-2.5">
              {recentMatches.map((match) => (
                <div
                  key={match.opponent}
                  className="flex items-center justify-between gap-3 rounded-[16px] bg-[#07111F]/58 px-3.5 py-3"
                >
                  <span className="min-w-0 truncate text-sm text-[#D6E0F0]">
                    {match.opponent}
                  </span>
                  <span className={`shrink-0 text-sm font-semibold ${match.tone}`}>
                    {match.result}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[26px] bg-[#0F1A2D]/88 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),0_14px_34px_rgba(0,0,0,0.18)] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#94A3B8]">
                Matchup signal
              </p>
              <h3 className="mt-2 text-lg font-bold text-[#F8FAFC]">
                Going second is costing wins.
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
                Losses are clustering around setup and sequencing.
              </p>
            </div>

            <div className="rounded-[26px] bg-[linear-gradient(135deg,rgba(245,200,76,0.12),rgba(15,26,45,0.90)_38%,rgba(15,26,45,0.88))] p-4 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14),0_14px_34px_rgba(0,0,0,0.18)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#94A3B8]">
                  Deck Lab
                </p>
                <Pill>Early read</Pill>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#D6E0F0]">
                v3 setup looks cleaner. Keep building the sample before changing again.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/signup"
          className="inline-flex min-h-12 items-center justify-center rounded-[18px] bg-[#F5C84C] px-5 text-sm font-black text-[#07111F] shadow-[0_18px_42px_rgba(245,200,76,0.24)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0"
        >
          Log the next game
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </Link>
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
    <main className={`${marketingShell} relative overflow-x-hidden`}>
      <header className="relative px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[24px] bg-[linear-gradient(180deg,rgba(10,18,38,0.98),rgba(6,13,26,0.96))] px-4 py-4 shadow-[0_16px_44px_rgba(0,0,0,0.30),inset_0_0_0_1px_rgba(79,140,255,0.20),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur sm:px-5">
          <BrandLogo
            variant="horizontal"
            size="xl"
            className="min-w-0 max-w-[142px] shrink object-left transition hover:opacity-90 sm:max-w-none sm:shrink-0"
          />

          <nav aria-label="Public" className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
            <Link
              href="/demo"
              className="hidden h-10 items-center justify-center rounded-[14px] px-3 text-sm font-medium text-[#B8D1FF] transition hover:bg-[#4F8CFF]/10 hover:text-[#F8FAFC] active:scale-[0.98] sm:inline-flex"
            >
              Preview demo
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-[12px] px-2 text-sm font-medium text-[#94A3B8]/88 transition hover:text-[#F8FAFC] sm:h-10 sm:rounded-[14px] sm:px-3 sm:hover:bg-white/5"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="hidden h-10 items-center justify-center whitespace-nowrap rounded-[14px] bg-[#F5C84C]/92 px-4 text-sm font-bold text-[#07111F] shadow-[0_10px_24px_rgba(245,200,76,0.16)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:inline-flex"
            >
              Start tracking games
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
        <div className="pointer-events-none absolute left-1/2 top-14 h-72 w-[min(58rem,92vw)] -translate-x-1/2 rounded-full bg-[#4F8CFF]/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-center xl:gap-16">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#4F8CFF]/12 px-3 py-1.5 text-sm font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Built for competitive Pokemon TCG testing
            </p>
            <h1 className="mt-6 max-w-[14ch] text-4xl font-black leading-[1.02] tracking-normal text-[#F8FAFC] min-[390px]:text-5xl sm:text-6xl xl:text-[4.3rem]">
              Track your Pokemon TCG testing and find what is costing wins.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C7D2E5] sm:text-xl sm:leading-9">
              Log matches, track matchup results, review repeated issues, and see what to test next.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#94A3B8]/86">
              SixPrizer is built for competitive players testing between events. Deck Lab helps compare versions once you have enough games.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#94A3B8]/86">
              <LockKeyhole className="size-4 text-[#4F8CFF]" aria-hidden="true" />
              Your testing data stays private by default.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className={`${primaryButton} min-h-12 px-7 text-base shadow-[0_18px_44px_rgba(245,200,76,0.30),0_0_0_1px_rgba(245,200,76,0.22)]`}
              >
                Start tracking games
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/demo"
                className={`${secondaryButton} h-12 px-6 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22),0_10px_28px_rgba(0,0,0,0.12)]`}
              >
                Preview demo
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 md:grid-cols-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="group relative overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(15,25,44,0.95),rgba(8,17,31,0.90))] p-6 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12),0_20px_54px_rgba(0,0,0,0.22)] sm:min-h-[230px] sm:p-7"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-[#F5C84C]/[0.06] blur-2xl transition group-hover:bg-[#F5C84C]/[0.09]" />
                  <div className="relative flex items-start justify-between gap-4">
                    <span className="inline-flex size-12 items-center justify-center rounded-[18px] bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-[#334155]">
                      0{index + 1}
                    </span>
                  </div>
                  <h2 className="relative mt-8 text-2xl font-black tracking-tight text-[#F8FAFC]">
                    {benefit.title}
                  </h2>
                  <p className="relative mt-3 text-base leading-7 text-[#B9C6DA]/86">
                    {benefit.copy}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_85%_10%,rgba(245,200,76,0.16),transparent_30%),linear-gradient(180deg,rgba(14,24,42,0.96),rgba(8,17,31,0.91))] p-6 shadow-[0_28px_76px_rgba(0,0,0,0.34),inset_0_0_0_1px_rgba(148,163,184,0.12)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F5C84C]/88">
              Deck Lab
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-4xl">
              Deck Lab turns your logs into deck decisions.
            </h2>
            <p className={`mt-4 max-w-2xl ${sectionCopy}`}>
              Compare versions, track clean samples, and see whether a list change is actually helping.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Pill>Version read</Pill>
              <Pill>Clean-log discipline</Pill>
              <Pill>Meta watchlist</Pill>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className={`${primaryButton} h-12 px-6`}>
                Preview demo
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
              <Link href="/signup" className={`${secondaryButton} h-12 px-6`}>
                Start tracking games
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] bg-[#07111F]/64 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),0_18px_46px_rgba(0,0,0,0.24)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-12 items-center justify-center rounded-[18px] bg-[#4F8CFF]/12 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                <FlaskConical className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#F8FAFC]">v3 consistency build</p>
                  <p className="text-sm text-[#94A3B8]/78">12 games logged</p>
                </div>
              </div>
              <Pill>Useful sample</Pill>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
                <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#F5C84C]">
                  Version read
                </p>
                <p className="mt-2 text-lg font-bold text-[#F8FAFC]">
                  v3 setup improved.
                </p>
                <p className="mt-1 text-sm leading-6 text-[#94A3B8]/80">
                  Keep testing before changing again.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-[#0F1A2D]/72 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
                  <p className="text-xs text-[#94A3B8]">Clean-log discipline</p>
                  <p className="mt-1 text-xl font-black text-[#F8FAFC]">8 of 12</p>
                </div>
                <div className="rounded-[18px] bg-[#0F1A2D]/72 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
                  <p className="text-xs text-[#94A3B8]">Meta watchlist</p>
                  <p className="mt-1 text-xl font-black text-[#FFE28A]">Needs more</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-12 sm:px-6 sm:pb-32 sm:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,25,44,0.94),rgba(8,17,31,0.88))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#F5C84C]">
                <Sparkles className="size-4" aria-hidden="true" />
                Start with the tracker. Unlock deeper reads as your logs grow.
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-4xl">
                Ready to start tracking your testing games?
              </h2>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={`${primaryButton} h-12 px-7`}>
                Start tracking games
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
              <Link href="/demo" className={`${secondaryButton} h-12 px-7`}>
                Preview demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
