"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
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

type SignalTone = "blue" | "gold" | "green" | "rose";
type GameContext = "testing" | "competitive";

const subCardClass =
  "rounded-xl bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]";

const largeToggleClass =
  "flex min-h-14 w-full items-center justify-center rounded-xl bg-[#07111F]/58 px-3 text-center text-base font-semibold text-[#D7E0EF] transition hover:bg-[#1A2238]/60 hover:text-[#F8FAFC] active:scale-[0.98]";

const mediumToggleClass =
  "flex min-h-12 w-full items-center justify-center rounded-lg bg-[#07111F]/56 px-3 text-center text-sm font-semibold text-[#B9C4D6] transition hover:bg-[#1A2238]/60 hover:text-[#F8FAFC] active:scale-[0.98]";

const tagToggleClass =
  "inline-flex min-h-11 w-full items-center justify-start rounded-lg bg-[#07111F]/52 px-3 py-2 text-left text-sm font-semibold text-[#A8B5C8] transition hover:bg-[#1A2238]/60 hover:text-[#F8FAFC] active:scale-[0.98]";

const selectedToggleClass =
  "bg-[#4F8CFF]/22 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.38),0_10px_24px_rgba(79,140,255,0.08)]";

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

function toggleSelection(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((candidate) => candidate !== value)
    : [...values, value];
}

function cleanChipValue(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function ChipInput({
  labelText,
  values,
  onChange,
  placeholder,
}: {
  labelText: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
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
  const [testingSessionName, setTestingSessionName] = useState("League block A");
  const [focusMatchup, setFocusMatchup] = useState("Mega Greninja");
  const [opponent, setOpponent] = useState("Mega Greninja");
  const [opponentVariant, setOpponentVariant] = useState("");
  const [result, setResult] = useState<MatchResult>("loss");
  const [wentFirst, setWentFirst] = useState(false);
  const [startQuality, setStartQuality] = useState<
    MatchStartQuality | undefined
  >("okay");
  const [openingHandQuality, setOpeningHandQuality] = useState<
    MatchOpeningHandQuality | undefined
  >("good");
  const [sequencingQuality, setSequencingQuality] = useState<
    MatchSequencingQuality | undefined
  >("okay");
  const [issueTags, setIssueTags] = useState<string[]>([
    "missed setup",
    "poor prize trade",
  ]);
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [cardsShined, setCardsShined] = useState<string[]>([]);
  const [cardsFailed, setCardsFailed] = useState<string[]>([]);
  const [learnings, setLearnings] = useState("");
  const [saved, setSaved] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [moreIssueTagsOpen, setMoreIssueTagsOpen] = useState(false);
  const opponentOptions = useMemo(
    () => getArchetypeOptions(null, [focusMatchup, opponent]),
    [focusMatchup, opponent]
  );

  const readySummary = useMemo(() => {
    const parts = [
      `${getVersionLabel(versionId)} vs ${opponent}`,
      getMatchResultLabel(result),
      wentFirst ? "Went first" : "Went second",
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

  const insightUpdate = getInsightUpdate({
    gameContext,
    result,
    issueTags,
    positiveTags,
  });

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
    setTestingSessionName("League block A");
    setFocusMatchup("Mega Greninja");
    setOpponent("Mega Greninja");
    setOpponentVariant("");
    setResult("loss");
    setWentFirst(false);
    setStartQuality("okay");
    setOpeningHandQuality("good");
    setSequencingQuality("okay");
    setIssueTags(["missed setup", "poor prize trade"]);
    setPositiveTags([]);
    setCardsShined([]);
    setCardsFailed([]);
    setLearnings("");
    setAdvancedOpen(false);
    setMoreIssueTagsOpen(false);
  }

  if (saved) {
    return (
      <section className="grid gap-4">
        <div className="rounded-md bg-[#0F1A2D]/74 p-5 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(34,197,94,0.18)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className="size-10 shrink-0 text-[#22C55E]"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#22C55E]">
                    Game logged
                  </p>
                  <h2 className="text-2xl font-bold text-[#F8FAFC] sm:text-3xl">
                    Structured signal preview
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#94A3B8]/82">
                Demo mode mirrors the structured logging flow without saving anything to your account.
              </p>
            </div>
            <span
              className={`w-fit rounded px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] ${signalCardClass(
                insightUpdate.tone
              )}`}
            >
              {insightUpdate.eyebrow}
            </span>
          </div>

          <div className="mt-5 rounded-md bg-[#07111F]/58 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
            <p className="text-lg font-bold text-[#F8FAFC]">
              {readySummary}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#94A3B8]/80">
              {insightUpdate.title}
            </p>
            <div className="mt-4 grid gap-2">
              {insightUpdate.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded bg-[#0F1A2D]/72 px-3 py-2 text-sm leading-6 text-[#F8FAFC]/88"
                >
                  {bullet}
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-md bg-[#4F8CFF]/10 px-3 py-2 text-sm font-medium leading-6 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.16)]">
              {gameContext === "competitive"
                ? `${opponent}: 4/5 focused games toward a stronger signal.`
                : `${opponent}: 4/5 focused games toward a building signal.`}
            </p>
            <p className="mt-4 rounded-md bg-[#F5C84C]/10 px-3 py-2 text-sm font-semibold leading-6 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
              {insightUpdate.recommendation}
            </p>
          </div>

          <p className="mt-4 text-sm font-medium text-[#F5C84C]">
            Demo mode only: no production data was changed.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={`${primaryButton} h-12`}
              onClick={resetForAnotherGame}
            >
              <RotateCcw className="mr-2 size-4" aria-hidden="true" />
              Log another game
            </button>
            <Link href="/demo/matchups" className={`${secondaryButton} h-12`}>
              Review matchup
            </Link>
            <Link href="/demo" className={`${secondaryButton} h-12`}>
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
              <p className="text-sm font-semibold text-[#F8FAFC]">Match</p>
              <p className="mt-1 text-xs leading-5 text-[#94A3B8]/72">
                Pick your deck and the matchup you just played.
              </p>
              <div className="mt-3 grid gap-3">
                <div className="rounded-lg bg-[#07111F]/42 p-3">
                  <label className={label}>Your deck</label>
                  <div className="mt-2 grid gap-2">
                    {versionOptions.map((version) => (
                      <button
                        key={version.id}
                        type="button"
                        onClick={() => setVersionId(version.id)}
                        className={`${tagToggleClass} ${
                          versionId === version.id ? selectedToggleClass : ""
                        }`}
                      >
                        <span className="block">
                          <span className="block text-sm font-semibold">
                            {version.label}
                          </span>
                          <span className="block text-xs opacity-75">
                            {version.archetype}
                            {version.active ? " | active" : ""}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-[#07111F]/42 p-3">
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
                    {(["win", "loss", "tie"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setResult(value)}
                        className={`${largeToggleClass} ${
                          result === value ? selectedToggleClass : ""
                        }`}
                      >
                        {getMatchResultLabel(value)}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="rounded-lg bg-[#07111F]/42 p-3">
                  <legend className={label}>Turn order</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[true, false].map((value) => (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => setWentFirst(value)}
                        className={`${mediumToggleClass} ${
                          wentFirst === value ? selectedToggleClass : ""
                        }`}
                      >
                        {value ? "First" : "Second"}
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
                        onClick={() => setPrimaryTags(toggleSelection(primaryTags, tag))}
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
                <legend className={label}>Anything else matter?</legend>
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
                    {MATCH_GAME_CONTEXT_OPTIONS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGameContext(value)}
                        className={`${mediumToggleClass} ${
                          gameContext === value ? selectedToggleClass : ""
                        }`}
                      >
                        {getGameContextLabel(value)}
                      </button>
                    ))}
                  </div>

                  {gameContext === "competitive" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label className={label}>Event name</label>
                        <input
                          value={eventName}
                          onChange={(event) => setEventName(event.target.value)}
                          placeholder="Optional"
                          className={inputH11}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={label}>Round number</label>
                        <input
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
                        <label className={label}>Testing session name</label>
                        <input
                          value={testingSessionName}
                          onChange={(event) =>
                            setTestingSessionName(event.target.value)
                          }
                          placeholder="Optional"
                          className={inputH11}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={label}>Focus matchup</label>
                        <input
                          value={focusMatchup}
                          onChange={(event) => setFocusMatchup(event.target.value)}
                          placeholder="Optional"
                          className={inputH11}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className={label}>Opponent variant</label>
                    <input
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
          </div>

          <div className="mt-4 rounded-xl bg-[#0B1020]/52 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
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

          <button type="submit" className={`${primaryButton} h-12 w-full text-base`}>
            Save demo game
          </button>
        </section>
      </form>
    </section>
  );
}
