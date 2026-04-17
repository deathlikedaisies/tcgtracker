import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

const valueChips = [
  "See your real win rates",
  "Find your worst matchup",
  "Know what to test next",
];

const demoMetrics = [
  {
    label: "Worst matchup",
    value: "Dragapult Dusknoir",
    mobileValue: "Dragapult",
    tone: "text-[#F43F5E]",
    archetype: "Dragapult Dusknoir",
  },
  {
    label: "Best deck",
    value: "Raging Bolt Ogerpon",
    mobileValue: "Raging Bolt",
    tone: "text-[#F5C84C]",
    archetype: "Raging Bolt Ogerpon",
  },
  { label: "Win rate", value: "64%", tone: "text-[#22C55E]" },
  { label: "Recent trend", value: "4 wins in 6", tone: "text-[#F8FAFC]" },
];

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute inset-x-8 -top-5 h-16 bg-[#4F8CFF]/18 blur-3xl" />
      <div className="relative rounded-md bg-[#10172A]/92 p-2.5 shadow-[0_28px_90px_rgba(0,0,0,0.42),0_0_64px_rgba(79,140,255,0.14)] sm:p-3">
        <div className="rounded-md bg-[#0B1020]/96 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.07)] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-[#94A3B8]/80">
                Based on your testing
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#F8FAFC] sm:text-xl">
                Your matchup insights
              </h2>
            </div>
            <span className="rounded-md bg-[#22C55E]/12 px-3 py-1 text-xs font-semibold text-emerald-300">
              +8%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
            {demoMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-md bg-[#1A2238]/62 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(248,250,252,0.05)]"
              >
                <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                  {metric.label}
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-2 sm:mt-2">
                  {metric.archetype ? (
                    <ArchetypeSprites archetype={metric.archetype} className="shrink-0" />
                  ) : null}
                  <p className={`min-w-0 text-xl font-semibold leading-tight sm:text-2xl ${metric.tone}`}>
                    {"mobileValue" in metric ? (
                      <>
                        <span className="sm:hidden">{metric.mobileValue}</span>
                        <span className="hidden sm:inline">{metric.value}</span>
                      </>
                    ) : (
                      metric.value
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-md bg-[#11182C]/78 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <ArchetypeSprites archetype="Dragapult Dusknoir" className="shrink-0" />
              <p className="min-w-0 text-sm font-semibold text-[#F8FAFC]">
                Next test: fix the Dragapult Dusknoir line.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0B1020] bg-[radial-gradient(ellipse_at_top,rgba(79,140,255,0.22),transparent_42%),linear-gradient(180deg,#0B1020_0%,#11182C_48%,#0B1020_100%)] text-[#F8FAFC]">
      <header className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-md bg-[#0B1020]/42 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)]">
          <PrizeMapLogo
            markClassName="bg-[#1A2238] shadow-[0_0_28px_rgba(79,140,255,0.22)]"
            textClassName="text-base text-[#F8FAFC]"
          />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-white/5 hover:text-[#F8FAFC] sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020] shadow-[0_12px_30px_rgba(245,200,76,0.22)] transition hover:bg-[#ffd85f]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="px-4 pb-6 pt-3 sm:px-6 sm:pb-9 sm:pt-7">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-md bg-[#4F8CFF]/14 px-3 py-1 text-sm font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]">
              Built for Pokémon TCG testing
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-6xl">
              You don&apos;t actually know your matchups.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-[#F8FAFC]">
              Track games. Find what&apos;s losing you matches. Fix it.
            </p>
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.24)] transition hover:bg-[#ffd85f] sm:w-auto"
              >
                Start tracking
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
          {valueChips.map((item) => (
            <div
              key={item}
              className="rounded-md bg-[#11182C]/66 px-4 py-4 text-sm font-semibold text-[#F8FAFC] shadow-[0_14px_34px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(248,250,252,0.05)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="mx-auto max-w-6xl rounded-md bg-[#11182C]/64 p-5 shadow-[0_18px_52px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
            Most players test wrong.
          </h2>
          <div className="mt-4 grid gap-2 text-sm font-medium text-[#94A3B8] md:grid-cols-3">
            <p>You remember wins, not patterns</p>
            <p>You guess matchups</p>
            <p>You repeat the same mistakes</p>
          </div>
          <p className="mt-4 text-base font-semibold text-[#F8FAFC]">
            PrizeMap shows you what&apos;s actually happening.
          </p>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-md bg-[#11182C]/72 p-5 shadow-[0_18px_58px_rgba(0,0,0,0.26),0_0_36px_rgba(79,140,255,0.06),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              Know exactly what to fix next session.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8]/80">
              No guessing. Just data from your own games.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#F5C84C] px-4 text-center text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.24)] transition hover:bg-[#ffd85f] sm:px-6 md:w-auto"
          >
            Start tracking before your next testing block
          </Link>
        </div>
      </section>
    </main>
  );
}
