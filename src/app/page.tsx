import Link from "next/link";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

const trustItems = [
  "Track decks",
  "Analyze matchups",
  "Improve testing decisions",
];

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
    label: "Deck performance",
    value: "Raging Bolt",
    detail: "11 wins in last 15",
    accent: "bg-[#4F8CFF]",
  },
  {
    label: "Recent trend",
    value: "5-1",
    detail: "Current session",
    accent: "bg-[#F5C84C]",
  },
];

const features = [
  {
    title: "Track every match",
    copy: "Log deck versions, turn order, formats, tags, and notes without slowing down a testing session.",
  },
  {
    title: "See your real matchups",
    copy: "Filter by format, deck, and opponent archetype to understand where your testing record actually stands.",
  },
  {
    title: "Turn notes into preparation",
    copy: "Keep matchup notes tied to your own archetypes so practice turns into a cleaner game plan.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1020] text-[#F8FAFC]">
      <section className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <PrizeMapLogo
            markClassName="bg-[#1A2238] shadow-[0_0_32px_rgba(79,140,255,0.22)]"
            textClassName="text-lg text-[#F8FAFC]"
          />
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/15 px-4 text-sm font-medium text-[#F8FAFC] transition hover:border-[#4F8CFF]/70 hover:bg-white/5"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-md border border-[#F5C84C]/30 bg-[#F5C84C]/10 px-3 py-1 text-sm font-medium text-[#F5C84C]">
              Competitive Pokémon TCG testing
            </p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-[#F8FAFC]">
              PrizeMap
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
                className="inline-flex h-12 items-center justify-center rounded-md border border-[#4F8CFF]/50 px-6 text-sm font-semibold text-[#F8FAFC] transition hover:border-[#4F8CFF] hover:bg-[#4F8CFF]/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#1A2238]/40 px-6 py-5">
        <div className="mx-auto grid max-w-6xl gap-3 sm:grid-cols-3">
          {trustItems.map((item) => (
            <div
              key={item}
              className="rounded-md border border-white/10 bg-[#0B1020]/45 px-4 py-3 text-sm font-medium text-[#F8FAFC]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#4F8CFF]">
              Testing intelligence
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#F8FAFC]">
              Your testing room, at a glance.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {previewStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-md border border-white/10 bg-[#1A2238]/80 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#94A3B8]">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                      {stat.value}
                    </p>
                  </div>
                  <span
                    className={`mt-1 h-2 w-16 rounded-full ${stat.accent}`}
                  />
                </div>
                <p className="mt-4 text-sm text-[#94A3B8]">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#4F8CFF]">
              Built for better testing loops
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#F8FAFC]">
              Know what is working before tournament day.
            </h2>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-md border border-white/10 bg-[#1A2238]/70 p-6"
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

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl rounded-md border border-[#F5C84C]/25 bg-[#F5C84C]/10 p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-[#F8FAFC]">
                Start mapping your testing record.
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
