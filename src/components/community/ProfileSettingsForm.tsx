"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  formSectionCard,
  inputH10,
  label,
  pageCopy,
  premiumChip,
  premiumInset,
  premiumInsetStrong,
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

type BuilderValues = {
  displayName: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  country: string;
  favoriteArchetype: string;
  mainDeckName: string;
  currentTestingFocus: string;
  profileVisibility: ProfileVisibility;
  analyticsVisibility: AnalyticsVisibility;
};

type VisibilityOption<T extends string> = {
  value: T;
  title: string;
  description: string;
};

const PROFILE_VISIBILITY_OPTIONS: VisibilityOption<ProfileVisibility>[] = [
  {
    value: "private",
    title: "Private",
    description: "Only you can view your profile.",
  },
  {
    value: "link_only",
    title: "Link-only",
    description: "Anyone with the direct link can view it.",
  },
  {
    value: "public",
    title: "Public",
    description: "Your profile can be discovered and shared.",
  },
];

const ANALYTICS_VISIBILITY_OPTIONS: VisibilityOption<AnalyticsVisibility>[] = [
  {
    value: "private",
    title: "Private",
    description: "Only you can see your testing stats.",
  },
  {
    value: "aggregate_only",
    title: "Aggregate only",
    description: "Others see summary trends, never raw logs.",
  },
  {
    value: "detailed",
    title: "Detailed",
    description: "Public pages can show the fuller summary model you allow.",
  },
];

const PRIVATE_RULES = [
  "Raw match logs stay private.",
  "Private notes stay private.",
  "Decklists do not become public just because a profile exists.",
  "Public reports are opt-in and summary-only.",
  "Analytics sharing is controlled separately from profile visibility.",
];

function getInitialProfileValues(profile: ProfileRecord | null): BuilderValues {
  return {
    displayName: profile?.display_name ?? "",
    handle: profile?.handle ?? "",
    avatarUrl: profile?.avatar_url ?? "",
    bio: profile?.bio ?? "",
    country: profile?.country ?? "",
    favoriteArchetype: profile?.favorite_archetype ?? "",
    mainDeckName: profile?.main_deck_name ?? "",
    currentTestingFocus: profile?.current_testing_focus ?? "",
    profileVisibility: profile?.profile_visibility ?? "private",
    analyticsVisibility: profile?.analytics_visibility ?? "private",
  };
}

function formatProfileVisibility(value: ProfileVisibility) {
  return value === "link_only"
    ? "Link-only"
    : value === "public"
      ? "Public"
      : "Private";
}

function formatAnalyticsVisibility(value: AnalyticsVisibility) {
  return value === "aggregate_only"
    ? "Aggregate only"
    : value === "detailed"
      ? "Detailed"
      : "Private";
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "S";
}

function SaveProfileButton({ mode }: { mode: "setup" | "settings" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${primaryButton} w-full sm:w-auto`}>
      {pending
        ? mode === "setup"
          ? "Creating..."
          : "Saving..."
        : mode === "setup"
          ? "Create my profile"
          : "Save profile"}
    </button>
  );
}

function SectionHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#4F8CFF]/16 text-sm font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
          {step}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
            Section {step}
          </p>
          <h2 className={`mt-1 ${sectionTitle}`}>{title}</h2>
        </div>
      </div>
      <p className={pageCopy}>{description}</p>
    </div>
  );
}

function FieldHint({ children }: { children: string }) {
  return <p className={`${sectionCopy} text-xs sm:text-sm`}>{children}</p>;
}

function OptionCardGroup<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: VisibilityOption<T>[];
  onChange: (nextValue: T) => void;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => {
        const checked = value === option.value;

        return (
          <label
            key={option.value}
            className={`group relative cursor-pointer rounded-[20px] p-4 transition ${checked ? "bg-[linear-gradient(180deg,rgba(18,30,52,0.96),rgba(9,19,34,0.90))] shadow-[0_18px_42px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(79,140,255,0.24),inset_0_1px_0_rgba(255,255,255,0.04)]" : "bg-[linear-gradient(180deg,rgba(10,18,32,0.74),rgba(7,14,25,0.68))] shadow-[0_14px_32px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(148,163,184,0.08),inset_0_1px_0_rgba(255,255,255,0.02)] hover:shadow-[0_18px_36px_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(79,140,255,0.16),inset_0_1px_0_rgba(255,255,255,0.03)]"}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex size-5 shrink-0 rounded-full border transition ${checked ? "border-[#F5C84C] bg-[#F5C84C] shadow-[0_0_18px_rgba(245,200,76,0.18)]" : "border-white/18 bg-[#07111F]/76 group-hover:border-[#4F8CFF]/42"}`}
                aria-hidden="true"
              >
                <span
                  className={`m-auto size-2 rounded-full ${checked ? "bg-[#07111F]" : "bg-transparent"}`}
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F8FAFC]">{option.title}</p>
                <p className="mt-1 text-sm leading-6 text-[#94A3B8]/80">
                  {option.description}
                </p>
              </div>
            </div>
          </label>
        );
      })}
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
  const [values, setValues] = useState<BuilderValues>(() =>
    getInitialProfileValues(profile)
  );

  const profilePreview = useMemo(
    () => ({
      displayName: values.displayName.trim() || "Your player name",
      handle: values.handle.trim() ? `@${values.handle.trim()}` : "@your-handle",
      bio:
        values.bio.trim() ||
        "Share what you are testing and how you approach matchups.",
      country: values.country.trim() || null,
      favoriteArchetype: values.favoriteArchetype.trim() || null,
      mainDeckName: values.mainDeckName.trim() || null,
      currentTestingFocus: values.currentTestingFocus.trim() || null,
      avatarUrl: values.avatarUrl.trim() || null,
    }),
    [values]
  );

  const currentProfileVisibility = values.profileVisibility;
  const currentAnalyticsVisibility = values.analyticsVisibility;

  return (
    <form action={formAction} className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <div className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
        <div className="grid gap-4">
          <SectionHeader
            step="1"
            title="Player identity"
            description="Set the public-facing basics of your SixPrizer player identity. Keep it private until you are ready."
          />

          <section className={`grid gap-4 p-4 sm:p-5 ${premiumInsetStrong}`}>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="display_name" className={label}>
                  Display name
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  required
                  value={values.displayName}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
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
                  value={values.handle}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      handle: event.target.value,
                    }))
                  }
                  className={inputH10}
                  placeholder="domzimm888"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <FieldHint>
                  Lowercase only. Use letters, numbers, underscores, or hyphens. No spaces.
                </FieldHint>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="avatar_url" className={label}>
                    Avatar URL
                  </label>
                  <input
                    id="avatar_url"
                    name="avatar_url"
                    value={values.avatarUrl}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        avatarUrl: event.target.value,
                      }))
                    }
                    className={inputH10}
                    placeholder="https://..."
                  />
                  <FieldHint>
                    Optional. Add a clean image URL if you want your public profile to feel more personal.
                  </FieldHint>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="country" className={label}>
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    value={values.country}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        country: event.target.value,
                      }))
                    }
                    className={inputH10}
                    placeholder="Netherlands"
                  />
                </div>
              </div>

              <div className={`flex items-center justify-center rounded-[22px] p-4 ${premiumInset}`}>
                {profilePreview.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profilePreview.avatarUrl}
                    alt={profilePreview.displayName}
                    className="size-24 rounded-[24px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                  />
                ) : (
                  <div className="inline-flex size-24 items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(79,140,255,0.22),rgba(12,21,38,0.92))] text-3xl font-bold text-[#F8FAFC] shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
                    {getInitial(profilePreview.displayName)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="bio" className={label}>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                value={values.bio}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                className={`${textarea} min-h-[132px]`}
                placeholder="What are you testing, what deck do you main, or how do you approach matchups?"
              />
            </div>
          </section>
        </div>

        <div className="grid gap-4">
          <SectionHeader
            step="2"
            title="Competitive profile"
            description="Give your profile the context that makes it feel like a serious testing identity, not just an account name."
          />

          <section className={`grid gap-4 p-4 sm:p-5 ${premiumInsetStrong}`}>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-2">
                <label htmlFor="favorite_archetype" className={label}>
                  Favorite archetype
                </label>
                <input
                  id="favorite_archetype"
                  name="favorite_archetype"
                  value={values.favoriteArchetype}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      favoriteArchetype: event.target.value,
                    }))
                  }
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
                  value={values.mainDeckName}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      mainDeckName: event.target.value,
                    }))
                  }
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
                  value={values.currentTestingFocus}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      currentTestingFocus: event.target.value,
                    }))
                  }
                  className={inputH10}
                  placeholder="Mega Greninja matchup"
                />
              </div>
            </div>
            <p className={sectionCopy}>
              These fields shape your preview and public testing identity, but they do not expose raw decklists or notes.
            </p>
          </section>
        </div>

        <div className="grid gap-4">
          <SectionHeader
            step="3"
            title="Privacy and sharing"
            description="Decide what other players can discover and what level of testing signal is safe to share."
          />

          <section className={`grid gap-5 p-4 sm:p-5 ${premiumInsetStrong}`}>
            <div className="grid gap-3">
              <div>
                <p className={label}>Profile visibility</p>
                <p className={sectionCopy}>
                  Choose how visible your player identity should be.
                </p>
              </div>
              <OptionCardGroup
                name="profile_visibility"
                value={values.profileVisibility}
                options={PROFILE_VISIBILITY_OPTIONS}
                onChange={(nextValue) =>
                  setValues((current) => ({
                    ...current,
                    profileVisibility: nextValue,
                  }))
                }
              />
            </div>

            <div className="grid gap-3">
              <div>
                <p className={label}>Analytics visibility</p>
                <p className={sectionCopy}>
                  Public analytics are always summary-first and never raw logs.
                </p>
              </div>
              <OptionCardGroup
                name="analytics_visibility"
                value={values.analyticsVisibility}
                options={ANALYTICS_VISIBILITY_OPTIONS}
                onChange={(nextValue) =>
                  setValues((current) => ({
                    ...current,
                    analyticsVisibility: nextValue,
                  }))
                }
              />
            </div>
          </section>
        </div>

        {state.error ? (
          <div className="rounded-[18px] bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
            {state.error}
          </div>
        ) : null}

        {state.success ? (
          <div className="rounded-[18px] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
            <p className="font-semibold text-emerald-200">{state.success}</p>
            {state.publicUrl ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={state.publicUrl} className={secondaryButton}>
                  View profile
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-emerald-100/88">
                The profile is still private. You can share it later when you are ready.
              </p>
            )}
          </div>
        ) : null}

        <section className={`grid gap-4 p-4 sm:p-5 ${premiumInsetStrong}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
              Final step
            </p>
            <h2 className={`mt-2 ${sectionTitle}`}>
              {mode === "setup" ? "Create your SixPrizer profile" : "Save your profile"}
            </h2>
            <p className={pageCopy}>
              {mode === "setup"
                ? "You can keep everything private until you are ready to share."
                : "You can keep everything private until you are ready to share, and public reports stay opt-in."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={sectionCopy}>
              {mode === "setup"
                ? "Create the identity first. You can refine the details after a few more testing sessions."
                : "Saving here updates your identity and sharing controls without exposing raw match details."}
            </p>
            <SaveProfileButton mode={mode} />
          </div>
        </section>
      </div>

      <aside className="grid gap-4 xl:sticky xl:top-6">
        <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
              Live preview
            </p>
            <h2 className={`mt-2 ${sectionTitle}`}>Your SixPrizer player card</h2>
            <p className={pageCopy}>
              This is how your profile will start to feel once you decide to share it.
            </p>
          </div>

          <div className={`grid gap-4 p-4 sm:p-5 ${premiumInsetStrong}`}>
            <div className="flex items-start gap-4">
              {profilePreview.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePreview.avatarUrl}
                  alt={profilePreview.displayName}
                  className="size-20 rounded-[22px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                />
              ) : (
                <div className="inline-flex size-20 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,rgba(79,140,255,0.24),rgba(14,24,42,0.92))] text-2xl font-bold text-[#F8FAFC] shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
                  {getInitial(profilePreview.displayName)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-xl font-semibold tracking-tight text-[#F8FAFC]">
                  {profilePreview.displayName}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#94A3B8]">
                  {profilePreview.handle}
                </p>
                {profilePreview.country ? (
                  <p className="mt-2 text-sm text-[#D6E0F0]">{profilePreview.country}</p>
                ) : null}
              </div>
            </div>

            <p className="text-sm leading-6 text-[#D6E0F0]">{profilePreview.bio}</p>

            <div className="flex flex-wrap gap-2">
              <span className={`${premiumChip} text-[#DCE8FF]`}>
                {formatProfileVisibility(currentProfileVisibility)}
              </span>
              <span className={`${premiumChip} text-[#FFE28A]`}>
                {formatAnalyticsVisibility(currentAnalyticsVisibility)}
              </span>
              {profilePreview.favoriteArchetype ? (
                <span className={`${premiumChip} text-[#DCE8FF]`}>
                  {profilePreview.favoriteArchetype}
                </span>
              ) : null}
              {profilePreview.mainDeckName ? (
                <span className={`${premiumChip} text-[#FFE28A]`}>
                  {profilePreview.mainDeckName}
                </span>
              ) : null}
              {profilePreview.currentTestingFocus ? (
                <span className={`${premiumChip} text-emerald-200`}>
                  {profilePreview.currentTestingFocus}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
              Privacy summary
            </p>
            <h2 className={`mt-2 ${sectionTitle}`}>What stays private</h2>
            <p className={pageCopy}>
              Your community profile is controlled, summary-first, and safe by default.
            </p>
          </div>

          <div className={`grid gap-3 p-4 ${premiumInset}`}>
            {PRIVATE_RULES.map((rule) => (
              <div key={rule} className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/14 text-[11px] font-bold text-emerald-200">
                  ✓
                </span>
                <p className="text-sm leading-6 text-[#D6E0F0]">{rule}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </form>
  );
}
