import { DemoMatchLogForm } from "@/components/demo/DemoMatchLogForm";
import { DemoShell } from "@/components/demo/DemoShell";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  pageCopy,
  pageHeaderCard,
  pageTitle,
  premiumInset,
  sectionCopy,
} from "@/components/brand-styles";
import { getDemoActiveVersion, getDemoCurrentDeck } from "@/lib/demo-data";

export default function DemoNewMatchPage() {
  const currentDeck = getDemoCurrentDeck();
  const activeVersion = getDemoActiveVersion(currentDeck);

  return (
    <DemoShell current="log">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Fast log flow</p>
          <h1 className={pageTitle}>Log a demo game</h1>
          <p className={pageCopy}>
            Log manually in the demo flow. In a real workspace, you can also paste a
            TCG Live battle log to prefill result, turn order, and opponent deck.
          </p>
        </div>
      </section>

      {currentDeck && activeVersion ? (
        <section className="grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
          <article className={`${premiumInset} p-3.5 sm:p-4`}>
            <div className="flex min-w-0 items-start gap-3">
              <ArchetypeSprites archetype={currentDeck.archetype} size="md" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                  Active test
                </p>
                <p className="mt-2 truncate text-lg font-semibold text-[#F8FAFC]">
                  {currentDeck.name}
                </p>
                <p className="text-sm text-[#B8D1FF]">{currentDeck.archetype}</p>
                <p className="mt-1 text-sm text-[#94A3B8]/76">
                  Testing: {activeVersion.name}
                </p>
              </div>
            </div>
          </article>

          <article className={`${premiumInset} p-3.5 sm:p-4`}>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
              TCG Live import in the full app
            </p>
            <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
              Paste a TCG Live battle log to prefill result, turn order, and opponent deck.
            </p>
            <p className={`${sectionCopy} mt-1`}>
              The demo form stays local, but the real workspace supports the faster import-assisted flow.
            </p>
          </article>
        </section>
      ) : null}

      <DemoMatchLogForm />
    </DemoShell>
  );
}
