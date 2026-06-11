import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  Gauge,
  Layers3,
  PlusCircle,
  Target,
} from "lucide-react";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import {
  logoOnDark,
  navItem,
  navItemActive,
  navRailPanel,
  premiumInset,
} from "@/components/brand-styles";

type AppSection = "dashboard" | "decks" | "matches" | "log" | "matchups" | "review";

type AppSidebarProps = {
  current: AppSection;
  deckLabel?: string;
  insight?: {
    label: string;
    value: string;
    helper?: string;
  };
};

const navItems = [
  { href: "/dashboard", label: "Overview", section: "dashboard" as const, icon: Gauge },
  { href: "/matches/new", label: "Log game", section: "log" as const, icon: PlusCircle },
  { href: "/review", label: "Review", section: "review" as const, icon: Target },
  { href: "/matches", label: "Logs", section: "matches" as const, icon: ClipboardList },
  { href: "/decks", label: "Decks", section: "decks" as const, icon: Layers3 },
  { href: "/matchups", label: "Matchups", section: "matchups" as const, icon: BarChart3 },
];

export function AppSidebar({ current, deckLabel, insight }: AppSidebarProps) {
  return (
    <aside className={`hidden min-h-[calc(100vh-3rem)] p-3 lg:sticky lg:top-6 lg:block ${navRailPanel}`}>
      <div className="relative flex h-full flex-col">
        <SixPrizerLogo {...logoOnDark} hideTextOnMobile={false} />

        {deckLabel ? (
          <div className={`mt-6 p-3 ${premiumInset}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
              Active test
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[#F8FAFC]">
              {deckLabel}
            </p>
          </div>
        ) : null}

        <nav aria-label="Product" className="mt-5 grid gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.section === current;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? navItemActive : navItem}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {insight ? (
          <div className={`mt-auto p-3 ${premiumInset}`}>
            <div className="flex items-center gap-2 text-[#F5C84C]">
              <Target className="size-4" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.1em]">
                {insight.label}
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-5 text-[#F8FAFC]">
              {insight.value}
            </p>
            {insight.helper ? (
              <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                {insight.helper}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
