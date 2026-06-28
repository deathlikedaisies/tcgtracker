import { DemoMatchesReview } from "@/components/demo/DemoMatchesReview";
import { DemoShell } from "@/components/demo/DemoShell";

export default function DemoReviewPage() {
  return (
    <DemoShell current="review">
      <DemoMatchesReview mode="review" />
    </DemoShell>
  );
}
