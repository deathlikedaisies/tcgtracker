import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

const valueChips = [
  "Stop guessing your matchups",
  "See what's actually losing you games",
  "Fix your next testing block",
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
      <div className="absolute inset-x-10 -top-4 h-14 bg-[#4F8CFF]/14 blur-3xl" />
      <div className="relative rounded bg-[#10172A]/94 p-2 shadow-[0_24px_72px_rgba(0,0,0,0.46)] sm:p-3">
        <div className="rounded bg-[#0B1020]/96 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.07)] sm:p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-[#94A3B8]/80">
                From your last testing session
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#F8FAFC] sm:text-xl">
                Your matchup insights
              </h2>
            </div>
            <span className="rounded bg-[#22C55E]/10 px-3 py-1 text-xs font-semibold text-emerald-300/86">
              +8%
            </span>
          </div>

          <div className="mt-3 rounded bg-[#11182C]/92 p-4 shadow-[0_18px_48px_rgba(245,200,76,0.12),inset_0_0_0_1px_rgba(245,200,76,0.36)] transition duration-200 hover:-translate-y-0.5 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <ArchetypeSprites archetype="Dragapult Dusknoir" className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-[#F5C84C]">
                  Primary recommendation
                </p>
                <p className="mt-1 min-w-0 text-base font-semibold text-[#F8FAFC] sm:text-lg">
                  Your next session: fix the Dragapult Dusknoir line.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            {demoMetrics.map((metric) => {
              const isWorstMatchup = metric.label === "Worst matchup";

              return (
                <div
                  key={metric.label}
                  className={`rounded p-3 transition duration-200 hover:-translate-y-0.5 ${
                    isWorstMatchup
                      ? "col-span-2 bg-[#F43F5E]/18 shadow-[0_18px_52px_rgba(244,63,94,0.20),inset_0_0_0_1px_rgba(244,63,94,0.44)]"
                      : "bg-[#1A2238]/50 shadow-[0_10px_26px_rgba(0,0,0,0.12)]"
                  }`}
                >
                  <p
                    className={`text-xs font-medium uppercase ${
                      isWorstMatchup ? "text-rose-200" : "text-[#94A3B8]/72"
                    }`}
                  >
                    {metric.label}
                  </p>
                  <div className="mt-1 flex min-w-0 items-center gap-2 sm:mt-2">
                    {metric.archetype ? (
                      <ArchetypeSprites archetype={metric.archetype} className="shrink-0" />
                    ) : null}
                    <p
                      className={`min-w-0 font-semibold leading-tight ${metric.tone} ${
                        isWorstMatchup
                          ? "text-3xl sm:text-4xl"
                          : metric.label === "Recent trend"
                            ? "text-base text-[#F8FAFC]/82 sm:text-lg"
                            : "text-lg sm:text-xl"
                      }`}
                    >
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSignal() {
  return (
    <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded bg-[#11182C]/56 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
      <ArchetypeSprites archetype="Dragapult Dusknoir" className="shrink-0" />
      <span className="min-w-0 text-sm font-semibold text-[#F8FAFC]">
        Weak spot found: Dragapult Dusknoir
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0B1020] bg-[radial-gradient(ellipse_at_top,rgba(79,140,255,0.14),transparent_38%),linear-gradient(180deg,#0B1020_0%,#11182C_50%,#0B1020_100%)] text-[#F8FAFC]">
      <header className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded bg-[#0B1020]/42 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)]">
          <PrizeMapLogo
            markClassName="bg-[#1A2238] shadow-[0_0_28px_rgba(79,140,255,0.22)]"
            textClassName="text-base text-[#F8FAFC]"
          />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-10 items-center justify-center rounded px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-white/5 hover:text-[#F8FAFC] active:scale-[0.98] sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.28)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98]"
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
            <HeroSignal />
            <div className="mt-5">
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center rounded bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] shadow-[0_18px_44px_rgba(245,200,76,0.34)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:w-auto"
              >
                Start tracking
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="px-4 pb-5 sm:px-6 sm:pb-7">
        <div className="mx-auto grid max-w-6xl gap-2 md:grid-cols-3">
          {valueChips.map((item) => (
            <div
              key={item}
              className="rounded bg-[#11182C]/32 px-4 py-3 text-sm font-semibold text-[#F8FAFC]/88"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-5 sm:px-6 sm:pb-7">
        <div className="mx-auto max-w-6xl rounded bg-[#11182C]/42 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.14)] sm:p-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
            Most players test wrong.
          </h2>
          <div className="mt-3 grid gap-2 text-sm font-medium text-[#94A3B8] md:grid-cols-3">
            <p>You remember wins. You forget what&apos;s actually losing you games.</p>
            <p>You think you know your matchups. You don&apos;t.</p>
            <p>You repeat the same mistakes every session.</p>
          </div>
          <p className="mt-3 text-base font-semibold text-[#F8FAFC]">
            PrizeMap shows you what&apos;s actually happening.
          </p>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 sm:pb-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded bg-[#11182C]/58 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.18)] sm:p-5 md:flex-row md:items-center md:justify-between">
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
            className="inline-flex h-12 w-full items-center justify-center rounded bg-[#F5C84C] px-4 text-center text-sm font-semibold text-[#0B1020] shadow-[0_18px_44px_rgba(245,200,76,0.32)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:px-6 md:w-auto"
          >
            Start tracking before your next testing session
          </Link>
        </div>
      </section>
    </main>
  );
}
