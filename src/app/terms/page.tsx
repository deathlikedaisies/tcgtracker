import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  cardLarge,
  marketingShell,
  secondaryButton,
  sectionCopy,
} from "@/components/brand-styles";

export default function TermsPage() {
  return (
    <main className={marketingShell}>
      <section className="px-4 py-8 sm:px-6 sm:py-12">
        <div className={`mx-auto max-w-4xl ${cardLarge}`}>
          <Link href="/" className={`${secondaryButton} h-10 w-fit px-4`}>
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            Back home
          </Link>
          <div className="mt-8 flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-[#4F8CFF]/12 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
              <FileText className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4F8CFF]">
                Terms
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-5xl">
                SixPrizer beta terms
              </h1>
              <p className={`mt-4 ${sectionCopy}`}>
                These simple beta terms set expectations while SixPrizer is
                being tested with early users.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 text-sm leading-7 text-[#C7D2E5]">
            <section className="rounded-[22px] bg-[#0F1A2D]/70 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Use during beta</h2>
              <p className="mt-2">
                SixPrizer is provided as a beta testing tool for competitive
                Pokémon TCG players. Features, copy, and analysis may change as
                the product improves.
              </p>
            </section>
            <section className="rounded-[22px] bg-[#0F1A2D]/70 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Testing analysis</h2>
              <p className="mt-2">
                Coaching reads are based on the match data you log. They are
                intended to support testing decisions, not guarantee tournament
                results.
              </p>
            </section>
            <section className="rounded-[22px] bg-[#0F1A2D]/70 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Fan-made tool</h2>
              <p className="mt-2">
                SixPrizer is a fan-made testing tool and is not affiliated with
                Nintendo, Creatures, Game Freak, or The Pokémon Company.
              </p>
            </section>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
