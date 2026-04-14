import Link from "next/link";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

const previewStats = [
  {
    label: "Win rate",
    value: "64%",
    detail: "Post-rotation testing",
    accent: "bg-[#22C55E]",
  },
  {
    label: "Worst matchup",
    value: "Dragapult ex",
    detail: "42% over 19 games",
    accent: "bg-[#F43F5E]",
  },
  {
    label: "Best deck performance",
    value: "Raging Bolt",
    detail: "11 wins in last 15",
    accent: "bg-[#4F8CFF]",
  },
  {
    label: "Recent trend",
    value: "5-1",
    detail: "Current testing session",
    accent: "bg-[#4F8CFF]",
  },
];

const valueChips = [
  "Track every game you play",
  "See your real matchup win rates",
  "Turn mistakes into better prep",
];

const features = [
  {
    title: "Track every match",
    copy: "Log deck version, opponent archetype, result, turn order, event type, format, tags, and notes without breaking testing rhythm.",
  },
  {
    title: "See your real matchups",
    copy: "Filter by deck, version, and format to find the archetypes you are actually beating and the ones costing you wins.",
  },
  {
    title: "Turn notes into preparation",
    copy: "Keep matchup-specific notes tied to your own archetypes so practice games become cleaner sequencing and better plans.",
  },
];

const intelligence = [
  {
    label: "Deck clarity",
    text: "Find which deck version is performing best instead of relying on the last set you remember.",
  },
  {
    label: "Matchup pressure",
    text: "Spot the opponent archetypes dragging down your record before they define tournament day.",
  },
  {
    label: "Testing feedback",
    text: "See whether new lists, notes, and practice sessions are moving your results in the right direction.",
  },
];

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-full bg-[#4F8CFF]/18 blur-3xl" />
      <div className="absolute -bottom-8 right-8 h-32 w-32 rounded-full bg-[#4F8CFF]/10 blur-3xl" />
      <div className="relative rounded-md bg-[#1A2238]/82 p-3 shadow-[0_30px_100px_rgba(0,0,0,0.42),0_0_70px_rgba(79,140,255,0.16)] ring-1 ring-white/10 sm:p-4">
      <div className="rounded-md bg-[#0B1020] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)]">
        <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#94A3B8]">PrizeMap</p>
            <p className="mt-1 text-lg font-semibold text-[#F8FAFC]">
              Matchup command center
            </p>
          </div>
          <span className="rounded-md bg-[#4F8CFF]/15 px-3 py-1 text-xs font-semibold text-[#F8FAFC]">
            Live testing
          </span>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {previewStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-md bg-[#1A2238]/78 p-4 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-[#94A3B8]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                    {stat.value}
                  </p>
                </div>
                <span className={`mt-1 h-2 w-12 rounded-full ${stat.accent}`} />
              </div>
              <p className="mt-3 text-sm text-[#94A3B8]">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-white/6 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#F8FAFC]">
                Dragapult ex
              </p>
              <p className="mt-1 text-sm text-[#94A3B8]">
                Worst current matchup
              </p>
            </div>
            <p className="text-sm font-semibold text-[#F43F5E]">42%</p>
          </div>
          <div className="mt-4 h-2 rounded-full bg-[#1A2238]">
            <div className="h-2 w-[42%] rounded-full bg-[#F43F5E]" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#94A3B8]">
            <span className="rounded-md bg-[#1A2238]/80 px-2 py-2">
              19 games
            </span>
            <span className="rounded-md bg-[#1A2238]/80 px-2 py-2">
              8 wins
            </span>
            <span className="rounded-md bg-[#1A2238]/80 px-2 py-2">
              11 losses
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F8FAFC]">
      <header className="border-b border-white/6 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <PrizeMapLogo
            markClassName="bg-[#1A2238] shadow-[0_0_32px_rgba(79,140,255,0.22)]"
            textClassName="text-lg text-[#F8FAFC]"
          />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#94A3B8] md:flex">
            <a href="#features" className="transition hover:text-[#F8FAFC]">
              Features
            </a>
            <a href="#intelligence" className="transition hover:text-[#F8FAFC]">
              Intelligence
            </a>
          </nav>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.12)] transition hover:bg-white/5 hover:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.58)]"
          >
            Log in
          </Link>
        </div>
      </header>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-md bg-[#4F8CFF]/12 px-3 py-1 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)]">
              Competitive Pokémon TCG tracker
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-[#F8FAFC] sm:text-5xl lg:text-6xl">
              Win more games by understanding your matchups.
            </h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-[#F8FAFC]">
              Track your matches. Map your prizes. Win more games.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#94A3B8]">
              A competitive Pokémon TCG tracker for testing, matchup analysis,
              and smarter preparation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] transition hover:bg-[#ffd85f]"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#4F8CFF]/10 px-6 text-sm font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.34)] transition hover:bg-[#4F8CFF]/16 hover:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.7)]"
              >
                Log in
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-white/6 bg-[#1A2238]/28 px-6 py-4">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-3">
          {valueChips.map((item) => (
            <div
              key={item}
              className="rounded-md bg-[#0B1020]/42 px-4 py-3 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="px-6 py-14 sm:py-18">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#4F8CFF]">
              Built for disciplined testing
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#F8FAFC] sm:text-4xl">
              Turn every game into usable signal.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#94A3B8]">
              PrizeMap keeps the important context attached to each result, so
              your testing record becomes easier to trust.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-md bg-[#1A2238]/62 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(248,250,252,0.05)]"
              >
                <h3 className="text-lg font-semibold text-[#F8FAFC]">
                  {feature.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[#94A3B8]">
                  {feature.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="intelligence" className="px-6 pb-14 sm:pb-18">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-md bg-[#1A2238]/42 p-6 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)] sm:p-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-semibold text-[#4F8CFF]">
              Product intelligence
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#F8FAFC]">
              Know what your testing is actually telling you.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#94A3B8]">
              PrizeMap helps separate one-off memory from repeatable patterns:
              which lists are improving, which matchups need prep, and whether
              your changes are producing better outcomes.
            </p>
          </div>

          <div className="grid gap-3">
            {intelligence.map((item) => (
              <div
                key={item.label}
                className="rounded-md bg-[#0B1020]/42 p-4 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)]"
              >
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl rounded-md bg-[#1A2238]/54 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(248,250,252,0.06)] sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[#F8FAFC]">
                Stop guessing. Start learning from your games.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#94A3B8]">
                Build better deck choices from real match data, matchup notes,
                and performance trends.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] transition hover:bg-[#ffd85f]"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
