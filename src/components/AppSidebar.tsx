import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  CalendarDays,
  FlaskConical,
  Gauge,
  Layers3,
  MessageSquareWarning,
  PlusCircle,
  Settings2,
  Target,
} from "lucide-react";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { SignOutButton } from "@/components/SignOutButton";
import {
  logoOnDark,
  navItem,
  navItemActive,
  navRailPanel,
  premiumInset,
} from "@/components/brand-styles";
import type { AppSection } from "@/lib/app-navigation";

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
  { href: "/testing", label: "Testing", section: "testing" as const, icon: FlaskConical },
  { href: "/matches", label: "Match history", section: "matches" as const, icon: ClipboardList },
  { href: "/events", label: "Events", section: "events" as const, icon: CalendarDays },
  { href: "/decks", label: "Decks", section: "decks" as const, icon: Layers3 },
  { href: "/matchups", label: "Matchups", section: "matchups" as const, icon: BarChart3 },
  { href: "/profile", label: "Profile", section: "settings" as const, icon: Settings2 },
  { href: "/feedback", label: "Feedback", section: "feedback" as const, icon: MessageSquareWarning },
];

export function AppSidebar({ current, deckLabel, insight }: AppSidebarProps) {
  return (
    <aside className={`hidden min-h-[calc(100vh-3rem)] p-3 xl:sticky xl:top-6 xl:block ${navRailPanel}`}>
      <div className="relative flex h-full flex-col">
        <Link
          href="/dashboard"
          aria-label="Go to dashboard"
          className="w-fit rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]"
        >
          <SixPrizerLogo {...logoOnDark} hideTextOnMobile={false} />
        </Link>

        {deckLabel ? (
          <div className={`mt-6 p-3 ${premiumInset}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
              Active test
            </p>
            <p className="mt-1 break-words text-sm leading-5 font-semibold text-[#F8FAFC]">
              {deckLabel}
            </p>
          </div>
        ) : null}

        <nav aria-label="Product" className="mt-5 grid gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.section === current;
            const isLogAction = item.section === "log";
            const className = active
              ? isLogAction
                ? "inline-flex h-11 items-center gap-3 rounded-[14px] bg-[linear-gradient(180deg,#F7D365,#F5C84C)] px-3 text-sm font-semibold text-[#07111F] shadow-[0_12px_24px_rgba(245,200,76,0.18),inset_0_1px_0_rgba(255,255,255,0.32),0_0_0_1px_rgba(245,200,76,0.18)]"
                : navItemActive
              : isLogAction
                ? "inline-flex h-11 items-center gap-3 rounded-[14px] bg-[linear-gradient(180deg,#F7D365,#F5C84C)] px-3 text-sm font-semibold text-[#07111F] shadow-[0_10px_22px_rgba(245,200,76,0.16),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform transition-colors hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#ffe082,#f6cf59)] hover:shadow-[0_18px_34px_rgba(245,200,76,0.24),inset_0_1px_0_rgba(255,255,255,0.32)]"
                : navItem;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3">
          {insight ? (
            <div className={`p-3 ${premiumInset}`}>
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

          <SignOutButton className="justify-center" />
        </div>
      </div>
    </aside>
  );
}
