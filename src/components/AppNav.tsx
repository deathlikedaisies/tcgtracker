import Link from "next/link";
import { navItemActive } from "@/components/brand-styles";
import type { AppSection } from "@/lib/app-navigation";

type AppNavProps = {
  current: AppSection;
};

const navItems: {
  href: string;
  label: string;
  mobileLabel: string;
  section: AppSection;
}[] = [
  { href: "/dashboard", label: "Overview", mobileLabel: "Overview", section: "dashboard" },
  { href: "/matches/new", label: "Log game", mobileLabel: "Log game", section: "log" },
  { href: "/review", label: "Review", mobileLabel: "Review", section: "review" },
  { href: "/matches", label: "Match history", mobileLabel: "Match history", section: "matches" },
  { href: "/events", label: "Events", mobileLabel: "Events", section: "events" },
  { href: "/decks", label: "Decks", mobileLabel: "Decks", section: "decks" },
  { href: "/matchups", label: "Matchups", mobileLabel: "Matchups", section: "matchups" },
  { href: "/profile", label: "Profile", mobileLabel: "Profile", section: "settings" },
  { href: "/feedback", label: "Feedback", mobileLabel: "Feedback", section: "feedback" },
];

export function AppNav({ current }: AppNavProps) {
  return (
    <div className="grid gap-2">
      <nav
        aria-label="Primary"
        className="grid w-full max-w-full grid-cols-3 gap-1 rounded-[18px] bg-[linear-gradient(180deg,rgba(11,18,32,0.78),rgba(7,17,31,0.70))] p-1 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)] sm:flex sm:w-auto sm:flex-wrap sm:justify-start sm:gap-1.5 sm:p-1.5 sm:backdrop-blur"
      >
        {navItems.map((item) => {
          const isCurrent = item.section === current;
          const isLogAction = item.section === "log";
          const className = isCurrent
            ? `${navItemActive} min-w-0 justify-center px-2 text-center text-[11px] leading-4 font-semibold sm:h-10 sm:shrink-0 sm:px-3 sm:text-sm sm:whitespace-nowrap`
            : isLogAction
              ? "inline-flex min-h-10 min-w-0 items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#F7D365,#F5C84C)] px-2 text-center text-[11px] leading-4 font-semibold text-[#07111F] shadow-[0_8px_18px_rgba(245,200,76,0.16),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform transition-colors hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#ffe082,#f6cf59)] active:scale-[0.98] sm:h-10 sm:shrink-0 sm:px-3 sm:text-sm sm:whitespace-nowrap"
              : "inline-flex min-h-10 min-w-0 items-center justify-center rounded-[12px] px-2 text-center text-[11px] leading-4 font-medium text-[#94A3B8]/76 transition-colors hover:bg-[#1A2238]/58 hover:text-[#F8FAFC] active:scale-[0.98] sm:h-10 sm:shrink-0 sm:px-3 sm:text-sm sm:whitespace-nowrap";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              className={className}
            >
              <span className="max-w-full whitespace-normal break-words sm:whitespace-nowrap">
                {item.mobileLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
