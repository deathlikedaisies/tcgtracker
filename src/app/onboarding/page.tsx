import { ThreeGameOnboarding } from "@/components/onboarding/ThreeGameOnboarding";
import { getArchetypeOptions } from "@/lib/archetypes";
import { LATEST_FORMAT } from "@/lib/formats";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function OnboardingPage() {
  // TODO: Decide whether this legacy lightweight flow should become part of
  // the main first-user path. Current setup guidance lives in dashboard/decks/matches.
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ThreeGameOnboarding
      archetypeOptions={getArchetypeOptions(LATEST_FORMAT)}
      continueHref={user ? "/matches/new" : "/signup"}
    />
  );
}
