"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { SessionCoachPanel } from "@/components/SessionCoachPanel";
import {
  glassPanelStrong,
  inputH11,
  label,
  primaryButton,
  secondaryButton,
  textarea,
} from "@/components/brand-styles";
import {
  MATCH_ISSUE_TAG_OPTIONS,
  MATCH_POSITIVE_TAG_OPTIONS,
} from "@/lib/match-options";
import {
  deriveInitialGameContext,
  getGameContextLabel,
  getMatchResultLabel,
  getQualityLabel,
  MATCH_GAME_CONTEXT_OPTIONS,
  MATCH_OPENING_HAND_OPTIONS,
  MATCH_SEQUENCING_OPTIONS,
  MATCH_START_QUALITY_OPTIONS,
  type MatchGameContext,
  type MatchMetadata,
  type MatchOpeningHandQuality,
  type MatchResult,
  type MatchSequencingQuality,
  type MatchStartQuality,
} from "@/lib/match-types";
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
  initialDeckVersionId?: string;
  initialEventType?: string;
  initialOpponentArchetype?: string;
  initialOpponentVariant?: string;
  initialResult?: string;
  initialWentFirst?: string;
  initialNotes?: string;
  initialTags?: string[];
  initialMetadata?: MatchMetadata | null;
  sessionCoach?: SessionCoachInsight | null;
  secondaryHref?: string;
  secondaryLabel?: string;
  submitLabel?: string;
  wasSuccessful: boolean;
};

type StepResultValue = MatchResult | "";
type StepWentFirstValue = "true" | "false" | "";

const sessionKeys = {
  deckVersionId: "tcgtracker.matchLog.deckVersionId",
  opponentArchetype: "tcgtracker.matchLog.opponentArchetype",
  result: "tcgtracker.matchLog.result",
  wentFirst: "tcgtracker.matchLog.wentFirst",
  gameContext: "tcgtracker.matchLog.gameContext",
  eventName: "tcgtracker.matchLog.eventName",
  roundNumber: "tcgtracker.matchLog.roundNumber",
  testingSessionName: "tcgtracker.matchLog.testingSessionName",
  focusMatchup: "tcgtracker.matchLog.focusMatchup",
  startQuality: "tcgtracker.matchLog.startQuality",
  openingHandQuality: "tcgtracker.matchLog.openingHandQuality",
  sequencingQuality: "tcgtracker.matchLog.sequencingQuality",
};

const subCardClass =
  "rounded-xl bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]";

const largeToggleClass =
  "flex min-h-14 w-full min-w-0 items-center justify-center rounded-xl bg-[#07111F]/58 px-3 text-center text-base font-semibold text-[#D7E0EF] transition hover:bg-[#4F8CFF]/14 hover:text-[#F8FAFC] active:scale-[0.98]";

const mediumToggleClass =
  "flex min-h-12 w-full min-w-0 items-center justify-center rounded-lg bg-[#07111F]/56 px-3 text-center text-sm font-semibold text-[#B9C4D6] transition hover:bg-[#4F8CFF]/12 hover:text-[#F8FAFC] active:scale-[0.98]";

const tagToggleClass =
  "inline-flex min-h-11 w-full min-w-0 items-center justify-start rounded-lg bg-[#07111F]/52 px-3 py-2 text-left text-sm font-semibold text-[#A8B5C8] transition hover:bg-[#4F8CFF]/10 hover:text-[#F8FAFC] active:scale-[0.98]";

const selectedToggleClass =
  "bg-[#4F8CFF]/22 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.32),0_10px_24px_rgba(79,140,255,0.08)]";

const progressStepClass =
  "flex items-center gap-3 rounded-xl px-3 py-3 text-left transition";

const stepOrder = [
  { label: "Match", shortLabel: "1" },
  { label: "Turn order", shortLabel: "2" },
  { label: "Result", shortLabel: "3" },
  { label: "Game quality", shortLabel: "4" },
  { label: "What mattered?", shortLabel: "5" },
  { label: "More context", shortLabel: "6" },
] as const;

const QUICK_ISSUE_TAG_OPTIONS = [
  "missed setup",
  "poor prize trade",
  "bad sequencing",
  "supporter drought",
  "energy issue",
  "bench pressure",
] as const satisfies readonly string[];

const QUICK_POSITIVE_TAG_OPTIONS = [
  "strong setup",
  "good prize plan",
  "clean sequencing",
  "key tech mattered",
  "strong recovery",
  "favorable matchup",
] as const satisfies readonly string[];

const EXTRA_ISSUE_TAG_OPTIONS: string[] = MATCH_ISSUE_TAG_OPTIONS.filter(
  (tag) => !QUICK_ISSUE_TAG_OPTIONS.includes(tag as (typeof QUICK_ISSUE_TAG_OPTIONS)[number])
);

const EXTRA_POSITIVE_TAG_OPTIONS: string[] = MATCH_POSITIVE_TAG_OPTIONS.filter(
  (tag) =>
    !QUICK_POSITIVE_TAG_OPTIONS.includes(
      tag as (typeof QUICK_POSITIVE_TAG_OPTIONS)[number]
    )
);

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButton} h-12 w-full text-base`}
    >
      {pending ? "Saving..." : label}
    </button>
  );
}

function normalize(value: string) {
  return value
    .trim()
    .replace(/[\u2018\u2019'`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function cleanChipValue(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function toggleSelection(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

function mapLegacyTagsToIssueTags(tags: string[]) {
  return Array.from(
    new Set(
      tags.flatMap((tag) => {
        if (tag === "setup issue") {
          return ["missed setup"];
        }

        if (tag === "prize plan") {
          return ["poor prize trade"];
        }

        if (tag === "sequencing") {
          return ["bad sequencing"];
        }

        if (tag === "dead draw") {
          return ["supporter drought"];
        }

        if (tag === "bad matchup") {
          return ["matchup knowledge"];
        }

        if (tag === "misplay") {
          return ["misplay"];
        }

        return [];
      })
    )
  );
}

function ChipInput({
  labelText,
  values,
  onChange,
  placeholder,
  fieldName,
}: {
  labelText: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  fieldName: string;
}) {
  const [draft, setDraft] = useState("");

  function addDraftValue() {
    const nextValue = cleanChipValue(draft);

    if (!nextValue || values.includes(nextValue)) {
      setDraft("");
      return;
    }

    onChange([...values, nextValue]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={label}>{labelText}</label>
      <div className="rounded-lg bg-[#11182C]/58 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onChange(values.filter((candidate) => candidate !== value))
              }
              className="inline-flex items-center gap-2 rounded-md bg-[#4F8CFF]/18 px-2.5 py-1.5 text-xs font-semibold text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.28)]"
            >
              {value}
              <span aria-hidden="true">x</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addDraftValue();
              }
            }}
            onBlur={() => {
              if (draft.trim()) {
                addDraftValue();
              }
            }}
            placeholder={placeholder}
            className={inputH11}
          />
          <button
            type="button"
            onClick={addDraftValue}
            className="rounded-md bg-[#4F8CFF]/12 px-3 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/18 active:scale-[0.98]"
          >
            Add
          </button>
        </div>
        {values.map((value) => (
          <input key={value} type="hidden" name={fieldName} value={value} />
        ))}
      </div>
    </div>
  );
}

export function MatchLogForm({
  action,
  deckOptions,
  opponentArchetypeOptions,
  initialDeckVersionId,
  initialEventType,
  initialOpponentArchetype,
  initialOpponentVariant,
  initialResult,
  initialWentFirst,
  initialNotes,
  initialTags = [],
  initialMetadata,
  sessionCoach,
  secondaryHref = "/matches",
  secondaryLabel = "Match history",
  submitLabel = "Save game",
  wasSuccessful,
}: MatchLogFormProps) {
  const metadata = initialMetadata ?? {};
  const [deckVersionId, setDeckVersionId] = useState(() => {
    if (initialDeckVersionId?.trim()) {
      return initialDeckVersionId;
    }

    if (typeof window === "undefined") {
      return deckOptions[0]?.id ?? "";
    }

    const stored = sessionStorage.getItem(sessionKeys.deckVersionId);
    return stored && deckOptions.some((option) => option.id === stored)
      ? stored
      : deckOptions[0]?.id ?? "";
  });
  const [gameContext, setGameContext] = useState<MatchGameContext>(() => {
    const initialContext = deriveInitialGameContext(
      metadata,
      initialEventType ?? null
    );

    if (metadata.game_context || initialEventType || initialDeckVersionId) {
      return initialContext;
    }

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(sessionKeys.gameContext);

      if (
        stored === MATCH_GAME_CONTEXT_OPTIONS[0] ||
        stored === MATCH_GAME_CONTEXT_OPTIONS[1]
      ) {
        return stored;
      }
    }

    return initialContext;
  });
  const [eventName, setEventName] = useState(() => {
    if (metadata.event_name) {
      return metadata.event_name;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.eventName) ?? "";
  });
  const [roundNumber, setRoundNumber] = useState(() => {
    if (metadata.round_number) {
      return metadata.round_number;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.roundNumber) ?? "";
  });
  const [testingSessionName, setTestingSessionName] = useState(() => {
    if (metadata.testing_session_name) {
      return metadata.testing_session_name;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.testingSessionName) ?? "";
  });
  const [focusMatchup, setFocusMatchup] = useState(() => {
    if (metadata.focus_matchup) {
      return metadata.focus_matchup;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.focusMatchup) ?? "";
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
  const [opponentVariant, setOpponentVariant] = useState(
    initialOpponentVariant ?? ""
  );
  const [result, setResult] = useState<StepResultValue>(() => {
    if (
      initialResult === "win" ||
      initialResult === "loss" ||
      initialResult === "tie"
    ) {
      return initialResult;
    }

    const stored = sessionStorage.getItem(sessionKeys.result);
    return stored === "win" || stored === "loss" || stored === "tie"
      ? stored
      : "";
  });
  const [wentFirst, setWentFirst] = useState<StepWentFirstValue>(() => {
    if (initialWentFirst === "true" || initialWentFirst === "false") {
      return initialWentFirst;
    }

    const stored = sessionStorage.getItem(sessionKeys.wentFirst);
    return stored === "true" || stored === "false" ? stored : "";
  });
  const [startQuality, setStartQuality] = useState<
    MatchStartQuality | undefined
  >(() => {
    if (metadata.start_quality) {
      return metadata.start_quality;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    const stored = sessionStorage.getItem(sessionKeys.startQuality);
    return MATCH_START_QUALITY_OPTIONS.includes(stored as MatchStartQuality)
      ? (stored as MatchStartQuality)
      : undefined;
  });
  const [openingHandQuality, setOpeningHandQuality] = useState<
    MatchOpeningHandQuality | undefined
  >(() => {
    if (metadata.opening_hand_quality) {
      return metadata.opening_hand_quality;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    const stored = sessionStorage.getItem(sessionKeys.openingHandQuality);
    return MATCH_OPENING_HAND_OPTIONS.includes(
      stored as MatchOpeningHandQuality
    )
      ? (stored as MatchOpeningHandQuality)
      : undefined;
  });
  const [sequencingQuality, setSequencingQuality] = useState<
    MatchSequencingQuality | undefined
  >(() => {
    if (metadata.sequencing_quality) {
      return metadata.sequencing_quality;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    const stored = sessionStorage.getItem(sessionKeys.sequencingQuality);
    return MATCH_SEQUENCING_OPTIONS.includes(
      stored as MatchSequencingQuality
    )
      ? (stored as MatchSequencingQuality)
      : undefined;
  });
  const [issueTags, setIssueTags] = useState<string[]>(
    metadata.issue_tags ?? mapLegacyTagsToIssueTags(initialTags)
  );
  const [positiveTags, setPositiveTags] = useState<string[]>(
    metadata.positive_tags ?? []
  );
  const [cardsShined, setCardsShined] = useState<string[]>(
    metadata.cards_shined ?? []
  );
  const [cardsFailed, setCardsFailed] = useState<string[]>(
    metadata.cards_failed ?? []
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [tcgLiveLog, setTcgLiveLog] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [isChangingDeck, setIsChangingDeck] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [moreIssueTagsOpen, setMoreIssueTagsOpen] = useState(() =>
    (metadata.issue_tags ?? mapLegacyTagsToIssueTags(initialTags)).some((tag) =>
      EXTRA_ISSUE_TAG_OPTIONS.includes(tag)
    ) ||
    (metadata.positive_tags ?? []).some((tag) =>
      EXTRA_POSITIVE_TAG_OPTIONS.includes(tag)
    )
  );
  const [showSecondaryTags, setShowSecondaryTags] = useState(() =>
    Boolean(metadata.positive_tags?.length || metadata.issue_tags?.length)
  );
  const selectedDeck = deckOptions.find((option) => option.id === deckVersionId);
  const selectedDeckArchetype = selectedDeck?.detail ?? "";
  const selectedDeckSuggestion = selectedDeck?.suggestedArchetype ?? null;
  const loggedOpponent = initialOpponentArchetype?.trim() ?? "";
  const loggedResult: MatchResult =
    initialResult === "loss" || initialResult === "tie" ? initialResult : "win";
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
    sessionStorage.setItem(sessionKeys.deckVersionId, deckVersionId);
  }, [deckVersionId]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.opponentArchetype, opponentArchetype);
  }, [opponentArchetype]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.result, result);
  }, [result]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.wentFirst, wentFirst);
  }, [wentFirst]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.gameContext, gameContext);
  }, [gameContext]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.eventName, eventName);
  }, [eventName]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.roundNumber, roundNumber);
  }, [roundNumber]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.testingSessionName, testingSessionName);
  }, [testingSessionName]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.focusMatchup, focusMatchup);
  }, [focusMatchup]);

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.startQuality, startQuality ?? "");
  }, [startQuality]);

  useEffect(() => {
    sessionStorage.setItem(
      sessionKeys.openingHandQuality,
      openingHandQuality ?? ""
    );
  }, [openingHandQuality]);

  useEffect(() => {
    sessionStorage.setItem(
      sessionKeys.sequencingQuality,
      sequencingQuality ?? ""
    );
  }, [sequencingQuality]);

  const readySummary = useMemo(() => {
    const parts: string[] = [];
    const deckLabel =
      selectedDeck?.label ?? selectedDeckSuggestion ?? selectedDeckArchetype;

    if (deckLabel && opponentArchetype) {
      parts.push(`${deckLabel} vs ${opponentArchetype}`);
    } else if (deckLabel) {
      parts.push(deckLabel);
    } else if (opponentArchetype) {
      parts.push(opponentArchetype);
    }

    if (result) {
      parts.push(getMatchResultLabel(result));
    }
    if (wentFirst) {
      parts.push(wentFirst === "true" ? "Went first" : "Went second");
    }

    const highlightTags = [...issueTags, ...positiveTags].slice(0, 3);
    if (highlightTags.length) {
      parts.push(highlightTags.join(", "));
    } else {
      const qualityHighlights = [
        sequencingQuality
          ? `${getQualityLabel(sequencingQuality)} sequencing`
          : null,
        openingHandQuality
          ? `${getQualityLabel(openingHandQuality)} opening hand`
          : null,
        startQuality ? `${getQualityLabel(startQuality)} start` : null,
      ].filter(Boolean);

      if (qualityHighlights.length) {
        parts.push(qualityHighlights.slice(0, 2).join(", "));
      }
    }

    return parts.filter(Boolean).join(" | ");
  }, [
    issueTags,
    openingHandQuality,
    opponentArchetype,
    positiveTags,
    result,
    selectedDeck,
    selectedDeckArchetype,
    selectedDeckSuggestion,
    sequencingQuality,
    startQuality,
    wentFirst,
  ]);

  const primaryTagTitle =
    result === "win"
      ? "What won you the game?"
      : result === "tie"
        ? "What defined the game?"
        : "What cost you the game?";
  const primaryTagHint =
    result === "win"
      ? "Lock the clearest edge first."
      : result === "tie"
        ? "Mark the biggest swings before you add detail."
        : "Mark the clearest leak before you queue again.";
  const secondaryTagTitle = "Anything else matter?";
  const secondaryTagHint =
    result === "win"
      ? "Add any leak that still shaped the game."
      : result === "tie"
        ? "If something still stood out, tag it here."
        : "Add any upside that still mattered.";
  const primaryTags = result === "win" ? positiveTags : issueTags;
  const setPrimaryTags = result === "win" ? setPositiveTags : setIssueTags;
  const primaryTagOptions =
    result === "win" ? QUICK_POSITIVE_TAG_OPTIONS : QUICK_ISSUE_TAG_OPTIONS;
  const primaryExtraTagOptions =
    result === "win" ? EXTRA_POSITIVE_TAG_OPTIONS : EXTRA_ISSUE_TAG_OPTIONS;
  const secondaryTags = result === "win" ? issueTags : positiveTags;
  const setSecondaryTags = result === "win" ? setIssueTags : setPositiveTags;
  const secondaryTagOptions =
    result === "win" ? MATCH_ISSUE_TAG_OPTIONS : MATCH_POSITIVE_TAG_OPTIONS;
  const postSaveSummary = readySummary || "Your match log is ready for review.";
  const postSaveMissionProgress = sessionCoach
    ? Math.min(
        sessionCoach.progressCompleted + (countedTowardMission ? 1 : 0),
        sessionCoach.progressGoal
      )
    : null;
  const postSaveFocusProgress = sessionCoach
    ? Math.min(
        sessionCoach.missionContextSeenCount + (countedTowardContext ? 1 : 0),
        sessionCoach.missionContextTargetCount
      )
    : null;
  const postSaveSignalLine =
    sessionCoach && postSaveMissionProgress !== null
      ? `${sessionCoach.missionTitle}: ${postSaveMissionProgress}/${sessionCoach.progressGoal} games logged.${
          countedTowardContext && postSaveFocusProgress !== null
            ? ` ${sessionCoach.missionContextLabel}: ${postSaveFocusProgress}/${sessionCoach.missionContextTargetCount}.`
            : ""
        }`
      : null;

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
      detectedResult = "Win";
    } else if (
      /\b(you lost|defeat|opponent won|opponent wins)\b/.test(normalizedLog)
    ) {
      setResult("loss");
      detectedResult = "Loss";
    }

    const ownArchetype = normalize(selectedDeckArchetype);
    const inferredOpponent = opponentArchetypeOptions
      .filter((option) => normalize(option) !== ownArchetype)
      .sort((first, second) => second.length - first.length)
      .find((option) => normalizedLog.includes(normalize(option)));

    if (inferredOpponent) {
      setOpponentArchetype(inferredOpponent);
    }

    setTcgLiveLog("");
    setCurrentStep(5);
    setImportStatus(
      `Imported to one learning.${
        detectedResult || inferredOpponent
          ? ` Detected: ${[detectedResult, inferredOpponent]
              .filter(Boolean)
              .join(" | ")}.`
          : " Opponent/result not detected."
      }`
    );
  }

  const progressPercent = ((currentStep + 1) / stepOrder.length) * 100;
  const secondaryToggleLabel =
    result === "win"
      ? "Add issues too"
      : result === "tie"
        ? "Show both sides"
        : "Add positives too";
  const canAdvanceFromMatch = Boolean(opponentArchetype.trim());
  const canAdvanceFromTurnOrder = wentFirst === "true" || wentFirst === "false";
  const canAdvanceFromResult = result === "win" || result === "loss" || result === "tie";
  const blockedNextMessage =
    currentStep === 0 && !canAdvanceFromMatch
      ? "Choose an opponent deck to continue."
      : currentStep === 1 && !canAdvanceFromTurnOrder
        ? "Choose whether you went first or second."
        : currentStep === 2 && !canAdvanceFromResult
          ? "Choose win, loss, or tie."
          : null;
  const desktopSummary = (
    <div className="rounded-xl bg-[#0B1020]/52 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
        Live summary
      </p>
      <p className="mt-3 text-sm font-medium leading-6 text-[#F8FAFC]">
        {readySummary ||
          "Choose a matchup, result, and turn order to start the quick log."}
      </p>
      <div className="mt-4 grid gap-2 text-xs text-[#94A3B8]">
        <p>Result: {result ? getMatchResultLabel(result) : "Not set"}</p>
        <p>
          Turn order:{" "}
          {wentFirst ? (wentFirst === "true" ? "First" : "Second") : "Not set"}
        </p>
        <p>
          Tags:{" "}
          {[...issueTags, ...positiveTags].length
            ? [...issueTags, ...positiveTags].slice(0, 4).join(", ")
            : "No tags yet"}
        </p>
      </div>
      <p className="mt-4 text-sm text-[#94A3B8]/76">
        This will update your matchup trends.
      </p>
      <Link href={secondaryHref} className={`mt-4 block w-full ${secondaryButton}`}>
        {secondaryLabel}
      </Link>
    </div>
  );

  return (
    <div className="mt-5 grid gap-4">
      {sessionCoach ? (
        <SessionCoachPanel
          insight={sessionCoach}
          isPostSave={wasSuccessful}
          showCta={false}
        />
      ) : null}

      <form
        action={action}
        className={`w-full max-w-full min-w-0 overflow-x-hidden p-3 sm:p-5 ${glassPanelStrong}`}
      >
        <input type="hidden" name="deck_version_id" value={deckVersionId} />
        <input
          type="hidden"
          name="opponent_archetype"
          value={opponentArchetype}
        />
        <input type="hidden" name="game_context" value={gameContext} />
        <input type="hidden" name="result" value={result} />
        <input type="hidden" name="went_first" value={wentFirst} />
        {startQuality ? (
          <input type="hidden" name="start_quality" value={startQuality} />
        ) : null}
        {openingHandQuality ? (
          <input
            type="hidden"
            name="opening_hand_quality"
            value={openingHandQuality}
          />
        ) : null}
        {sequencingQuality ? (
          <input
            type="hidden"
            name="sequencing_quality"
            value={sequencingQuality}
          />
        ) : null}
        {issueTags.map((tag) => (
          <input key={`issue-${tag}`} type="hidden" name="issue_tags" value={tag} />
        ))}
        {positiveTags.map((tag) => (
          <input
            key={`positive-${tag}`}
            type="hidden"
            name="positive_tags"
            value={tag}
          />
        ))}

        <div className="grid gap-4">
          {wasSuccessful ? (
            <div className="rounded-xl bg-[#07111F]/46 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#22C55E]">
                Game logged
              </p>
              <p className="mt-2 text-base font-semibold text-[#F8FAFC]">
                {postSaveSummary}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#B9C4D6]">
                This added a structured game to your matchup, turn-order, opening-hand, and sequencing patterns.
              </p>
              {postSaveSignalLine ? (
                <p className="mt-3 rounded-lg bg-[#4F8CFF]/10 px-3 py-2 text-sm font-medium text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16)]">
                  {postSaveSignalLine}
                </p>
              ) : null}
              <p
                className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  countedTowardMission
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-[#F5C84C]/10 text-[#FFE28A]"
                }`}
              >
                {sessionCoach
                  ? countedTowardMission
                    ? countedTowardContext
                      ? "This one strengthens both your current mission and the focus sample."
                      : "This one strengthens your current testing mission."
                    : "This game still helps your broader testing record."
                  : "One more data point for your testing loop."}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Link href="/matches/new" className={secondaryButton}>
                  Log another game
                </Link>
                <Link href="/matchups" className={secondaryButton}>
                  Review matchup
                </Link>
                <Link href="/dashboard" className={secondaryButton}>
                  Dashboard
                </Link>
              </div>
            </div>
          ) : null}

          {!wasSuccessful ? (
            <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
              <aside className="hidden xl:block">
                <div className="rounded-xl bg-[#07111F]/36 p-4 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                    Quick log
                  </p>
                  <div className="mt-4 grid gap-2">
                    {stepOrder.map((step, index) => {
                      const isCurrent = index === currentStep;
                      const isDone = index < currentStep;

                      return (
                        <button
                          key={step.label}
                          type="button"
                          onClick={() => {
                            if (index <= currentStep || index === 0) {
                              setCurrentStep(index);
                            }
                          }}
                          className={`${progressStepClass} ${
                            isCurrent
                              ? "bg-[#4F8CFF]/16 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]"
                              : isDone
                                ? "bg-[#07111F]/48 text-[#DCE8FF]"
                                : "bg-[#07111F]/18 text-[#94A3B8]"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              isCurrent
                                ? "bg-[#4F8CFF]/24 text-[#F8FAFC]"
                                : isDone
                                  ? "bg-[#22C55E]/20 text-[#DCFCE7]"
                                  : "bg-[#1A2238] text-[#94A3B8]"
                            }`}
                          >
                            {step.shortLabel}
                          </span>
                          <span className="text-sm font-semibold">{step.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>

              <section className="rounded-xl bg-[#07111F]/36 p-4 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:p-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                      Step {currentStep + 1} of {stepOrder.length}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {stepOrder[currentStep]?.label}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-[#07111F]/70">
                    <div
                      className="h-2 rounded-full bg-[#4F8CFF] transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#0B1020]/52 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  {currentStep === 0 ? (
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Match
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                          Who did you play against?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Pick the matchup first. Everything else follows from that.
                        </p>
                      </div>

                      <div className={subCardClass}>
                        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#94A3B8]/72">
                              Your deck
                            </p>
                            <div className="mt-2 flex min-w-0 items-center gap-2">
                              <ArchetypeSprites
                                archetype={selectedDeckSuggestion ?? selectedDeckArchetype}
                                className="shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                                  {selectedDeck?.label ?? "Choose a deck version"}
                                </p>
                                {selectedDeckSuggestion ? (
                                  <p className="truncate text-xs text-[#B8D1FF]">
                                    Reads as {selectedDeckSuggestion}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsChangingDeck((current) => !current)}
                            className="rounded-md bg-[#4F8CFF]/10 px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/16 active:scale-[0.98]"
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
                              onChange={(event) =>
                                setDeckVersionId(event.target.value)
                              }
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

                      <div className={subCardClass}>
                        <ArchetypePicker
                          id="opponent_archetype"
                          name="opponent_archetype_step"
                          label="Opponent deck"
                          options={opponentArchetypeOptions}
                          value={opponentArchetype}
                          required
                          autoFocus
                          maxOptions={7}
                          listMaxHeightClassName="max-h-48"
                          onValueChange={setOpponentArchetype}
                        />
                        {opponentArchetype ? (
                          <p className="mt-2 text-xs font-medium text-[#B8D1FF]">
                            Selected matchup: {opponentArchetype}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Turn order
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                          Did you go first or second?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          This helps SixPrizer separate matchup issues from turn-order issues.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["true", "First"],
                          ["false", "Second"],
                        ].map(([value, turnLabel]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setWentFirst(value as StepWentFirstValue)
                            }
                            className={`${largeToggleClass} ${
                              wentFirst === value ? selectedToggleClass : ""
                            }`}
                          >
                            {turnLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 2 ? (
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Result
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                          What was the result?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Log the outcome before you think about why it happened.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(["win", "loss", "tie"] as const).map((resultOption) => (
                          <button
                            key={resultOption}
                            type="button"
                            onClick={() => setResult(resultOption)}
                            className={`${largeToggleClass} ${
                              result === resultOption ? selectedToggleClass : ""
                            }`}
                          >
                            {getMatchResultLabel(resultOption)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 3 ? (
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Game quality
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                          How did the game feel?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Capture the quick quality read while the game is still fresh.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <fieldset className={subCardClass}>
                          <legend className={label}>Start</legend>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {MATCH_START_QUALITY_OPTIONS.map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setStartQuality(
                                    startQuality === value ? undefined : value
                                  )
                                }
                                className={`${mediumToggleClass} ${
                                  startQuality === value ? selectedToggleClass : ""
                                }`}
                              >
                                {getQualityLabel(value)}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <fieldset className={subCardClass}>
                          <legend className={label}>Opening hand</legend>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {MATCH_OPENING_HAND_OPTIONS.map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setOpeningHandQuality(
                                    openingHandQuality === value
                                      ? undefined
                                      : value
                                  )
                                }
                                className={`${mediumToggleClass} ${
                                  openingHandQuality === value
                                    ? selectedToggleClass
                                    : ""
                                }`}
                              >
                                {getQualityLabel(value)}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <fieldset className={subCardClass}>
                          <legend className={label}>Sequencing</legend>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {MATCH_SEQUENCING_OPTIONS.map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setSequencingQuality(
                                    sequencingQuality === value
                                      ? undefined
                                      : value
                                  )
                                }
                                className={`${mediumToggleClass} ${
                                  sequencingQuality === value
                                    ? selectedToggleClass
                                    : ""
                                }`}
                              >
                                {getQualityLabel(value)}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 4 ? (
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          What mattered?
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                          {primaryTagTitle}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          {primaryTagHint}
                        </p>
                      </div>
                      <fieldset className={subCardClass}>
                        <legend className={label}>{primaryTagTitle}</legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {primaryTagOptions.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setPrimaryTags(toggleSelection(primaryTags, tag))
                              }
                              className={`${tagToggleClass} ${
                                primaryTags.includes(tag) ? selectedToggleClass : ""
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        {primaryExtraTagOptions.length ? (
                          <button
                            type="button"
                            onClick={() =>
                              setMoreIssueTagsOpen((current) => !current)
                            }
                            className="mt-3 rounded-md bg-[#4F8CFF]/10 px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/16"
                          >
                            {moreIssueTagsOpen ? "Show fewer tags" : "More tags"}
                          </button>
                        ) : null}
                        {moreIssueTagsOpen && primaryExtraTagOptions.length ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {primaryExtraTagOptions.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() =>
                                  setPrimaryTags(toggleSelection(primaryTags, tag))
                                }
                                className={`${tagToggleClass} ${
                                  primaryTags.includes(tag)
                                    ? selectedToggleClass
                                    : ""
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </fieldset>
                      <div className={subCardClass}>
                        <button
                          type="button"
                          onClick={() =>
                            setShowSecondaryTags((current) => !current)
                          }
                          className="rounded-md bg-[#07111F]/56 px-3 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#1A2238]/60"
                        >
                          {secondaryToggleLabel}
                        </button>
                        {showSecondaryTags ? (
                          <div className="mt-3">
                            <p className="text-sm font-semibold text-[#F8FAFC]">
                              {secondaryTagTitle}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#94A3B8]/68">
                              {secondaryTagHint}
                            </p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              {secondaryTagOptions.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() =>
                                    setSecondaryTags(
                                      toggleSelection(secondaryTags, tag)
                                    )
                                  }
                                  className={`${tagToggleClass} ${
                                    secondaryTags.includes(tag)
                                      ? selectedToggleClass
                                      : ""
                                  }`}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 5 ? (
                    <div className="grid gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          More context
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                          Anything worth remembering?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Add context only if it helps future review. You can skip and save.
                        </p>
                      </div>

                      <div className={subCardClass}>
                        <p className="text-sm font-semibold text-[#F8FAFC]">
                          Game context
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {MATCH_GAME_CONTEXT_OPTIONS.map((contextOption) => (
                            <button
                              key={contextOption}
                              type="button"
                              onClick={() => setGameContext(contextOption)}
                              className={`${mediumToggleClass} ${
                                gameContext === contextOption
                                  ? selectedToggleClass
                                  : ""
                              }`}
                            >
                              {getGameContextLabel(contextOption)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {gameContext === "competitive" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className={subCardClass}>
                            <label htmlFor="event_name" className={label}>
                              Event name
                            </label>
                            <input
                              id="event_name"
                              name="event_name"
                              value={eventName}
                              onChange={(event) => setEventName(event.target.value)}
                              placeholder="Optional"
                              className={`${inputH11} mt-2`}
                            />
                          </div>
                          <div className={subCardClass}>
                            <label htmlFor="round_number" className={label}>
                              Round number
                            </label>
                            <input
                              id="round_number"
                              name="round_number"
                              value={roundNumber}
                              onChange={(event) => setRoundNumber(event.target.value)}
                              placeholder="Optional"
                              className={`${inputH11} mt-2`}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className={subCardClass}>
                            <label
                              htmlFor="testing_session_name"
                              className={label}
                            >
                              Testing session name
                            </label>
                            <input
                              id="testing_session_name"
                              name="testing_session_name"
                              value={testingSessionName}
                              onChange={(event) =>
                                setTestingSessionName(event.target.value)
                              }
                              placeholder="Optional"
                              className={`${inputH11} mt-2`}
                            />
                          </div>
                          <div className={subCardClass}>
                            <ArchetypePicker
                              id="focus_matchup"
                              name="focus_matchup"
                              label="Focus matchup"
                              options={opponentArchetypeOptions}
                              value={focusMatchup}
                              placeholder="Optional"
                              maxOptions={5}
                              listMaxHeightClassName="max-h-40"
                              onValueChange={setFocusMatchup}
                            />
                          </div>
                        </div>
                      )}

                      <div className={subCardClass}>
                        <label htmlFor="opponent_variant" className={label}>
                          Opponent variant
                        </label>
                        <input
                          id="opponent_variant"
                          name="opponent_variant"
                          value={opponentVariant}
                          onChange={(event) => setOpponentVariant(event.target.value)}
                          placeholder="Optional detail"
                          className={`${inputH11} mt-2`}
                        />
                      </div>

                      <div className={subCardClass}>
                        <p className="text-sm font-semibold text-[#F8FAFC]">
                          Cards that stood out
                        </p>
                        <div className="mt-3 grid gap-3 xl:grid-cols-2">
                          <ChipInput
                            labelText="Cards that shined"
                            values={cardsShined}
                            onChange={setCardsShined}
                            placeholder="Type a card name and press Enter"
                            fieldName="cards_shined"
                          />
                          <ChipInput
                            labelText="Cards that failed"
                            values={cardsFailed}
                            onChange={setCardsFailed}
                            placeholder="Type a card name and press Enter"
                            fieldName="cards_failed"
                          />
                        </div>
                      </div>

                      <div className={subCardClass}>
                        <label htmlFor="notes" className={label}>
                          One learning
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          rows={3}
                          placeholder="Example: I lost because I missed second attacker and fell behind on prizes."
                          className={`${textarea} mt-2 min-h-24 transition-all focus:min-h-28`}
                        />
                      </div>

                      <details className={subCardClass}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#F8FAFC] marker:hidden">
                          <span>Import TCG Live log</span>
                          <span className="text-xs text-[#94A3B8]">
                            Optional helper
                          </span>
                        </summary>
                        <div className="mt-3 flex flex-col gap-2">
                          <textarea
                            id="tcg_live_log"
                            value={tcgLiveLog}
                            onChange={(event) => setTcgLiveLog(event.target.value)}
                            rows={3}
                            placeholder="Paste a TCG Live battle log"
                            className={`${textarea} min-h-24`}
                          />
                          <button
                            type="button"
                            onClick={importTcgLiveLog}
                            className="w-fit rounded-md bg-[#4F8CFF]/12 px-3 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/20 active:scale-[0.98]"
                          >
                            Use log
                          </button>
                          {importStatus ? (
                            <p className="text-xs font-medium text-[#94A3B8]">
                              {importStatus}
                            </p>
                          ) : null}
                        </div>
                      </details>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-xl bg-[#0B1020]/52 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] xl:hidden">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                    Ready to save
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#F8FAFC]">
                    {readySummary ||
                      "Choose a matchup, result, and turn order to start the quick log."}
                  </p>
                  <p className="mt-2 text-sm text-[#94A3B8]/76">
                    This will update your matchup trends.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-h-10 items-center gap-2">
                    {currentStep > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentStep((step) => Math.max(step - 1, 0))
                        }
                        className={secondaryButton}
                      >
                        Back
                      </button>
                    ) : null}
                    {blockedNextMessage ? (
                      <p className="text-sm text-[#F5C84C]">
                        {blockedNextMessage}
                      </p>
                    ) : null}
                  </div>

                  {currentStep < stepOrder.length - 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentStep((step) =>
                          Math.min(step + 1, stepOrder.length - 1)
                        )
                      }
                      disabled={
                        (currentStep === 0 && !canAdvanceFromMatch) ||
                        (currentStep === 1 && !canAdvanceFromTurnOrder) ||
                        (currentStep === 2 && !canAdvanceFromResult)
                      }
                      className={`${primaryButton} h-12 w-full sm:w-auto ${
                        ((currentStep === 0 && !canAdvanceFromMatch) ||
                          (currentStep === 1 && !canAdvanceFromTurnOrder) ||
                          (currentStep === 2 && !canAdvanceFromResult))
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      Next
                    </button>
                  ) : (
                    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                      <button type="submit" className={secondaryButton}>
                        Skip and save
                      </button>
                      <SubmitButton label={submitLabel} />
                    </div>
                  )}
                </div>
              </section>

              <aside className="hidden xl:block">{desktopSummary}</aside>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
}
