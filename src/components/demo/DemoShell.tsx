import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Gauge,
  Layers3,
  PlusCircle,
  Target,
} from "lucide-react";
import { DemoBadge } from "@/components/demo/DemoBadge";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import {
  appFrame,
  appMain,
  appShell,
  logoOnDark,
  navItem,
  navItemActive,
  navRailPanel,
  premiumInset,
  pageHeaderCard,
} from "@/components/brand-styles";

type DemoSection =
  | "dashboard"
  | "decks"
  | "review"
  | "matches"
  | "log"
  | "matchups"
  | "testing"
  | "events";

type DemoShellProps = {
  current: DemoSection;
  children: ReactNode;
};

const navItems = [
  { href: "/demo", label: "Overview", section: "dashboard" as const, icon: Gauge },
  { href: "/demo/matches/new", label: "Log game", section: "log" as const, icon: PlusCircle },
  { href: "/demo/review", label: "Review", section: "review" as const, icon: ClipboardList },
  { href: "/demo/testing", label: "Testing block", section: "testing" as const, icon: Target },
  { href: "/demo/events", label: "Events", section: "events" as const, icon: CalendarDays },
  { href: "/demo/matches", label: "Match history", section: "matches" as const, icon: ClipboardList },
  { href: "/demo/decks", label: "Decks", section: "decks" as const, icon: Layers3 },
  { href: "/demo/matchups", label: "Matchups", section: "matchups" as const, icon: BarChart3 },
];

export function DemoShell({ current, children }: DemoShellProps) {
  return (
    <main className={appShell}>
      <div className={appFrame}>
        <aside className={`hidden min-h-[calc(100vh-3rem)] p-3 lg:sticky lg:top-6 lg:block ${navRailPanel}`}>
          <div className="relative flex h-full flex-col">
            <SixPrizerLogo {...logoOnDark} hideTextOnMobile={false} />
            <div className="mt-4">
              <DemoBadge />
            </div>
            <p className="mt-3 text-xs leading-5 text-[#94A3B8]/76">
              Sample data only. Demo actions never write to Supabase.
            </p>

            <nav aria-label="Demo" className="mt-5 grid gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.section === current;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      item.section === "log"
                        ? `inline-flex h-11 items-center gap-3 rounded-[14px] px-3 text-sm font-semibold shadow-[0_10px_22px_rgba(245,200,76,0.16)] ${
                            active
                              ? "bg-[linear-gradient(180deg,#F7D365,#F5C84C)] text-[#07111F]"
                              : "bg-[linear-gradient(180deg,#F7D365,#F5C84C)] text-[#07111F] hover:-translate-y-0.5"
                          }`
                        : active
                          ? navItemActive
                          : navItem
                    }
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/"
              className="mt-auto inline-flex h-10 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,rgba(11,18,32,0.78),rgba(7,17,31,0.68))] px-3 text-sm font-medium text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] transition hover:bg-[#1A2238]/58 hover:text-[#F8FAFC]"
            >
              Exit demo
            </Link>
          </div>
        </aside>

        <section className={appMain}>
          <header className={`${pageHeaderCard} p-3 sm:p-4 lg:hidden`}>
            <div className="flex items-center justify-between gap-3">
              <SixPrizerLogo {...logoOnDark} />
              <DemoBadge />
            </div>
            <nav className={`grid grid-cols-4 gap-1 p-1 ${premiumInset}`}>
              {navItems.map((item) => {
                const active = item.section === current;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex h-9 min-w-0 items-center justify-center rounded-[12px] px-1 text-[11px] font-semibold ${
                      item.section === "log"
                        ? active
                          ? "bg-[linear-gradient(180deg,#F7D365,#F5C84C)] text-[#07111F] shadow-[0_10px_20px_rgba(245,200,76,0.18)]"
                          : "bg-[#F5C84C]/12 text-[#FFE28A]"
                        : active
                          ? "bg-[linear-gradient(180deg,rgba(79,140,255,0.20),rgba(31,67,138,0.18))] text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)]"
                          : "text-[#94A3B8]/78"
                    }`}
                  >
                    <span className="truncate">
                      {item.label === "Match history" ? "History" : item.label.split(" ")[0]}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </header>
          <div className="rounded-[18px] bg-[linear-gradient(180deg,rgba(245,200,76,0.10),rgba(79,140,255,0.06))] p-3 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#F8FAFC]">
                <span className="font-semibold text-[#F5C84C]">Demo Mode:</span>{" "}
                You are viewing sample SixPrizer testing data.
              </p>
              <Link
                href="/"
                className="text-sm font-semibold text-[#B8D1FF] hover:text-[#F8FAFC]"
              >
                Exit demo
              </Link>
            </div>
          </div>
          {children}
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
