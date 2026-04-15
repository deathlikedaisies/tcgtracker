import Link from "next/link";

type AppNavSection = "dashboard" | "decks" | "matches" | "log" | "matchups";

type AppNavProps = {
  current: AppNavSection;
};

const navItems: { href: string; label: string; section: AppNavSection }[] = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/decks", label: "Decks", section: "decks" },
  { href: "/matches", label: "Matches", section: "matches" },
  { href: "/matches/new", label: "Log match", section: "log" },
  { href: "/matchups", label: "Matchups", section: "matchups" },
];

export function AppNav({ current }: AppNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="grid grid-cols-2 gap-2 min-[430px]:grid-cols-3 sm:flex sm:flex-wrap sm:justify-end"
    >
      {navItems.map((item) => {
        const isCurrent = item.section === current;
        const isLogAction = item.section === "log";
        const className = isCurrent
          ? "inline-flex h-10 items-center justify-center rounded-md bg-[#F5C84C] px-3 text-sm font-semibold text-[#0B1020] shadow-[0_8px_24px_rgba(245,200,76,0.14)]"
          : isLogAction
            ? "inline-flex h-10 items-center justify-center rounded-md bg-[#4F8CFF]/16 px-3 text-sm font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)] transition hover:bg-[#4F8CFF]/22"
            : "inline-flex h-10 items-center justify-center rounded-md bg-[#1A2238]/48 px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-[#4F8CFF]/10 hover:text-[#F8FAFC]";

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isCurrent ? "page" : undefined}
            className={className}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
