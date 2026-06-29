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
} from "@/components/brand-styles";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { getOwnProfile } from "@/lib/community";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getOwnUserPrivateSettings } from "@/lib/user-private-settings";

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
    redirect("/profile");
  }

  const privateSettings = await getOwnUserPrivateSettings(user.id);

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
                Set your player identity, choose your visibility, and decide what
                testing signal you want to share.
              </p>
            </div>
            <div className="lg:hidden">
              <AppNav current="settings" />
            </div>
          </header>
          <ProfileSettingsForm
            profile={null}
            mode="setup"
            pokemonTcgLiveUsername={privateSettings?.pokemon_tcg_live_username}
          />
        </div>
      </section>
    </main>
  );
}
