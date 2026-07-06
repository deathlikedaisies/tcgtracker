import { redirect } from "next/navigation";
import { ProfileSettingsPageContent } from "@/components/community/ProfileSettingsPageContent";
import { getOwnProfile } from "@/lib/community";
import { startDevTimer } from "@/lib/dev-timing";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getOwnUserPrivateSettings } from "@/lib/user-private-settings";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ refreshed?: string }>;
}) {
  const endTiming = startDevTimer("route:/profile");
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getOwnProfile(user.id);

  if (!profile) {
    redirect("/profile/setup");
  }

  const privateSettings = await getOwnUserPrivateSettings(user.id);

  endTiming();

  return (
    <ProfileSettingsPageContent
      profile={profile}
      userEmail={user.email ?? "Unknown email"}
      refreshed={params.refreshed}
      pokemonTcgLiveUsername={privateSettings?.pokemon_tcg_live_username}
    />
  );
}
