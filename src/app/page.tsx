import Link from "next/link";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

const valueChips = [
  "See your real win rates",
  "Find your worst matchup",
  "Improve every session",
];

const demoMetrics = [
  { label: "Worst matchup", value: "Dragapult", tone: "text-[#F43F5E]" },
  { label: "Best deck", value: "Raging Bolt", tone: "text-[#F5C84C]" },
  { label: "Win rate", value: "64%", tone: "text-[#22C55E]" },
];

const trendBars = [58, 76, 44, 84, 62, 70, 92, 52, 80, 68];

function SpriteStack() {
  const sprites = [
    "Dragapult Dusknoir",
    "Lucario Hariyama",
    "Raging Bolt Ogerpon",
  ];

  return (
    <div className="hidden items-center sm:flex">
      {sprites.map((sprite, index) => (
        <span
          key={sprite}
          className={`flex size-11 items-center justify-center rounded-md bg-[#0B1020]/74 shadow-[0_14px_34px_rgba(0,0,0,0.32),0_0_24px_rgba(79,140,255,0.12),inset_0_0_0_1px_rgba(248,250,252,0.08)] ${
            index > 0 ? "-ml-3" : ""
          }`}
        >
          <ArchetypeSprites archetype={sprite} size="md" />
        </span>
      ))}
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute inset-x-8 -top-6 h-20 bg-[#4F8CFF]/22 blur-3xl" />
      <div className="absolute inset-x-16 bottom-0 h-20 bg-[#F5C84C]/12 blur-3xl" />
      <div className="relative rounded-md bg-[#10172A]/92 p-2.5 shadow-[0_34px_110px_rgba(0,0,0,0.48),0_0_80px_rgba(79,140,255,0.18)] sm:p-3">
        <div className="rounded-md bg-[#0B1020]/96 p-4 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.07)] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase text-[#94A3B8]/80">
                PrizeMap preview
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#F8FAFC]">
                Your matchup insights
              </h2>
            </div>
            <SpriteStack />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-3">
            {demoMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-md bg-[#1A2238]/62 p-3 shadow-[0_14px_34px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-4"
              >
                <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                  {metric.label}
                </p>
                <p className={`mt-1 text-2xl font-semibold sm:mt-2 sm:text-3xl ${metric.tone}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-md bg-[#11182C]/78 p-3 sm:mt-4 sm:p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  Matchup signal
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]/80">
                  Example preview, not live account data
                </p>
              </div>
              <span className="rounded-md bg-[#22C55E]/12 px-3 py-1 text-xs font-semibold text-emerald-300">
                +8%
              </span>
            </div>
            <div className="mt-4 grid grid-cols-10 gap-1">
              {trendBars.map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className="flex h-12 items-end rounded-sm bg-[#0B1020]/72 px-1 sm:h-20"
                >
                  <div
                    className={`w-full rounded-sm ${
                      index === 2 || index === 7
                        ? "bg-[#F43F5E]"
                        : "bg-[#4F8CFF]"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2">
            <div className="rounded-md bg-[#1A2238]/48 p-3">
              <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                Focus next
              </p>
              <p className="mt-1 font-semibold text-[#F8FAFC]">
                Test the Dragapult line
              </p>
            </div>
            <div className="rounded-md bg-[#1A2238]/48 p-3">
              <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                Recent trend
              </p>
              <p className="mt-1 font-semibold text-[#F8FAFC]">
                4 wins in last 6
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

      <section className="px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-md bg-[#4F8CFF]/14 px-3 py-1 text-sm font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]">
              Built for Pokémon TCG testing
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-6xl">
              Log faster. Learn your matchups.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-[#F8FAFC]">
              Track games. See your worst matchups. Win more.
            </p>
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.24)] transition hover:bg-[#ffd85f] sm:w-auto"
              >
                Get started
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 sm:pb-10">
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

      <section className="px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-md bg-[#11182C]/72 p-5 shadow-[0_18px_58px_rgba(0,0,0,0.26),0_0_44px_rgba(79,140,255,0.08),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              Know what to test next.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8]/80">
              Turn every testing block into cleaner matchup decisions.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.24)] transition hover:bg-[#ffd85f]"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}
