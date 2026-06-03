import Link from "next/link";

type AppNavSection = "dashboard" | "decks" | "matches" | "log" | "matchups" | "review";

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
    <nav
      aria-label="Primary"
      className="grid w-full max-w-full grid-cols-6 gap-1.5 overflow-x-hidden rounded-[18px] bg-[#07111F]/52 p-1.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] backdrop-blur sm:w-auto sm:flex sm:flex-wrap sm:justify-end"
    >
      {navItems.map((item) => {
        const isCurrent = item.section === current;
        const isLogAction = item.section === "log";
        const className = isCurrent
          ? "inline-flex h-10 min-w-0 items-center justify-center rounded-[12px] bg-[#4F8CFF]/22 px-1.5 text-xs font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.34),0_8px_20px_rgba(79,140,255,0.09)] sm:h-10 sm:px-3 sm:text-sm"
          : isLogAction
            ? "inline-flex h-10 min-w-0 items-center justify-center rounded-[12px] bg-[#F5C84C]/95 px-1.5 text-xs font-semibold text-[#07111F] shadow-[0_8px_20px_rgba(245,200,76,0.14)] transition hover:bg-[#ffd85f] active:scale-[0.98] sm:h-10 sm:px-3 sm:text-sm"
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
  );
}
