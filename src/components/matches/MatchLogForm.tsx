"use client";

import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  History,
  Radio,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
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
import { buildPostSaveFocusSummary } from "@/lib/match-log-reward";
import { parseTcgLiveLog } from "@/lib/tcg-live-log-parser";

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
  initialTcgLivePlayerName?: string | null;
  initialNotes?: string;
  initialTags?: string[];
  initialMetadata?: MatchMetadata | null;
  sessionCoach?: SessionCoachInsight | null;
  secondaryHref?: string;
  secondaryLabel?: string;
  submitLabel?: string;
  wasSuccessful: boolean;
  rememberTcgLiveUsernameAction?: (
    username: string
  ) => Promise<{ error: string | null }>;
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
  tcgLivePlayerName: "tcgtracker.matchLog.tcgLivePlayerName",
};

const subCardClass = `${premiumTile} min-w-0 p-2.5 sm:p-3`;

const cockpitCardClass =
  "min-w-0 rounded-[18px] bg-[linear-gradient(180deg,rgba(13,25,46,0.88),rgba(7,17,31,0.76))] shadow-[0_14px_32px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(148,163,184,0.09)]";

const cockpitInsetClass =
  "rounded-2xl bg-[#07111F]/58 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]";

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

function parseWentFirstValue(value: string | null | undefined) {
  return parseWentFirstChoice(value);
}

const rewardStatCardClass = `${premiumInset} px-3 py-3`;

const rewardDetailChipClass = `${premiumTile} px-3 py-2.5`;

const stepOrder = [
  { label: "Match", shortLabel: "1" },
  { label: "Result", shortLabel: "2" },
  { label: "Turn order", shortLabel: "3" },
  { label: "Quality", shortLabel: "4" },
  { label: "Reason", shortLabel: "5" },
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

function getImportStatusMeta(note: string) {
  const normalized = note.toLowerCase();

  if (normalized.includes("result:")) {
    return {
      label: "Result",
      value: note.replace(/^Detected result:\s*/i, ""),
      toneClass:
        normalized.includes("loss")
          ? "border-rose-400/22 bg-rose-500/10 text-rose-100"
          : normalized.includes("win")
            ? "border-emerald-400/22 bg-emerald-500/10 text-emerald-100"
            : "border-[#F5C84C]/22 bg-[#F5C84C]/10 text-[#FFE28A]",
    };
  }

  if (normalized.includes("turn order:")) {
    return {
      label: "Turn order",
      value: note.replace(/^Detected turn order:\s*/i, ""),
      toneClass: "border-[#4F8CFF]/24 bg-[#4F8CFF]/10 text-[#DCE8FF]",
    };
  }

  if (normalized.includes("detected opponent:")) {
    return {
      label: "Opponent",
      value: note.replace(/^Detected opponent:\s*/i, ""),
      toneClass: "border-[#4F8CFF]/24 bg-[#4F8CFF]/10 text-[#DCE8FF]",
    };
  }

  if (normalized.includes("opponent deck:")) {
    return {
      label: "Opponent deck",
      value: note.replace(/^Detected opponent deck:\s*/i, ""),
      toneClass: "border-emerald-400/22 bg-emerald-500/10 text-emerald-100",
    };
  }

  if (normalized.includes("could not confidently detect opponent deck")) {
    return {
      label: "Opponent deck",
      value: "Choose manually",
      detail: "Could not confidently detect opponent deck.",
      toneClass: "border-[#F5C84C]/22 bg-[#F5C84C]/9 text-[#FFE28A]",
    };
  }

  if (normalized.includes("saved to your profile")) {
    return {
      label: "TCG Live name",
      value: "Saved",
      toneClass: "border-emerald-400/22 bg-emerald-500/10 text-emerald-100",
    };
  }

  return {
    label: "Import note",
    value: note,
    toneClass: "border-[#334155]/70 bg-[#07111F]/62 text-[#D6E0F0]",
  };
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

function getNextIncompleteStep({
  opponentArchetype,
  result,
  wentFirst,
  startQuality,
  openingHandQuality,
  sequencingQuality,
}: {
  opponentArchetype: string;
  result: StepResultValue;
  wentFirst: StepWentFirstValue;
  startQuality?: MatchStartQuality;
  openingHandQuality?: MatchOpeningHandQuality;
  sequencingQuality?: MatchSequencingQuality;
}) {
  if (!opponentArchetype.trim()) {
    return 0;
  }

  if (!result) {
    return 1;
  }

  if (!wentFirst) {
    return 2;
  }

  if (!(startQuality && openingHandQuality && sequencingQuality)) {
    return 3;
  }

  return 4;
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
  initialTcgLivePlayerName,
  initialNotes,
  initialTags = [],
  initialMetadata,
  sessionCoach,
  secondaryHref = "/matches",
  secondaryLabel = "Match history",
  submitLabel = "Save game",
  wasSuccessful,
  rememberTcgLiveUsernameAction,
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
  const tcgLiveLogRef = useRef<HTMLTextAreaElement>(null);
  const [tcgLivePlayerName, setTcgLivePlayerName] = useState(() => {
    if (initialTcgLivePlayerName?.trim()) {
      return initialTcgLivePlayerName.trim();
    }

    if (typeof window === "undefined") {
      return "";
    }

    return sessionStorage.getItem(sessionKeys.tcgLivePlayerName) ?? "";
  });
  const [importStatus, setImportStatus] = useState<string[]>([]);
  const tcgLivePlayerNameRef = useRef<HTMLInputElement>(null);
  const [tcgLivePlayerNameError, setTcgLivePlayerNameError] = useState("");
  const [rememberTcgLiveName, setRememberTcgLiveName] = useState(false);
  const [importExpanded, setImportExpanded] = useState(false);
  const importPointerHandledRef = useRef(false);
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

  useEffect(() => {
    sessionStorage.setItem(sessionKeys.tcgLivePlayerName, tcgLivePlayerName);
  }, [tcgLivePlayerName]);

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
  const postSaveFocusSummary = sessionCoach
    ? buildPostSaveFocusSummary(
        sessionCoach,
        countedTowardMission,
        countedTowardContext
      )
    : null;
  const postSaveMissionProgress = postSaveFocusSummary?.missionProgress ?? null;
  const postSaveSignalLine = postSaveFocusSummary?.signalLine ?? null;
  const postSaveStatusBadge = sessionCoach
    ? !countedTowardMission
      ? sessionCoach.missionGuidanceMode === "priority_watchlist"
        ? "Outside watchlist"
        : "Outside focused test"
      : sessionCoach.completionStatus
        ? sessionCoach.completionStatus
        : sessionCoach.missionStatusLabel
    : "Game logged";
  const postSaveMissionCopy = sessionCoach
    ? postSaveFocusSummary?.missionCopy ??
      "This result was added to your matchup history."
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
  const postSaveRewardLine =
    postLogCoachLine?.line ??
    (wasSuccessful ? "Logged. Match history updated." : null);

  const rewardPrimaryButtonClass =
    `${primaryButton} h-12 shadow-[0_14px_30px_rgba(79,140,255,0.16)]`;
  const rewardSecondaryButtonClass =
    `${secondaryButton} h-12 bg-[#07111F]/62 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]`;

  async function importTcgLiveLog() {
    const log = (tcgLiveLogRef.current?.value ?? tcgLiveLog).trim();
    const playerName = (
      tcgLivePlayerNameRef.current?.value ?? tcgLivePlayerName
    ).trim();
    setImportExpanded(true);
    setTcgLiveLog(log);
    setTcgLivePlayerName(playerName);

    if (!log) {
      setImportStatus(["Paste a TCG Live log first."]);
      setTcgLivePlayerNameError("");
      return;
    }

    if (!playerName) {
      setTcgLivePlayerNameError("Add your TCG Live name to autofill this log.");
      setImportStatus([]);
      return;
    }

    setTcgLivePlayerNameError("");

    setStartQuality(undefined);
    setOpeningHandQuality(undefined);
    setSequencingQuality(undefined);

    const parsed = parseTcgLiveLog(log, {
      archetypeOptions: opponentArchetypeOptions,
      playerName,
    });

    const nextResult = parsed.result ?? result;
    const nextWentFirst =
      parsed.turnOrder === "first"
        ? "true"
        : parsed.turnOrder === "second"
          ? "false"
          : parsed.turnOrder === "unknown"
            ? "unknown"
            : wentFirst;
    const nextOpponentArchetype =
      parsed.opponentDeckGuess ?? opponentArchetype;

    if (parsed.result) {
      setResult(parsed.result);
    }

    if (parsed.turnOrder === "first") {
      setWentFirst("true");
    } else if (parsed.turnOrder === "second") {
      setWentFirst("false");
    } else if (parsed.turnOrder === "unknown") {
      setWentFirst("unknown");
    }

    if (parsed.opponentDeckGuess) {
      setOpponentArchetype(parsed.opponentDeckGuess);
    }

    setCurrentStep(
      getNextIncompleteStep({
        opponentArchetype: nextOpponentArchetype,
        result: nextResult,
        wentFirst: nextWentFirst,
      })
    );

    let nextImportStatus = parsed.notes;

    if (rememberTcgLiveName && rememberTcgLiveUsernameAction) {
      const rememberResult = await rememberTcgLiveUsernameAction(playerName);
      nextImportStatus = [
        ...nextImportStatus,
        rememberResult.error
          ? "Could not save TCG Live name to your profile."
          : "TCG Live name saved to your profile.",
      ];
    }

    setImportStatus(nextImportStatus);
  }

  function handleImportPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    importPointerHandledRef.current = true;
    void importTcgLiveLog();
  }

  function handleImportClick() {
    if (importPointerHandledRef.current) {
      importPointerHandledRef.current = false;
      return;
    }

    void importTcgLiveLog();
  }

  function clearImportedLog() {
    setTcgLiveLog("");
    setImportStatus([]);
    setTcgLivePlayerNameError("");
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
  const canAdvanceFromQuality = Boolean(
    startQuality && openingHandQuality && sequencingQuality
  );
  const canAdvanceFromReason =
    result === "win"
      ? positiveTags.length > 0
      : result === "loss"
        ? issueTags.length > 0
        : issueTags.length > 0 || positiveTags.length > 0;
  const canQuickSave =
    canAdvanceFromMatch &&
    canAdvanceFromResult &&
    canAdvanceFromTurnOrder &&
    canAdvanceFromQuality &&
    canAdvanceFromReason;
  const blockedNextMessage =
    currentStep === 0 && !canAdvanceFromMatch
      ? "Choose an opponent deck to continue."
      : currentStep === 1 && !canAdvanceFromResult
        ? "Choose win, loss, or tie."
        : currentStep === 2 && !canAdvanceFromTurnOrder
          ? "Choose whether you went first, second, or can't remember."
          : currentStep === 3 && !canAdvanceFromQuality
            ? "Rate the start, opening hand, and sequencing before continuing."
            : currentStep === 4 && !canAdvanceFromReason
              ? result === "win"
                ? "Add at least one positive reason before saving."
                : result === "loss"
                  ? "Add at least one issue reason before saving."
                  : "Add at least one reason tag before saving."
          : null;
  const activeDeckHeadline = selectedDeck?.label ?? "Choose a deck version";
  const activeDeckArchetype =
    selectedDeckSuggestion || selectedDeckArchetype || "Archetype not set yet";
  const activeVersionLine = selectedDeck?.label
    ? `Testing: ${selectedDeck.label}`
    : "Choose the test version you want to log with.";
  const desktopSummary = (
    <div className={`${cockpitCardClass} sticky top-4 p-3.5`}>
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-xl bg-[#4F8CFF]/12 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
          <Radio className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]/78">
            Live match card
          </p>
          <p className="text-sm font-semibold text-[#F8FAFC]">
            Updates as you log
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-[#0B1020]/56 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
        <p className="text-sm font-medium leading-6 text-[#F8FAFC]">
          {readySummary ||
            "Choose matchup, result, turn order, quality, and reason to complete the quick log."}
        </p>
      </div>

      <div className="mt-3 grid gap-2">
        {[
          {
            label: "Result",
            value: result ? getMatchResultLabel(result) : "Not set",
            tone:
              result === "win"
                ? "text-emerald-200"
                : result === "loss"
                  ? "text-rose-200"
                  : "text-[#DCE8FF]",
          },
          {
            label: "Turn order",
            value:
              wentFirst === "true"
                ? "First"
                : wentFirst === "false"
                  ? "Second"
                  : wentFirst === "unknown"
                    ? "Unknown"
                    : "Not set",
            tone: "text-[#DCE8FF]",
          },
          {
            label: "Tags",
            value: [...issueTags, ...positiveTags].length
              ? [...issueTags, ...positiveTags].slice(0, 2).join(", ")
              : "No tags yet",
            tone: "text-[#DCE8FF]",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-xl bg-[#07111F]/50 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.07)]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/76">
              {item.label}
            </span>
            <span className={`truncate text-sm font-semibold ${item.tone}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F5C84C]/8 px-3 py-2 text-xs font-medium leading-5 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.12)]">
        <Zap className="size-4 shrink-0" aria-hidden="true" />
        Clean logs strengthen Deck Lab and Review.
      </div>

      <Link href={secondaryHref} className={`mt-3 flex w-full items-center justify-center gap-2 ${secondaryButton}`}>
        <History className="size-4" aria-hidden="true" />
        {secondaryLabel}
      </Link>
    </div>
  );

  return (
    <div className="mt-3 grid min-w-0 gap-3">
      <form
        action={formAction}
        className={`w-full max-w-full min-w-0 overflow-x-hidden p-2 sm:p-3.5 ${glassPanelStrong}`}
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
                {postSaveRewardLine ? (
                  <p
                    data-testid="post-save-reward"
                    className="mt-3 inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]"
                  >
                    {postSaveRewardLine}
                  </p>
                ) : null}
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
                      Saved signal
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[#94A3B8]/76">
                    {postLogCoachLine.detail}
                  </p>
                </div>
              ) : null}

              {sessionCoach ? (
                <div className="rounded-[18px] bg-[#07111F]/40 p-3 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.10)] sm:rounded-[22px] sm:p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                        Current focus
                      </p>
                      <p className="mt-1 text-base font-semibold text-[#F8FAFC] sm:text-lg">
                        {sessionCoach.missionTitle}
                      </p>
                      <p className="mt-1 text-xs text-[#94A3B8]/72">
                        {sessionCoach.missionGuidanceLabel}
                      </p>
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
            <div className="grid min-w-0 gap-2.5 sm:gap-3">
              <section className="relative min-w-0 overflow-hidden rounded-[20px] bg-[radial-gradient(circle_at_15%_0%,rgba(79,140,255,0.20),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(245,200,76,0.10),transparent_28%),linear-gradient(135deg,rgba(14,27,50,0.96),rgba(7,17,31,0.90))] p-2.5 shadow-[0_16px_38px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(184,209,255,0.13)] sm:p-3">
                <div className="pointer-events-none absolute -right-20 -top-24 h-40 w-40 rounded-full bg-[#4F8CFF]/10 blur-3xl" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2.5 overflow-hidden">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(79,140,255,0.28),rgba(11,16,32,0.94))] shadow-[0_12px_28px_rgba(79,140,255,0.10),0_12px_24px_rgba(0,0,0,0.24),inset_0_0_0_1px_rgba(184,209,255,0.18)] sm:h-14 sm:w-14">
                      <ArchetypeSprites
                        archetype={selectedDeckSuggestion || selectedDeckArchetype}
                        size="md"
                        variant="bare"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="rounded-full bg-[#4F8CFF]/12 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                          Active test
                        </p>
                      </div>
                      <h2 className="mt-0.5 truncate text-lg font-semibold text-[#F8FAFC] sm:text-xl">
                        {activeDeckHeadline}
                      </h2>
                      <p className="mt-0.5 truncate text-sm font-medium text-[#D7E0EF]">
                        {activeDeckArchetype}
                      </p>
                      <p className="mt-0.5 truncate text-xs leading-5 text-[#94A3B8]/76">
                        {activeVersionLine}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium leading-5 text-[#DCE8FF]/86">
                        <Sparkles className="size-3.5 shrink-0 text-[#F5C84C]" aria-hidden="true" />
                        Clean games strengthen your reads.
                      </p>
                    </div>
                  </div>
                    <div className="relative flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[#07111F]/64 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
                        Step {currentStep + 1} of {stepOrder.length}
                      </span>
                    <span className="rounded-full bg-[#4F8CFF]/16 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[0_0_18px_rgba(79,140,255,0.10),inset_0_0_0_1px_rgba(79,140,255,0.22)]">
                      {stepOrder[currentStep]?.label}
                    </span>
                  </div>
                </div>
              </section>

              <div className="grid min-w-0 gap-2.5 sm:gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
                <div className="grid min-w-0 gap-2.5 sm:gap-3">
                  <section className={`${cockpitCardClass} p-2.5`}>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-7 items-center justify-center rounded-xl bg-[#4F8CFF]/12 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                            <ClipboardList className="size-3.5" aria-hidden="true" />
                          </span>
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                            Quick log
                          </p>
                        </div>
                        <p className="text-xs font-semibold text-[#DCE8FF]">
                          {stepOrder[currentStep]?.label}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#07111F]/72 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)]">
                        <div
                          className="h-1.5 rounded-full bg-[linear-gradient(90deg,#4F8CFF,#F5C84C)] shadow-[0_0_14px_rgba(79,140,255,0.20)] transition-[width,background-color]"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
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
                              className={`min-w-0 rounded-lg px-2 py-1.5 text-left transition-all ${
                                isCurrent
                                  ? "bg-[#4F8CFF]/17 text-[#F8FAFC] shadow-[0_0_22px_rgba(79,140,255,0.10),inset_0_0_0_1px_rgba(79,140,255,0.28)]"
                                  : isDone
                                    ? "bg-emerald-500/9 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(34,197,94,0.14)]"
                                    : "bg-[#07111F]/22 text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.04)]"
                              }`}
                            >
                              <span className="flex items-center gap-1.5 text-[11px] font-bold">
                                {isDone ? (
                                  <CheckCircle2 className="size-3.5 text-emerald-300" aria-hidden="true" />
                                ) : isCurrent ? (
                                  <CircleDot className="size-3.5 text-[#F5C84C]" aria-hidden="true" />
                                ) : null}
                                <span>{step.shortLabel}</span>
                              </span>
                              <span className="mt-0.5 block text-[11px] font-semibold leading-4 break-words">
                                {step.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  <section className={`${cockpitCardClass} p-2.5`}>
                    <button
                      type="button"
                      onClick={() => setImportExpanded((current) => !current)}
                      className="flex w-full min-w-0 items-center justify-between gap-3 text-left"
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#F5C84C]/10 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                          <Bot className="size-[18px]" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                            Import from TCG Live log
                          </p>
                          <p className="mt-0.5 text-sm leading-5 text-[#94A3B8]/76">
                            Paste a TCG Live battle log to autofill result, turn order, and opponent deck when possible.
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[#0B1020]/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
                        {importExpanded ? "Hide" : "Open"}
                      </span>
                    </button>

                    {importExpanded ? (
                      <div className="mt-2.5 grid min-w-0 gap-2.5">
                        <div className={`grid gap-2 p-2.5 ${cockpitInsetClass}`}>
                          <label htmlFor="tcg_live_player_name" className={label}>
                            Your TCG Live name
                          </label>
                          <input
                            id="tcg_live_player_name"
                            ref={tcgLivePlayerNameRef}
                            value={tcgLivePlayerName}
                            onChange={(event) => {
                              setImportExpanded(true);
                              setTcgLivePlayerName(event.target.value);
                              if (tcgLivePlayerNameError) {
                                setTcgLivePlayerNameError("");
                              }
                            }}
                            placeholder="DommitronNL"
                            className={`${inputH11} ${
                              tcgLivePlayerNameError
                                ? "border-rose-400/70 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]"
                                : ""
                            }`}
                          />
                          <p className="text-xs leading-5 text-[#94A3B8]/72">
                            Required for import so SixPrizer knows which player is you.
                          </p>
                          {rememberTcgLiveUsernameAction ? (
                            <label className="flex items-start gap-2 text-xs leading-5 text-[#D6E0F0]">
                              <input
                                type="checkbox"
                                checked={rememberTcgLiveName}
                                onChange={(event) =>
                                  setRememberTcgLiveName(event.target.checked)
                                }
                                className="mt-1 h-4 w-4 rounded border-[#334155] bg-[#07111F] text-[#F5C84C] focus:ring-[#F5C84C]/60"
                              />
                              <span>Remember this name on my profile</span>
                            </label>
                          ) : null}
                          {tcgLivePlayerNameError ? (
                            <p className="text-xs font-medium text-rose-200">
                              {tcgLivePlayerNameError}
                            </p>
                          ) : null}
                        </div>
                        <div className={`grid gap-2 p-2.5 ${cockpitInsetClass}`}>
                          <label htmlFor="tcg_live_log" className={label}>
                            TCG Live battle log
                          </label>
                          <textarea
                            id="tcg_live_log"
                            ref={tcgLiveLogRef}
                            value={tcgLiveLog}
                            onChange={(event) => {
                              setImportExpanded(true);
                              setTcgLiveLog(event.target.value);
                            }}
                            rows={5}
                            placeholder="Paste a TCG Live battle log"
                            className={`${textarea} min-h-[130px] w-full max-w-full min-w-0 bg-[#0B1020]/72 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.10)] focus:min-h-[170px]`}
                          />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onPointerDown={handleImportPointerDown}
                            onClick={handleImportClick}
                            className={`${primaryButton} w-full whitespace-nowrap sm:w-auto sm:min-w-[188px]`}
                          >
                            Autofill from log
                          </button>
                          <button
                            type="button"
                            onClick={clearImportedLog}
                            className={`${secondaryButton} w-full whitespace-nowrap sm:w-auto sm:min-w-[140px]`}
                          >
                            Clear import
                          </button>
                        </div>
                        {importStatus.length ? (
                          <div className={`grid gap-2 p-2.5 ${cockpitInsetClass}`}>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="size-4 text-emerald-300" aria-hidden="true" />
                              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/80">
                                Import read
                              </p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {importStatus.map((note) => {
                                const status = getImportStatusMeta(note);

                                return (
                                  <div
                                    key={note}
                                    className={`min-w-0 rounded-xl border px-3 py-2 ${status.toneClass}`}
                                  >
                                    <span className="sr-only">{note}</span>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-72">
                                      {status.label}
                                    </p>
                                    <p className="mt-1 truncate text-sm font-semibold">
                                      {status.value}
                                    </p>
                                    {"detail" in status && status.detail ? (
                                      <p className="mt-1 text-xs leading-4 opacity-75">
                                        {status.detail}
                                      </p>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </section>

                  <section className="min-w-0 rounded-[22px] bg-[linear-gradient(180deg,rgba(12,22,40,0.96),rgba(7,17,31,0.88))] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(79,140,255,0.14)] sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-7 items-center justify-center rounded-xl bg-[#4F8CFF]/12 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                          <Target className="size-3.5" aria-hidden="true" />
                        </span>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Current step
                        </p>
                      </div>
                      <p className="text-xs text-[#94A3B8]">
                        Step {currentStep + 1} of {stepOrder.length}
                      </p>
                    </div>

                    <div className="mt-2.5 min-w-0 rounded-[18px] bg-[#0B1020]/56 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] sm:mt-3 sm:p-3.5">
                  {currentStep === 0 ? (
                    <div className="grid gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Match
                        </p>
                        <h2 className="mt-1.5 text-[1.25rem] font-semibold leading-tight text-[#F8FAFC] sm:text-[1.45rem]">
                          Who did you play against?
                        </h2>
                        <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/76">
                          Start with the matchup. You can fill the rest in fast.
                        </p>
                      </div>

                      <div className={subCardClass}>
                        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                            className="w-full rounded-md bg-[#4F8CFF]/10 px-3 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/16 active:scale-[0.98] sm:w-auto"
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
                    <div className="grid gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Turn order
                        </p>
                        <h2 className="mt-1.5 text-[1.25rem] font-semibold leading-tight text-[#F8FAFC] sm:text-[1.45rem]">
                          Did you go first, second, or can&apos;t remember?
                        </h2>
                        <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/76">
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
                    <div className="grid gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          Result
                        </p>
                        <h2 className="mt-1.5 text-[1.25rem] font-semibold leading-tight text-[#F8FAFC] sm:text-[1.45rem]">
                          What was the result?
                        </h2>
                        <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/76">
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

                  {currentStep === 3 ? (
                    <div className="grid gap-3">
                      <div className="rounded-2xl bg-[radial-gradient(circle_at_top_left,rgba(79,140,255,0.14),transparent_32%),rgba(7,17,31,0.46)] p-2.5 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:p-3">
                        <div className="flex items-start gap-3">
                          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-2xl bg-[#4F8CFF]/12 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
                            <Zap className="size-[18px]" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                              Quality signal
                            </p>
                            <h2 className="mt-1.5 text-[1.25rem] font-semibold leading-tight text-[#F8FAFC] sm:text-[1.45rem]">
                              Rate how the game felt
                            </h2>
                            <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/76">
                              These subjective ratings stay manual. TCG Live import never fills them.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2.5 sm:gap-3">
                        <fieldset className={`${subCardClass} bg-[#07111F]/58`}>
                          <legend className={`${label} flex items-center gap-2`}>
                            <CircleDot className="size-3.5 text-[#F5C84C]" aria-hidden="true" />
                            Start
                          </legend>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {MATCH_START_QUALITY_OPTIONS.map((value) => (
                              (() => {
                                const isSelected = startQuality === value;
                                const tone = getQualityTone(value);

                                return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setStartQuality(value)}
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
                        <fieldset className={`${subCardClass} bg-[#07111F]/58`}>
                          <legend className={`${label} flex items-center gap-2`}>
                            <CircleDot className="size-3.5 text-[#F5C84C]" aria-hidden="true" />
                            Opening hand
                          </legend>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {MATCH_OPENING_HAND_OPTIONS.map((value) => (
                              (() => {
                                const isSelected = openingHandQuality === value;
                                const tone = getQualityTone(value);

                                return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setOpeningHandQuality(value)}
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
                        <fieldset className={`${subCardClass} bg-[#07111F]/58`}>
                          <legend className={`${label} flex items-center gap-2`}>
                            <CircleDot className="size-3.5 text-[#F5C84C]" aria-hidden="true" />
                            Sequencing
                          </legend>
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {MATCH_SEQUENCING_OPTIONS.map((value) => (
                              (() => {
                                const isSelected = sequencingQuality === value;
                                const tone = getQualityTone(value);

                                return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setSequencingQuality(value)}
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

                  {currentStep === 4 ? (
                    <div className="grid gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          What mattered?
                        </p>
                        <h2 className="mt-1.5 text-[1.25rem] font-semibold leading-tight text-[#F8FAFC] sm:text-[1.45rem]">
                          {primaryTagTitle}
                        </h2>
                        <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/76">
                          Add at least one reason tag before saving this game.
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
                    <div className="grid gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                          More context
                        </p>
                        <h2 className="mt-1.5 text-[1.25rem] font-semibold leading-tight text-[#F8FAFC] sm:text-[1.45rem]">
                          Anything worth remembering?
                        </h2>
                        <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/76">
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
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 rounded-[18px] bg-[linear-gradient(180deg,rgba(11,16,32,0.78),rgba(7,17,31,0.62))] p-2.5 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.12)] xl:hidden">
                  <div className="flex items-center gap-2">
                    <Radio className="size-4 text-[#F5C84C]" aria-hidden="true" />
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                      Live match card
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-5 text-[#F8FAFC] sm:leading-6">
                    {readySummary ||
                      "Choose matchup, result, turn order, quality, and reason to save."}
                  </p>
                  <p className="mt-2 text-sm text-[#94A3B8]/76">
                    {canQuickSave
                      ? "Ready to save, or add optional context."
                      : "This will update matchup trends and Deck Lab reads."}
                  </p>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:justify-between">
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

                  {currentStep < 4 ? (
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
                        (currentStep === 2 && !canAdvanceFromTurnOrder) ||
                        (currentStep === 3 && !canAdvanceFromQuality)
                      }
                      className={`h-12 w-full sm:w-auto ${
                        ((currentStep === 0 && !canAdvanceFromMatch) ||
                          (currentStep === 1 && !canAdvanceFromResult) ||
                          (currentStep === 2 && !canAdvanceFromTurnOrder) ||
                          (currentStep === 3 && !canAdvanceFromQuality))
                          ? `${secondaryButton} cursor-not-allowed opacity-50`
                          : primaryButton
                      }`}
                    >
                      Continue
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
                        disabled={!canAdvanceFromReason}
                        className={`${
                          !canAdvanceFromReason
                            ? `${secondaryButton} cursor-not-allowed opacity-50`
                            : secondaryButton
                        }`}
                      >
                        More context
                      </button>
                      <button
                        type="submit"
                        disabled={!canAdvanceFromReason}
                        className={`h-12 w-full text-base ${
                          !canAdvanceFromReason
                            ? `${secondaryButton} cursor-not-allowed opacity-50`
                            : primaryButton
                        }`}
                      >
                        Save now
                      </button>
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

              </div>
              <aside className="hidden xl:block">{desktopSummary}</aside>
            </div>
            </div>
          ) : null}
        </div>
      </form>
      {sessionCoach && !wasSuccessful ? (
        <section className="rounded-[18px] bg-[radial-gradient(circle_at_left,rgba(79,140,255,0.14),transparent_32%),linear-gradient(180deg,rgba(11,16,32,0.80),rgba(7,17,31,0.62))] p-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.14),inset_0_0_0_1px_rgba(79,140,255,0.12)] sm:rounded-[22px] sm:p-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#F5C84C]/10 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                <Target className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                  Current focus
                </p>
                <p className="mt-1 text-[15px] font-semibold text-[#F8FAFC] sm:text-lg">
                  {sessionCoach.missionTitle}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72 sm:text-sm">
                  {sessionCoach.nextAction}
                </p>
                <p className="mt-2 text-xs font-medium text-[#DCE8FF]/82">
                  Clean logs improve your Deck Lab reads.
                </p>
              </div>
            </div>
            <div className="w-fit rounded-full bg-[#0B1020]/56 px-3 py-1.5 text-[11px] font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
              {sessionCoach.missionProgress}/{sessionCoach.missionTargetCount} games
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
