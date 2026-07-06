import { AppRouteLoadingSkeleton } from "@/components/layout/AppRouteLoadingSkeleton";

export default function Loading() {
  return <AppRouteLoadingSkeleton title="Loading feedback" cards={2} listRows={2} />;
}
