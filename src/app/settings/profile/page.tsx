import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { ProfileSettingsForm } from "@/components/community/ProfileSettingsForm";
import {
  appFrame,
  appMain,
  appShell,
  secondaryButton,
} from "@/components/brand-styles";
import { refreshProfileStatsAction } from "@/app/community/actions";
import { getOwnProfile } from "@/lib/community";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function ProfileSettingsPage({
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

  const refreshAction = refreshProfileStatsAction.bind(
    null,
    profile.handle,
    "/settings/profile"
  );

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="settings" />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="settings"
            eyebrow="Community settings"
            title="Profile"
            subtitle="Update how your SixPrizer identity and testing signal appear to others."
            userEmail={user.email ?? "Unknown email"}
            actions={
              <>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/u/${profile.handle}`} className={secondaryButton}>
                    View profile
                  </Link>
                  <form action={refreshAction}>
                    <button type="submit" className={secondaryButton}>
                      Refresh public stats
                    </button>
                  </form>
                </div>
                {params.refreshed === "1" ? (
                  <p className="text-sm font-medium text-emerald-300">
                    Public stats refreshed.
                  </p>
                ) : null}
              </>
            }
          />
          <ProfileSettingsForm profile={profile} mode="settings" />
        </div>
      </section>
    </main>
  );
}
