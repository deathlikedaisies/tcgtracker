import Link from "next/link";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

const previewStats = [
  { label: "Win rate", value: "64%", tone: "text-emerald-300" },
  { label: "Worst matchup", value: "Dragapult ex", tone: "text-rose-200" },
  { label: "Best deck", value: "Raging Bolt", tone: "text-[#4F8CFF]" },
];

const valueChips = ["Track games", "Read matchups", "Prep smarter"];

const features = [
  {
    title: "Track every match",
    copy: "Log deck version, opponent archetype, result, format, tags, and notes in one fast flow.",
  },
  {
    title: "See real matchups",
    copy: "Filter your records by deck, version, and format to find what is actually costing wins.",
  },
  {
    title: "Prepare with notes",
    copy: "Keep matchup notes tied to your archetypes so testing turns into better plans.",
  },
];

function ProductPreview() {
  return (
    <div className="rounded-md bg-[#11182C] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.42),0_0_54px_rgba(79,140,255,0.12)]">
      <div className="rounded-md bg-[#0B1020]/92 p-4 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase text-[#94A3B8]">
              Dashboard
            </p>
            <p className="mt-1 text-lg font-semibold text-[#F8FAFC]">
              Post-rotation testing
            </p>
          </div>
          <span className="rounded-md bg-[#4F8CFF]/14 px-3 py-1 text-xs font-medium text-[#F8FAFC]">
            42 games
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {previewStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-md bg-[#1A2238]/52 p-4"
            >
              <p className="text-xs font-medium uppercase text-[#94A3B8]/80">
                {stat.label}
              </p>
              <p className={`mt-2 text-xl font-semibold ${stat.tone}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-md bg-[#1A2238]/42 p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-[#F8FAFC]">Matchup trend</span>
            <span className="text-[#94A3B8]">Last 10 matches</span>
          </div>
          <div className="mt-4 grid grid-cols-10 gap-1">
            {[48, 70, 36, 82, 54, 62, 88, 44, 74, 66].map((height, index) => (
              <div
                key={`${height}-${index}`}
                className="flex h-20 items-end rounded-sm bg-[#0B1020]/70 px-1"
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
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F8FAFC]">
      <header className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <PrizeMapLogo
            markClassName="bg-[#1A2238] shadow-[0_0_28px_rgba(79,140,255,0.18)]"
            textClassName="text-base text-[#F8FAFC]"
          />
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-white/5 hover:text-[#F8FAFC] sm:px-4"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020] transition hover:bg-[#ffd85f]"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 pb-12 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-[#4F8CFF]">
              Competitive Pokemon TCG tracker
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-5xl">
              Win more games by understanding your matchups.
            </h1>
            <p className="mt-5 text-lg leading-7 text-[#F8FAFC]">
              Track your matches. Map your prizes. Win more games.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#94A3B8]/80">
              A focused testing tracker for matchup analysis, deck performance,
              and smarter preparation.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#F5C84C] px-5 text-sm font-semibold text-[#0B1020] transition hover:bg-[#ffd85f]"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#4F8CFF]/10 px-5 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/16"
              >
                Log in
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-4xl">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-2 sm:grid-cols-3">
          {valueChips.map((item) => (
            <div
              key={item}
              className="rounded-md bg-[#1A2238]/42 px-4 py-3 text-center text-sm font-medium text-[#F8FAFC]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-md bg-[#1A2238]/50 p-5 shadow-[0_12px_34px_rgba(0,0,0,0.14)]"
              >
                <h2 className="text-lg font-semibold text-[#F8FAFC]">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#94A3B8]/78">
                  {feature.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 rounded-md bg-[#1A2238]/46 p-6 shadow-[0_16px_44px_rgba(0,0,0,0.16)] sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              Start learning from your games.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
              Build cleaner testing decisions from real match data.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#F5C84C] px-5 text-sm font-semibold text-[#0B1020] transition hover:bg-[#ffd85f]"
          >
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}
