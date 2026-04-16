"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  inputH11,
  label,
  primaryButton,
  textarea,
} from "@/components/brand-styles";
import { LATEST_FORMAT, MATCH_FORMATS } from "@/lib/formats";
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
  format: "tcgtracker.matchLog.format",
  customFormat: "tcgtracker.matchLog.customFormat",
  opponentArchetype: "tcgtracker.matchLog.opponentArchetype",
  result: "tcgtracker.matchLog.result",
};

const toggleClass =
  "flex h-11 cursor-pointer items-center justify-center rounded-md bg-[#0B1020]/46 px-3 text-sm font-medium text-[#F8FAFC] transition hover:bg-[#4F8CFF]/12 has-[:checked]:bg-[#4F8CFF]/24 has-[:checked]:shadow-[0_0_24px_rgba(79,140,255,0.12)] has-[:checked]:text-[#F8FAFC]";

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
  const [format, setFormat] = useState<string>(() => {
    if (typeof window === "undefined") {
      return LATEST_FORMAT;
    }

    const stored = sessionStorage.getItem(sessionKeys.format);
    return stored &&
      (MATCH_FORMATS.includes(stored as never) || stored === "custom")
      ? stored
      : LATEST_FORMAT;
  });
  const [customFormat, setCustomFormat] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.customFormat) ?? "";
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
      className="mt-6 rounded-md bg-[#11182C]/76 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(248,250,252,0.05)] sm:p-5"
    >
      <div className="grid gap-4">
        {wasSuccessful ? (
          <div className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            Match logged. Your previous selections are ready.
          </div>
        ) : null}

        <div className="rounded-md bg-[#4F8CFF]/12 p-4 shadow-[0_0_34px_rgba(79,140,255,0.08)]">
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

        <div className="grid gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="opponent_archetype"
              className={label}
            >
              Opponent archetype
            </label>
            <input
              id="opponent_archetype"
              name="opponent_archetype"
              list="opponent-archetypes"
              required
              autoFocus
              value={opponentArchetype}
              onChange={(event) => {
                setOpponentArchetype(event.target.value);
                remember(sessionKeys.opponentArchetype, event.target.value);
              }}
              placeholder="Choose or type an archetype"
              className={inputH11}
            />
            <datalist id="opponent-archetypes">
              {opponentArchetypeOptions.map((archetype) => (
                <option key={archetype} value={archetype} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="grid grid-cols-3 gap-2">
              {(["casual", "testing", "tournament"] as const).map(
                (eventType) => (
                  <label
                    key={eventType}
                    className={`${toggleClass} px-2 capitalize`}
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

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex flex-col gap-2">
            <label htmlFor="format" className={label}>
              Format
            </label>
            <select
              id="format"
              name="format"
              value={format}
              onChange={(event) => {
                setFormat(event.target.value);
                remember(sessionKeys.format, event.target.value);
              }}
              className={inputH11}
            >
              {MATCH_FORMATS.map((formatOption) => (
                <option key={formatOption} value={formatOption}>
                  {formatOption}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="format_custom"
              className={label}
            >
              Custom format
            </label>
            <input
              id="format_custom"
              name="format_custom"
              value={customFormat}
              onChange={(event) => {
                setCustomFormat(event.target.value);
                remember(sessionKeys.customFormat, event.target.value);
              }}
              placeholder="Optional"
              className={inputH11}
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className={label}>Tags</legend>
          <div className="flex flex-wrap gap-2">
            {MATCH_TAGS.map((tag) => (
              <label
                key={tag}
                className="cursor-pointer rounded-md bg-[#0B1020]/46 px-3 py-2 text-sm font-medium text-[#F8FAFC] transition hover:bg-[#4F8CFF]/12 has-[:checked]:bg-[#4F8CFF]/24 has-[:checked]:text-[#F8FAFC]"
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
            className={`${textarea} min-h-20 transition-all focus:min-h-28`}
          />
        </div>

        <div className="pt-1">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
