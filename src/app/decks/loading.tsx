import { AppRouteLoadingSkeleton } from "@/components/layout/AppRouteLoadingSkeleton";

export default function Loading() {
  return <AppRouteLoadingSkeleton title="Loading decks" cards={3} listRows={4} />;
}
