import { redirect } from "next/navigation";
import { ProfileSettingsPageContent } from "@/components/community/ProfileSettingsPageContent";
import { getOwnProfile } from "@/lib/community";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ refreshed?: string }>;
}) {
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

  return (
    <ProfileSettingsPageContent
      profile={profile}
      userEmail={user.email ?? "Unknown email"}
      refreshed={params.refreshed}
    />
  );
}
