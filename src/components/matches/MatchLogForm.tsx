"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
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
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
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

  function remember(key: string, value: string) {
    sessionStorage.setItem(key, value);
  }

  return (
    <form
      action={action}
      className="mt-8 rounded-md border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-5">
        {wasSuccessful ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Match logged. Your deck, format, and opponent are ready for the next
            entry.
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="deck_version_id"
              className="text-sm font-medium text-zinc-800"
            >
              Deck version
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
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
            >
              {deckOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                  {option.isActive ? " (active)" : ""} - {option.detail}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-zinc-800">
              Result
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {(["win", "loss"] as const).map((result) => (
                <label
                  key={result}
                  className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium capitalize text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
                >
                  <input
                    type="radio"
                    name="result"
                    value={result}
                    defaultChecked={result === "win"}
                    className="sr-only"
                  />
                  {result}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="opponent_archetype"
              className="text-sm font-medium text-zinc-800"
            >
              Opponent archetype
            </label>
            <input
              id="opponent_archetype"
              name="opponent_archetype"
              list="opponent-archetypes"
              required
              value={opponentArchetype}
              onChange={(event) => {
                setOpponentArchetype(event.target.value);
                remember(sessionKeys.opponentArchetype, event.target.value);
              }}
              placeholder="Choose or type an archetype"
              className="h-11 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
            />
            <datalist id="opponent-archetypes">
              {opponentArchetypeOptions.map((archetype) => (
                <option key={archetype} value={archetype} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="opponent_variant"
              className="text-sm font-medium text-zinc-800"
            >
              Opponent variant
            </label>
            <input
              id="opponent_variant"
              name="opponent_variant"
              placeholder="Optional detail"
              className="h-11 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-zinc-800">
              Went first
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["true", "Yes"],
                ["false", "No"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
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
            <legend className="text-sm font-medium text-zinc-800">
              Event type
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {(["casual", "testing", "tournament"] as const).map(
                (eventType) => (
                  <label
                    key={eventType}
                    className="flex h-11 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-2 text-sm font-medium capitalize text-zinc-800 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
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

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex flex-col gap-2">
            <label htmlFor="format" className="text-sm font-medium text-zinc-800">
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
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-zinc-950 outline-none focus:border-zinc-950"
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
              className="text-sm font-medium text-zinc-800"
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
              className="h-11 rounded-md border border-zinc-300 px-3 text-zinc-950 outline-none focus:border-zinc-950"
            />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-zinc-800">Tags</legend>
          <div className="flex flex-wrap gap-2">
            {MATCH_TAGS.map((tag) => (
              <label
                key={tag}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
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
          <label htmlFor="notes" className="text-sm font-medium text-zinc-800">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional"
            className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950"
          />
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
