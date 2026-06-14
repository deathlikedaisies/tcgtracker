import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList, Layers3, Sparkles, Target, TrendingUp } from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { BrandLogo } from "@/components/BrandLogo";
import {
  cardLarge,
  marketingShell,
  primaryButton,
  secondaryButton,
  sectionCopy,
} from "@/components/brand-styles";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const heroSteps = [
  {
    step: "1",
    icon: ClipboardList,
    title: "Log the game",
    copy: "Capture the matchup, result, turn order, and what mattered before the next queue.",
  },
  {
    step: "2",
    icon: Sparkles,
    title: "Build signal",
    copy: "SixPrizer groups your games into matchup reads, repeated leaks, and deck-version evidence.",
  },
  {
    step: "3",
    icon: Target,
    title: "Test next",
    copy: "Get a priority watchlist or focused test instead of guessing what to review or change.",
  },
] as const;

const featureChips = [
  ["Fast logging", ClipboardList],
  ["Matchup signal", Target],
  ["Deck versions", Layers3],
] as const;

const recordCards = [
  {
    label: "Wins",
    value: "5",
    support: "19%",
    className:
      "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]",
  },
  {
    label: "Losses",
    value: "19",
    support: "73%",
    className:
      "bg-[#F43F5E]/10 text-rose-200 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]",
  },
  {
    label: "Ties",
    value: "2",
    support: "8%",
    className:
      "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]",
  },
] as const;

function ProductPreview() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(15,25,44,0.96),rgba(8,17,31,0.92))] p-5 shadow-[0_24px_62px_rgba(0,0,0,0.30),inset_0_0_0_1px_rgba(148,163,184,0.12),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),transparent_24%,rgba(245,200,76,0.035)_56%,transparent_78%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(79,140,255,0.22),rgba(255,255,255,0.08),rgba(245,200,76,0.16))]" />
      <div className="pointer-events-none absolute -right-10 top-2 size-32 rounded-full bg-[#4F8CFF]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-12 size-32 rounded-full bg-[#F5C84C]/[0.05] blur-3xl" />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4F8CFF]">
              Current focus
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#F8FAFC] sm:text-3xl">
              Mega Greninja matchup
            </h2>
          </div>
          <span className="rounded-full bg-[#4F8CFF]/12 px-3 py-1 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
            Actionable signal
          </span>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[172px_minmax(0,1fr)] 2xl:grid-cols-[180px_minmax(0,1fr)]">
          <div className="flex flex-col items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(11,18,32,0.80),rgba(8,15,28,0.90))] p-5 text-center shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08),inset_0_1px_0_rgba(255,255,255,0.02)]">
            <div className="flex size-28 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(79,140,255,0.16),transparent_54%),radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.04),transparent_64%),rgba(7,17,31,0.92)] shadow-[0_0_24px_rgba(79,140,255,0.10),inset_0_0_0_1px_rgba(79,140,255,0.20)] sm:size-32">
              <ArchetypeSprites
                archetype="Mega Greninja"
                size="lg"
                variant="bare"
                className="overflow-visible"
                imageClassName="size-20 scale-[1.12] min-[390px]:size-[5.25rem] sm:size-24 sm:scale-[1.16]"
              />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#F8FAFC]">Mega Greninja</p>
            <p className="mt-1 text-xs text-[#94A3B8]/76">Priority watchlist</p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_132px]">
              <div className="grid gap-4">
                <div className="grid gap-3 min-[430px]:grid-cols-3">
                  {recordCards.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-[18px] px-4 py-3 ${item.className}`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-80">
                        {item.label}
                      </p>
                      <p className="mt-2 text-3xl font-black tracking-tight">{item.value}</p>
                      <p className="mt-1 text-xs font-semibold opacity-80">{item.support}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[20px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09),inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
                      Record
                    </p>
                    <p className="text-sm font-semibold text-[#F8FAFC]">5W / 19L / 2T</p>
                  </div>
                  <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[#1A2238]">
                    <div className="h-full bg-emerald-400" style={{ width: "19%" }} />
                    <div className="h-full bg-[#F43F5E]" style={{ width: "73%" }} />
                    <div className="h-full bg-[#F5C84C]" style={{ width: "8%" }} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                    <span className="text-emerald-200">19% wins</span>
                    <span className="text-rose-200">73% losses</span>
                    <span className="text-[#FFE28A]">8% ties</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-[22px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09),inset_0_1px_0_rgba(255,255,255,0.02)]">
                <div
                  className="relative flex size-28 items-center justify-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#F43F5E 0 19%, rgba(26,34,56,0.95) 19% 100%)",
                  }}
                >
                  <div className="flex size-[92px] flex-col items-center justify-center rounded-full bg-[#07111F] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <p className="text-3xl font-black tracking-tight text-[#F8FAFC]">19%</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/72">
                      Win rate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 min-[430px]:grid-cols-2 2xl:grid-cols-3">
              <div className="rounded-[18px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09),inset_0_1px_0_rgba(255,255,255,0.02)]">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
                  Focused games
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#F8FAFC]">4 / 5</p>
                <div className="mt-3 flex items-center gap-1.5">
                  {[true, true, true, true, false].map((filled, index) => (
                    <span
                      key={index}
                      className={`h-3 w-6 rounded-full ${
                        filled ? "bg-[#F5C84C]" : "bg-[#1A2238]"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#94A3B8]/72">
                  1 more to unlock next insight
                </p>
              </div>

              <div className="rounded-[18px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09),inset_0_1px_0_rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-2 text-[#4F8CFF]">
                  <Target className="size-4" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
                    Next watch
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#F8FAFC]">
                  Keep logging. When Mega Greninja appears, track bench pressure.
                </p>
              </div>

              <div className="rounded-[18px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09),inset_0_1px_0_rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-2 text-emerald-300">
                  <TrendingUp className="size-4" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
                    Deck signal
                  </p>
                </div>
                <p className="mt-3 text-sm leading-6 text-emerald-200">
                  v3 improved opening hands
                </p>
                <svg
                  viewBox="0 0 100 24"
                  className="mt-3 h-8 w-full"
                  aria-hidden="true"
                >
                  <polyline
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="4,18 24,16 42,14 62,10 82,8 96,5"
                  />
                </svg>
              </div>
            </div>
          </div>
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(79,140,255,0.10),transparent_40%)]" />

      <header className="relative px-4 py-3 sm:px-6 sm:py-4">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(10,18,38,0.98),rgba(6,13,26,0.96))] px-4 py-4 shadow-[0_16px_44px_rgba(0,0,0,0.30),inset_0_0_0_1px_rgba(79,140,255,0.22),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur sm:rounded-[26px] sm:px-5 sm:py-4">
          <div
            className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[#4F8CFF]/[0.16] blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 rounded-full bg-[#F5C84C]/[0.10] blur-2xl sm:block"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,rgba(79,140,255,0.35),transparent_40%,transparent_60%,rgba(245,200,76,0.22))]"
            aria-hidden="true"
          />

          <div className="relative z-10 flex min-w-0 items-center justify-between gap-3">
            <BrandLogo
              variant="horizontal"
              size="xl"
              className="min-w-0 max-w-[142px] shrink object-left transition hover:opacity-90 sm:max-w-none sm:shrink-0"
            />

            <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
              <Link
                href="/demo"
                className="hidden h-10 items-center justify-center rounded-[14px] px-3 text-sm font-medium text-[#B8D1FF] transition hover:bg-[#4F8CFF]/10 hover:text-[#F8FAFC] active:scale-[0.98] sm:inline-flex"
              >
                Preview demo
              </Link>
              <Link
                href="/login"
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-[12px] px-1 text-sm font-medium text-[#94A3B8]/88 transition hover:text-[#F8FAFC] sm:h-10 sm:rounded-[14px] sm:px-3 sm:text-sm sm:text-[#94A3B8] sm:hover:bg-white/5 sm:active:scale-[0.98]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden h-10 items-center justify-center whitespace-nowrap rounded-[14px] bg-[#F5C84C]/92 px-4 text-sm font-bold text-[#07111F] shadow-[0_10px_24px_rgba(245,200,76,0.16)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:inline-flex"
              >
                Start tracking games
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative px-4 pb-12 pt-9 sm:px-6 sm:pb-16 sm:pt-10">
        <div className="mx-auto grid max-w-[1400px] gap-8 xl:gap-9 2xl:gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="relative min-w-0 overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,rgba(16,26,45,0.95),rgba(8,17,31,0.90))] p-5 shadow-[0_24px_62px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(148,163,184,0.12),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur sm:p-6 lg:px-9 lg:py-8 xl:px-10 xl:py-9">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_22%,rgba(79,140,255,0.04)_46%,rgba(245,200,76,0.035)_68%,transparent_84%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(79,140,255,0.28),rgba(255,255,255,0.08),rgba(245,200,76,0.22))]" />
            <div className="pointer-events-none absolute -left-10 -top-10 size-36 rounded-full bg-[#4F8CFF]/[0.12] blur-3xl" />
            <div className="pointer-events-none absolute -bottom-14 right-8 size-36 rounded-full bg-[#F5C84C]/[0.06] blur-3xl" />

            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#4F8CFF]/12 px-3 py-1.5 text-sm font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]">
                <Sparkles className="size-4" aria-hidden="true" />
                Built for competitive Pokemon TCG testing
              </p>
              <h1 className="mt-5 max-w-[11.5ch] text-4xl font-black leading-[0.96] tracking-tight text-[#F8FAFC] min-[390px]:text-5xl sm:text-6xl xl:text-[3.75rem] 2xl:text-[4.5rem]">
                <span className="block">From testing games to</span>
                <span className="block max-w-[9.8ch] text-[#F5C84C] drop-shadow-[0_0_12px_rgba(245,200,76,0.12)] min-[1440px]:max-w-none 2xl:whitespace-nowrap">
                  six-prize turns.
                </span>
              </h1>
              <p className="mt-5 max-w-[44rem] text-base leading-7 text-[#C7D2E5] sm:text-lg sm:leading-8">
                Log games fast, spot the matchups costing you wins, and know what to test next.
              </p>
              <p className="mt-3 text-sm font-medium text-[#94A3B8]/82">
                Stop changing lists based on vibes.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
              <p className="mt-4 text-sm leading-6 text-[#94A3B8]/82">
                No account needed to preview demo data.
              </p>

              <div className="mt-8 flex flex-wrap gap-2.5">
                {featureChips.map(([label, Icon]) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0B1020]/42 px-3 py-2 text-sm font-medium text-[#F8FAFC]/88 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09),inset_0_1px_0_rgba(255,255,255,0.02)]"
                  >
                    <Icon className="size-4 text-[#4F8CFF]" aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="relative px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {heroSteps.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.step} className={`${cardLarge} relative overflow-hidden`}>
                <div className="pointer-events-none absolute -right-10 -top-10 size-24 rounded-full bg-[#4F8CFF]/10 blur-2xl" />
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-[14px] bg-[#F5C84C]/12 text-sm font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
                    {item.step}
                  </span>
                  <Icon className="size-5 text-[#4F8CFF]" aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-lg font-bold text-[#F8FAFC]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative px-4 pb-16 sm:px-6 sm:pb-20">
        <div className={`mx-auto max-w-7xl ${cardLarge}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]/82">
            Built for competitive testing
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">
            Built for the games between events, where lists are tuned and matchups are learned.
          </h2>
          <p className={`mt-4 max-w-3xl ${sectionCopy}`}>
            Every log should answer a testing question, not disappear into a spreadsheet.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className={`${primaryButton} h-12 px-6`}>
              Start tracking games
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
            <Link href="/demo" className={`${secondaryButton} h-12 px-6`}>
              Preview demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
