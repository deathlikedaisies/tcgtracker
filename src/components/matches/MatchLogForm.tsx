"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  inputH11,
  label,
  primaryButton,
  secondaryButton,
  textarea,
} from "@/components/brand-styles";
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
  recentOpponentArchetypes: string[];
  wasSuccessful: boolean;
};

const sessionKeys = {
  deckVersionId: "tcgtracker.matchLog.deckVersionId",
  opponentArchetype: "tcgtracker.matchLog.opponentArchetype",
  result: "tcgtracker.matchLog.result",
  wentFirst: "tcgtracker.matchLog.wentFirst",
  eventType: "tcgtracker.matchLog.eventType",
};

const toggleClass =
  "flex h-12 min-w-0 cursor-pointer items-center justify-center rounded-md bg-[#0B1020]/42 px-3 text-center text-sm font-semibold text-[#94A3B8] transition hover:bg-[#4F8CFF]/12 hover:text-[#F8FAFC] has-[:checked]:bg-[#4F8CFF]/24 has-[:checked]:shadow-[0_0_24px_rgba(79,140,255,0.12)] has-[:checked]:text-[#F8FAFC]";

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

function normalize(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function MatchLogForm({
  action,
  deckOptions,
  opponentArchetypeOptions,
  recentOpponentArchetypes,
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
  const [wentFirst, setWentFirst] = useState<"true" | "false">(() => {
    if (typeof window === "undefined") {
      return "true";
    }

    const stored = sessionStorage.getItem(sessionKeys.wentFirst);
    return stored === "false" ? "false" : "true";
  });
  const [eventType, setEventType] = useState<
    "casual" | "testing" | "tournament"
  >(() => {
    if (typeof window === "undefined") {
      return "testing";
    }

    const stored = sessionStorage.getItem(sessionKeys.eventType);
    return stored === "casual" || stored === "tournament"
      ? stored
      : "testing";
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [tcgLiveLog, setTcgLiveLog] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [isChangingDeck, setIsChangingDeck] = useState(false);
  const selectedDeck = deckOptions.find((option) => option.id === deckVersionId);
  const selectedDeckArchetype = selectedDeck?.detail ?? "";

  function remember(key: string, value: string) {
    sessionStorage.setItem(key, value);
  }

  function importTcgLiveLog() {
    const log = tcgLiveLog.trim();

    if (!log) {
      setImportStatus("Paste a TCG Live log first.");
      return;
    }

    setNotes(log);

    const normalizedLog = normalize(log);
    let detectedResult = "";

    if (
      /\b(you won|you win|won the game|victory)\b/.test(normalizedLog) &&
      !/\b(opponent won|opponent wins|you lost|defeat)\b/.test(normalizedLog)
    ) {
      setResult("win");
      remember(sessionKeys.result, "win");
      detectedResult = "Win";
    } else if (/\b(you lost|defeat|opponent won|opponent wins)\b/.test(normalizedLog)) {
      setResult("loss");
      remember(sessionKeys.result, "loss");
      detectedResult = "Loss";
    }

    const ownArchetype = normalize(selectedDeckArchetype);
    const inferredOpponent = opponentArchetypeOptions
      .filter((option) => normalize(option) !== ownArchetype)
      .sort((first, second) => second.length - first.length)
      .find((option) => normalizedLog.includes(normalize(option)));

    if (inferredOpponent) {
      setOpponentArchetype(inferredOpponent);
      remember(sessionKeys.opponentArchetype, inferredOpponent);
    }

    setTcgLiveLog("");
    setImportStatus(
      `Imported to notes.${
        detectedResult || inferredOpponent
          ? ` Detected: ${[detectedResult, inferredOpponent].filter(Boolean).join(" · ")}.`
          : " Opponent/result not detected."
      }`
    );
  }

  return (
    <form
      action={action}
      className="mt-5 w-full min-w-0 overflow-hidden rounded-md bg-[#11182C]/68 p-3 pb-28 shadow-[0_20px_60px_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(248,250,252,0.04)] sm:p-5 md:pb-5"
    >
      <input type="hidden" name="deck_version_id" value={deckVersionId} />
      <div className="grid min-w-0 gap-4">
        {wasSuccessful ? (
          <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
            Match logged. Ready for the next one.
          </div>
        ) : null}

        <div className="rounded-md bg-[#0B1020]/38 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                Using
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <ArchetypeSprites
                  archetype={selectedDeckArchetype}
                  className="shrink-0"
                />
                <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                  {selectedDeck?.label ?? "Choose a deck version"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsChangingDeck((current) => !current)}
              className="shrink-0 rounded-md bg-[#4F8CFF]/12 px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/18"
            >
              {isChangingDeck ? "Done" : "Change"}
            </button>
          </div>
          {isChangingDeck ? (
            <div className="mt-3 flex flex-col gap-2">
              <label htmlFor="deck_version_id_select" className={label}>
                Session deck
              </label>
              <select
                id="deck_version_id_select"
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
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md bg-[#0B1020]/28 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.035)]">
          <p className="truncate text-xs font-medium uppercase text-[#94A3B8]/72">
            Event
          </p>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#4F8CFF]/12 px-3 py-1.5 text-xs font-semibold capitalize text-[#F8FAFC] transition hover:bg-[#4F8CFF]/18"
          >
            {eventType}
            <span className="text-[#94A3B8]">Change</span>
          </button>
        </div>

        <section className="rounded-md bg-[#0B1020]/24 p-3 shadow-[0_14px_40px_rgba(0,0,0,0.14),inset_0_0_0_1px_rgba(79,140,255,0.08)] sm:p-4">
          <ArchetypePicker
            id="opponent_archetype"
            name="opponent_archetype"
            label="Opponent archetype"
            options={opponentArchetypeOptions}
            value={opponentArchetype}
            required
            autoFocus
            maxOptions={7}
            listMaxHeightClassName="max-h-48"
            onValueChange={(nextValue) => {
              setOpponentArchetype(nextValue);
              remember(sessionKeys.opponentArchetype, nextValue);
            }}
          />
          {recentOpponentArchetypes.length ? (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium uppercase text-[#94A3B8]/70">
                Recent opponents
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentOpponentArchetypes.map((archetype) => (
                  <button
                    key={archetype}
                    type="button"
                    onClick={() => {
                      setOpponentArchetype(archetype);
                      remember(sessionKeys.opponentArchetype, archetype);
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#11182C]/82 px-3 py-2 text-xs font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.05)] transition hover:bg-[#4F8CFF]/16"
                  >
                    <ArchetypeSprites archetype={archetype} className="shrink-0" />
                    {archetype}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
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
          <fieldset className="flex flex-col gap-2">
            <legend className={label}>
              Turn order
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["true", "First"],
                ["false", "Second"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={toggleClass}
                >
                  <input
                    type="radio"
                    name="went_first"
                    value={value}
                    checked={wentFirst === value}
                    onChange={() => {
                      setWentFirst(value as "true" | "false");
                      remember(sessionKeys.wentFirst, value);
                    }}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

        </div>

        <details
          open={detailsOpen}
          onToggle={(event) => {
            setDetailsOpen(event.currentTarget.open);
          }}
          className="group rounded-md bg-[#0B1020]/28 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.035)]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#F8FAFC] marker:hidden">
            <span>More details</span>
            <span className="text-xs font-medium text-[#94A3B8] group-open:hidden">
              Event, variant, tags, notes
            </span>
            <span className="hidden text-xs font-medium text-[#94A3B8] group-open:inline">
              Hide
            </span>
          </summary>
          <div className="mt-4 grid gap-4">
            <div className="rounded-md bg-[#11182C]/58 p-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="tcg_live_log" className={label}>
                  Import TCG Live log
                </label>
                <textarea
                  id="tcg_live_log"
                  value={tcgLiveLog}
                  onChange={(event) => setTcgLiveLog(event.target.value)}
                  rows={3}
                  placeholder="Paste a TCG Live battle log"
                  className={`${textarea} min-h-24`}
                />
              </div>
              <button
                type="button"
                onClick={importTcgLiveLog}
                className="mt-3 rounded-md bg-[#4F8CFF]/14 px-3 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/22"
              >
                Use log
              </button>
              {importStatus ? (
                <p className="mt-2 text-xs font-medium text-[#94A3B8]">
                  {importStatus}
                </p>
              ) : null}
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className={label}>
                Event type
              </legend>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(["casual", "testing", "tournament"] as const).map(
                  (eventTypeOption) => (
                    <label
                      key={eventTypeOption}
                      className={`${toggleClass} text-xs capitalize sm:text-sm`}
                    >
                      <input
                        type="radio"
                        name="event_type"
                        value={eventTypeOption}
                        checked={eventType === eventTypeOption}
                        onChange={() => {
                          setEventType(eventTypeOption);
                          remember(sessionKeys.eventType, eventTypeOption);
                        }}
                        className="sr-only"
                      />
                      {eventTypeOption}
                    </label>
                  )
                )}
              </div>
            </fieldset>

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
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                placeholder="Optional"
                className={`${textarea} min-h-16 transition-all focus:min-h-28`}
              />
            </div>
          </div>
        </details>

        <div className="grid gap-2 pt-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="hidden md:block">
            <SubmitButton />
          </div>
          <a href="/matches" className={secondaryButton}>
            Match history
          </a>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 bg-[#0B1020]/92 px-4 py-3 shadow-[0_-18px_44px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(248,250,252,0.06)] backdrop-blur md:hidden">
        <div className="mx-auto max-w-2xl">
          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
