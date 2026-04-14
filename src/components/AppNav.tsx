import Link from "next/link";

type AppNavSection = "dashboard" | "decks" | "matches" | "log" | "matchups";

type AppNavProps = {
  current: AppNavSection;
};

const navItems: { href: string; label: string; section: AppNavSection }[] = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/decks", label: "Decks", section: "decks" },
  { href: "/matches", label: "Matches", section: "matches" },
  { href: "/matchups", label: "Matchups", section: "matchups" },
  { href: "/matches/new", label: "Log match", section: "log" },
];

export function AppNav({ current }: AppNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      {navItems.map((item) => {
        const isCurrent = item.section === current;
        const className = isCurrent
          ? "inline-flex h-10 items-center justify-center rounded-md bg-[#F5C84C] px-4 text-sm font-semibold text-[#0B1020]"
          : "inline-flex h-10 items-center justify-center rounded-md border border-white/15 bg-[#1A2238]/55 px-4 text-sm font-medium text-[#F8FAFC] transition hover:border-[#4F8CFF]/70 hover:bg-[#4F8CFF]/10";

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
