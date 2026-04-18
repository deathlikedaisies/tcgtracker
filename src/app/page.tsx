import Link from "next/link";
import { redirect } from "next/navigation";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const demoMetrics = [
  {
    label: "Worst matchup",
    value: "Dragapult Dusknoir",
    mobileValue: "Dragapult",
    detail: "You lost 7 of your last 10 games",
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
          <div>
            <p className="text-xs font-medium uppercase text-[#94A3B8]/80">
              From your last testing session
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#F8FAFC] sm:text-xl">
              Your matchup insights
            </h2>
          </div>

          <div className="mt-3 rounded bg-[#11182C]/92 p-4 shadow-[0_14px_34px_rgba(245,200,76,0.07),inset_0_0_0_1px_rgba(245,200,76,0.34)] transition duration-200 hover:-translate-y-0.5 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <PrizeMapLogo
                variant="app-icon"
                showText={false}
                className="shrink-0 opacity-90"
                markClassName="size-8 bg-transparent shadow-none"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-[#F5C84C]/82">
                  Auto analysis
                </p>
                <p className="mt-1 min-w-0 text-lg font-semibold text-[#F8FAFC] sm:text-xl">
                  Run 5 games vs Dragapult going second.
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
                      ? "col-span-2 bg-[#2A1320]/92 shadow-[0_14px_38px_rgba(244,63,94,0.12),inset_0_0_0_1px_rgba(244,63,94,0.34)]"
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
                  {"detail" in metric ? (
                    <>
                      <p className="mt-2 text-sm font-semibold text-rose-100/90">
                        This is your biggest leak right now.
                      </p>
                      <p className="mt-1 text-sm font-medium text-rose-100/78">
                        {metric.detail}
                      </p>
                    </>
                  ) : null}
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
        This matchup is your biggest leak right now: Dragapult Dusknoir
      </span>
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
    <main className="min-h-screen overflow-hidden bg-[#0B1020] bg-[radial-gradient(ellipse_at_top,rgba(79,140,255,0.14),transparent_38%),linear-gradient(180deg,#0B1020_0%,#11182C_50%,#0B1020_100%)] text-[#F8FAFC]">
      <header className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded bg-[#0B1020]/42 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)]">
          <PrizeMapLogo
            variant="app-icon"
            hideTextOnMobile
            className="group transition hover:scale-[1.02]"
            markClassName="bg-[#1A2238] transition group-hover:shadow-[0_0_22px_rgba(79,140,255,0.22)]"
            textClassName="text-base text-[#F8FAFC]"
          />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-white/5 hover:text-[#F8FAFC] active:scale-[0.98]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center justify-center rounded bg-[#F5C84C] px-3 text-sm font-semibold text-[#0B1020] shadow-[0_14px_34px_rgba(245,200,76,0.22)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:px-4"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="relative px-4 pb-6 pt-3 sm:px-6 sm:pb-9 sm:pt-7">
        <PrizeMapLogo
          variant="watermark"
          showText={false}
          className="pointer-events-none absolute -left-16 top-4 hidden size-72 opacity-[0.035] lg:block"
          markClassName="size-full"
        />
        <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="prizemap-fade-in">
            <p className="inline-flex rounded bg-[#4F8CFF]/14 px-3 py-1 text-sm font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]">
              Based on your real match data
            </p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-6xl">
              You don&apos;t actually know your matchups.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-[#F8FAFC]">
              Built from your own games, not guesses.
            </p>
            <HeroSignal />
            <div className="mt-5">
              <Link
                href="/onboarding"
                className="inline-flex h-12 w-full items-center justify-center rounded bg-[#F5C84C] px-6 text-sm font-semibold text-[#0B1020] shadow-[0_18px_44px_rgba(245,200,76,0.34)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:w-auto"
              >
                Log your next game
              </Link>
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section className="px-4 pb-5 sm:px-6 sm:pb-7">
        <div className="mx-auto max-w-6xl rounded bg-[#11182C]/42 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.14)] sm:p-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
            Stop guessing. Test the leak.
          </h2>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#94A3B8]">
            PrizeMap turns your last games into the next matchup to drill.
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
            href="/onboarding"
            className="inline-flex h-12 w-full items-center justify-center rounded bg-[#F5C84C] px-4 text-center text-sm font-semibold text-[#0B1020] shadow-[0_18px_44px_rgba(245,200,76,0.32)] transition hover:-translate-y-0.5 hover:bg-[#ffd85f] active:translate-y-0 active:scale-[0.98] sm:px-6 md:w-auto"
          >
            Log your next game
          </Link>
        </div>
      </section>
    </main>
  );
}
