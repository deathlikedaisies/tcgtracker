import { AppRouteLoadingSkeleton } from "@/components/layout/AppRouteLoadingSkeleton";

export default function Loading() {
  return <AppRouteLoadingSkeleton title="Loading review" chart cards={4} listRows={3} />;
}
