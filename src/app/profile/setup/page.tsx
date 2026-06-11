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
} from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { getOwnProfile } from "@/lib/community";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function ProfileSetupPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getOwnProfile(user.id);

  if (profile) {
    redirect("/settings/profile");
  }

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="settings" />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <header className={pageHeaderCard}>
            <div>
              <SixPrizerLogo />
              <p className="mt-4 text-sm font-medium text-[#4F8CFF]">Community setup</p>
              <h1 className={pageTitle}>Create your profile</h1>
              <p className={pageCopy}>
                Pick a handle, choose your visibility, and decide how much testing
                signal you want to share.
              </p>
            </div>
            <div className="lg:hidden">
              <AppNav current="settings" />
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <ProfileSettingsForm profile={null} mode="setup" />

            <aside className={`grid gap-4 p-4 sm:p-5 ${premiumInset}`}>
              <div>
                <p className="text-lg font-semibold text-[#F8FAFC]">
                  What stays private
                </p>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                  Your raw match logs, private notes, and decklists do not become
                  public when you create a profile.
                </p>
              </div>
              <ul className="grid gap-2 text-sm leading-6 text-[#D6E0F0]">
                <li>Profiles default to private.</li>
                <li>Aggregate-only hides deeper analytics from other users.</li>
                <li>Public reports are opt-in and safe by design.</li>
              </ul>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
