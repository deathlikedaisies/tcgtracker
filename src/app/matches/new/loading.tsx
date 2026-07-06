import { AppRouteLoadingSkeleton } from "@/components/layout/AppRouteLoadingSkeleton";

export default function Loading() {
  return <AppRouteLoadingSkeleton title="Loading log game" cards={2} listRows={3} />;
}
