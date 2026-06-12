import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { AppSidebar } from "@/components/AppSidebar";
import { ProfileSettingsForm } from "@/components/community/ProfileSettingsForm";
import {
  appFrame,
  appMain,
  appShell,
  pageCopy,
  pageHeaderCard,
  pageTitle,
  secondaryButton,
} from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
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
          <header className={pageHeaderCard}>
            <div>
              <SixPrizerLogo />
              <p className="mt-4 text-sm font-medium text-[#4F8CFF]">Community settings</p>
              <h1 className={pageTitle}>Profile</h1>
              <p className={pageCopy}>
                Update how your SixPrizer identity and testing signal appear to
                others.
              </p>
            </div>
            <div className="grid gap-3 lg:justify-items-end">
              <div className="lg:hidden">
                <AppNav current="settings" />
              </div>
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
            </div>
          </header>
          <ProfileSettingsForm profile={profile} mode="settings" />
        </div>
      </section>
    </main>
  );
}
