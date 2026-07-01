"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_TYPE_OPTIONS,
  MATCH_SCORE_OPTIONS,
} from "@/lib/events";
import {
  MATCH_ISSUE_TAG_OPTIONS,
  MATCH_POSITIVE_TAG_OPTIONS,
} from "@/lib/match-options";
import {
  glassPanel,
  inputH10,
  label,
  primaryButton,
  secondaryButton,
  textarea,
} from "@/components/brand-styles";
import type { CreateEventState } from "@/app/events/actions";

type DeckOption = {
  id: string;
  name: string;
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
};

type RoundDraft = {
  id: string;
  roundNumber: number;
};

const tagOptions = Array.from(
  new Set([...MATCH_ISSUE_TAG_OPTIONS, ...MATCH_POSITIVE_TAG_OPTIONS])
);

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

export function EventForm({ action, decks }: EventFormProps) {
  const initialDeck = decks[0];
  const initialVersion =
    initialDeck?.versions.find((version) => version.isActive) ??
    initialDeck?.versions[0];
  const [state, formAction] = useActionState(action, { error: null });
  const [selectedDeckId, setSelectedDeckId] = useState(initialDeck?.id ?? "");
  const [selectedVersionId, setSelectedVersionId] = useState(
    initialVersion?.id ?? ""
  );
  const [rounds, setRounds] = useState<RoundDraft[]>([
    { id: crypto.randomUUID(), roundNumber: 1 },
    { id: crypto.randomUUID(), roundNumber: 2 },
    { id: crypto.randomUUID(), roundNumber: 3 },
  ]);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
  const visibleVersions = selectedDeck?.versions ?? [];
  const selectedVersionExists = visibleVersions.some(
    (version) => version.id === selectedVersionId
  );
  const resolvedVersionId = selectedVersionExists
    ? selectedVersionId
    : visibleVersions[0]?.id ?? "";
  const eventTagOptions = useMemo(() => tagOptions, []);

  function addRound() {
    setRounds((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        roundNumber: current.length + 1,
      },
    ]);
  }

  function removeRound(id: string) {
    setRounds((current) =>
      current
        .filter((round) => round.id !== id)
        .map((round, index) => ({ ...round, roundNumber: index + 1 }))
    );
  }

  return (
    <form action={formAction} className={`${glassPanel} grid gap-5 p-4 sm:p-6`}>
      {state?.error ? (
        <div className="rounded-2xl bg-rose-500/12 px-4 py-3 text-sm font-medium text-rose-100">
          {state.error}
        </div>
      ) : null}

      <input type="hidden" name="round_count" value={rounds.length} />

      <section className="grid gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4F8CFF]">
            Event setup
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#F8FAFC]">
            What did you play?
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Save the event once and every round becomes normal SixPrizer match data.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="name" className={label}>
              Event name
            </label>
            <input
              id="name"
              name="name"
              required
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
            <select id="event_type" name="event_type" className={inputH10}>
              {EVENT_TYPE_OPTIONS.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {eventType}
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
          <div className="grid gap-1.5 lg:col-span-2">
            <label htmlFor="notes" className={label}>
              Event notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="What mattered across the event?"
              className={textarea}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4F8CFF]">
              Rounds
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#F8FAFC]">
              Add each matchup
            </h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Tags are optional here, but they make the event review sharper.
            </p>
          </div>
          <button type="button" onClick={addRound} className={secondaryButton}>
            Add round
          </button>
        </div>

        <div className="grid gap-4">
          {rounds.map((round, index) => (
            <article
              key={round.id}
              className="rounded-[20px] bg-[#07111F]/60 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] sm:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-[#F8FAFC]">
                  Round {index + 1}
                </h3>
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
              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div className="grid gap-1.5 lg:col-span-2">
                  <label htmlFor={`round_${index}_opponent`} className={label}>
                    Opponent deck
                  </label>
                  <input
                    id={`round_${index}_opponent`}
                    name={`round_${index}_opponent`}
                    required
                    placeholder="Raging Bolt"
                    className={inputH10}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`round_${index}_result`} className={label}>
                    Result
                  </label>
                  <select
                    id={`round_${index}_result`}
                    name={`round_${index}_result`}
                    required
                    className={inputH10}
                  >
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="tie">Tie</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`round_${index}_score`} className={label}>
                    Match score
                  </label>
                  <select
                    id={`round_${index}_score`}
                    name={`round_${index}_score`}
                    className={inputH10}
                  >
                    <option value="">Optional</option>
                    {MATCH_SCORE_OPTIONS.map((score) => (
                      <option key={score} value={score}>
                        {score}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor={`round_${index}_went_first`} className={label}>
                    Turn order
                  </label>
                  <select
                    id={`round_${index}_went_first`}
                    name={`round_${index}_went_first`}
                    className={inputH10}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="true">Went first</option>
                    <option value="false">Went second</option>
                  </select>
                </div>
                <div className="grid gap-1.5 lg:col-span-3">
                  <p className={label}>Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {eventTagOptions.map((tag) => (
                      <label
                        key={`${round.id}-${tag}`}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0D1830]/80 px-3 py-2 text-xs font-semibold text-[#D7E0EF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] transition hover:bg-[#14243F]"
                      >
                        <input
                          type="checkbox"
                          name={`round_${index}_tags`}
                          value={tag}
                          className="size-3.5 rounded border-white/20 accent-[#F5C84C]"
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-1.5 lg:col-span-3">
                  <label htmlFor={`round_${index}_notes`} className={label}>
                    Round notes
                  </label>
                  <textarea
                    id={`round_${index}_notes`}
                    name={`round_${index}_notes`}
                    rows={2}
                    placeholder="Key turn, prize issue, matchup note..."
                    className={textarea}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
