import Link from "next/link";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { CopyLinkButton } from "@/components/community/CopyLinkButton";
import { ProfileSettingsForm } from "@/components/community/ProfileSettingsForm";
import {
  appFrame,
  appMain,
  appShell,
  pageCopy,
  premiumInset,
  secondaryButton,
} from "@/components/brand-styles";
import { refreshProfileStatsAction } from "@/app/community/actions";
import type { ProfileRecord } from "@/lib/community";

type ProfileSettingsPageContentProps = {
  profile: ProfileRecord;
  userEmail: string;
  refreshed?: string;
};

export function ProfileSettingsPageContent({
  profile,
  userEmail,
  refreshed,
}: ProfileSettingsPageContentProps) {
  const refreshAction = refreshProfileStatsAction.bind(
    null,
    profile.handle,
    "/profile"
  );
  const publicUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  }/u/${profile.handle}`;
  const isPubliclyVisible = profile.profile_visibility !== "private";

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="settings" />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="settings"
            eyebrow="Competitive identity"
            title="Profile"
            subtitle="Set your public player identity, control what testing signal is visible, and keep everything else private."
            userEmail={userEmail}
            actions={
              <div className="grid gap-3">
                <div className={`grid gap-2 p-3 text-sm ${premiumInset}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Public profile URL
                  </p>
                  <p className="break-all font-medium text-[#F8FAFC]">{publicUrl}</p>
                  <p className={pageCopy}>
                    {isPubliclyVisible
                      ? "This link is live according to your current sharing settings."
                      : "This link is reserved for your handle. It stays hidden from other players until you move the profile out of private mode."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/u/${profile.handle}`} className={secondaryButton}>
                    View public profile
                  </Link>
                  <form action={refreshAction}>
                    <button type="submit" className={secondaryButton}>
                      Refresh public stats
                    </button>
                  </form>
                </div>

                <CopyLinkButton link={publicUrl} />

                {refreshed === "1" ? (
                  <p className="text-sm font-medium text-emerald-300">
                    Public stats refreshed.
                  </p>
                ) : null}
              </div>
            }
          />
          <ProfileSettingsForm profile={profile} mode="settings" />
        </div>
      </section>
    </main>
  );
}
