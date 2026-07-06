import {
  appFrame,
  appMain,
  appShell,
  cardLarge,
  glassPanel,
  navRailPanel,
  premiumInset,
} from "@/components/brand-styles";

type AppRouteLoadingSkeletonProps = {
  title?: string;
  cards?: number;
  listRows?: number;
  chart?: boolean;
};

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-[#1A2238]/82 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)] ${className}`}
    />
  );
}

export function AppRouteLoadingSkeleton({
  title = "Loading workspace",
  cards = 3,
  listRows = 4,
  chart = false,
}: AppRouteLoadingSkeletonProps) {
  return (
    <main className={appShell} aria-label={title} aria-busy="true">
      <section className={appFrame}>
        <aside
          className={`hidden min-h-[calc(100vh-3rem)] p-3 xl:block ${navRailPanel}`}
        >
          <SkeletonBlock className="h-10 w-36 rounded-[14px]" />
          <div className="mt-7 grid gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-11 rounded-[14px]" />
            ))}
          </div>
          <div className={`mt-8 p-3 ${premiumInset}`}>
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="mt-3 h-4 w-32" />
            <SkeletonBlock className="mt-2 h-3 w-24" />
          </div>
        </aside>

        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <section className={`${cardLarge} overflow-hidden`}>
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="mt-3 h-8 w-56 max-w-full rounded-[14px]" />
            <SkeletonBlock className="mt-3 h-4 w-[min(34rem,100%)] rounded-[12px]" />
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: cards }).map((_, index) => (
              <div key={index} className={`${glassPanel} p-4`}>
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="mt-3 h-7 w-24 rounded-[12px]" />
                <SkeletonBlock className="mt-3 h-3 w-full" />
              </div>
            ))}
          </section>

          {chart ? (
            <section className={`${cardLarge} overflow-hidden`}>
              <SkeletonBlock className="h-5 w-40 rounded-[12px]" />
              <div className="mt-4 h-56 animate-pulse rounded-[18px] bg-[#10192B]/78 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]" />
            </section>
          ) : null}

          <section className={`${cardLarge} overflow-hidden`}>
            <div className="flex items-center justify-between gap-4">
              <SkeletonBlock className="h-5 w-36 rounded-[12px]" />
              <SkeletonBlock className="h-10 w-28 rounded-[14px]" />
            </div>
            <div className="mt-4 grid gap-3">
              {Array.from({ length: listRows }).map((_, index) => (
                <div
                  key={index}
                  className={`${premiumInset} grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_9rem]`}
                >
                  <div className="min-w-0">
                    <SkeletonBlock className="h-4 w-48 max-w-full rounded-[12px]" />
                    <SkeletonBlock className="mt-3 h-3 w-[min(28rem,100%)]" />
                  </div>
                  <SkeletonBlock className="h-9 w-full rounded-[14px]" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
