import { AppRouteLoadingSkeleton } from "@/components/layout/AppRouteLoadingSkeleton";

export default function Loading() {
  return <AppRouteLoadingSkeleton title="Loading match history" cards={4} listRows={5} />;
}
