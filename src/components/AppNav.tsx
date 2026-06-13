import Link from "next/link";
import { navItemActive } from "@/components/brand-styles";

type AppNavSection =
  | "dashboard"
  | "decks"
  | "matches"
  | "log"
  | "matchups"
  | "review"
  | "settings";

type AppNavProps = {
  current: AppNavSection;
};

const navItems: {
  href: string;
  label: string;
  mobileLabel: string;
  section: AppNavSection;
}[] = [
  { href: "/dashboard", label: "Home", mobileLabel: "Home", section: "dashboard" },
  { href: "/matches/new", label: "Log", mobileLabel: "Log", section: "log" },
  { href: "/review", label: "Review", mobileLabel: "Review", section: "review" },
  { href: "/matches", label: "Logs", mobileLabel: "Logs", section: "matches" },
  { href: "/decks", label: "Decks", mobileLabel: "Decks", section: "decks" },
  { href: "/matchups", label: "Matchups", mobileLabel: "Matchups", section: "matchups" },
  { href: "/profile", label: "Profile", mobileLabel: "Profile", section: "settings" },
];

export function AppNav({ current }: AppNavProps) {
  return (
    <div className="grid gap-2">
      <nav
        aria-label="Primary"
        className="flex w-full max-w-full gap-1.5 overflow-x-auto rounded-[16px] bg-[linear-gradient(180deg,rgba(11,18,32,0.78),rgba(7,17,31,0.70))] p-1 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:w-auto sm:flex-wrap sm:justify-end sm:overflow-visible sm:p-1.5 sm:backdrop-blur"
      >
        {navItems.map((item) => {
          const isCurrent = item.section === current;
          const isLogAction = item.section === "log";
          const className = isCurrent
            ? `${navItemActive} shrink-0 justify-center px-3 text-sm font-semibold whitespace-nowrap sm:h-10 sm:px-3 sm:text-sm`
            : isLogAction
              ? "inline-flex h-9 shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#F7D365,#F5C84C)] px-3 text-sm font-semibold text-[#07111F] whitespace-nowrap shadow-[0_8px_18px_rgba(245,200,76,0.16),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform transition-colors hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#ffe082,#f6cf59)] active:scale-[0.98] sm:h-10 sm:px-3 sm:text-sm"
              : "inline-flex h-9 shrink-0 items-center justify-center rounded-[12px] px-3 text-sm font-medium text-[#94A3B8]/76 whitespace-nowrap transition-colors hover:bg-[#1A2238]/58 hover:text-[#F8FAFC] active:scale-[0.98] sm:h-10 sm:px-3 sm:text-sm";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              className={className}
            >
              <span>{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
