import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { glassPanel, primaryButton } from "@/components/brand-styles";

export function DemoConversionCta() {
  return (
    <section className={`mt-6 p-4 sm:p-5 ${glassPanel}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold text-[#F8FAFC]">
            Ready to use PrizeMap with your own games?
          </p>
          <p className="mt-1 text-sm leading-6 text-[#94A3B8]/76">
            Create a workspace to save real matches, deck versions, and coaching notes.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/signup" className={`${primaryButton} h-11 px-4`}>
            Create your workspace
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold text-[#C7D2E5] transition hover:bg-white/5 hover:text-[#F8FAFC] active:scale-[0.98]"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}
