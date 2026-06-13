"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  glassPanelStrong,
  inputH11,
  label,
  premiumInset,
  premiumTile,
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
import { parseWentFirstChoice } from "@/lib/match-form";
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
  action: (
    state: { error: string | null },
    formData: FormData
  ) => Promise<{ error: string | null }>;
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
type StepWentFirstValue = "true" | "false" | "unknown" | "";
type SelectionTone = "blue" | "gold" | "emerald" | "rose";

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

const subCardClass = `${premiumTile} p-2.5 sm:p-3`;

const largeToggleClass =
  "group relative flex min-h-12 w-full min-w-0 items-center justify-center overflow-hidden rounded-xl border border-[#23314A] bg-[linear-gradient(180deg,rgba(11,16,32,0.96),rgba(7,17,31,0.88))] px-3 text-center text-sm font-semibold text-[#D7E0EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-transform transition-colors duration-150 ease-out hover:-translate-y-0.5 hover:border-[#35507D] hover:bg-[#0D1830] hover:text-[#F8FAFC] hover:shadow-[0_12px_24px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(79,140,255,0.12)] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F] sm:min-h-14 sm:rounded-2xl sm:text-base";

const mediumToggleClass =
  "group relative flex min-h-11 w-full min-w-0 items-center justify-center overflow-hidden rounded-xl border border-[#223049] bg-[linear-gradient(180deg,rgba(11,16,32,0.94),rgba(7,17,31,0.86))] px-3 text-center text-sm font-semibold text-[#B9C4D6] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-transform transition-colors duration-150 ease-out hover:-translate-y-0.5 hover:border-[#36507D] hover:text-[#F8FAFC] hover:shadow-[0_10px_22px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(79,140,255,0.10)] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F] sm:min-h-12";

const tagToggleClass =
  "group relative inline-flex min-h-10 w-full min-w-0 items-center justify-start overflow-hidden rounded-xl border border-[#223049] bg-[linear-gradient(180deg,rgba(11,16,32,0.94),rgba(7,17,31,0.86))] px-3 py-2 text-left text-sm font-semibold text-[#A8B5C8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-transform transition-colors duration-150 ease-out hover:-translate-y-0.5 hover:border-[#36507D] hover:text-[#F8FAFC] hover:shadow-[0_10px_22px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(79,140,255,0.10)] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F] sm:min-h-11";

const selectedToggleClass =
  "border-[#7CB4FF] bg-[linear-gradient(180deg,rgba(79,140,255,0.36),rgba(24,57,120,0.92))] text-[#F8FAFC] shadow-[0_16px_34px_rgba(79,140,255,0.18),inset_0_0_0_1px_rgba(184,209,255,0.42),inset_0_1px_0_rgba(255,255,255,0.12)] -translate-y-[1px]";

const selectedGoldToggleClass =
  "border-[#F5C84C] bg-[linear-gradient(180deg,rgba(245,200,76,0.28),rgba(107,78,13,0.94))] text-[#FFF8E1] shadow-[0_16px_34px_rgba(245,200,76,0.16),inset_0_0_0_1px_rgba(255,226,138,0.38),inset_0_1px_0_rgba(255,255,255,0.10)] -translate-y-[1px]";

const selectedEmeraldToggleClass =
  "border-[#34D399] bg-[linear-gradient(180deg,rgba(16,185,129,0.28),rgba(7,85,65,0.94))] text-[#ECFDF5] shadow-[0_16px_34px_rgba(16,185,129,0.16),inset_0_0_0_1px_rgba(167,243,208,0.36),inset_0_1px_0_rgba(255,255,255,0.10)] -translate-y-[1px]";

const selectedRoseToggleClass =
  "border-[#FB7185] bg-[linear-gradient(180deg,rgba(244,63,94,0.26),rgba(101,20,43,0.96))] text-[#FFF1F4] shadow-[0_16px_34px_rgba(244,63,94,0.16),inset_0_0_0_1px_rgba(255,189,206,0.34),inset_0_1px_0_rgba(255,255,255,0.10)] -translate-y-[1px]";

const progressStepClass =
  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors sm:gap-3 sm:py-3";

function parseWentFirstValue(value: string | null | undefined) {
  return parseWentFirstChoice(value);
}

const rewardStatCardClass = `${premiumInset} px-3 py-3`;

const rewardDetailChipClass = `${premiumTile} px-3 py-2.5`;

const stepOrder = [
  { label: "Match", shortLabel: "1" },
  { label: "Result", shortLabel: "2" },
  { label: "Turn order", shortLabel: "3" },
  { label: "Reason", shortLabel: "4" },
  { label: "Quality", shortLabel: "5" },
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
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

function toggleSelection(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

function getRewardStatusToneClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("complete")) {
    return "bg-emerald-500/14 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.20)]";
  }

  if (normalized.includes("improved")) {
    return "bg-[#4F8CFF]/14 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]";
  }

  if (normalized.includes("building")) {
    return "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]";
  }

  return `${premiumTile} text-[#DCE8FF]`;
}

function getSelectedToneClass(tone: SelectionTone) {
  if (tone === "gold") {
    return selectedGoldToggleClass;
  }

  if (tone === "emerald") {
    return selectedEmeraldToggleClass;
  }

  if (tone === "rose") {
    return selectedRoseToggleClass;
  }

  return selectedToggleClass;
}

function getQualityTone(
  value: MatchStartQuality | MatchOpeningHandQuality | MatchSequencingQuality
): SelectionTone {
  if (value === "bad") {
    return "rose";
  }

  if (value === "okay") {
    return "gold";
  }

  return "blue";
}

function getResultTone(value: MatchResult): SelectionTone {
  if (value === "loss") {
    return "rose";
  }

  if (value === "tie") {
    return "gold";
  }

  return "emerald";
}

function SelectionMark({ tone }: { tone: SelectionTone }) {
  const className =
    tone === "gold"
      ? "bg-[#FFF1B8] text-[#5A4300]"
      : tone === "emerald"
        ? "bg-[#D6FCE5] text-[#0E4B2B]"
        : tone === "rose"
          ? "bg-[#FFD3DC] text-[#6B1730]"
          : "bg-[#DCE8FF] text-[#123060]";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black shadow-[0_6px_14px_rgba(0,0,0,0.18)] ${className}`}
    >
      {"\u2713"}
    </span>
  );
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
  helperText,
}: {
  labelText: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  fieldName?: string;
  helperText?: string;
}) {
  const [draft, setDraft] = useState("");

  function addDraftValue() {
    const nextValue = cleanChipValue(draft);
    const normalizedNextValue = normalize(nextValue);
    const alreadySelected = values.some(
      (candidate) => normalize(candidate) === normalizedNextValue
    );

    if (!nextValue || alreadySelected) {
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
            maxLength={40}
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
        {fieldName
          ? values.map((value) => (
              <input key={value} type="hidden" name={fieldName} value={value} />
            ))
          : null}
        {helperText ? (
          <p className="mt-2 text-xs leading-5 text-[#94A3B8]/68">{helperText}</p>
        ) : null}
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
  const [actionState, formAction] = useActionState(action, { error: null });
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

    if (typeof window === "undefined") {
      return "";
    }

    const stored = sessionStorage.getItem(sessionKeys.result);
    return stored === "win" || stored === "loss" || stored === "tie"
      ? stored
      : "";
  });
  const [wentFirst, setWentFirst] = useState<StepWentFirstValue>(() => {
    if (
      initialWentFirst === "true" ||
      initialWentFirst === "false" ||
      initialWentFirst === "unknown"
    ) {
      return initialWentFirst;
    }

    if (typeof window === "undefined") {
      return "";
    }

    const stored = sessionStorage.getItem(sessionKeys.wentFirst);
    return stored === "true" || stored === "false" || stored === "unknown"
      ? (stored as StepWentFirstValue)
      : "";
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
          went_first: parseWentFirstValue(initialWentFirst),
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
    if (wentFirst === "true") {
      parts.push("Went first");
    } else if (wentFirst === "false") {
      parts.push("Went second");
    } else if (wentFirst === "unknown") {
      parts.push("Turn order unknown");
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
  const postSaveStatusBadge = sessionCoach
    ? !countedTowardMission
      ? sessionCoach.missionGuidanceMode === "priority_watchlist"
        ? "Outside watchlist"
        : "Outside focused test"
      : sessionCoach.completionStatus
        ? sessionCoach.completionStatus
        : sessionCoach.missionStatusLabel
    : "Game logged";
  const remaining = sessionCoach
    ? Math.max(sessionCoach.progressGoal - (postSaveMissionProgress ?? 0), 0)
    : 0;
  const postSaveMissionCopy = sessionCoach
    ? !countedTowardMission
      ? "This game is outside the current focus, but it still updates your wider history."
      : sessionCoach.completionLesson
        ? sessionCoach.completionLesson
        : sessionCoach.missionGuidanceMode === "investigation"
          ? remaining > 0
            ? `${remaining} more log${remaining === 1 ? "" : "s"} will tell us whether this is a real pattern.`
            : "This pattern is strong enough to review."
          : sessionCoach.missionGuidanceMode === "priority_watchlist"
            ? remaining > 0
              ? `${remaining} more watchlist game${remaining === 1 ? "" : "s"} until the read is ready.`
              : "This is strong enough to review before changing your list."
            : remaining > 0
              ? `${remaining} more game${remaining === 1 ? "" : "s"} until this read is ready.`
              : "This focused sample is ready to review."
    : "This result was added to your matchup history.";
  const postSaveProgressPercent =
    sessionCoach && sessionCoach.progressGoal > 0 && postSaveMissionProgress !== null
      ? Math.min((postSaveMissionProgress / sessionCoach.progressGoal) * 100, 100)
      : 0;
  const postSaveStatChips = [
    {
      label: "Matchup sample",
      value: "+1 matchup game",
    },
    {
      label: "Turn-order sample",
      value:
        wentFirst === "true"
          ? "+1 first-turn game"
          : wentFirst === "false"
            ? "+1 second-turn game"
            : "Turn order unknown",
    },
    {
      label: "Quality signal",
      value: sequencingQuality
        ? `${getQualityLabel(sequencingQuality)} sequencing`
        : startQuality
          ? `${getQualityLabel(startQuality)} start`
          : "No quality signal",
    },
  ];
  const postSaveAddedItems = [
    opponentArchetype
      ? { label: "Matchup", value: opponentArchetype }
      : null,
    wentFirst
      ? wentFirst === "unknown"
        ? {
            label: "Turn order",
            value: "Turn order unknown",
          }
        : {
          label: "Turn order",
          value: wentFirst === "true" ? "First" : "Second",
        }
      : null,
    openingHandQuality
      ? {
          label: "Opening hand",
          value: getQualityLabel(openingHandQuality),
        }
      : null,
    sequencingQuality
      ? { label: "Sequencing", value: getQualityLabel(sequencingQuality) }
      : null,
    [...issueTags, ...positiveTags].length
      ? {
          label: "Tags",
          value: [...issueTags, ...positiveTags].slice(0, 3).join(", "),
        }
      : null,
  ].filter(
    (
      item
    ): item is {
      label: string;
      value: string;
    } => Boolean(item)
  );
  const nextActionTitle = sessionCoach
    ? !countedTowardMission
      ? "Return to dashboard"
      : sessionCoach.missionNextAction
    : "Log another game";
  const nextActionCopy = sessionCoach
    ? !countedTowardMission
      ? "This game still updates your wider testing record."
      : sessionCoach.completionStatus
        ? "This keeps the matchup history fresh."
        : sessionCoach.nextAction
    : "Keep your testing loop moving with one more data point.";
  const postSaveStatusToneClass = getRewardStatusToneClass(postSaveStatusBadge);

  // Derive a plain-English coaching line from what was just logged
  const postLogCoachLine = (() => {
    if (!wasSuccessful) return null;
    if (result === "loss") {
      if (issueTags.length) {
        const topTag = issueTags[0];
        return {
          line: `Logged. "${topTag}" was the clearest issue.`,
          detail: "Keep tagging it the same way if it happens again.",
        };
      }
      if (startQuality === "bad" || startQuality === "okay") {
        return {
          line: "Logged. The start quality issue is building.",
          detail: "Tag what failed first next time if you can.",
        };
      }
      if (openingHandQuality === "bad" || openingHandQuality === "okay") {
        return {
          line: "Logged. The weak opening-hand signal is building.",
          detail: "Note whether it was basics, draw, or search next time.",
        };
      }
      if (sequencingQuality === "bad" || sequencingQuality === "okay") {
        return {
          line: "Logged. The sequencing signal is building.",
          detail: "Use Review once you have a few more of these.",
        };
      }
      return {
        line: countedTowardMission
          ? "Logged. This loss counts toward your current focus."
          : "Logged. Loss added to your matchup history.",
        detail: "Add one issue tag next time to sharpen the review read.",
      };
    }
    if (result === "win") {
      if (positiveTags.length) {
        return {
          line: `Logged. "${positiveTags[0]}" showed up in this win.`,
          detail: "Keep tagging it if it keeps appearing.",
        };
      }
      return {
        line: countedTowardMission
          ? "Logged. This win counts toward your current focus."
          : "Logged. Win added to your matchup history.",
        detail: "Add one positive tag next time to track what worked.",
      };
    }
    return {
      line: "Logged. Tie added to your history.",
      detail: "It still counts toward the sample.",
    };
  })();

  const rewardPrimaryButtonClass =
    `${primaryButton} h-12 shadow-[0_14px_30px_rgba(79,140,255,0.16)]`;
  const rewardSecondaryButtonClass =
    `${secondaryButton} h-12 bg-[#07111F]/62 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]`;

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
  const canAdvanceFromTurnOrder =
    wentFirst === "true" || wentFirst === "false" || wentFirst === "unknown";
  const canAdvanceFromResult = result === "win" || result === "loss" || result === "tie";
  const canQuickSave =
    canAdvanceFromMatch && canAdvanceFromResult && canAdvanceFromTurnOrder;
  const blockedNextMessage =
    currentStep === 0 && !canAdvanceFromMatch
      ? "Choose an opponent deck to continue."
      : currentStep === 1 && !canAdvanceFromResult
        ? "Choose win, loss, or tie."
        : currentStep === 2 && !canAdvanceFromTurnOrder
          ? "Choose whether you went first, second, or can't remember."
          : null;
  const summaryChipClass =
    "inline-flex items-center rounded-full bg-[#0B1020]/72 px-2.5 py-1 text-[11px] font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]";
  const desktopSummary = (
    <div className="rounded-xl bg-[#0B1020]/52 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
        Live summary
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[#F8FAFC]">
        {readySummary ||
          "Choose a matchup, result, and turn order to start the quick log."}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={summaryChipClass}>
          Result: {result ? getMatchResultLabel(result) : "Not set"}
        </span>
        <span className={summaryChipClass}>
          Turn order:{" "}
          {wentFirst === "true"
            ? "First"
            : wentFirst === "false"
              ? "Second"
              : wentFirst === "unknown"
                ? "Turn order unknown"
                : "Not set"}
        </span>
        <span className={summaryChipClass}>
          Tags:{" "}
          {[...issueTags, ...positiveTags].length
            ? [...issueTags, ...positiveTags].slice(0, 2).join(", ")
            : "No tags yet"}
        </span>
      </div>
      <p className="mt-3 text-xs text-[#94A3B8]/76">
        This will update your matchup trends.
      </p>
      <Link href={secondaryHref} className={`mt-3 block w-full ${secondaryButton}`}>
        {secondaryLabel}
      </Link>
    </div>
  );

  return (
    <div className="mt-5 grid gap-4">
      {sessionCoach && !wasSuccessful ? (
        <section className="rounded-[20px] bg-[#07111F]/40 p-3.5 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:rounded-[24px] sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Current focus
              </p>
              <p className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                {sessionCoach.missionTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                {sessionCoach.nextAction}
              </p>
            </div>
            <div className="rounded-xl bg-[#0B1020]/52 px-3 py-2 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              {sessionCoach.missionProgress}/{sessionCoach.missionTargetCount} games
            </div>
          </div>
        </section>
      ) : null}

      <form
        action={formAction}
      className={`w-full max-w-full min-w-0 overflow-x-hidden p-2.5 sm:p-5 ${glassPanelStrong}`}
      >
        <input type="hidden" name="deck_version_id" value={deckVersionId} />
        <input
          type="hidden"
          name="opponent_archetype"
          value={opponentArchetype}
        />
        <input type="hidden" name="game_context" value={gameContext} />
        <input type="hidden" name="result" value={result} />
        <input
          type="hidden"
          name="went_first"
          value={wentFirst === "unknown" ? "unknown" : wentFirst}
        />
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

        <div className="grid gap-3.5 sm:gap-4">
          {actionState.error ? (
            <div className="rounded-xl bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
              Something went wrong while saving this game. Please try again.
              <span className="mt-1 block text-rose-200/80">
                {actionState.error}
              </span>
            </div>
          ) : null}
          {wasSuccessful ? (
            <div className="grid gap-3.5 sm:gap-4">
              <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(14,24,42,0.95),rgba(8,17,31,0.90))] p-4 shadow-[0_16px_36px_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(148,163,184,0.11)] sm:rounded-[28px] sm:p-6 sm:shadow-[0_20px_48px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(148,163,184,0.11)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-emerald-500/12 text-emerald-300 shadow-[0_10px_22px_rgba(34,197,94,0.08),inset_0_0_0_1px_rgba(34,197,94,0.16)] sm:h-14 sm:w-14 sm:rounded-[20px]">
                      <CheckCircle2 className="size-6 sm:size-7" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#22C55E]">
                          Game logged
                        </p>
                    <h2 className="mt-1 text-[1.45rem] font-bold leading-tight text-[#F8FAFC] sm:text-3xl">
                      {!countedTowardMission
                        ? "Your matchup history moved."
                        : sessionCoach?.completionStatus
                          ? "Current review set updated."
                          : sessionCoach?.missionGuidanceMode === "priority_watchlist"
                            ? "Watchlist read updated."
                            : "Focused test advanced."}
                    </h2>
                  </div>
                </div>
                <p className="mt-3 text-[0.95rem] font-semibold leading-6 text-[#F8FAFC] sm:mt-4 sm:text-base sm:leading-7">
                  {postSaveSummary}
                </p>
                <p className="mt-2 text-sm leading-5 text-[#94A3B8]/76 sm:leading-6">
                  {!countedTowardMission
                    ? sessionCoach?.missionGuidanceMode === "priority_watchlist"
                      ? "This game sits outside the watchlist, but it still strengthens the wider sample."
                      : "This game sits outside the focused test, but it still strengthens the wider sample."
                    : sessionCoach?.completionStatus
                      ? "This keeps the current review set fresh while you decide the next change."
                      : sessionCoach?.missionGuidanceMode === "priority_watchlist"
                        ? "This log strengthened the current watchlist read."
                        : "This log pushed the focused test forward."}
                </p>
              </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] ${postSaveStatusToneClass}`}
                  >
                    {postSaveStatusBadge}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 sm:mt-5 sm:grid-cols-3">
                  {postSaveStatChips.map((chip) => (
                    <div
                      key={chip.label}
                      className={rewardStatCardClass}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                        {chip.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                        {chip.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {postLogCoachLine ? (
                <div className="rounded-[18px] bg-[#07111F]/44 p-3.5 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)] sm:rounded-[20px] sm:p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-[8px] bg-[#F5C84C]/12 text-[10px] font-bold text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                      TC
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]/52">
                      Coach says
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-[#F8FAFC]">
                    {postLogCoachLine.line}
                  </p>
                  <p className="mt-1 text-sm text-[#94A3B8]/76">
                    {postLogCoachLine.detail}
                  </p>
                </div>
              ) : null}

              {sessionCoach ? (
                <div className="rounded-[20px] bg-[#07111F]/44 p-3.5 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:rounded-[24px] sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                        Current focus
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                        {sessionCoach.missionTitle}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-[#94A3B8]/72">
                          {sessionCoach.missionGuidanceLabel}
                        </span>
                        <span className="text-[10px] font-semibold text-[#F5C84C]/80">
                          → {sessionCoach.rewardLabel}
                        </span>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${postSaveStatusToneClass}`}>
                      {postSaveStatusBadge}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      {postSaveMissionProgress}/{sessionCoach.progressGoal} games
                    </p>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: sessionCoach.progressGoal }).map((_, index) => (
                        <span
                          key={index}
                          className={`h-2.5 w-6 rounded-full ${
                            index < (postSaveMissionProgress ?? 0)
                              ? "bg-[#4F8CFF]"
                              : "bg-[#1A2238]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-[#0B1020]/72">
                    <div
                      className="h-2 rounded-full bg-[#4F8CFF] transition-[width,background-color]"
                      style={{ width: `${postSaveProgressPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm font-medium text-[#D7E0EF]">
                    {postSaveMissionCopy}
                  </p>
                  {postSaveSignalLine ? (
                    <p className="mt-2 text-xs leading-5 text-[#94A3B8]/72">
                      {postSaveSignalLine}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="rounded-[20px] bg-[#07111F]/38 p-3.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] sm:rounded-[24px] sm:p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-[#F5C84C]" aria-hidden="true" />
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      What this added
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {postSaveAddedItems.length ? (
                      postSaveAddedItems.map((item) => (
                        <div key={`${item.label}-${item.value}`} className={rewardDetailChipClass}>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                            {item.value}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className={rewardDetailChipClass}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                          Added
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                          Matchup history updated
                        </p>
                      </div>
                    )}
                  </div>
                  {postSaveSignalLine ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-[#94A3B8]">
                        Why this matters
                      </summary>
                      <p className="mt-2 text-sm text-[#B9C4D6]">
                        {postSaveSignalLine}
                      </p>
                    </details>
                  ) : null}
                </div>

                <div className="rounded-[20px] bg-[#0B1020]/54 p-3.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)] sm:rounded-[24px] sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                    Next best action
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                    {nextActionTitle}
                  </p>
                  <p className="mt-2 text-sm text-[#94A3B8]">
                    {nextActionCopy}
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#07111F]/60 px-3 py-2 text-sm font-medium text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <ArrowRight className="size-4 text-[#F5C84C]" aria-hidden="true" />
                    Keep the testing loop moving.
                  </div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Link href="/matches/new" className={rewardPrimaryButtonClass}>
                  Log another game
                </Link>
                <Link href="/matchups" className={rewardSecondaryButtonClass}>
                  Review matchup
                </Link>
                <Link href="/dashboard" className={rewardSecondaryButtonClass}>
                  Dashboard
                </Link>
              </div>
            </div>
          ) : null}

          {!wasSuccessful ? (
            <div className="grid gap-3.5 sm:gap-4 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
              <aside className="hidden xl:block">
                <div className="rounded-xl bg-[#07111F]/36 p-3.5 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:p-4">
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

              <section className="rounded-xl bg-[#07111F]/36 p-3.5 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:p-5">
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
                      className="h-2 rounded-full bg-[#4F8CFF] transition-[width,background-color]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3.5 rounded-xl bg-[#0B1020]/52 p-3.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] sm:mt-4 sm:p-4">
                  {currentStep === 0 ? (
                    <div className="grid gap-3.5 sm:gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Match
                        </p>
                        <h2 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[#F8FAFC] sm:text-2xl">
                          Who did you play against?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Start with the matchup. You can fill the rest in fast.
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
                                archetype={selectedDeckArchetype || selectedDeckSuggestion}
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

                  {currentStep === 2 ? (
                    <div className="grid gap-3.5 sm:gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Turn order
                        </p>
                        <h2 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[#F8FAFC] sm:text-2xl">
                          Did you go first, second, or can&apos;t remember?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Choose turn order, or tap unknown and keep going.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {[
                          ["true", "First"],
                          ["false", "Second"],
                          ["unknown", "Can't remember"],
                        ].map(([value, turnLabel]) => (
                          (() => {
                            const isSelected = wentFirst === value;

                            return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setWentFirst(value as StepWentFirstValue)}
                            aria-pressed={isSelected}
                            className={`${largeToggleClass} ${
                              isSelected ? getSelectedToneClass("blue") : ""
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isSelected ? <SelectionMark tone="blue" /> : null}
                              <span>{turnLabel}</span>
                            </span>
                          </button>
                            );
                          })()
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <div className="grid gap-3.5 sm:gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Result
                        </p>
                        <h2 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[#F8FAFC] sm:text-2xl">
                          What was the result?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Win, loss, or tie. Keep it moving.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(["win", "loss", "tie"] as const).map((resultOption) => (
                          (() => {
                            const isSelected = result === resultOption;
                            const tone = getResultTone(resultOption);

                            return (
                          <button
                            key={resultOption}
                            type="button"
                            onClick={() => setResult(resultOption)}
                            aria-pressed={isSelected}
                            className={`${largeToggleClass} ${
                              isSelected ? getSelectedToneClass(tone) : ""
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {isSelected ? <SelectionMark tone={tone} /> : null}
                              <span>{getMatchResultLabel(resultOption)}</span>
                            </span>
                          </button>
                            );
                          })()
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 4 ? (
                    <div className="grid gap-3.5 sm:gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Quick quality
                        </p>
                        <h2 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[#F8FAFC] sm:text-2xl">
                          Add quality if you remember it
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          This is optional. Add it now if the game is still fresh, or save without it.
                        </p>
                      </div>
                      <div className="grid gap-2.5 sm:gap-3">
                        <fieldset className={subCardClass}>
                          <legend className={label}>Start</legend>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {MATCH_START_QUALITY_OPTIONS.map((value) => (
                              (() => {
                                const isSelected = startQuality === value;
                                const tone = getQualityTone(value);

                                return (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setStartQuality(
                                    startQuality === value ? undefined : value
                                  )
                                }
                                aria-pressed={isSelected}
                                className={`${mediumToggleClass} ${
                                  isSelected ? getSelectedToneClass(tone) : ""
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected ? <SelectionMark tone={tone} /> : null}
                                  <span>{getQualityLabel(value)}</span>
                                </span>
                              </button>
                                );
                              })()
                            ))}
                          </div>
                        </fieldset>
                        <fieldset className={subCardClass}>
                          <legend className={label}>Opening hand</legend>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {MATCH_OPENING_HAND_OPTIONS.map((value) => (
                              (() => {
                                const isSelected = openingHandQuality === value;
                                const tone = getQualityTone(value);

                                return (
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
                                aria-pressed={isSelected}
                                className={`${mediumToggleClass} ${
                                  isSelected ? getSelectedToneClass(tone) : ""
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected ? <SelectionMark tone={tone} /> : null}
                                  <span>{getQualityLabel(value)}</span>
                                </span>
                              </button>
                                );
                              })()
                            ))}
                          </div>
                        </fieldset>
                        <fieldset className={subCardClass}>
                          <legend className={label}>Sequencing</legend>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {MATCH_SEQUENCING_OPTIONS.map((value) => (
                              (() => {
                                const isSelected = sequencingQuality === value;
                                const tone = getQualityTone(value);

                                return (
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
                                aria-pressed={isSelected}
                                className={`${mediumToggleClass} ${
                                  isSelected ? getSelectedToneClass(tone) : ""
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected ? <SelectionMark tone={tone} /> : null}
                                  <span>{getQualityLabel(value)}</span>
                                </span>
                              </button>
                                );
                              })()
                            ))}
                          </div>
                        </fieldset>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 3 ? (
                    <div className="grid gap-3.5 sm:gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          What mattered?
                        </p>
                        <h2 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[#F8FAFC] sm:text-2xl">
                          {primaryTagTitle}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Add one reason, or skip and save.
                        </p>
                      </div>
                      <fieldset className={subCardClass}>
                        <legend className={label}>{primaryTagTitle}</legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {primaryTagOptions.map((tag) => (
                            (() => {
                              const isSelected = primaryTags.includes(tag);
                              const tone = result === "win" ? "emerald" : "rose";

                              return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setPrimaryTags(toggleSelection(primaryTags, tag))
                              }
                              aria-pressed={isSelected}
                              className={`${tagToggleClass} ${
                                isSelected ? getSelectedToneClass(tone) : ""
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {isSelected ? <SelectionMark tone={tone} /> : null}
                                <span>{tag}</span>
                              </span>
                            </button>
                              );
                            })()
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
                              (() => {
                                const isSelected = primaryTags.includes(tag);
                                const tone = result === "win" ? "emerald" : "rose";

                                return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() =>
                                  setPrimaryTags(toggleSelection(primaryTags, tag))
                                }
                                aria-pressed={isSelected}
                                className={`${tagToggleClass} ${
                                  isSelected ? getSelectedToneClass(tone) : ""
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected ? <SelectionMark tone={tone} /> : null}
                                  <span>{tag}</span>
                                </span>
                              </button>
                                );
                              })()
                            ))}
                          </div>
                        ) : null}
                      </fieldset>
                      <ChipInput
                        labelText={
                          result === "win"
                            ? "Add custom positive tag"
                            : "Add custom issue tag"
                        }
                        values={primaryTags}
                        onChange={setPrimaryTags}
                        placeholder="e.g. Item Lock, prize map error, stadium lock"
                        helperText="Press Enter or Add. Custom tags are saved with the normal structured tags."
                      />
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
                                (() => {
                                  const isSelected = secondaryTags.includes(tag);
                                  const tone = result === "win" ? "rose" : "emerald";

                                  return (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() =>
                                    setSecondaryTags(
                                      toggleSelection(secondaryTags, tag)
                                    )
                                  }
                                  aria-pressed={isSelected}
                                  className={`${tagToggleClass} ${
                                    isSelected ? getSelectedToneClass(tone) : ""
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    {isSelected ? <SelectionMark tone={tone} /> : null}
                                    <span>{tag}</span>
                                  </span>
                                </button>
                                  );
                                })()
                              ))}
                            </div>
                            <div className="mt-3">
                              <ChipInput
                                labelText={
                                  result === "win"
                                    ? "Add custom issue tag"
                                    : "Add custom positive tag"
                                }
                                values={secondaryTags}
                                onChange={setSecondaryTags}
                                placeholder="e.g. Item Lock, prize map error, stadium lock"
                                helperText="Keep rare or matchup-specific details here without waiting for a built-in tag."
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 5 ? (
                    <div className="grid gap-3.5 sm:gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          More context
                        </p>
                        <h2 className="mt-2 text-[1.35rem] font-semibold leading-tight text-[#F8FAFC] sm:text-2xl">
                          Anything worth remembering?
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                          Everything here is optional. Save as soon as you have enough.
                        </p>
                      </div>

                      <div className={subCardClass}>
                        <p className="text-sm font-semibold text-[#F8FAFC]">
                          Game context
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {MATCH_GAME_CONTEXT_OPTIONS.map((contextOption) => (
                            (() => {
                              const isSelected = gameContext === contextOption;

                              return (
                            <button
                              key={contextOption}
                              type="button"
                              onClick={() => setGameContext(contextOption)}
                              aria-pressed={isSelected}
                              className={`${mediumToggleClass} ${
                                isSelected ? getSelectedToneClass("gold") : ""
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                {isSelected ? <SelectionMark tone="gold" /> : null}
                                <span>{getGameContextLabel(contextOption)}</span>
                              </span>
                            </button>
                              );
                            })()
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
                              label="Priority matchup"
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
                          className={`${textarea} mt-2 min-h-24 transition-[min-height,border-color,background-color] focus:min-h-28`}
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
                            className="w-fit rounded-md bg-[#4F8CFF]/12 px-3 py-2 text-sm font-semibold text-[#F8FAFC] transition-colors hover:bg-[#4F8CFF]/20 active:scale-[0.98]"
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

                <div className="mt-3.5 rounded-xl bg-[#0B1020]/52 p-2.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] xl:hidden sm:mt-4 sm:p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                    Ready to save
                  </p>
                  <p className="mt-1.5 text-sm font-medium leading-5 text-[#F8FAFC] sm:mt-2 sm:leading-6">
                    {readySummary ||
                      "Choose matchup, result, and turn order to save quickly."}
                  </p>
                  <p className="mt-1.5 text-sm text-[#94A3B8]/76 sm:mt-2">
                    {canQuickSave
                      ? "You can save now, or add optional detail first."
                      : "This will update your matchup trends."}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
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

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentStep((step) =>
                          Math.min(step + 1, stepOrder.length - 1)
                        )
                      }
                      disabled={
                        (currentStep === 0 && !canAdvanceFromMatch) ||
                        (currentStep === 1 && !canAdvanceFromResult) ||
                        (currentStep === 2 && !canAdvanceFromTurnOrder)
                      }
                      className={`${primaryButton} h-12 w-full sm:w-auto ${
                        ((currentStep === 0 && !canAdvanceFromMatch) ||
                          (currentStep === 1 && !canAdvanceFromResult) ||
                          (currentStep === 2 && !canAdvanceFromTurnOrder))
                          ? "cursor-not-allowed opacity-60"
                          : ""
                      }`}
                    >
                      Next
                    </button>
                  ) : currentStep < stepOrder.length - 1 ? (
                    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentStep((step) =>
                            Math.min(step + 1, stepOrder.length - 1)
                          )
                        }
                        className={secondaryButton}
                      >
                        {currentStep === 3 ? "Optional quality" : "More context"}
                      </button>
                      <SubmitButton label="Save now" />
                    </div>
                  ) : (
                    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                      <button type="submit" className={secondaryButton}>
                        Save now
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
