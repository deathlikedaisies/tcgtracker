import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { CopyLinkButton } from "@/components/community/CopyLinkButton";
import { ProfileSettingsForm } from "@/components/community/ProfileSettingsForm";
import {
  appFrame,
  appMain,
  appShell,
  premiumInset,
  premiumInsetStrong,
  secondaryButton,
} from "@/components/brand-styles";
import { refreshProfileStatsAction } from "@/app/community/actions";
import type { ProfileRecord } from "@/lib/community";
import { getPublicProfileUrl } from "@/lib/site-url";

type ProfileSettingsPageContentProps = {
  profile: ProfileRecord;
  userEmail: string;
  refreshed?: string;
};

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "S";
}

function visibilityLabel(visibility: ProfileRecord["profile_visibility"]) {
  if (visibility === "public") return "Public";
  if (visibility === "link_only") return "Link-only";
  return "Private";
}

function visibilityTone(visibility: ProfileRecord["profile_visibility"]) {
  if (visibility === "public") return "bg-emerald-500/14 text-emerald-200";
  if (visibility === "link_only") return "bg-[#4F8CFF]/14 text-[#B8D1FF]";
  return "bg-[#94A3B8]/10 text-[#94A3B8]";
}

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
  const publicUrl = getPublicProfileUrl(profile.handle);
  const isPubliclyVisible = profile.profile_visibility !== "private";

  const completionItems = [
    { label: "Display name", done: Boolean(profile.display_name?.trim()) },
    { label: "Handle", done: Boolean(profile.handle?.trim()) },
    { label: "Country", done: Boolean(profile.country?.trim()) },
    { label: "Bio", done: Boolean(profile.bio?.trim()) },
    { label: "Sharing configured", done: profile.profile_visibility !== "private" },
  ];
  const completedCount = completionItems.filter((item) => item.done).length;
  const allComplete = completedCount === completionItems.length;

  return (
    <main className={appShell}>
      <section className={appFrame}>
        <AppSidebar current="settings" />
        <div className={`${appMain} mx-auto w-full max-w-7xl`}>
          <AuthenticatedPageHeader
            current="settings"
            eyebrow="Competitive identity"
            title="Your player card"
            subtitle="Shape how the community sees you as a tester."
            userEmail={userEmail}
          />

          {/* Player card hero */}
          <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* Identity card */}
            <div className="rounded-[24px] bg-[radial-gradient(circle_at_top_left,rgba(79,140,255,0.14),transparent_40%),linear-gradient(180deg,rgba(12,22,42,0.96),rgba(6,13,26,0.92))] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(79,140,255,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-start gap-4">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="size-16 shrink-0 rounded-[18px] object-cover shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
                  />
                ) : (
                  <div className="inline-flex size-16 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,rgba(79,140,255,0.28),rgba(12,21,38,0.92))] text-2xl font-bold text-[#F8FAFC] shadow-[0_12px_28px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(79,140,255,0.22)]">
                    {getInitial(profile.display_name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[#F8FAFC]">
                      {profile.display_name || "Your name"}
                    </h2>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${visibilityTone(profile.profile_visibility)}`}>
                      {visibilityLabel(profile.profile_visibility)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-[#94A3B8]">@{profile.handle}</p>
                  {profile.country ? (
                    <p className="mt-0.5 text-sm text-[#94A3B8]/72">{profile.country}</p>
                  ) : null}
                  {profile.bio ? (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#94A3B8]/80">
                      {profile.bio}
                    </p>
                  ) : null}
                  {profile.favorite_archetype || profile.main_deck_name ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profile.favorite_archetype ? (
                        <span className="rounded-md bg-[#4F8CFF]/10 px-2.5 py-1 text-xs font-medium text-[#B8D1FF]">
                          {profile.favorite_archetype}
                        </span>
                      ) : null}
                      {profile.main_deck_name ? (
                        <span className="rounded-md bg-[#F5C84C]/10 px-2.5 py-1 text-xs font-medium text-[#FFE28A]">
                          {profile.main_deck_name}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={`mt-4 ${premiumInset} rounded-[16px] p-3`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Public profile URL
                </p>
                <p className="mt-1 break-all text-sm font-medium text-[#F8FAFC]">
                  {publicUrl}
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]/72">
                  {isPubliclyVisible
                    ? "Live and shareable based on your sharing settings."
                    : "Reserved but hidden — set sharing to Link-only or Public to activate."}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/u/${profile.handle}`} className={secondaryButton}>
                  View public profile
                </Link>
                <CopyLinkButton link={publicUrl} />
                <form action={refreshAction}>
                  <button type="submit" className={secondaryButton}>
                    Refresh stats
                  </button>
                </form>
              </div>

              {refreshed === "1" ? (
                <p className="mt-2 text-sm font-medium text-emerald-300">
                  Public stats refreshed.
                </p>
              ) : null}
            </div>

            {/* Profile completion */}
            <div className={`${premiumInsetStrong} rounded-[24px] p-4`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#F8FAFC]">Profile completion</p>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${allComplete ? "bg-emerald-500/14 text-emerald-200" : "bg-[#4F8CFF]/14 text-[#B8D1FF]"}`}>
                  {completedCount}/{completionItems.length}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-[#1A2238]">
                <div
                  className="h-1.5 rounded-full bg-[#4F8CFF] transition-[width]"
                  style={{ width: `${(completedCount / completionItems.length) * 100}%` }}
                />
              </div>
              <ul className="mt-4 grid gap-2">
                {completionItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2.5 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-[#94A3B8]/40" aria-hidden="true" />
                    )}
                    <span className={item.done ? "text-[#F8FAFC]" : "text-[#94A3B8]/72"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              {!allComplete ? (
                <p className="mt-4 text-xs leading-5 text-[#94A3B8]/62">
                  Fill in the form below to complete your player card.
                </p>
              ) : (
                <p className="mt-4 text-xs leading-5 text-emerald-300/80">
                  Your player card is complete.
                </p>
              )}
            </div>
          </section>

          <ProfileSettingsForm profile={profile} mode="settings" />
        </div>
      </section>
    </main>
  );
}
