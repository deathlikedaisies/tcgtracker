"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bolt, CheckCircle2, ClipboardList, Target } from "lucide-react";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { SessionCoachPanel } from "@/components/SessionCoachPanel";
import {
  glassPanel,
  glassPanelStrong,
  inputH11,
  label,
  primaryButton,
  secondaryButton,
  textarea,
} from "@/components/brand-styles";
import { MATCH_TAGS } from "@/lib/match-options";
import {
  matchCountsTowardMission,
  matchCountsTowardMissionContext,
  type SessionCoachInsight,
} from "@/lib/session-coach";

type DeckOption = {
  id: string;
  label: string;
  detail: string;
  isActive: boolean;
  suggestedArchetype: string | null;
};

type MatchLogFormProps = {
  action: (formData: FormData) => void;
  deckOptions: DeckOption[];
  opponentArchetypeOptions: string[];
  recentOpponentArchetypes: string[];
  initialEventType?: string;
  initialOpponentArchetype?: string;
  initialResult?: string;
  initialWentFirst?: string;
  sessionCoach?: SessionCoachInsight | null;
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
  "flex h-12 w-full max-w-full min-w-0 cursor-pointer items-center justify-center rounded-md bg-[#07111F]/52 px-3 text-center text-sm font-semibold text-[#94A3B8] transition hover:bg-[#4F8CFF]/12 hover:text-[#F8FAFC] active:scale-[0.98] has-[:checked]:bg-[#4F8CFF]/22 has-[:checked]:shadow-[inset_0_0_0_1px_rgba(79,140,255,0.30),0_8px_22px_rgba(79,140,255,0.10)] has-[:checked]:text-[#F8FAFC]";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButton} h-11 w-full`}
    >
      {pending ? "Saving..." : "Save and log another"}
    </button>
  );
}

function StepLabel({
  index,
  title,
  helper,
}: {
  index: number;
  title: string;
  helper: string;
}) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4F8CFF] text-xs font-bold text-white shadow-[0_8px_18px_rgba(79,140,255,0.20)]">
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#F8FAFC]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#94A3B8]/72">{helper}</p>
      </div>
    </div>
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
  initialEventType,
  initialOpponentArchetype,
  initialResult,
  initialWentFirst,
  recentOpponentArchetypes,
  sessionCoach,
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
    if (initialOpponentArchetype?.trim()) {
      return initialOpponentArchetype.trim();
    }

    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.opponentArchetype) ?? "";
  });
  const [result, setResult] = useState<"win" | "loss">(() => {
    if (initialResult === "win" || initialResult === "loss") {
      return initialResult;
    }

    if (typeof window === "undefined") {
      return "win";
    }

    const stored = sessionStorage.getItem(sessionKeys.result);
    return stored === "loss" ? "loss" : "win";
  });
  const [wentFirst, setWentFirst] = useState<"true" | "false">(() => {
    if (initialWentFirst === "true" || initialWentFirst === "false") {
      return initialWentFirst;
    }

    if (sessionCoach?.missionSkill.toLowerCase().includes("going-second")) {
      return "false";
    }

    if (
      sessionCoach?.missionSkill.toLowerCase().includes("going first") ||
      sessionCoach?.missionSkill.toLowerCase().includes("going-first")
    ) {
      return "true";
    }

    if (typeof window === "undefined") {
      return "true";
    }

    const stored = sessionStorage.getItem(sessionKeys.wentFirst);
    return stored === "false" ? "false" : "true";
  });
  const [eventType, setEventType] = useState<
    "casual" | "testing" | "tournament"
  >(() => {
    if (
      initialEventType === "casual" ||
      initialEventType === "testing" ||
      initialEventType === "tournament"
    ) {
      return initialEventType;
    }

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
  const selectedDeckSuggestion = selectedDeck?.suggestedArchetype ?? null;
  const loggedOpponent = initialOpponentArchetype?.trim() ?? "";
  const loggedResult: "win" | "loss" = initialResult === "loss" ? "loss" : "win";
  const loggedMatch =
    sessionCoach && loggedOpponent
      ? {
          opponent_archetype: loggedOpponent,
          result: loggedResult,
          went_first:
            initialWentFirst === "true"
              ? true
              : initialWentFirst === "false"
                ? false
                : null,
          event_type: initialEventType ?? null,
          played_at: new Date().toISOString(),
        }
      : null;
  const countedTowardMission =
    wasSuccessful && loggedMatch
      ? matchCountsTowardMission(loggedMatch, sessionCoach ?? null)
      : false;
  const countedTowardContext =
    wasSuccessful && loggedMatch
      ? matchCountsTowardMissionContext(loggedMatch, sessionCoach ?? null)
      : false;

  useEffect(() => {
    if (initialOpponentArchetype?.trim()) {
      sessionStorage.setItem(
        sessionKeys.opponentArchetype,
        initialOpponentArchetype.trim()
      );
    }

    if (
      initialEventType === "casual" ||
      initialEventType === "testing" ||
      initialEventType === "tournament"
    ) {
      sessionStorage.setItem(sessionKeys.eventType, initialEventType);
    }

    if (initialResult === "win" || initialResult === "loss") {
      sessionStorage.setItem(sessionKeys.result, initialResult);
    }
  }, [initialEventType, initialOpponentArchetype, initialResult]);

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
    <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
    <form
      action={action}
      className={`w-full max-w-full min-w-0 overflow-x-hidden p-3 pb-28 sm:p-5 md:pb-5 ${glassPanelStrong}`}
    >
      <input type="hidden" name="deck_version_id" value={deckVersionId} />
      <div className="grid w-full max-w-full min-w-0 gap-4 overflow-x-hidden">
        {wasSuccessful ? (
          <div className="rounded-md bg-[#07111F]/46 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
            <div
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                countedTowardMission
                  ? "bg-emerald-500/10 text-emerald-200"
                  : "bg-[#F5C84C]/10 text-[#F5C84C]"
              }`}
            >
              {sessionCoach ? (
                <>
                  {countedTowardMission
                    ? countedTowardContext
                      ? "Counts toward mission and focus evidence."
                      : "Counts toward your current mission."
                    : "Logged outside the current mission focus."}{" "}
                  <span className="text-emerald-100">
                    {sessionCoach.missionProgress} / {sessionCoach.missionTargetCount} done.
                    {" "}
                    {countedTowardMission
                      ? sessionCoach.progressFeedback
                      : sessionCoach.missionContextSeenCount > 0
                        ? "Focus evidence is still separate."
                        : "Focus area not seen yet."}
                  </span>
                </>
              ) : (
                "Match logged. Ready for the next one."
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <Link href="/dashboard" className={secondaryButton}>
                Dashboard
              </Link>
              <Link href="/matchups" className={secondaryButton}>
                Matchups
              </Link>
              <Link href="/matches" className={secondaryButton}>
                Matches
              </Link>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 border-b border-white/6 pb-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <StepLabel index={1} title="Your deck" helper="Select the tested version." />
          <div className="max-w-full overflow-x-hidden rounded-md bg-[#07111F]/44 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase text-[#94A3B8]/72">
                Current deck
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <ArchetypeSprites
                  archetype={selectedDeckSuggestion ?? selectedDeckArchetype}
                  className="shrink-0"
                />
                <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                  {selectedDeck?.label ?? "Choose a deck version"}
                </p>
              </div>
              {selectedDeckSuggestion ? (
                <p className="mt-1 truncate text-xs font-medium text-[#B8D1FF]">
                  List reads as {selectedDeckSuggestion}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setIsChangingDeck((current) => !current)}
              className="shrink-0 rounded-md bg-[#4F8CFF]/10 px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/16 active:scale-[0.98]"
            >
              {isChangingDeck ? "Done" : "Change deck"}
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
        </div>

        <section className="grid gap-3 border-b border-white/6 pb-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <StepLabel index={2} title="Opponent matchup" helper="Who did you play against?" />
          <div className="max-w-full overflow-x-hidden rounded-md bg-[#07111F]/38 p-3 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:p-4">
            <ArchetypePicker
              id="opponent_archetype"
              name="opponent_archetype"
              label="Who did you play?"
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
                <div className="flex max-w-full flex-wrap gap-2 overflow-x-hidden pb-1">
                  {recentOpponentArchetypes.map((archetype) => (
                    <button
                      key={archetype}
                      type="button"
                      onClick={() => {
                        setOpponentArchetype(archetype);
                        remember(sessionKeys.opponentArchetype, archetype);
                      }}
                      className="inline-flex max-w-full items-center gap-2 rounded-md bg-[#11182C]/78 px-3 py-2 text-xs font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.045)] transition hover:bg-[#4F8CFF]/14 active:scale-[0.98]"
                    >
                      <ArchetypeSprites archetype={archetype} className="shrink-0" />
                      <span className="min-w-0 truncate">{archetype}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid min-w-0 gap-3 border-b border-white/6 pb-4 lg:grid-cols-[180px_minmax(0,1fr)]">
          <StepLabel index={3} title="Result and play order" helper="Record the key outcome." />
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className={label}>
              Did you win?
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
              Did you go first?
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
        </div>

        <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
          <StepLabel index={4} title="Session context" helper="Add only what helps review." />
          <fieldset className="max-w-full overflow-x-hidden rounded-md bg-[#07111F]/38 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
            <legend className="mb-2 text-xs font-medium uppercase text-[#94A3B8]/72">
              Game type
            </legend>
            <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
              {(["casual", "testing", "tournament"] as const).map(
                (eventTypeOption) => (
                  <label
                    key={eventTypeOption}
                    className={`${toggleClass} h-10 text-xs capitalize sm:text-sm`}
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
        </div>

        <details
          open={detailsOpen}
          onToggle={(event) => {
            setDetailsOpen(event.currentTarget.open);
          }}
          className="group max-w-full overflow-x-hidden rounded-md bg-[#07111F]/34 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.035)]"
        >
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-sm font-semibold text-[#F8FAFC] marker:hidden">
            <span>More details</span>
            <span className="text-xs font-medium text-[#94A3B8] group-open:hidden">
              Variant, tags, notes, import
            </span>
            <span className="hidden text-xs font-medium text-[#94A3B8] group-open:inline">
              Hide
            </span>
          </summary>
          <div className="mt-4 grid gap-4">
            <div className="max-w-full overflow-x-hidden rounded-md bg-[#11182C]/58 p-3">
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
                className="mt-3 max-w-full rounded-md bg-[#4F8CFF]/12 px-3 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/20 active:scale-[0.98]"
              >
                Use log
              </button>
              {importStatus ? (
                <p className="mt-2 text-xs font-medium text-[#94A3B8]">
                  {importStatus}
                </p>
              ) : null}
            </div>

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
          <a href="/matches" className={`w-full ${secondaryButton}`}>
            Match history
          </a>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 max-w-full overflow-x-hidden bg-[#0B1020]/92 px-4 py-3 shadow-[0_-18px_44px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(248,250,252,0.055)] backdrop-blur md:hidden">
        <div className="mx-auto w-full max-w-2xl">
          <SubmitButton />
        </div>
      </div>
    </form>
      <aside className="grid gap-3 xl:sticky xl:top-6">
        {sessionCoach ? (
          <SessionCoachPanel
            insight={sessionCoach}
            isPostSave={wasSuccessful}
            showCta={false}
          />
        ) : (
          <div className={`p-4 ${glassPanel}`}>
            <Target className="size-5 text-[#F5C84C]" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-semibold text-[#F8FAFC]">
              Active testing session
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
              Log a few games and PrizeMap will build a focused mission.
            </p>
          </div>
        )}
        <div className={`p-4 ${glassPanel}`}>
          <div className="flex items-center gap-2 text-[#F5C84C]">
            <Bolt className="size-4" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.1em]">
              Fast log flow
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              [ClipboardList, selectedDeck?.label ?? "Choose deck"],
              [Target, opponentArchetype || "Pick opponent"],
              [CheckCircle2, `${result === "win" ? "Win" : "Loss"} · ${wentFirst === "true" ? "First" : "Second"}`],
            ].map(([Icon, value]) => (
              <div key={value as string} className="flex min-w-0 items-center gap-3 rounded-md bg-[#07111F]/44 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <Icon className="size-4 shrink-0 text-[#4F8CFF]" aria-hidden="true" />
                <span className="truncate text-sm font-medium text-[#F8FAFC]">
                  {value as string}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
