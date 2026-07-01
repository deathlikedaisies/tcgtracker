"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  glassPanel,
  inputH10,
  label,
  premiumInset,
  primaryButton,
  secondaryButton,
  subtlePill,
  textarea,
} from "@/components/brand-styles";
import type { CreateEventState } from "@/app/events/actions";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_MATCH_STRUCTURE_LABELS,
  EVENT_TYPE_OPTIONS,
  MATCH_SCORE_OPTIONS,
  getDefaultMatchStructure,
  type EventMatchStructure,
  type EventType,
} from "@/lib/events";
import {
  MATCH_ISSUE_TAG_OPTIONS,
  MATCH_POSITIVE_TAG_OPTIONS,
} from "@/lib/match-options";

type DeckOption = {
  id: string;
  name: string;
  archetype: string | null;
  versions: {
    id: string;
    name: string;
    isActive: boolean;
  }[];
};

type EventFormProps = {
  action: (
    state: CreateEventState,
    formData: FormData
  ) => Promise<CreateEventState>;
  decks: DeckOption[];
  initialEventType?: string;
};

type RoundDraft = {
  id: string;
  opponent: string;
  result: "win" | "loss" | "tie";
  score: string;
  wentFirst: "unknown" | "true" | "false";
  tags: string[];
  notes: string;
};

const tagOptions = Array.from(
  new Set([...MATCH_ISSUE_TAG_OPTIONS, ...MATCH_POSITIVE_TAG_OPTIONS])
);

const resultOptions = [
  { value: "win", label: "W", fullLabel: "Win" },
  { value: "loss", label: "L", fullLabel: "Loss" },
  { value: "tie", label: "T", fullLabel: "Tie" },
] as const;

const turnOrderOptions = [
  { value: "unknown", label: "Unknown" },
  { value: "true", label: "First" },
  { value: "false", label: "Second" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? "Saving event..." : "Save event"}
    </button>
  );
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialEventType(value: string | undefined): EventType {
  return EVENT_TYPE_OPTIONS.includes(value as EventType)
    ? (value as EventType)
    : "Local";
}

function createRoundDraft(): RoundDraft {
  return {
    id: crypto.randomUUID(),
    opponent: "",
    result: "win",
    score: "2-0",
    wentFirst: "unknown",
    tags: [],
    notes: "",
  };
}

function getRecord(rounds: RoundDraft[]) {
  return rounds.reduce(
    (record, round) => {
      if (round.result === "win") record.wins += 1;
      if (round.result === "loss") record.losses += 1;
      if (round.result === "tie") record.ties += 1;
      return record;
    },
    { wins: 0, losses: 0, ties: 0 }
  );
}

function formatRecord(rounds: RoundDraft[]) {
  const record = getRecord(rounds);
  return `${record.wins}-${record.losses}-${record.ties}`;
}

function updateRound(
  rounds: RoundDraft[],
  id: string,
  patch: Partial<RoundDraft>
) {
  return rounds.map((round) =>
    round.id === id ? { ...round, ...patch } : round
  );
}

export function EventForm({
  action,
  decks,
  initialEventType,
}: EventFormProps) {
  const startingEventType = getInitialEventType(initialEventType);
  const initialDeck = decks[0];
  const initialVersion =
    initialDeck?.versions.find((version) => version.isActive) ??
    initialDeck?.versions[0];
  const [state, formAction] = useActionState(action, { error: null });
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>(startingEventType);
  const [matchStructure, setMatchStructure] = useState<EventMatchStructure>(
    getDefaultMatchStructure(startingEventType)
  );
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeck?.id ?? "");
  const [selectedVersionId, setSelectedVersionId] = useState(
    initialVersion?.id ?? ""
  );
  const [rounds, setRounds] = useState<RoundDraft[]>([
    createRoundDraft(),
    createRoundDraft(),
    createRoundDraft(),
  ]);
  const [activeRoundId, setActiveRoundId] = useState(rounds[0]?.id ?? "");
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
  const visibleVersions = selectedDeck?.versions ?? [];
  const selectedVersionExists = visibleVersions.some(
    (version) => version.id === selectedVersionId
  );
  const resolvedVersionId = selectedVersionExists
    ? selectedVersionId
    : visibleVersions[0]?.id ?? "";
  const selectedVersion = visibleVersions.find(
    (version) => version.id === resolvedVersionId
  );
  const eventTagOptions = useMemo(() => tagOptions, []);
  const topTags = Array.from(
    new Set(rounds.flatMap((round) => round.tags))
  ).slice(0, 4);

  function addRound() {
    const nextRound = createRoundDraft();
    setRounds((current) => [...current, nextRound]);
    setActiveRoundId(nextRound.id);
  }

  function removeRound(id: string) {
    setRounds((current) => {
      const nextRounds = current.filter((round) => round.id !== id);
      if (!nextRounds.some((round) => round.id === activeRoundId)) {
        setActiveRoundId(nextRounds[0]?.id ?? "");
      }
      return nextRounds;
    });
  }

  function handleEventTypeChange(value: EventType) {
    setEventType(value);
    setMatchStructure(getDefaultMatchStructure(value));
  }

  return (
    <form action={formAction} className="grid gap-5">
      {state?.error ? (
        <div className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm font-medium text-rose-100">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="round_count" value={rounds.length} />

      <section
        className={`${glassPanel} overflow-hidden p-4 sm:p-5 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_0%,rgba(79,140,255,0.16),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(245,200,76,0.10),transparent_30%)] before:content-['']`}
      >
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4F8CFF]">
              Build your event run
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#F8FAFC]">
              Log every round once.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8]">
              SixPrizer turns the run into matchup data, deck-version stats,
              and a post-event review.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="name" className={label}>
                  Event name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                  placeholder="CoreTCG Weekly"
                  className={inputH10}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="event_date" className={label}>
                  Event date
                </label>
                <input
                  id="event_date"
                  name="event_date"
                  type="date"
                  required
                  defaultValue={todayInputValue()}
                  className={inputH10}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="event_type" className={label}>
                  Event type
                </label>
                <select
                  id="event_type"
                  name="event_type"
                  value={eventType}
                  onChange={(event) =>
                    handleEventTypeChange(event.target.value as EventType)
                  }
                  className={inputH10}
                >
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="format" className={label}>
                  Format
                </label>
                <select id="format" name="format" className={inputH10}>
                  {EVENT_FORMAT_OPTIONS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="mt-4 grid gap-2">
              <legend className={label}>Match structure</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["bo1", "bo3"] as const).map((structure) => (
                  <label
                    key={structure}
                    className={`cursor-pointer rounded-2xl px-3 py-3 text-sm font-semibold transition shadow-[inset_0_0_0_1px_rgba(148,163,184,0.11)] ${
                      matchStructure === structure
                        ? "bg-[#4F8CFF]/16 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.34),0_12px_24px_rgba(79,140,255,0.10)]"
                        : "bg-[#07111F]/58 text-[#94A3B8] hover:bg-[#14243F]/68 hover:text-[#F8FAFC]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="match_structure"
                      value={structure}
                      checked={matchStructure === structure}
                      onChange={() => setMatchStructure(structure)}
                      className="sr-only"
                    />
                    {EVENT_MATCH_STRUCTURE_LABELS[structure]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <aside className={`${premiumInset} relative p-4`}>
            <div className="flex items-start gap-3">
              <ArchetypeSprites
                archetype={selectedDeck?.archetype ?? selectedDeck?.name ?? null}
                size="lg"
              />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#FFE28A]">
                  Event run preview
                </p>
                <h3 className="mt-1 truncate text-lg font-semibold text-[#F8FAFC]">
                  {eventName || "Unnamed event"}
                </h3>
                <p className="mt-1 truncate text-sm text-[#94A3B8]">
                  {selectedDeck?.name ?? "No deck"}{" "}
                  {selectedVersion ? `- ${selectedVersion.name}` : ""}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-[#07111F]/64 px-3 py-2">
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#94A3B8]">
                  Record
                </p>
                <p className="mt-1 text-xl font-semibold text-[#F8FAFC]">
                  {formatRecord(rounds)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#07111F]/64 px-3 py-2">
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#94A3B8]">
                  Structure
                </p>
                <p className="mt-1 text-xl font-semibold text-[#F8FAFC]">
                  {matchStructure.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-1.5">
              {rounds.slice(0, 5).map((round, index) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[#07111F]/52 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-[#D7E0EF]">
                    R{index + 1}: {round.opponent || "Opponent deck"}
                  </span>
                  <span className={subtlePill}>{round.result.toUpperCase()}</span>
                </div>
              ))}
            </div>
            {topTags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {topTags.map((tag) => (
                  <span key={tag} className={subtlePill}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className={`${glassPanel} grid gap-4 p-4 sm:p-5`}>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="deck_id" className={label}>
              Deck used
            </label>
            <select
              id="deck_id"
              name="deck_id"
              required
              value={selectedDeckId}
              onChange={(event) => {
                const nextDeckId = event.target.value;
                const nextDeck = decks.find((deck) => deck.id === nextDeckId);
                const nextVersion =
                  nextDeck?.versions.find((version) => version.isActive) ??
                  nextDeck?.versions[0];
                setSelectedDeckId(nextDeckId);
                setSelectedVersionId(nextVersion?.id ?? "");
              }}
              className={inputH10}
            >
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="deck_version_id" className={label}>
              Deck version
            </label>
            <select
              id="deck_version_id"
              name="deck_version_id"
              required
              value={resolvedVersionId}
              onChange={(event) => setSelectedVersionId(event.target.value)}
              className={inputH10}
            >
              {visibleVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name}
                  {version.isActive ? " (active)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="placement" className={label}>
              Placement
            </label>
            <input
              id="placement"
              name="placement"
              placeholder="Top 8, 12th, 3-1 bubble..."
              className={inputH10}
            />
          </div>
          <details className="rounded-2xl bg-[#07111F]/52 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
            <summary className="cursor-pointer text-sm font-semibold text-[#F8FAFC]">
              Event notes
            </summary>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="What mattered across the event?"
              className={`mt-3 ${textarea}`}
            />
          </details>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4F8CFF]">
              Rounds
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#F8FAFC]">
              Fast round log
            </h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Opponent, result, turn order first. Add tags only when they help.
            </p>
          </div>
          <button type="button" onClick={addRound} className={primaryButton}>
            Add next round
          </button>
        </div>

        <div className="grid gap-3">
          {rounds.map((round, index) => {
            const isActive = activeRoundId === round.id;

            return (
              <article
                key={round.id}
                onFocusCapture={() => setActiveRoundId(round.id)}
                className={`rounded-[22px] p-3 transition sm:p-4 ${
                  isActive
                    ? "bg-[linear-gradient(180deg,rgba(20,36,63,0.92),rgba(8,17,31,0.86))] shadow-[0_18px_38px_rgba(79,140,255,0.13),inset_0_0_0_1px_rgba(79,140,255,0.24)]"
                    : "bg-[#07111F]/60 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-[#4F8CFF]/14 text-sm font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]">
                      R{index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-[#F8FAFC]">
                        Round {index + 1}
                      </h3>
                      <p className="text-xs text-[#94A3B8]">
                        {matchStructure === "bo3" ? "Best-of-3 score matters" : "BO1 result only"}
                      </p>
                    </div>
                  </div>
                  {rounds.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeRound(round.id)}
                      className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/16"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  type="hidden"
                  name={`round_${index}_number`}
                  value={index + 1}
                />
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)] lg:items-end">
                  <div className="grid gap-1.5">
                    <label htmlFor={`round_${index}_opponent`} className={label}>
                      Opponent deck
                    </label>
                    <div className="flex items-center gap-2">
                      <ArchetypeSprites
                        archetype={round.opponent}
                        size="md"
                        className="shrink-0"
                      />
                      <input
                        id={`round_${index}_opponent`}
                        name={`round_${index}_opponent`}
                        required
                        value={round.opponent}
                        onChange={(event) =>
                          setRounds((current) =>
                            updateRound(current, round.id, {
                              opponent: event.target.value,
                            })
                          )
                        }
                        placeholder="Raging Bolt"
                        className={inputH10}
                      />
                    </div>
                  </div>

                  <fieldset className="grid gap-1.5">
                    <legend className={label}>Result</legend>
                    <div className="grid grid-cols-3 gap-1.5">
                      {resultOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-2xl px-3 py-2 text-center text-sm font-semibold transition ${
                            round.result === option.value
                              ? option.value === "win"
                                ? "bg-emerald-500/18 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.24)]"
                                : option.value === "loss"
                                  ? "bg-rose-500/18 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.24)]"
                                  : "bg-[#4F8CFF]/18 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]"
                              : "bg-[#0D1830]/76 text-[#94A3B8] hover:bg-[#14243F]"
                          }`}
                          title={option.fullLabel}
                        >
                          <input
                            type="radio"
                            name={`round_${index}_result`}
                            value={option.value}
                            checked={round.result === option.value}
                            onChange={() =>
                              setRounds((current) =>
                                updateRound(current, round.id, {
                                  result: option.value,
                                })
                              )
                            }
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="grid gap-1.5">
                    <legend className={label}>Turn order</legend>
                    <div className="grid grid-cols-3 gap-1.5">
                      {turnOrderOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-2xl px-2 py-2 text-center text-xs font-semibold transition ${
                            round.wentFirst === option.value
                              ? "bg-[#4F8CFF]/16 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.24)]"
                              : "bg-[#0D1830]/76 text-[#94A3B8] hover:bg-[#14243F]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`round_${index}_went_first`}
                            value={option.value}
                            checked={round.wentFirst === option.value}
                            onChange={() =>
                              setRounds((current) =>
                                updateRound(current, round.id, {
                                  wentFirst: option.value,
                                })
                              )
                            }
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {matchStructure === "bo3" ? (
                  <div className="mt-3 grid gap-1.5 sm:max-w-sm">
                    <label htmlFor={`round_${index}_score`} className={label}>
                      Match score
                    </label>
                    <select
                      id={`round_${index}_score`}
                      name={`round_${index}_score`}
                      value={round.score}
                      onChange={(event) =>
                        setRounds((current) =>
                          updateRound(current, round.id, {
                            score: event.target.value,
                          })
                        )
                      }
                      className={inputH10}
                    >
                      {MATCH_SCORE_OPTIONS.map((score) => (
                        <option key={score} value={score}>
                          {score}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <details className="rounded-2xl bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <summary className="cursor-pointer text-sm font-semibold text-[#F8FAFC]">
                      Tags {round.tags.length ? `(${round.tags.length})` : ""}
                    </summary>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {eventTagOptions.map((tag) => (
                        <label
                          key={`${round.id}-${tag}`}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                            round.tags.includes(tag)
                              ? "bg-[#F5C84C]/15 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.20)]"
                              : "bg-[#0D1830]/80 text-[#D7E0EF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] hover:bg-[#14243F]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name={`round_${index}_tags`}
                            value={tag}
                            checked={round.tags.includes(tag)}
                            onChange={(event) => {
                              const nextTags = event.target.checked
                                ? [...round.tags, tag]
                                : round.tags.filter((currentTag) => currentTag !== tag);
                              setRounds((current) =>
                                updateRound(current, round.id, { tags: nextTags })
                              );
                            }}
                            className="size-3.5 rounded border-white/20 accent-[#F5C84C]"
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </details>

                  <details className="rounded-2xl bg-[#0B1020]/46 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                    <summary className="cursor-pointer text-sm font-semibold text-[#F8FAFC]">
                      Notes {round.notes ? "(added)" : ""}
                    </summary>
                    <textarea
                      id={`round_${index}_notes`}
                      name={`round_${index}_notes`}
                      rows={2}
                      value={round.notes}
                      onChange={(event) =>
                        setRounds((current) =>
                          updateRound(current, round.id, {
                            notes: event.target.value,
                          })
                        )
                      }
                      placeholder="Key turn, prize issue, matchup note..."
                      className={`mt-3 ${textarea}`}
                    />
                  </details>
                </div>
              </article>
            );
          })}
        </div>

        <button type="button" onClick={addRound} className={secondaryButton}>
          Add next round
        </button>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
