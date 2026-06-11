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
  premiumInset,
  secondaryButton,
  sectionCopy,
  sectionTitle,
} from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { refreshProfileStatsAction } from "@/app/community/actions";
import { getOwnProfile, getPublicProfileStats } from "@/lib/community";
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

  const stats = await getPublicProfileStats(user.id);
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
                Control what other players can see, and share only the testing
                summary you want attached to your handle.
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

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <ProfileSettingsForm profile={profile} mode="settings" />

            <aside className={`grid gap-4 p-4 sm:p-5 ${premiumInset}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                  Public preview
                </p>
                <h2 className={`mt-2 ${sectionTitle}`}>What other players can see</h2>
                <p className={pageCopy}>
                  Public pages use safe derived stats. Raw logs, private notes, and
                  decklists stay private unless you explicitly share a report.
                </p>
              </div>

              <div className="grid gap-3 rounded-[22px] bg-[#07111F]/52 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <div>
                  <p className="text-lg font-semibold text-[#F8FAFC]">
                    {profile.display_name}
                  </p>
                  <p className="mt-1 text-sm text-[#94A3B8]">@{profile.handle}</p>
                </div>
                <p className={sectionCopy}>
                  {profile.bio ?? "No bio added yet."}
                </p>
                <div className="grid gap-2 text-sm text-[#D6E0F0]">
                  <p>
                    Current focus:{" "}
                    <span className="font-semibold text-[#F8FAFC]">
                      {profile.current_testing_focus ??
                        stats?.current_focus ??
                        "Not set"}
                    </span>
                  </p>
                  <p>
                    Analytics:{" "}
                    <span className="font-semibold text-[#F8FAFC]">
                      {profile.analytics_visibility === "private"
                        ? "Private"
                        : profile.analytics_visibility === "aggregate_only"
                          ? "Aggregate only"
                          : "Detailed"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm text-[#D6E0F0]">
                <p>
                  Games logged:{" "}
                  <span className="font-semibold text-[#F8FAFC]">
                    {stats?.total_matches ?? 0}
                  </span>
                </p>
                <p>
                  Public win rate:{" "}
                  <span className="font-semibold text-[#F8FAFC]">
                    {stats?.win_rate !== null && stats?.win_rate !== undefined
                      ? `${stats.win_rate}%`
                      : "Hidden"}
                  </span>
                </p>
              </div>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
