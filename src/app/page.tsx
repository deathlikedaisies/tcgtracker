import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  ClipboardList,
  Eye,
  Gauge,
  GitCompareArrows,
  Import,
  LockKeyhole,
  ShieldCheck,
  Target,
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

const workflowSteps = [
  {
    icon: ClipboardList,
    title: "Log the game",
    copy: "Manual logging or TCG Live import captures result, turn order, matchup, and what mattered.",
  },
  {
    icon: ClipboardCheck,
    title: "Build a clean sample",
    copy: "Track clean logs, current version sample size, and repeated patterns before changing again.",
  },
  {
    icon: GitCompareArrows,
    title: "Compare versions",
    copy: "Deck Lab shows whether the latest list is improving or just noisy.",
  },
  {
    icon: Target,
    title: "Test the right things",
    copy: "Use Review, Matchups, and the meta watchlist to decide what deserves attention next.",
  },
] as const;

const deckLabFeatures = [
  "Version read",
  "Version comparison",
  "Clean-log discipline",
  "Meta watchlist",
  "Baseline-ready states",
] as const;

const importFeatures = [
  "Result",
  "Turn order",
  "Opponent player",
  "Opponent deck when confident",
] as const;

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-[#0F1A2D]/86 px-3 py-1.5 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.11)]">
      {children}
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(15,25,44,0.97),rgba(8,17,31,0.94))] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.34),inset_0_0_0_1px_rgba(148,163,184,0.14),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6 lg:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(79,140,255,0.34),rgba(255,255,255,0.10),rgba(245,200,76,0.24))]" />
      <div className="relative grid gap-5">
        <div className="flex min-w-0 items-start gap-3 rounded-[24px] bg-[#07111F]/58 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] sm:gap-4 sm:p-5">
          <span className="inline-flex shrink-0 rounded-[20px] bg-[radial-gradient(circle_at_top,rgba(79,140,255,0.24),rgba(11,16,32,0.16)_62%,transparent_100%)] p-3 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
            <ArchetypeSprites
              archetype="Dragapult Blaziken"
              size="lg"
              variant="bare"
              imageClassName="scale-[1.08]"
            />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#4F8CFF]">
              Current test deck
            </p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[#F8FAFC] sm:text-2xl">
              Dragapult Blaziken
            </h2>
            <p className="mt-1 text-sm font-medium text-[#D6E0F0]/86">
              Testing: v3 consistency build
            </p>
            <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
              Showing insights for this deck
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1.28fr_0.72fr]">
          <div className="rounded-[24px] bg-[#0F1A2D]/86 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#F5C84C]">
                Deck Lab
              </p>
              <Pill>Version improved</Pill>
            </div>
            <h3 className="mt-3 text-lg font-bold text-[#F8FAFC]">
              Setup quality improved in v3.
            </h3>
            <p className="mt-2 max-w-[32rem] text-sm leading-6 text-[#94A3B8]/78">
              Keep this version for a few more clean logs before changing the list again.
            </p>
            <div className="mt-5 grid gap-2.5">
              <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[#07111F]/58 px-3.5 py-3">
                <span className="text-sm text-[#D6E0F0]">Win rate</span>
                <span className="text-sm font-semibold text-emerald-200">58% vs 44%</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[#07111F]/58 px-3.5 py-3">
                <span className="text-sm text-[#D6E0F0]">Opening hand</span>
                <span className="text-sm font-semibold text-[#FFE28A]">Better</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[#07111F]/58 px-3.5 py-3">
                <span className="text-sm text-[#D6E0F0]">Going second</span>
                <span className="text-sm font-semibold text-rose-200">Watch</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] bg-[#0F1A2D]/86 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#94A3B8]">
                Testing discipline
              </p>
              <p className="mt-2 text-2xl font-black text-[#F8FAFC]">8 of 12</p>
              <p className="mt-1 text-sm text-[#94A3B8]/76">clean logs</p>
              <div className="mt-3 flex gap-1.5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 flex-1 rounded-full ${
                      index < 4 ? "bg-[#F5C84C]" : "bg-[#1A2238]"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-[#0F1A2D]/86 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#94A3B8]">
                Meta watchlist
              </p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[#D6E0F0]">N&apos;s Zoroark</span>
                  <span className="shrink-0 text-[#94A3B8]">No data</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[#D6E0F0]">Mega Greninja</span>
                  <span className="shrink-0 text-[#FFE28A]">Needs more</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[#D6E0F0]">Ogerpon Meganium</span>
                  <span className="shrink-0 text-emerald-200">Early read</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F5C84C]/88">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-4xl">
        {title}
      </h2>
      <p className={`mt-3 ${sectionCopy}`}>{copy}</p>
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
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:items-center xl:gap-12">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#4F8CFF]/12 px-3 py-1.5 text-sm font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Built for competitive Pokemon TCG testing
            </p>
            <h1 className="mt-6 max-w-[13ch] text-4xl font-black leading-[1.02] tracking-normal text-[#F8FAFC] min-[390px]:text-5xl sm:text-6xl xl:text-[4rem]">
              Know if your deck changes are actually working.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#C7D2E5] sm:text-lg sm:leading-8">
              Log games, import TCG Live battle logs, compare deck versions, and see what to test next before changing your list again.
            </p>
            <p className="mt-3 text-sm font-medium text-[#94A3B8]/82">
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

            <div className="mt-9 grid gap-2.5 min-[430px]:grid-cols-3">
              <Pill>Fast logging</Pill>
              <Pill>Deck Lab</Pill>
              <Pill>Scoped Review</Pill>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Testing workflow"
            title="Use ladder games without chasing exact pairings."
            copy="SixPrizer turns whatever games you actually get into a clean testing loop for the current deck."
          />

          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-[24px] bg-[linear-gradient(180deg,rgba(15,25,44,0.90),rgba(8,17,31,0.86))] p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.11),0_14px_36px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-[14px] bg-[#F5C84C]/12 text-sm font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
                      {index + 1}
                    </span>
                    <Icon className="size-5 text-[#4F8CFF]" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#F8FAFC]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-[32px] bg-[linear-gradient(180deg,rgba(14,24,42,0.94),rgba(8,17,31,0.90))] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(148,163,184,0.12)] sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <SectionHeader
              eyebrow="Deck Lab"
              title="Deck Lab tells you whether the change was worth it."
              copy="Compare your active version against previous builds, track testing discipline, and watch key meta matchups without chasing ladder pairings."
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/demo" className={`${primaryButton} h-12 px-6`}>
                Preview demo
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
              <Link href="/signup" className={`${secondaryButton} h-12 px-6`}>
                Start tracking games
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {deckLabFeatures.map((feature) => (
              <div
                key={feature}
                className="rounded-[20px] bg-[#07111F]/58 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]"
              >
                <div className="flex items-center gap-2 text-[#F5C84C]">
                  <Gauge className="size-4" aria-hidden="true" />
                  <p className="text-sm font-semibold text-[#F8FAFC]">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] bg-[linear-gradient(180deg,rgba(15,25,44,0.92),rgba(8,17,31,0.88))] p-6 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12),0_18px_48px_rgba(0,0,0,0.20)] sm:p-8">
            <Import className="size-8 text-[#F5C84C]" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#F8FAFC]">
              Paste a TCG Live battle log. SixPrizer fills the boring parts.
            </h2>
            <p className={`mt-3 ${sectionCopy}`}>
              Autofill what can be detected. You stay in control of quality ratings, reason tags, and testing notes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {importFeatures.map((feature) => (
                <Pill key={feature}>{feature}</Pill>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] bg-[linear-gradient(180deg,rgba(15,25,44,0.92),rgba(8,17,31,0.88))] p-6 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12),0_18px_48px_rgba(0,0,0,0.20)] sm:p-8">
            <LockKeyhole className="size-8 text-[#4F8CFF]" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#F8FAFC]">
              Private testing by default.
            </h2>
            <p className={`mt-3 ${sectionCopy}`}>
              Keep deck work private while you test. Share public profiles or reports only when you choose.
            </p>
            <div className="mt-5 grid gap-3">
              <div className="flex items-center gap-3 rounded-[18px] bg-[#07111F]/54 p-3 text-sm text-[#D6E0F0] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
                <ShieldCheck className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />
                Testing data stays private until you change sharing settings.
              </div>
              <div className="flex items-center gap-3 rounded-[18px] bg-[#07111F]/54 p-3 text-sm text-[#D6E0F0] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
                <Eye className="size-4 shrink-0 text-[#F5C84C]" aria-hidden="true" />
                Use demo data first if you want to inspect the workflow.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(7,17,31,0.92))] p-7 text-center shadow-[0_24px_64px_rgba(0,0,0,0.30),inset_0_0_0_1px_rgba(245,200,76,0.16)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F5C84C]/88">
            Demo workspace
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-4xl">
            Try the demo workspace first.
          </h2>
          <p className={`mx-auto mt-3 max-w-2xl ${sectionCopy}`}>
            Explore realistic seeded testing data before creating an account.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/demo" className={`${primaryButton} h-12 px-7`}>
              Preview demo
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
            <Link href="/signup" className={`${secondaryButton} h-12 px-7`}>
              Start tracking games
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 pt-10 sm:px-6 sm:pb-32 sm:pt-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 rounded-[30px] border border-white/10 bg-[#0B1020]/44 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-4xl">
                Ready to test your next list properly?
              </h2>
              <p className={`mt-2 ${sectionCopy}`}>
                Track versions, log games, and make the next deck change with evidence.
              </p>
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
