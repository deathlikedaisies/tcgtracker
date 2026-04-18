import Link from "next/link";

type AppNavSection = "dashboard" | "decks" | "matches" | "log" | "matchups";

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
  { href: "/decks", label: "Decks", shortLabel: "Decks", section: "decks" },
  { href: "/matches", label: "Matches", shortLabel: "Logs", section: "matches" },
  { href: "/matches/new", label: "Log match", shortLabel: "Log", section: "log" },
  { href: "/matchups", label: "Matchups", shortLabel: "Match", section: "matchups" },
];

export function AppNav({ current }: AppNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="grid w-full max-w-full grid-cols-5 gap-1 overflow-x-hidden rounded-md bg-[#0B1020]/34 p-1 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:w-auto sm:flex sm:flex-wrap sm:justify-end sm:gap-2 sm:p-1.5"
    >
      {navItems.map((item) => {
        const isCurrent = item.section === current;
        const isLogAction = item.section === "log";
        const className = isCurrent
          ? "inline-flex h-9 min-w-0 items-center justify-center rounded-md bg-[#4F8CFF]/24 px-1.5 text-[11px] font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.34),0_10px_26px_rgba(79,140,255,0.12)] sm:h-10 sm:px-3 sm:text-sm"
          : isLogAction
            ? "inline-flex h-9 min-w-0 items-center justify-center rounded-md bg-[#4F8CFF]/18 px-1.5 text-[11px] font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.26)] transition hover:bg-[#4F8CFF]/24 sm:h-10 sm:px-3 sm:text-sm"
            : "inline-flex h-9 min-w-0 items-center justify-center rounded-md px-1.5 text-[11px] font-medium text-[#94A3B8] transition hover:bg-[#1A2238]/66 hover:text-[#F8FAFC] sm:h-10 sm:px-3 sm:text-sm";

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
