"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import {
  inputH11,
  label,
  primaryButton,
  secondaryButton,
  textarea,
} from "@/components/brand-styles";
import { getArchetypeOptions } from "@/lib/archetypes";
import { demoDecks } from "@/lib/demo-data";
import {
  MATCH_ISSUE_TAG_OPTIONS,
  MATCH_POSITIVE_TAG_OPTIONS,
} from "@/lib/match-options";
import {
  getGameContextLabel,
  getMatchResultLabel,
  getQualityLabel,
  MATCH_GAME_CONTEXT_OPTIONS,
  MATCH_OPENING_HAND_OPTIONS,
  MATCH_SEQUENCING_OPTIONS,
  MATCH_START_QUALITY_OPTIONS,
  type MatchOpeningHandQuality,
  type MatchResult,
  type MatchSequencingQuality,
  type MatchStartQuality,
} from "@/lib/match-types";

type StepResultValue = MatchResult | "";
type StepWentFirstValue = boolean | "unknown" | null;
type SelectionTone = "blue" | "gold" | "emerald" | "rose";

type SignalTone = "blue" | "gold" | "green" | "rose";
type GameContext = "testing" | "competitive";

const subCardClass =
  "rounded-xl bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]";

const largeToggleClass =
  "group relative flex min-h-14 w-full items-center justify-center overflow-hidden rounded-2xl border border-[#23314A] bg-[linear-gradient(180deg,rgba(11,16,32,0.96),rgba(7,17,31,0.88))] px-3 text-center text-base font-semibold text-[#D7E0EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[#35507D] hover:bg-[#0D1830] hover:text-[#F8FAFC] hover:shadow-[0_12px_24px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(79,140,255,0.12)] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]";

const mediumToggleClass =
  "group relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl border border-[#223049] bg-[linear-gradient(180deg,rgba(11,16,32,0.94),rgba(7,17,31,0.86))] px-3 text-center text-sm font-semibold text-[#B9C4D6] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[#36507D] hover:text-[#F8FAFC] hover:shadow-[0_10px_22px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(79,140,255,0.10)] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]";

const tagToggleClass =
  "group relative inline-flex min-h-11 w-full items-center justify-start overflow-hidden rounded-xl border border-[#223049] bg-[linear-gradient(180deg,rgba(11,16,32,0.94),rgba(7,17,31,0.86))] px-3 py-2 text-left text-sm font-semibold text-[#A8B5C8] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-[#36507D] hover:text-[#F8FAFC] hover:shadow-[0_10px_22px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(79,140,255,0.10)] active:translate-y-0 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]";

const selectedToggleClass =
  "border-[#7CB4FF] bg-[linear-gradient(180deg,rgba(79,140,255,0.36),rgba(24,57,120,0.92))] text-[#F8FAFC] shadow-[0_16px_34px_rgba(79,140,255,0.18),inset_0_0_0_1px_rgba(184,209,255,0.42),inset_0_1px_0_rgba(255,255,255,0.12)] -translate-y-[1px]";

const selectedGoldToggleClass =
  "border-[#F5C84C] bg-[linear-gradient(180deg,rgba(245,200,76,0.28),rgba(107,78,13,0.94))] text-[#FFF8E1] shadow-[0_16px_34px_rgba(245,200,76,0.16),inset_0_0_0_1px_rgba(255,226,138,0.38),inset_0_1px_0_rgba(255,255,255,0.10)] -translate-y-[1px]";

const selectedEmeraldToggleClass =
  "border-[#34D399] bg-[linear-gradient(180deg,rgba(16,185,129,0.28),rgba(7,85,65,0.94))] text-[#ECFDF5] shadow-[0_16px_34px_rgba(16,185,129,0.16),inset_0_0_0_1px_rgba(167,243,208,0.36),inset_0_1px_0_rgba(255,255,255,0.10)] -translate-y-[1px]";

const selectedRoseToggleClass =
  "border-[#FB7185] bg-[linear-gradient(180deg,rgba(244,63,94,0.26),rgba(101,20,43,0.96))] text-[#FFF1F4] shadow-[0_16px_34px_rgba(244,63,94,0.16),inset_0_0_0_1px_rgba(255,189,206,0.34),inset_0_1px_0_rgba(255,255,255,0.10)] -translate-y-[1px]";

const progressStepClass =
  "flex items-center gap-3 rounded-xl px-3 py-3 text-left transition";

const rewardStatCardClass =
  "rounded-2xl bg-[#07111F]/62 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]";

const rewardDetailChipClass =
  "rounded-2xl bg-[#0B1020]/72 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]";

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

function getVersionLabel(versionId: string) {
  const deck = demoDecks.find((candidate) =>
    candidate.versions.some((version) => version.id === versionId)
  );
  const version = deck?.versions.find((candidate) => candidate.id === versionId);

  if (!deck || !version) {
    return "Dragapult v2";
  }

  return `${deck.archetype} ${version.name.replace(/^v/i, "v")}`;
}

function signalCardClass(tone: SignalTone) {
  if (tone === "green") {
    return "bg-emerald-500/[0.08] text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.20)]";
  }

  if (tone === "rose") {
    return "bg-rose-500/[0.09] text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.20)]";
  }

  if (tone === "gold") {
    return "bg-[#F5C84C]/[0.10] text-[#FFF1B8] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.22)]";
  }

  return "bg-[#4F8CFF]/[0.09] text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]";
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

function getWentFirstLabel(value: StepWentFirstValue) {
  if (value === true) {
    return "First";
  }

  if (value === false) {
    return "Second";
  }

  if (value === "unknown") {
    return "Turn order unknown";
  }

  return "Turn order not set";
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

function toggleSelection(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
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

function ChipInput({
  labelText,
  values,
  onChange,
  placeholder,
  helperText,
}: {
  labelText: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
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
        {helperText ? (
          <p className="mt-2 text-xs leading-5 text-[#94A3B8]/68">{helperText}</p>
        ) : null}
      </div>
    </div>
  );
}

function getInsightUpdate({
  gameContext,
  result,
  issueTags,
  positiveTags,
}: {
  gameContext: GameContext;
  result: MatchResult;
  issueTags: string[];
  positiveTags: string[];
}) {
  if (result === "win") {
    return {
      eyebrow: "Trend improved",
      title: "This demo game would improve the matchup sample",
      bullets: [
        "The win would raise the matchup sample without changing production data.",
        "Turn-order, opening-hand, and sequencing splits would still update.",
        "SixPrizer would wait for more games before making a big recommendation change.",
      ],
      recommendation:
        "Keep adding structured games until the pattern becomes a stronger signal.",
      tone: "green" as const,
    };
  }

  if (result === "tie") {
    return {
      eyebrow: "Sample updated",
      title: "This demo game would add context without changing the win/loss split",
      bullets: [
        "A tie still counts as a logged game in SixPrizer.",
        "Confidence and turn-order patterns would continue to build.",
        "Ties usually mean you need more testing before changing the deck.",
      ],
      recommendation:
        "Treat this as a building signal and keep logging the matchup.",
      tone: "blue" as const,
    };
  }

  return {
    eyebrow: gameContext === "competitive" ? "Competitive review" : "Testing review",
    title: "This demo loss would add a structured review point",
    bullets: [
      issueTags.length
        ? `Issue tags tracked: ${issueTags.slice(0, 2).join(", ")}.`
        : "No issue tags selected yet.",
      positiveTags.length
        ? `Positive tags still tracked: ${positiveTags.slice(0, 2).join(", ")}.`
        : "No positive tags selected yet.",
      "SixPrizer would use this structured log to compare future games.",
    ],
    recommendation:
      "Keep the sample moving until the issue pattern is clear enough to trust.",
    tone: "gold" as const,
  };
}

export function DemoMatchLogForm() {
  const [versionId, setVersionId] = useState("dragapult-v2");
  const [gameContext, setGameContext] = useState<GameContext>("testing");
  const [eventName, setEventName] = useState("");
  const [roundNumber, setRoundNumber] = useState("");
  const [testingSessionName, setTestingSessionName] = useState("");
  const [focusMatchup, setFocusMatchup] = useState("");
  const [opponent, setOpponent] = useState("");
  const [opponentVariant, setOpponentVariant] = useState("");
  const [result, setResult] = useState<StepResultValue>("");
  const [wentFirst, setWentFirst] = useState<StepWentFirstValue>(null);
  const [startQuality, setStartQuality] = useState<
    MatchStartQuality | undefined
  >(undefined);
  const [openingHandQuality, setOpeningHandQuality] = useState<
    MatchOpeningHandQuality | undefined
  >(undefined);
  const [sequencingQuality, setSequencingQuality] = useState<
    MatchSequencingQuality | undefined
  >(undefined);
  const [issueTags, setIssueTags] = useState<string[]>([]);
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [cardsShined, setCardsShined] = useState<string[]>([]);
  const [cardsFailed, setCardsFailed] = useState<string[]>([]);
  const [learnings, setLearnings] = useState("");
  const [saved, setSaved] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [moreIssueTagsOpen, setMoreIssueTagsOpen] = useState(false);
  const [showSecondaryTags, setShowSecondaryTags] = useState(false);
  const opponentOptions = useMemo(
    () => getArchetypeOptions(null, [focusMatchup, opponent]),
    [focusMatchup, opponent]
  );

  const readySummary = useMemo(() => {
    const parts = [
      opponent ? `${getVersionLabel(versionId)} vs ${opponent}` : getVersionLabel(versionId),
      result ? getMatchResultLabel(result) : "Result not set",
      getWentFirstLabel(wentFirst),
    ];
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

    return parts.join(" | ");
  }, [
    issueTags,
    openingHandQuality,
    opponent,
    positiveTags,
    result,
    sequencingQuality,
    startQuality,
    versionId,
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
  const progressPercent = ((currentStep + 1) / stepOrder.length) * 100;
  const secondaryToggleLabel =
    result === "win"
      ? "Add issues too"
      : result === "tie"
        ? "Show both sides"
        : "Add positives too";
  const canAdvanceFromMatch = Boolean(opponent.trim());
  const canAdvanceFromTurnOrder = wentFirst !== null;
  const canAdvanceFromResult = result === "win" || result === "loss" || result === "tie";
  const blockedNextMessage =
    currentStep === 0 && !canAdvanceFromMatch
      ? "Choose an opponent deck to continue."
      : currentStep === 1 && !canAdvanceFromTurnOrder
        ? "Choose whether you went first, second, or can't remember."
        : currentStep === 2 && !canAdvanceFromResult
          ? "Choose win, loss, or tie."
          : null;
  const finalizedResult: MatchResult =
    result === "win" || result === "loss" || result === "tie" ? result : "loss";

  const insightUpdate = getInsightUpdate({
    gameContext,
    result: finalizedResult,
    issueTags,
    positiveTags,
  });

  const summaryChipClass =
    "inline-flex items-center rounded-full bg-[#0B1020]/72 px-2.5 py-1 text-[11px] font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]";
  const desktopSummary = (
    <div className="rounded-xl bg-[#0B1020]/52 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
        Live summary
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-[#F8FAFC]">
        {readySummary || "Start with a matchup, then add result and turn order."}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={summaryChipClass}>
          Result: {result ? getMatchResultLabel(result) : "Not set"}
        </span>
        <span className={summaryChipClass}>Turn order: {getWentFirstLabel(wentFirst)}</span>
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
      <Link href="/demo/matches" className={`mt-3 block w-full ${secondaryButton}`}>
        Demo matches
      </Link>
    </div>
  );
  const demoStatusBadge =
    result === "win"
      ? "Actionable signal"
      : result === "tie"
        ? "Building signal"
        : "Needs games";
  const demoMissionSupportLine =
    demoStatusBadge === "Actionable signal"
      ? "This strengthened the current watchlist read. Review before changing your list."
      : demoStatusBadge === "Building signal"
        ? "Building signal. One more game makes this pattern easier to trust."
        : "Needs games. Keep logging normally until this watchlist becomes actionable.";
  const demoStatChips = [
    { label: "Matchup sample", value: "+1 matchup game" },
    {
      label: "Turn-order sample",
      value:
        wentFirst === true
          ? "+1 first-turn game"
          : wentFirst === false
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
  const demoAddedItems = [
    opponent ? { label: "Matchup", value: opponent } : null,
    wentFirst === null
      ? null
      : { label: "Turn order", value: getWentFirstLabel(wentFirst) },
    openingHandQuality
      ? { label: "Opening hand", value: getQualityLabel(openingHandQuality) }
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
  const demoNextActionTitle =
    result === "win"
      ? "Review this matchup"
      : "Log next game";
  const demoNextActionCopy =
    result === "win"
      ? "The sample improved. Review the matchup before changing your list."
      : result === "tie"
        ? "Keep logging normally. When this matchup appears, capture one more watchlist game."
        : "Keep logging normally until the issue pattern is easier to trust.";
  const rewardPrimaryButtonClass =
    `${primaryButton} h-12 shadow-[0_14px_30px_rgba(79,140,255,0.16)]`;
  const rewardSecondaryButtonClass =
    `${secondaryButton} h-12 bg-[#07111F]/62 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]`;

  const versionOptions = useMemo(
    () =>
      demoDecks.flatMap((deck) =>
        deck.versions.map((version) => ({
          id: version.id,
          label: `${deck.name} | ${version.name}`,
          archetype: deck.archetype,
          active: version.isActive,
        }))
      ),
    []
  );

  function resetForAnotherGame() {
    setSaved(false);
    setGameContext("testing");
    setEventName("");
    setRoundNumber("");
    setTestingSessionName("");
    setFocusMatchup("");
    setOpponent("");
    setOpponentVariant("");
    setResult("");
    setWentFirst(null);
    setStartQuality(undefined);
    setOpeningHandQuality(undefined);
    setSequencingQuality(undefined);
    setIssueTags([]);
    setPositiveTags([]);
    setCardsShined([]);
    setCardsFailed([]);
    setLearnings("");
    setCurrentStep(0);
    setMoreIssueTagsOpen(false);
    setShowSecondaryTags(false);
  }

  if (saved) {
    return (
      <section className="grid gap-4">
        <div className="grid gap-4">
          <div className="rounded-[28px] bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_34%),linear-gradient(180deg,rgba(15,26,45,0.96),rgba(7,17,31,0.88))] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(34,197,94,0.18)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-emerald-500/14 text-emerald-300 shadow-[0_14px_28px_rgba(34,197,94,0.12),inset_0_0_0_1px_rgba(34,197,94,0.20)]">
                    <CheckCircle2 className="size-7" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#22C55E]">
                      Game logged
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
                      {result === "win"
                        ? "Watchlist read updated."
                        : "Testing sample updated."}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 text-base font-semibold leading-7 text-[#F8FAFC]">
                  {readySummary}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]/76">
                  {result === "win"
                    ? "This demo log strengthens the watchlist read."
                    : "This demo log adds one more data point to the testing loop."}
                </p>
              </div>
              <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] ${signalCardClass(
                insightUpdate.tone
              )}`}>
                {demoStatusBadge}
              </span>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {demoStatChips.map((chip) => (
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

          <div className="rounded-[24px] bg-[#07111F]/38 p-4 shadow-[inset_0_0_0_1px_rgba(79,140,255,0.12)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                  Mission progress
                </p>
                <p className="mt-1 text-lg font-semibold text-[#F8FAFC]">
                  {gameContext === "competitive" ? "Round-by-round review" : "Build matchup confidence"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#94A3B8]/72">
                  {gameContext === "competitive" ? "Focused test" : "Priority watchlist"}
                </p>
              </div>
              <span className="rounded-full bg-[#F5C84C]/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
                {demoStatusBadge}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#F8FAFC]">
                4/5 games
              </p>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-6 rounded-full ${
                      index < 4 ? "bg-[#4F8CFF]" : "bg-[#1A2238]"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[#0B1020]/72">
              <div className="h-2 w-[80%] rounded-full bg-[#4F8CFF]" />
            </div>
            <p className="mt-3 text-sm font-medium text-[#D7E0EF]">
              {gameContext === "competitive" && demoStatusBadge === "Actionable signal"
                ? "This focused round is ready for review."
                : demoMissionSupportLine}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#94A3B8]/72">
              {gameContext === "competitive"
                ? `${opponent}: 4/5 focused games. One more round unlocks review.`
                : `${opponent}: 4/5 watchlist games. One more matchup unlocks review.`}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="rounded-[24px] bg-[#07111F]/34 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#F5C84C]" aria-hidden="true" />
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  What this added
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {demoAddedItems.length ? (
                  demoAddedItems.map((item) => (
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
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-[#94A3B8]">
                  Why this matters
                </summary>
                <p className="mt-2 text-sm text-[#B9C4D6]">
                  {gameContext === "competitive"
                    ? `${opponent}: 4/5 focused games toward a stronger signal.`
                    : `${opponent}: 4/5 watchlist games toward a stronger read.`}
                </p>
              </details>
            </div>

            <div className="rounded-[24px] bg-[#0B1020]/58 p-4 shadow-[inset_0_0_0_1px_rgba(245,200,76,0.14)]">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                Next best action
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                {demoNextActionTitle}
              </p>
              <p className="mt-2 text-sm text-[#94A3B8]">
                {demoNextActionCopy}
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#07111F]/60 px-3 py-2 text-sm font-medium text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <ArrowRight className="size-4 text-[#F5C84C]" aria-hidden="true" />
                Demo mode only. No production data changed.
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <button
              type="button"
              className={rewardPrimaryButtonClass}
              onClick={resetForAnotherGame}
            >
              <RotateCcw className="mr-2 size-4" aria-hidden="true" />
              Log another game
            </button>
            <Link href="/demo/matchups" className={rewardSecondaryButtonClass}>
              Review matchup
            </Link>
            <Link href="/demo" className={rewardSecondaryButtonClass}>
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <form
        className="grid gap-4 rounded-md bg-[#0F1A2D]/74 p-4 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.09)] backdrop-blur sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
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
                    <label className={label}>Your deck</label>
                    <div className="mt-2 grid gap-2">
                      {versionOptions.map((version) => (
                        (() => {
                          const isSelected = versionId === version.id;

                          return (
                        <button
                          key={version.id}
                          type="button"
                          onClick={() => setVersionId(version.id)}
                          aria-pressed={isSelected}
                          className={`${tagToggleClass} ${
                            isSelected ? getSelectedToneClass("blue") : ""
                          }`}
                        >
                          <span className="flex items-start gap-2">
                            {isSelected ? <SelectionMark tone="blue" /> : null}
                            <span className="block">
                              <span className="block text-sm font-semibold">
                                {version.label}
                              </span>
                              <span className="block text-xs opacity-75">
                                {version.archetype}
                                {version.active ? " | active" : ""}
                              </span>
                            </span>
                          </span>
                        </button>
                          );
                        })()
                      ))}
                    </div>
                  </div>
                  <div className={subCardClass}>
                    <ArchetypePicker
                      id="demo_opponent_archetype"
                      name="demo_opponent_archetype"
                      label="Opponent deck"
                      options={opponentOptions}
                      value={opponent}
                      placeholder="Search all known archetypes or type your own"
                      maxOptions={7}
                      listMaxHeightClassName="max-h-48"
                      onValueChange={setOpponent}
                    />
                    {opponent ? (
                      <p className="mt-2 text-xs font-medium text-[#B8D1FF]">
                        Selected matchup: {opponent}
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
                      Choose turn order, or mark unknown if you can&apos;t remember.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { value: true, label: "First" },
                      { value: false, label: "Second" },
                      { value: "unknown" as const, label: "Can't remember" },
                    ].map(({ value, label }) => (
                      (() => {
                        const isSelected = wentFirst === value;

                        return (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => setWentFirst(value)}
                        aria-pressed={isSelected}
                        className={`${largeToggleClass} ${
                          isSelected ? getSelectedToneClass("blue") : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected ? <SelectionMark tone="blue" /> : null}
                          <span>{label}</span>
                        </span>
                      </button>
                        );
                      })()
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
                    {(["win", "loss", "tie"] as const).map((value) => (
                      (() => {
                        const isSelected = result === value;
                        const tone = getResultTone(value);

                        return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setResult(value)}
                        aria-pressed={isSelected}
                        className={`${largeToggleClass} ${
                          isSelected ? getSelectedToneClass(tone) : ""
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {isSelected ? <SelectionMark tone={tone} /> : null}
                          <span>{getMatchResultLabel(value)}</span>
                        </span>
                      </button>
                        );
                      })()
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
                                openingHandQuality === value ? undefined : value
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
                                sequencingQuality === value ? undefined : value
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
                        (() => {
                          const isSelected = primaryTags.includes(tag);
                          const tone = result === "win" ? "emerald" : "rose";

                          return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setPrimaryTags(toggleSelection(primaryTags, tag))}
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
                        onClick={() => setMoreIssueTagsOpen((current) => !current)}
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
                            onClick={() => setPrimaryTags(toggleSelection(primaryTags, tag))}
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
                    helperText="Press Enter or Add. Demo custom tags stay local to this sample game."
                  />
                  <div className={subCardClass}>
                    <button
                      type="button"
                      onClick={() => setShowSecondaryTags((current) => !current)}
                      className="rounded-md bg-[#07111F]/56 px-3 py-2 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#1A2238]/60"
                    >
                      {secondaryToggleLabel}
                    </button>
                    {showSecondaryTags ? (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-[#F8FAFC]">
                          Anything else matter?
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
                                setSecondaryTags(toggleSelection(secondaryTags, tag))
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
                            helperText="Use this for rare details that would not fit a fixed tag."
                          />
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
                      {MATCH_GAME_CONTEXT_OPTIONS.map((value) => (
                        (() => {
                          const isSelected = gameContext === value;

                          return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setGameContext(value)}
                          aria-pressed={isSelected}
                          className={`${mediumToggleClass} ${
                            isSelected ? getSelectedToneClass("gold") : ""
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isSelected ? <SelectionMark tone="gold" /> : null}
                            <span>{getGameContextLabel(value)}</span>
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
                        <label className={label}>Event name</label>
                        <input
                          value={eventName}
                          onChange={(event) => setEventName(event.target.value)}
                          placeholder="Optional"
                          className={`${inputH11} mt-2`}
                        />
                      </div>
                      <div className={subCardClass}>
                        <label className={label}>Round number</label>
                        <input
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
                        <label className={label}>Testing session name</label>
                        <input
                          value={testingSessionName}
                          onChange={(event) =>
                            setTestingSessionName(event.target.value)
                          }
                          placeholder="Optional"
                          className={`${inputH11} mt-2`}
                        />
                      </div>
                      <div className={subCardClass}>
                        <label className={label}>Priority matchup</label>
                        <input
                          value={focusMatchup}
                          onChange={(event) => setFocusMatchup(event.target.value)}
                          placeholder="Optional"
                          className={`${inputH11} mt-2`}
                        />
                      </div>
                    </div>
                  )}

                  <div className={subCardClass}>
                    <label className={label}>Opponent variant</label>
                    <input
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
                      />
                      <ChipInput
                        labelText="Cards that failed"
                        values={cardsFailed}
                        onChange={setCardsFailed}
                        placeholder="Type a card name and press Enter"
                      />
                    </div>
                  </div>

                  <div className={subCardClass}>
                    <label className={label}>One learning</label>
                    <textarea
                      className={`${textarea} mt-2 min-h-24 text-sm`}
                      value={learnings}
                      onChange={(event) => setLearnings(event.target.value)}
                      placeholder="Example: I lost because I missed second attacker and fell behind on prizes."
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl bg-[#0B1020]/52 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)] xl:hidden">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#F5C84C]">
                Ready to save
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#F8FAFC]">
                {readySummary}
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
                    onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
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
                    setCurrentStep((step) => Math.min(step + 1, stepOrder.length - 1))
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
                  <button
                    type="submit"
                    className={`${primaryButton} h-12 w-full text-base`}
                  >
                    Save game
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden xl:block">{desktopSummary}</aside>
        </div>
      </form>
    </section>
  );
}
