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
          ? "inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white"
          : "inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 transition hover:bg-white";

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
