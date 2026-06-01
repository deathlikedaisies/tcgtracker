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

const sectionToggleClass =
  "flex w-full items-center justify-between rounded-xl bg-[#07111F]/48 px-3 py-3 text-left transition hover:bg-[#07111F]/66";

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
  submitLabel = "Save and log another",
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
  const [result, setResult] = useState<MatchResult>(() => {
    if (
      initialResult === "win" ||
      initialResult === "loss" ||
      initialResult === "tie"
    ) {
      return initialResult;
    }

    if (typeof window === "undefined") {
      return "win";
    }

    const stored = sessionStorage.getItem(sessionKeys.result);
    return stored === "loss" || stored === "tie" ? stored : "win";
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
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    Boolean(
      initialOpponentVariant?.trim() ||
        metadata.game_context === "competitive" ||
        metadata.event_name ||
        metadata.round_number ||
        metadata.testing_session_name ||
        metadata.focus_matchup ||
        metadata.start_quality ||
        metadata.opening_hand_quality ||
        metadata.sequencing_quality ||
        metadata.cards_shined?.length ||
        metadata.cards_failed?.length ||
        (initialNotes ?? "").trim()
    )
  );
  const [moreIssueTagsOpen, setMoreIssueTagsOpen] = useState(() =>
    (metadata.issue_tags ?? mapLegacyTagsToIssueTags(initialTags)).some((tag) =>
      EXTRA_ISSUE_TAG_OPTIONS.includes(tag)
    ) ||
    (metadata.positive_tags ?? []).some((tag) =>
      EXTRA_POSITIVE_TAG_OPTIONS.includes(tag)
    )
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

    parts.push(getMatchResultLabel(result));
    parts.push(wentFirst === "true" ? "Went first" : "Went second");

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
    setAdvancedOpen(true);
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
                This log will update your matchup, turn-order, opening-hand, and sequencing patterns.
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

          <section className="rounded-xl bg-[#07111F]/36 p-4 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:p-5">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Quick log
              </p>
              <h2 className="text-xl font-semibold text-[#F8FAFC]">
                Fast post-game debrief
              </h2>
              <p className="text-sm leading-6 text-[#94A3B8]/76">
                Log the key signal first, then add context only if the game earned it.
              </p>
            </div>

            <div className="mt-4 grid gap-4">
              <div className={subCardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#F8FAFC]">Match</p>
                    <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                      Pick your deck and the matchup you just played.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-lg bg-[#07111F]/42 p-3">
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
                          onChange={(event) => setDeckVersionId(event.target.value)}
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

                  <div className="rounded-lg bg-[#07111F]/42 p-3">
                    <ArchetypePicker
                      id="opponent_archetype"
                      name="opponent_archetype"
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
              </div>

              <div className={subCardClass}>
                <p className="text-sm font-semibold text-[#F8FAFC]">Result</p>
                <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                  Record the outcome first, then add turn order.
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                  <fieldset className="rounded-lg bg-[#07111F]/42 p-3">
                    <legend className={label}>Outcome</legend>
                    <div className="mt-2 grid grid-cols-3 gap-2">
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
                  </fieldset>

                  <fieldset className="rounded-lg bg-[#07111F]/42 p-3">
                    <legend className={label}>Turn order</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {[
                        ["true", "First"],
                        ["false", "Second"],
                      ].map(([value, turnLabel]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setWentFirst(value as "true" | "false")}
                          className={`${mediumToggleClass} ${
                            wentFirst === value ? selectedToggleClass : ""
                          }`}
                        >
                          {turnLabel}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </div>

              <div className={subCardClass}>
                <p className="text-sm font-semibold text-[#F8FAFC]">Game quality</p>
                <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                  Capture the fast quality read while the game is still fresh.
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  <fieldset className="rounded-lg bg-[#07111F]/42 p-3">
                    <legend className={label}>Start</legend>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {MATCH_START_QUALITY_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setStartQuality(startQuality === value ? undefined : value)
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
                  <fieldset className="rounded-lg bg-[#07111F]/42 p-3">
                    <legend className={label}>Opening hand</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {MATCH_OPENING_HAND_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setOpeningHandQuality(
                              openingHandQuality === value ? undefined : value
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
                  <fieldset className="rounded-lg bg-[#07111F]/42 p-3">
                    <legend className={label}>Sequencing</legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {MATCH_SEQUENCING_OPTIONS.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setSequencingQuality(
                              sequencingQuality === value ? undefined : value
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

              <div className={subCardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      What mattered?
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                      {primaryTagHint}
                    </p>
                  </div>
                  {primaryExtraTagOptions.length ? (
                    <button
                      type="button"
                      onClick={() => setMoreIssueTagsOpen((current) => !current)}
                      className="rounded-md bg-[#4F8CFF]/10 px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/16"
                    >
                      {moreIssueTagsOpen ? "Fewer tags" : "More tags"}
                    </button>
                  ) : null}
                </div>

                <fieldset className="mt-3 rounded-lg bg-[#07111F]/42 p-3">
                  <legend className={label}>{primaryTagTitle}</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {primaryTagOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPrimaryTags(toggleSelection(primaryTags, tag))}
                        className={`${tagToggleClass} ${
                          primaryTags.includes(tag) ? selectedToggleClass : ""
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {moreIssueTagsOpen && primaryExtraTagOptions.length ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {primaryExtraTagOptions.map((tag) => (
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
                  ) : null}
                </fieldset>

                <fieldset className="mt-3 rounded-lg bg-[#07111F]/28 p-3">
                  <legend className={label}>{secondaryTagTitle}</legend>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8]/68">
                    {secondaryTagHint}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {secondaryTagOptions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setSecondaryTags(toggleSelection(secondaryTags, tag))
                        }
                        className={`${tagToggleClass} ${
                          secondaryTags.includes(tag) ? selectedToggleClass : ""
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((current) => !current)}
                  className={sectionToggleClass}
                >
                  <span>
                    <span className="block text-sm font-semibold text-[#F8FAFC]">
                      Add more context
                    </span>
                    <span className="block text-xs text-[#94A3B8]/72">
                      Testing context, event detail, cards, and one learning.
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[#B8D1FF]">
                    {advancedOpen ? "Hide" : "Open"}
                  </span>
                </button>

                {advancedOpen ? (
                  <div className="grid gap-3 rounded-xl bg-[#07111F]/28 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <div className="grid grid-cols-2 gap-2">
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

                    {gameContext === "competitive" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="event_name" className={label}>
                            Event name
                          </label>
                          <input
                            id="event_name"
                            name="event_name"
                            value={eventName}
                            onChange={(event) => setEventName(event.target.value)}
                            placeholder="Optional"
                            className={inputH11}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="round_number" className={label}>
                            Round number
                          </label>
                          <input
                            id="round_number"
                            name="round_number"
                            value={roundNumber}
                            onChange={(event) => setRoundNumber(event.target.value)}
                            placeholder="Optional"
                            className={inputH11}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="testing_session_name" className={label}>
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
                            className={inputH11}
                          />
                        </div>
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
                    )}

                    <div className="flex flex-col gap-2">
                      <label htmlFor="opponent_variant" className={label}>
                        Opponent variant
                      </label>
                      <input
                        id="opponent_variant"
                        name="opponent_variant"
                        value={opponentVariant}
                        onChange={(event) => setOpponentVariant(event.target.value)}
                        placeholder="Optional detail"
                        className={inputH11}
                      />
                    </div>

                    <div className={subCardClass}>
                      <p className="text-sm font-semibold text-[#F8FAFC]">
                        Cards to remember
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
            </div>

            <div className="mt-4 rounded-xl bg-[#0B1020]/52 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                Ready to save
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#F8FAFC]">
                {readySummary ||
                  "Choose a matchup, result, and turn order to finish the quick log."}
              </p>
              <p className="mt-2 text-sm text-[#94A3B8]/76">
                This will update your matchup trends.
              </p>
            </div>

            <div className="grid gap-2 pt-1 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <SubmitButton label={submitLabel} />
              <Link href={secondaryHref} className={`w-full ${secondaryButton}`}>
                {secondaryLabel}
              </Link>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
