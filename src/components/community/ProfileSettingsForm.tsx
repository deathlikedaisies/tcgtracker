"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Gamepad2, ShieldCheck, Sparkles } from "lucide-react";
import { ArchetypePicker } from "@/components/ArchetypePicker";
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
import { getArchetypeOptions } from "@/lib/archetypes";
import type {
  AnalyticsVisibility,
  ProfileRecord,
  ProfileVisibility,
} from "@/lib/community";
import { getCountryOptions, getCountryOptionValue } from "@/lib/countries";

type ProfileSettingsFormProps = {
  profile: ProfileRecord | null;
  mode: "setup" | "settings";
  pokemonTcgLiveUsername?: string | null;
};

type BuilderValues = {
  displayName: string;
  bio: string;
  country: string;
  favoriteArchetype: string;
  pokemonTcgLiveUsername: string;
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

function getInitialProfileValues(
  profile: ProfileRecord | null,
  pokemonTcgLiveUsername: string | null | undefined
): BuilderValues {
  return {
    displayName: profile?.display_name ?? "",
    bio: profile?.bio ?? "",
    country: profile?.country ?? "",
    favoriteArchetype: profile?.favorite_archetype ?? "",
    pokemonTcgLiveUsername: pokemonTcgLiveUsername ?? "",
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
  return value.trim().charAt(0).toUpperCase() || "?";
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]">
            Player card setup
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
  pokemonTcgLiveUsername,
}: ProfileSettingsFormProps) {
  const initialProfileFormState: ProfileFormState = {
    error: null,
    success: null,
    warning: null,
    publicUrl: null,
    handle: null,
  };

  const [state, formAction] = useActionState<ProfileFormState, FormData>(
    saveProfileAction,
    initialProfileFormState
  );
  const [values, setValues] = useState<BuilderValues>(() =>
    getInitialProfileValues(profile, pokemonTcgLiveUsername)
  );

  const profilePreview = useMemo(
    () => ({
      displayName: values.displayName.trim() || "Your player name",
      bio:
        values.bio.trim() ||
        "Share what you are testing and how you approach matchups.",
      country: values.country.trim() || null,
      favoriteArchetype: values.favoriteArchetype.trim() || null,
      mainDeckName: values.mainDeckName.trim() || null,
      currentTestingFocus: values.currentTestingFocus.trim() || null,
    }),
    [values]
  );

  const currentProfileVisibility = values.profileVisibility;
  const currentAnalyticsVisibility = values.analyticsVisibility;
  const countryOptions = getCountryOptions(values.country);
  const favoriteDeckOptions = getArchetypeOptions(null, [
    values.favoriteArchetype,
  ]);

  return (
    <form action={formAction} className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <input type="hidden" name="avatar_url" value={profile?.avatar_url ?? ""} />

      <div className="flex flex-col gap-3 rounded-[18px] bg-[linear-gradient(180deg,rgba(12,22,40,0.88),rgba(7,17,31,0.82))] px-4 py-3 shadow-[0_14px_30px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.10),inset_0_1px_0_rgba(255,255,255,0.03)] sm:flex-row sm:items-center sm:justify-between xl:col-span-2 xl:sticky xl:top-4 xl:z-10">
        <div>
          <p className="text-sm font-semibold text-[#F8FAFC]">
            {mode === "setup" ? "Create your player card" : "Edit player card"}
          </p>
          <p className="mt-0.5 text-xs text-[#94A3B8]/72">
            Save identity, TCG Live import name, and sharing controls.
          </p>
        </div>
        <SaveProfileButton mode={mode} />
      </div>

      <div className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
        <div className="grid gap-4">
          <SectionHeader
            step="1"
            title="Player identity"
            description="Set the identity that appears on shared profile links and reports."
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
                  placeholder="Your player name"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="country" className={label}>
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={getCountryOptionValue(values.country)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      country: event.target.value,
                    }))
                  }
                  className={inputH10}
                >
                  <option value="">Select your country</option>
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`flex flex-col gap-4 rounded-[22px] p-4 sm:flex-row sm:items-center ${premiumInset}`}>
              <div className="inline-flex size-20 shrink-0 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,rgba(79,140,255,0.24),rgba(12,21,38,0.92))] text-2xl font-bold text-[#F8FAFC] shadow-[0_18px_40px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                {getInitial(profilePreview.displayName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  Initials-based player card
                </p>
                <p className="mt-1 text-sm leading-6 text-[#94A3B8]/80">
                  SixPrizer uses your display name initial for a clean, consistent profile mark.
                </p>
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
            description="Connect your testing identity to the decks and tools you use most."
          />

          <section className={`grid gap-4 p-4 sm:p-5 ${premiumInsetStrong}`}>
            <ArchetypePicker
              id="favorite_archetype"
              name="favorite_archetype"
              label="Favorite deck"
              options={favoriteDeckOptions}
              value={values.favoriteArchetype}
              onValueChange={(nextValue) =>
                setValues((current) => ({
                  ...current,
                  favoriteArchetype: nextValue,
                }))
              }
              placeholder="Search or pick a deck"
              maxOptions={8}
              listMaxHeightClassName="max-h-48"
              customOptionPrefix="Use custom deck"
            />
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="pokemon_tcg_live_username" className={label}>
                  Pokemon TCG Live username
                </label>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5C84C]/12 px-2.5 py-1 text-[11px] font-semibold text-[#FFE28A]">
                  <Gamepad2 className="size-3.5" aria-hidden="true" />
                  Import helper
                </span>
              </div>
              <input
                id="pokemon_tcg_live_username"
                name="pokemon_tcg_live_username"
                value={values.pokemonTcgLiveUsername}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    pokemonTcgLiveUsername: event.target.value,
                  }))
                }
                className={inputH10}
                placeholder="DommitronNL"
              />
              <FieldHint>
                Used to autofill your name on the Log game page when importing TCG Live battle logs.
              </FieldHint>
            </div>
            <input type="hidden" name="main_deck_name" value={values.mainDeckName} />
            <input
              type="hidden"
              name="current_testing_focus"
              value={values.currentTestingFocus}
            />
            <p className={`${sectionCopy} rounded-[14px] bg-[#07111F]/38 px-3 py-2 text-xs`}>
              Competitive profile fields help your player card feel familiar without exposing raw decklists or private notes.
            </p>
          </section>
        </div>

        <div className="grid gap-4">
          <SectionHeader
            step="3"
            title="Privacy and sharing"
            description="Control who can see your profile and how much testing data is visible."
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

        {state.warning ? (
          <div className="rounded-[18px] bg-[#F5C84C]/10 px-4 py-3 text-sm text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
            {state.warning}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className={sectionCopy}>
            {mode === "setup"
              ? "Everything stays private until you decide to share."
              : "Raw match data and decklists are never exposed."}
          </p>
          <SaveProfileButton mode={mode} />
        </div>
      </div>

      <aside className="grid gap-4 xl:sticky xl:top-6">
        <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Share preview
            </p>
            <h2 className={`mt-2 ${sectionTitle}`}>Public profile preview</h2>
            <p className={pageCopy}>
              This is how your profile appears when shared.
            </p>
          </div>

          <div className={`relative grid gap-4 overflow-hidden p-4 sm:p-5 ${premiumInsetStrong}`}>
            <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-[#4F8CFF]/10 blur-3xl" />
            <div className="flex items-start gap-4">
              <div className="inline-flex size-20 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,rgba(79,140,255,0.24),rgba(14,24,42,0.92))] text-2xl font-bold text-[#F8FAFC] shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
                {getInitial(profilePreview.displayName)}
              </div>
              <div className="relative min-w-0">
                <h3 className="text-xl font-semibold tracking-tight text-[#F8FAFC]">
                  {profilePreview.displayName}
                </h3>
                {profilePreview.country ? (
                  <p className="mt-1 text-sm text-[#D6E0F0]">{profilePreview.country}</p>
                ) : null}
              </div>
            </div>

            <p className="relative text-sm leading-6 text-[#D6E0F0]">{profilePreview.bio}</p>

            <div className="relative flex flex-wrap gap-2">
              <span className={`${premiumChip} text-[#DCE8FF]`}>
                {formatProfileVisibility(currentProfileVisibility)}
              </span>
              <span className={`${premiumChip} text-[#FFE28A]`}>
                {formatAnalyticsVisibility(currentAnalyticsVisibility)}
              </span>
              {profilePreview.favoriteArchetype ? (
                <span className={`${premiumChip} text-[#DCE8FF]`}>
                  Favorite deck: {profilePreview.favoriteArchetype}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Privacy summary
            </p>
            <h2 className={`mt-2 ${sectionTitle}`}>What stays private</h2>
            <p className={pageCopy}>
              Your player card is controlled, summary-first, and private by default.
            </p>
          </div>

          <div className={`grid gap-2.5 p-3 ${premiumInset}`}>
            {PRIVATE_RULES.map((rule) => (
              <div key={rule} className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/14 text-[11px] font-bold text-emerald-200">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
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
