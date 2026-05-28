import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  Gauge,
  Layers3,
  PlusCircle,
} from "lucide-react";
import { DemoBadge } from "@/components/demo/DemoBadge";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";
import { appFrame, appMain, appShell, glassPanel, logoOnDark } from "@/components/brand-styles";

type DemoSection = "dashboard" | "decks" | "matches" | "log" | "matchups";

type DemoShellProps = {
  current: DemoSection;
  children: ReactNode;
};

const navItems = [
  { href: "/demo", label: "Overview", section: "dashboard" as const, icon: Gauge },
  { href: "/demo/matches/new", label: "Log game", section: "log" as const, icon: PlusCircle },
  { href: "/demo/matches", label: "Sessions", section: "matches" as const, icon: ClipboardList },
  { href: "/demo/decks", label: "Decks", section: "decks" as const, icon: Layers3 },
  { href: "/demo/matchups", label: "Matchups", section: "matchups" as const, icon: BarChart3 },
];

export function DemoShell({ current, children }: DemoShellProps) {
  return (
    <main className={appShell}>
      <div className={appFrame}>
        <aside className={`hidden min-h-[calc(100vh-3rem)] p-3 lg:sticky lg:top-6 lg:block ${glassPanel}`}>
          <div className="flex h-full flex-col">
            <PrizeMapLogo {...logoOnDark} hideTextOnMobile={false} />
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
                    className={`inline-flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                      active
                        ? "bg-[#4F8CFF]/18 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.30),0_10px_24px_rgba(79,140,255,0.08)]"
                        : "text-[#94A3B8]/78 hover:bg-[#07111F]/58 hover:text-[#F8FAFC]"
                    }`}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/"
              className="mt-auto inline-flex h-10 items-center justify-center rounded-md bg-[#07111F]/52 px-3 text-sm font-medium text-[#94A3B8] transition hover:bg-[#1A2238]/58 hover:text-[#F8FAFC]"
            >
              Exit demo
            </Link>
          </div>
        </aside>

        <section className={appMain}>
          <header className="flex flex-col gap-3 rounded-md bg-[#0B1020]/44 p-3 shadow-[0_16px_46px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(148,163,184,0.10)] backdrop-blur sm:p-4 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <PrizeMapLogo {...logoOnDark} />
              <DemoBadge />
            </div>
            <nav className="grid grid-cols-5 gap-1 rounded-md bg-[#07111F]/52 p-1">
              {navItems.map((item) => {
                const active = item.section === current;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex h-9 min-w-0 items-center justify-center rounded-md px-1 text-[11px] font-semibold ${
                      active ? "bg-[#4F8CFF]/22 text-[#F8FAFC]" : "text-[#94A3B8]/78"
                    }`}
                  >
                    <span className="truncate">{item.label.split(" ")[0]}</span>
                  </Link>
                );
              })}
            </nav>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
