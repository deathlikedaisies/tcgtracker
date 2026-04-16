import Image from "next/image";
import Link from "next/link";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

const navItems = ["Product", "Insights", "Prep"];

const valueChips = [
  "Deck version tracking",
  "Current Standard matchup data",
  "Testing notes that travel",
];

const features = [
  {
    title: "Log testing fast",
    copy: "Capture deck, opponent, result, turn order, and event type without slowing down testing.",
    stat: "30s",
  },
  {
    title: "Find pressure points",
    copy: "See which matchups and deck versions are actually moving your win rate.",
    stat: "64%",
  },
  {
    title: "Prep with context",
    copy: "Save matchup notes by your archetype so the next set of games starts sharper.",
    stat: "Notes",
  },
];

const demoMetrics = [
  { label: "Example games", value: "42" },
  { label: "Example win rate", value: "64%" },
  { label: "Example weak spot", value: "Dragapult" },
];

const trendBars = [58, 76, 44, 84, 62, 70, 92, 52, 80, 68];

function SpriteStack() {
  const sprites = [
    { src: "/sprites/dragapult-ex.png", alt: "Dragapult ex" },
    { src: "/sprites/lucario.png", alt: "Lucario" },
    { src: "/sprites/ogerpon.png", alt: "Ogerpon" },
  ];

  return (
    <div className="hidden items-center sm:flex">
      {sprites.map((sprite, index) => (
        <span
          key={sprite.src}
          className={`flex size-11 items-center justify-center rounded-md bg-[#0B1020]/74 shadow-[0_14px_34px_rgba(0,0,0,0.32),0_0_24px_rgba(79,140,255,0.12),inset_0_0_0_1px_rgba(248,250,252,0.08)] ${
            index > 0 ? "-ml-3" : ""
          }`}
        >
          <Image
            src={sprite.src}
            alt={sprite.alt}
            width={36}
            height={36}
            className="size-9 object-contain"
          />
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
                Post-rotation 2026
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#F8FAFC]">
                Testing dashboard
              </h2>
            </div>
            <SpriteStack />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            {demoMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-md bg-[#1A2238]/56 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-4"
              >
                <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                  {metric.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-[#F8FAFC] sm:text-2xl">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md bg-[#11182C]/78 p-4">
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
                  className="flex h-16 items-end rounded-sm bg-[#0B1020]/72 px-1 sm:h-24"
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

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md bg-[#1A2238]/48 p-3">
              <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                Best deck
              </p>
              <p className="mt-1 font-semibold text-[#F8FAFC]">
                Raging Bolt Ogerpon
              </p>
            </div>
            <div className="rounded-md bg-[#1A2238]/48 p-3">
              <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                Prep focus
              </p>
              <p className="mt-1 font-semibold text-[#F8FAFC]">
                Dragapult lines
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
          <nav className="hidden items-center gap-5 text-sm font-medium text-[#94A3B8] md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="transition hover:text-[#F8FAFC]"
              >
                {item}
              </a>
            ))}
          </nav>
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

      <section className="px-4 pb-12 pt-7 sm:px-6 sm:pb-16 sm:pt-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-md bg-[#4F8CFF]/14 px-3 py-1 text-sm font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]">
              Competitive Pokémon TCG command center
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-6xl">
              Turn every match into an edge.
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#F8FAFC]">
              Track matches, map matchups, and prep with real testing signal.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#94A3B8]/82">
              PrizeMap gives competitive players a sharper way to understand
              deck performance, current Standard trends, and matchup plans.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.24)] transition hover:bg-[#ffd85f]"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#4F8CFF]/12 px-6 text-sm font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)] transition hover:bg-[#4F8CFF]/18"
              >
                Log in
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section id="product" className="px-4 pb-10 sm:px-6 sm:pb-12">
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

      <section id="insights" className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#4F8CFF]">
                Product intelligence
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#F8FAFC]">
                Built for disciplined testing.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#94A3B8]/80">
              Clean inputs, readable summaries, and matchup notes in one place.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-md bg-[#11182C]/72 p-5 shadow-[0_18px_52px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(248,250,252,0.05)]"
              >
                <p className="text-3xl font-semibold text-[#F5C84C]">
                  {feature.stat}
                </p>
                <h3 className="mt-5 text-lg font-semibold text-[#F8FAFC]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#94A3B8]/80">
                  {feature.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 sm:pb-16">
        <div className="mx-auto grid max-w-6xl gap-3 rounded-md bg-[#0B1020]/44 p-4 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)] sm:grid-cols-3 sm:p-5">
          {demoMetrics.map((metric) => (
            <div key={metric.label} className="rounded-md bg-[#11182C]/62 p-4">
              <p className="text-xs font-medium uppercase text-[#94A3B8]/76">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="prep" className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-md bg-[#11182C]/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32),0_0_56px_rgba(79,140,255,0.08),inset_0_0_0_1px_rgba(248,250,252,0.06)] sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#4F8CFF]">
              Ready for your next testing block?
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#F8FAFC]">
              Stop guessing. Start mapping.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#94A3B8]/80">
              Build better tournament decisions from your own match data.
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
