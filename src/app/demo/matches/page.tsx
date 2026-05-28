import { DemoMatchesReview } from "@/components/demo/DemoMatchesReview";
import { DemoShell } from "@/components/demo/DemoShell";

export default function DemoMatchesPage() {
  return (
    <DemoShell current="matches">
      <DemoMatchesReview />
    </DemoShell>
  );
}
