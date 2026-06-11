"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  buildPublicProfileStats,
  createMatchupSharedReport,
  createOrUpdateProfile,
  followUser,
  removeReaction,
  reactToProfileOrReport,
  type AnalyticsVisibility,
  type ProfileInput,
  type ProfileReactionType,
  type ProfileVisibility,
  unfollowUser,
} from "@/lib/community";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export type ProfileFormState = {
  error: string | null;
  success: string | null;
  publicUrl: string | null;
  handle: string | null;
};

async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

function readVisibility(
  value: FormDataEntryValue | null,
  fallback: ProfileVisibility
): ProfileVisibility {
  return value === "private" || value === "link_only" || value === "public"
    ? value
    : fallback;
}

function readAnalyticsVisibility(
  value: FormDataEntryValue | null,
  fallback: AnalyticsVisibility
): AnalyticsVisibility {
  return value === "private" || value === "aggregate_only" || value === "detailed"
    ? value
    : fallback;
}

export async function saveProfileAction(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUser();

  const input: ProfileInput = {
    handle: String(formData.get("handle") ?? ""),
    displayName: String(formData.get("display_name") ?? ""),
    avatarUrl: String(formData.get("avatar_url") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    country: String(formData.get("country") ?? ""),
    favoriteArchetype: String(formData.get("favorite_archetype") ?? ""),
    mainDeckName: String(formData.get("main_deck_name") ?? ""),
    currentTestingFocus: String(formData.get("current_testing_focus") ?? ""),
    profileVisibility: readVisibility(formData.get("profile_visibility"), "private"),
    analyticsVisibility: readAnalyticsVisibility(
      formData.get("analytics_visibility"),
      "private"
    ),
  };

  const result = await createOrUpdateProfile(user.id, input);

  if (!result.ok || !result.profile) {
    return {
      error: result.error ?? "Profile could not be saved.",
      success: null,
      publicUrl: null,
      handle: null,
    };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/profile/setup");
  revalidatePath(`/u/${result.profile.handle}`);

  return {
    error: null,
    success: "Profile saved.",
    publicUrl:
      result.profile.profile_visibility === "private"
        ? null
        : `/u/${result.profile.handle}`,
    handle: result.profile.handle,
  };
}

export async function refreshProfileStatsAction(handle: string, redirectPath: string) {
  const user = await requireUser();
  await buildPublicProfileStats(user.id);
  revalidatePath("/settings/profile");
  revalidatePath(`/u/${handle}`);
  redirect(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}refreshed=1`);
}

export async function toggleFollowAction(
  targetUserId: string,
  handle: string,
  isFollowing: boolean
) {
  const user = await requireUser();

  if (isFollowing) {
    await unfollowUser(user.id, targetUserId);
  } else {
    await followUser(user.id, targetUserId);
  }

  revalidatePath(`/u/${handle}`);
  redirect(`/u/${handle}`);
}

export async function toggleProfileReactionAction(
  targetUserId: string,
  targetId: string,
  handle: string,
  reactionType: ProfileReactionType,
  hasReacted: boolean
) {
  const user = await requireUser();

  if (hasReacted) {
    await removeReaction({
      actorId: user.id,
      targetType: "profile",
      targetId,
      reactionType,
    });
  } else {
    await reactToProfileOrReport({
      actorId: user.id,
      targetUserId,
      targetType: "profile",
      targetId,
      reactionType,
    });
  }

  revalidatePath(`/u/${handle}`);
  redirect(`/u/${handle}`);
}

export async function toggleReportReactionAction(
  targetUserId: string,
  targetId: string,
  slug: string,
  reactionType: ProfileReactionType,
  hasReacted: boolean
) {
  const user = await requireUser();

  if (hasReacted) {
    await removeReaction({
      actorId: user.id,
      targetType: "shared_report",
      targetId,
      reactionType,
    });
  } else {
    await reactToProfileOrReport({
      actorId: user.id,
      targetUserId,
      targetType: "shared_report",
      targetId,
      reactionType,
    });
  }

  revalidatePath(`/r/${slug}`);
  redirect(`/r/${slug}`);
}

export async function createMatchupSharedReportAction(
  deckId: string | null,
  deckVersionId: string | null,
  opponentArchetype: string | null,
  visibility: "private" | "link_only" | "public" = "link_only"
) {
  const user = await requireUser();
  let reportSlug: string | null = null;

  try {
    const report = await createMatchupSharedReport(user.id, {
      deckId,
      deckVersionId,
      opponentArchetype,
      visibility,
    });

    reportSlug = report.slug;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report could not be created.";
    console.error("createMatchupSharedReportAction failed", {
      userId: user.id,
      deckId,
      deckVersionId,
      opponentArchetype,
      visibility,
      message,
    });

    if (message.toLowerCase().includes("create a profile")) {
      redirect("/profile/setup?next=/matchups");
    }

    redirect("/matchups?share_error=1");
  }

  if (!reportSlug) {
    redirect("/matchups?share_error=1");
  }

  revalidatePath("/matchups");
  revalidatePath(`/r/${reportSlug}`);
  redirect(`/r/${reportSlug}`);
}
