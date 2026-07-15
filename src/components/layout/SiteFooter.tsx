import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
  { href: "/login", label: "Sign in" },
  { href: "/feedback", label: "Feedback" },
] as const;

const productLinks = [
  { href: "/demo/matches/new", label: "Match logging" },
  { href: "/demo/matches/new", label: "TCG Live import" },
  { href: "/demo/events", label: "Event review" },
  { href: "/demo", label: "Deck versions" },
  { href: "/demo/matchups", label: "Matchup insights" },
] as const;

const resourceLinks = [
  { href: "https://limitlesstcg.com", label: "Limitless TCG" },
  { href: "https://www.trainerhill.com", label: "Trainer Hill" },
  { href: "https://rk9.gg", label: "RK9.gg" },
  { href: "https://tcg.pokemon.com/en-us/tcgl/", label: "Pokémon TCG Live" },
] as const;

const iconItems = [
  { label: "Fast logs", icon: ClipboardList },
  { label: "Matchups", icon: BarChart3 },
  { label: "Events", icon: Trophy },
  { label: "Testing", icon: Zap },
] as const;

export function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      className="relative border-t border-[#4F8CFF]/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96),rgba(4,10,22,0.98))] px-4 py-10 text-[#94A3B8] sm:px-6 sm:py-12"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(79,140,255,0.28),rgba(245,200,76,0.18),transparent)]"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(0,1.45fr)_repeat(3,minmax(0,1fr))]">
        <section aria-label="SixPrizer summary" className="min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-black tracking-tight text-[#F8FAFC] transition hover:text-[#F5C84C]"
          >
            <BrandLogo
              variant="icon"
              size="sm"
              className="rounded-[14px] bg-[#07111F] shadow-[0_0_20px_rgba(79,140,255,0.14),inset_0_0_0_1px_rgba(79,140,255,0.24)]"
            />
            SixPrizer
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#C7D2E5]/82">
            Competitive Pokémon TCG testing, match logging, and event review.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {iconItems.map((item) => {
              const Icon = item.icon;

              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1A2D]/76 px-2.5 py-1.5 text-xs font-semibold text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)]"
                >
                  <Icon className="size-3.5 text-[#4F8CFF]" aria-hidden="true" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </section>

        <nav aria-label="Footer navigation" className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F8FAFC]">
            Navigate
          </h2>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-[#F8FAFC]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="footer-product-heading" className="min-w-0">
          <h2
            id="footer-product-heading"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F8FAFC]"
          >
            Product
          </h2>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {productLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="transition hover:text-[#F8FAFC]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="External resources" className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F8FAFC]">
            Resources
          </h2>
          <ul className="mt-4 grid gap-2.5 text-sm">
            {resourceLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 transition hover:text-[#F8FAFC]"
                >
                  {link.label}
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-9 flex max-w-7xl flex-col gap-4 border-t border-white/[0.07] pt-5 text-xs leading-5 text-[#94A3B8]/82 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-2">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-[#F5C84C]"
            aria-hidden="true"
          />
          <p>
            © 2026 SixPrizer. Fan-made testing tool. Not affiliated with
            Nintendo, Creatures, Game Freak, or The Pokémon Company.
          </p>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/privacy" className="transition hover:text-[#F8FAFC]">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-[#F8FAFC]">
            Terms
          </Link>
          <Link href="/feedback" className="transition hover:text-[#F8FAFC]">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}
