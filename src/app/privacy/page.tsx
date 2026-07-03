import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  cardLarge,
  marketingShell,
  secondaryButton,
  sectionCopy,
} from "@/components/brand-styles";

export default function PrivacyPage() {
  return (
    <main className={marketingShell}>
      <section className="px-4 py-8 sm:px-6 sm:py-12">
        <div className={`mx-auto max-w-4xl ${cardLarge}`}>
          <Link href="/" className={`${secondaryButton} h-10 w-fit px-4`}>
            <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
            Back home
          </Link>
          <div className="mt-8 flex items-start gap-4">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4F8CFF]">
                Privacy
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#F8FAFC] sm:text-5xl">
                SixPrizer privacy notes
              </h1>
              <p className={`mt-4 ${sectionCopy}`}>
                SixPrizer is built for private testing data. These notes are a
                plain-language placeholder for beta users while the full policy
                is finalized.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 text-sm leading-7 text-[#C7D2E5]">
            <section className="rounded-[22px] bg-[#0F1A2D]/70 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
              <h2 className="text-lg font-bold text-[#F8FAFC]">What you store</h2>
              <p className="mt-2">
                Your decks, match logs, event rounds, notes, tags, and profile
                settings are used to power your SixPrizer workspace and testing
                analysis.
              </p>
            </section>
            <section className="rounded-[22px] bg-[#0F1A2D]/70 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Private by default</h2>
              <p className="mt-2">
                Raw match logs, private notes, and deck testing history are not
                public by default. Sharing features are intended to be opt-in.
              </p>
            </section>
            <section className="rounded-[22px] bg-[#0F1A2D]/70 p-5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Beta contact</h2>
              <p className="mt-2">
                For privacy questions or beta feedback, use the feedback page
                from your workspace or contact the beta organiser directly.
              </p>
            </section>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
