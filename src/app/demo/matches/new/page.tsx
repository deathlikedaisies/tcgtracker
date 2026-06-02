import { DemoMatchLogForm } from "@/components/demo/DemoMatchLogForm";
import { DemoShell } from "@/components/demo/DemoShell";
import { pageCopy, pageHeaderCard, pageTitle } from "@/components/brand-styles";

export default function DemoNewMatchPage() {
  return (
    <DemoShell current="log">
      <section className={pageHeaderCard}>
        <div>
          <p className="text-sm font-semibold text-[#4F8CFF]">Fast log flow</p>
          <h1 className={pageTitle}>Log a demo game</h1>
          <p className={pageCopy}>
            This form behaves like the product flow, but submit only updates local demo UI state.
          </p>
        </div>
      </section>

      <DemoMatchLogForm />
    </DemoShell>
  );
}
