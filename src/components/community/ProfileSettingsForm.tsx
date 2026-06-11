"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  formSectionCard,
  inputH10,
  label,
  pageCopy,
  premiumInset,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  textarea,
} from "@/components/brand-styles";
import {
  saveProfileAction,
  type ProfileFormState,
} from "@/app/community/actions";
import type {
  AnalyticsVisibility,
  ProfileRecord,
  ProfileVisibility,
} from "@/lib/community";

type ProfileSettingsFormProps = {
  profile: ProfileRecord | null;
  mode: "setup" | "settings";
};

function SaveProfileButton({ mode }: { mode: "setup" | "settings" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending
        ? mode === "setup"
          ? "Creating..."
          : "Saving..."
        : mode === "setup"
          ? "Create profile"
          : "Save profile"}
    </button>
  );
}

function VisibilityHelp({
  profileVisibility,
  analyticsVisibility,
}: {
  profileVisibility: ProfileVisibility;
  analyticsVisibility: AnalyticsVisibility;
}) {
  return (
    <div className={`grid gap-3 p-4 ${premiumInset}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
          Privacy
        </p>
        <h3 className={`mt-2 ${sectionTitle}`}>What becomes public</h3>
        <p className={pageCopy}>
          Raw match logs, private notes, and decklists stay private by default.
        </p>
      </div>
      <ul className="grid gap-2 text-sm leading-6 text-[#D6E0F0]">
        <li>
          Profile visibility:{" "}
          <span className="font-semibold text-[#F8FAFC]">
            {profileVisibility === "private"
              ? "Private"
              : profileVisibility === "link_only"
                ? "Link-only"
                : "Public"}
          </span>
        </li>
        <li>
          Analytics visibility:{" "}
          <span className="font-semibold text-[#F8FAFC]">
            {analyticsVisibility === "private"
              ? "Private"
              : analyticsVisibility === "aggregate_only"
                ? "Aggregate only"
                : "Detailed"}
          </span>
        </li>
      </ul>
    </div>
  );
}

export function ProfileSettingsForm({
  profile,
  mode,
}: ProfileSettingsFormProps) {
  const initialProfileFormState: ProfileFormState = {
    error: null,
    success: null,
    publicUrl: null,
    handle: null,
  };

  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    saveProfileAction,
    initialProfileFormState
  );

  const currentProfileVisibility = (
    state.handle ? undefined : profile?.profile_visibility
  ) ?? profile?.profile_visibility ?? "private";
  const currentAnalyticsVisibility =
    profile?.analytics_visibility ?? "private";

  return (
    <form action={formAction} className={`grid gap-5 p-4 sm:p-5 ${formSectionCard}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
          {mode === "setup" ? "Profile setup" : "Profile settings"}
        </p>
        <h2 className={`mt-2 ${sectionTitle}`}>
          {mode === "setup"
            ? "Create your SixPrizer identity"
            : "Update your testing profile"}
        </h2>
        <p className={pageCopy}>
          Public profiles are opt-in. Start private, then share only the aggregate
          analytics that help other players.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="display_name" className={label}>
            Display name
          </label>
          <input
            id="display_name"
            name="display_name"
            required
            defaultValue={profile?.display_name ?? ""}
            className={inputH10}
            placeholder="Dom Zimmerman"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="handle" className={label}>
            Handle
          </label>
          <input
            id="handle"
            name="handle"
            required
            defaultValue={profile?.handle ?? ""}
            className={inputH10}
            placeholder="domzimm888"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className={sectionCopy}>
            Lowercase only. Use letters, numbers, underscores, or hyphens.
          </p>
        </div>
        <div className="grid gap-2">
          <label htmlFor="avatar_url" className={label}>
            Avatar URL
          </label>
          <input
            id="avatar_url"
            name="avatar_url"
            defaultValue={profile?.avatar_url ?? ""}
            className={inputH10}
            placeholder="https://..."
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="country" className={label}>
            Country
          </label>
          <input
            id="country"
            name="country"
            defaultValue={profile?.country ?? ""}
            className={inputH10}
            placeholder="Netherlands"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="bio" className={label}>
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile?.bio ?? ""}
          className={textarea}
          placeholder="What are you testing, and how do you like to prep matchups?"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor="favorite_archetype" className={label}>
            Favorite archetype
          </label>
          <input
            id="favorite_archetype"
            name="favorite_archetype"
            defaultValue={profile?.favorite_archetype ?? ""}
            className={inputH10}
            placeholder="Raging Bolt"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="main_deck_name" className={label}>
            Main deck
          </label>
          <input
            id="main_deck_name"
            name="main_deck_name"
            defaultValue={profile?.main_deck_name ?? ""}
            className={inputH10}
            placeholder="Raging Bolt v3 Anti-Bench"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="current_testing_focus" className={label}>
            Current testing focus
          </label>
          <input
            id="current_testing_focus"
            name="current_testing_focus"
            defaultValue={profile?.current_testing_focus ?? ""}
            className={inputH10}
            placeholder="Mega Greninja matchup"
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="profile_visibility" className={label}>
            Profile visibility
          </label>
          <select
            id="profile_visibility"
            name="profile_visibility"
            defaultValue={profile?.profile_visibility ?? "private"}
            className={inputH10}
          >
            <option value="private">Private</option>
            <option value="link_only">Link-only</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="analytics_visibility" className={label}>
            Analytics visibility
          </label>
          <select
            id="analytics_visibility"
            name="analytics_visibility"
            defaultValue={profile?.analytics_visibility ?? "private"}
            className={inputH10}
          >
            <option value="private">Private</option>
            <option value="aggregate_only">Aggregate only</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
      </div>

      <VisibilityHelp
        profileVisibility={currentProfileVisibility}
        analyticsVisibility={currentAnalyticsVisibility}
      />

      {state.error ? (
        <div className="rounded-[18px] bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-[18px] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
          <p className="font-semibold text-emerald-200">{state.success}</p>
          {state.publicUrl ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={state.publicUrl} className={secondaryButton}>
                View public profile
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-emerald-100/88">
              The profile is still private. You can make it public later.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={sectionCopy}>
          {mode === "setup"
            ? "You can keep everything private until you are ready to share."
            : "Public profile pages never expose raw logs, private notes, or decklists by default."}
        </p>
        <SaveProfileButton mode={mode} />
      </div>
    </form>
  );
}
