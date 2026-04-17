"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import {
  inputH11,
  label,
  primaryButton,
  sectionCopy,
  secondaryButton,
  textarea,
} from "@/components/brand-styles";
import { LATEST_FORMAT } from "@/lib/formats";
import { MATCH_TAGS } from "@/lib/match-options";

type DeckOption = {
  id: string;
  label: string;
  detail: string;
  isActive: boolean;
};

type MatchLogFormProps = {
  action: (formData: FormData) => void;
  deckOptions: DeckOption[];
  opponentArchetypeOptions: string[];
  wasSuccessful: boolean;
};

const sessionKeys = {
  deckVersionId: "tcgtracker.matchLog.deckVersionId",
  opponentArchetype: "tcgtracker.matchLog.opponentArchetype",
  result: "tcgtracker.matchLog.result",
};

const toggleClass =
  "flex h-11 min-w-0 cursor-pointer items-center justify-center rounded-md bg-[#0B1020]/46 px-2 text-center text-sm font-medium text-[#F8FAFC] transition hover:bg-[#4F8CFF]/12 has-[:checked]:bg-[#4F8CFF]/24 has-[:checked]:shadow-[0_0_24px_rgba(79,140,255,0.12)] has-[:checked]:text-[#F8FAFC]";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButton} h-11`}
    >
      {pending ? "Saving..." : "Save and log another"}
    </button>
  );
}

export function MatchLogForm({
  action,
  deckOptions,
  opponentArchetypeOptions,
  wasSuccessful,
}: MatchLogFormProps) {
  const [deckVersionId, setDeckVersionId] = useState(() => {
    if (typeof window === "undefined") {
      return deckOptions[0]?.id ?? "";
    }

    const stored = sessionStorage.getItem(sessionKeys.deckVersionId);
    return stored && deckOptions.some((option) => option.id === stored)
      ? stored
      : deckOptions[0]?.id ?? "";
  });
  const [opponentArchetype, setOpponentArchetype] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.opponentArchetype) ?? "";
  });
  const [result, setResult] = useState<"win" | "loss">(() => {
    if (typeof window === "undefined") {
      return "win";
    }

    const stored = sessionStorage.getItem(sessionKeys.result);
    return stored === "loss" ? "loss" : "win";
  });

  function remember(key: string, value: string) {
    sessionStorage.setItem(key, value);
  }

  return (
    <form
      action={action}
      className="mt-5 w-full min-w-0 overflow-hidden rounded-md bg-[#11182C]/76 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-5"
    >
      <input type="hidden" name="format" value={LATEST_FORMAT} />
      <div className="grid min-w-0 gap-4">
        {wasSuccessful ? (
          <div className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            Match logged. Your previous selections are ready.
          </div>
        ) : null}

        <div className="rounded-md bg-[#4F8CFF]/12 p-3 shadow-[0_0_34px_rgba(79,140,255,0.08)] sm:p-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="deck_version_id"
              className={label}
            >
              Deck version for this match
            </label>
            <select
              id="deck_version_id"
              name="deck_version_id"
              required
              value={deckVersionId}
              onChange={(event) => {
                setDeckVersionId(event.target.value);
                remember(sessionKeys.deckVersionId, event.target.value);
              }}
              className={inputH11}
            >
              {deckOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                  {option.isActive ? " (active)" : ""} - {option.detail}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ArchetypePicker
          id="opponent_archetype"
          name="opponent_archetype"
          label="Opponent archetype"
          options={opponentArchetypeOptions}
          value={opponentArchetype}
          required
          autoFocus
          onValueChange={(nextValue) => {
            setOpponentArchetype(nextValue);
            remember(sessionKeys.opponentArchetype, nextValue);
          }}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className={label}>
            Result
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(["win", "loss"] as const).map((resultOption) => (
              <label
                key={resultOption}
                className={`${toggleClass} capitalize`}
              >
                <input
                  type="radio"
                  name="result"
                  value={resultOption}
                  checked={result === resultOption}
                  onChange={() => {
                    setResult(resultOption);
                    remember(sessionKeys.result, resultOption);
                  }}
                  className="sr-only"
                />
                {resultOption}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className={label}>
              Went first
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["true", "Yes"],
                ["false", "No"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={toggleClass}
                >
                  <input
                    type="radio"
                    name="went_first"
                    value={value}
                    defaultChecked={value === "true"}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className={label}>
              Event type
            </legend>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {(["casual", "testing", "tournament"] as const).map(
                (eventType) => (
                  <label
                    key={eventType}
                    className={`${toggleClass} text-xs capitalize sm:text-sm`}
                  >
                    <input
                      type="radio"
                      name="event_type"
                      value={eventType}
                      defaultChecked={eventType === "casual"}
                      className="sr-only"
                    />
                    {eventType}
                  </label>
                )
              )}
            </div>
          </fieldset>
        </div>

        <details className="group rounded-md bg-[#0B1020]/30 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#F8FAFC] marker:hidden">
            <span>Optional details</span>
            <span className="text-xs font-medium text-[#94A3B8] group-open:hidden">
              Variant, tags, notes
            </span>
            <span className="hidden text-xs font-medium text-[#94A3B8] group-open:inline">
              Hide
            </span>
          </summary>
          <div className="mt-4 grid gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="opponent_variant"
                className={label}
              >
                Opponent variant
              </label>
              <input
                id="opponent_variant"
                name="opponent_variant"
                placeholder="Optional detail"
                className={inputH11}
              />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className={label}>Tags</legend>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {MATCH_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className="cursor-pointer rounded-md bg-[#11182C]/76 px-2.5 py-2 text-xs font-medium text-[#F8FAFC] transition hover:bg-[#4F8CFF]/12 has-[:checked]:bg-[#4F8CFF]/24 has-[:checked]:text-[#F8FAFC] sm:text-sm"
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      className="sr-only"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <label htmlFor="notes" className={label}>
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Optional"
                className={`${textarea} min-h-16 transition-all focus:min-h-28`}
              />
            </div>

            <p className={sectionCopy}>
              Current Standard is stored automatically as {LATEST_FORMAT}.
            </p>
          </div>
        </details>

        <div className="grid gap-2 pt-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <SubmitButton />
          <a href="/matches" className={secondaryButton}>
            Match history
          </a>
        </div>
      </div>
    </form>
  );
}
