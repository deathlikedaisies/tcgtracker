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
  shortLabel: string;
  section: AppNavSection;
}[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", section: "dashboard" },
  { href: "/matches/new", label: "Log game", shortLabel: "Log", section: "log" },
  { href: "/review", label: "Review", shortLabel: "Review", section: "review" },
  { href: "/matches", label: "Logs", shortLabel: "Logs", section: "matches" },
  { href: "/decks", label: "Decks", shortLabel: "Decks", section: "decks" },
  { href: "/matchups", label: "Matchups", shortLabel: "Match", section: "matchups" },
];

export function AppNav({ current }: AppNavProps) {
  return (
    <div className="grid gap-2">
      <nav
        aria-label="Primary"
        className="grid w-full max-w-full grid-cols-6 gap-1.5 overflow-x-hidden rounded-[18px] bg-[linear-gradient(180deg,rgba(11,18,32,0.78),rgba(7,17,31,0.70))] p-1.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur sm:w-auto sm:flex sm:flex-wrap sm:justify-end"
      >
        {navItems.map((item) => {
          const isCurrent = item.section === current;
          const isLogAction = item.section === "log";
          const className = isCurrent
            ? `${navItemActive} min-w-0 justify-center px-1.5 text-xs font-semibold sm:h-10 sm:px-3 sm:text-sm`
            : isLogAction
              ? "inline-flex h-10 min-w-0 items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#F7D365,#F5C84C)] px-1.5 text-xs font-semibold text-[#07111F] shadow-[0_10px_24px_rgba(245,200,76,0.18),inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#ffe082,#f6cf59)] active:scale-[0.98] sm:h-10 sm:px-3 sm:text-sm"
              : "inline-flex h-10 min-w-0 items-center justify-center rounded-[12px] px-1.5 text-xs font-medium text-[#94A3B8]/76 transition hover:bg-[#1A2238]/58 hover:text-[#F8FAFC] active:scale-[0.98] sm:h-10 sm:px-3 sm:text-sm";

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              className={className}
            >
              <span className="truncate sm:hidden">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex justify-end">
        <Link
          href="/settings/profile"
          aria-current={current === "settings" ? "page" : undefined}
          className={
            current === "settings"
              ? "rounded-full bg-[#4F8CFF]/12 px-3 py-1 text-xs font-semibold text-[#DCE8FF]"
              : "rounded-full px-3 py-1 text-xs font-semibold text-[#94A3B8] transition hover:text-[#F8FAFC]"
          }
        >
          Profile
        </Link>
      </div>
    </div>
  );
}
