"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { inputH11, label, primaryButton, secondaryButton, textarea } from "@/components/brand-styles";
import { demoDecks } from "@/lib/demo-data";

type Result = "win" | "loss";

const commonOpponents = [
  "Mega Greninja",
  "Mega Lopunny",
  "Dragapult ex",
  "Ogerpon Meganium",
  "Rocket's Mewtwo",
  "Raging Bolt",
];

const defaultTags = [
  "missed setup",
  "bench pressure",
  "prize deficit",
  "bad opening hand",
  "recovery issue",
  "misplay",
];

const tagsByOpponent: Record<string, string[]> = {
  "Mega Greninja": [
    "missed setup",
    "bench pressure",
    "prize deficit",
    "bad opening hand",
    "recovery issue",
    "misplay",
  ],
  "Mega Lopunny": [
    "pace mismatch",
    "missed setup",
    "tempo loss",
    "poor prize trade",
    "review",
  ],
  "Dragapult ex": [
    "prize map",
    "midgame trade",
    "bench pressure",
    "resource check",
    "review",
  ],
  "Ogerpon Meganium": [
    "tempo lead",
    "resource check",
    "missed gust",
    "late recovery",
    "review",
  ],
  "Rocket's Mewtwo": [
    "hand disruption",
    "bad opening hand",
    "recovery issue",
    "misplay",
    "review",
  ],
  "Raging Bolt": [
    "race plan",
    "poor prize trade",
    "bad opening hand",
    "tempo loss",
    "review",
  ],
};

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

function chipClass(active: boolean, tone: "gold" | "blue" | "green" | "rose" = "blue") {
  if (!active) {
    return "bg-[#07111F]/58 text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)] hover:bg-[#1A2238]/60 hover:text-[#F8FAFC]";
  }

  if (tone === "gold") {
    return "bg-[#F5C84C] text-[#07111F] shadow-[0_12px_28px_rgba(245,200,76,0.20)]";
  }

  if (tone === "green") {
    return "bg-[#22C55E]/18 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.36)]";
  }

  if (tone === "rose") {
    return "bg-[#F43F5E]/18 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.36)]";
  }

  return "bg-[#4F8CFF]/22 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.38),0_10px_24px_rgba(79,140,255,0.08)]";
}

export function DemoMatchLogForm() {
  const [versionId, setVersionId] = useState("dragapult-v2");
  const [eventType, setEventType] = useState("Best-of-three testing");
  const [opponent, setOpponent] = useState("Mega Greninja");
  const [result, setResult] = useState<Result>("loss");
  const [wentFirst, setWentFirst] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "missed setup",
    "bench pressure",
  ]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const quickTags = tagsByOpponent[opponent] ?? defaultTags;
  const summary = `${getVersionLabel(versionId)} vs ${opponent} · ${result === "win" ? "Win" : "Loss"} · Went ${wentFirst ? "first" : "second"} · ${selectedTags.length ? selectedTags.join(", ") : "no tags yet"}`;

  const versionOptions = useMemo(
    () =>
      demoDecks.flatMap((deck) =>
        deck.versions.map((version) => ({
          id: version.id,
          label: `${deck.name} · ${version.name}`,
          archetype: deck.archetype,
          active: version.isActive,
        }))
      ),
    []
  );

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((candidate) => candidate !== tag)
        : [...current, tag]
    );
  }

  function resetForAnotherGame() {
    setSaved(false);
    setOpponent("Mega Greninja");
    setResult("loss");
    setWentFirst(false);
    setSelectedTags(["missed setup", "bench pressure"]);
    setNote("");
  }

  if (saved) {
    return (
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-md bg-[#0F1A2D]/74 p-5 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(34,197,94,0.18)] backdrop-blur sm:p-6">
          <CheckCircle2 className="size-10 text-[#22C55E]" aria-hidden="true" />
          <h2 className="mt-4 text-3xl font-bold text-[#F8FAFC]">Game logged</h2>
          <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
            This would update your {opponent} going-{wentFirst ? "first" : "second"} sample.
          </p>
          <div className="mt-4 rounded-md bg-[#07111F]/58 p-3 text-sm leading-6 text-[#F8FAFC]/88">
            {summary}
          </div>
          <p className="mt-3 text-sm font-medium text-[#F5C84C]">
            Demo mode only: no production data was changed.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" className={`${primaryButton} h-12`} onClick={resetForAnotherGame}>
              <RotateCcw className="mr-2 size-4" aria-hidden="true" />
              Log another game
            </button>
            <Link href="/demo/matchups" className={`${secondaryButton} h-12`}>
              View matchup report
            </Link>
          </div>
        </div>
        <LiveSummary
          opponent={opponent}
          summary={summary}
          result={result}
          selectedTags={selectedTags}
          wentFirst={wentFirst}
        />
      </section>
    );
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        className="grid gap-4 rounded-md bg-[#0F1A2D]/74 p-4 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.09)] backdrop-blur sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        <section className="rounded-md bg-[#07111F]/42 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Step 1
              </p>
              <h2 className="text-lg font-bold text-[#F8FAFC]">Your deck/version</h2>
            </div>
            <select
              className={`${inputH11} max-w-[180px] text-xs sm:max-w-xs`}
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
              aria-label="Event type"
            >
              <option>Best-of-three testing</option>
              <option>League night</option>
              <option>Solo testing</option>
              <option>Online ladder</option>
            </select>
          </div>
          <div className="mt-3 grid gap-2">
            {versionOptions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => setVersionId(version.id)}
                className={`min-h-14 rounded-md px-3 py-2 text-left transition active:scale-[0.99] ${chipClass(versionId === version.id)}`}
              >
                <span className="block text-sm font-semibold">{version.label}</span>
                <span className="text-xs opacity-75">{version.archetype}{version.active ? " · active" : ""}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-md bg-[#07111F]/42 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
            Step 2
          </p>
          <h2 className="text-lg font-bold text-[#F8FAFC]">Opponent matchup</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {commonOpponents.map((archetype) => (
              <button
                key={archetype}
                type="button"
                onClick={() => {
                  setOpponent(archetype);
                  setSelectedTags((tagsByOpponent[archetype] ?? defaultTags).slice(0, 2));
                }}
                className={`min-h-16 rounded-md p-2 text-left transition active:scale-[0.98] ${chipClass(opponent === archetype)}`}
              >
                <ArchetypeSprites archetype={archetype} />
                <span className="mt-1 block truncate text-sm font-semibold">{archetype}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <fieldset className="rounded-md bg-[#07111F]/42 p-3">
            <legend>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Step 3
              </span>
              <span className="block text-lg font-bold text-[#F8FAFC]">Result</span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["win", "loss"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setResult(value)}
                  className={`min-h-14 rounded-md text-base font-bold capitalize transition active:scale-[0.98] ${chipClass(result === value, value === "win" ? "green" : "rose")}`}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-md bg-[#07111F]/42 p-3">
            <legend>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Step 4
              </span>
              <span className="block text-lg font-bold text-[#F8FAFC]">First/second</span>
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setWentFirst(value)}
                  className={`min-h-14 rounded-md text-base font-bold transition active:scale-[0.98] ${chipClass(wentFirst === value, "blue")}`}
                >
                  {value ? "Went first" : "Went second"}
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="rounded-md bg-[#07111F]/42 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
            Step 5
          </p>
          <h2 className="text-lg font-bold text-[#F8FAFC]">Tags and optional note</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`min-h-11 rounded-md px-2 text-sm font-semibold transition active:scale-[0.98] ${chipClass(selectedTags.includes(tag), "gold")}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <label className="mt-4 grid gap-2">
            <span className={`${label} text-[#94A3B8]/86`}>Optional note</span>
            <textarea
              className={`${textarea} min-h-20 text-sm`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Only add detail if the tags do not cover it."
            />
          </label>
        </section>

        <button type="submit" className={`${primaryButton} h-12 w-full text-base`}>
          Save demo game
        </button>
      </form>

      <LiveSummary
        opponent={opponent}
        summary={summary}
        result={result}
        selectedTags={selectedTags}
        wentFirst={wentFirst}
      />
    </section>
  );
}

function LiveSummary({
  opponent,
  summary,
  result,
  selectedTags,
  wentFirst,
}: {
  opponent: string;
  summary: string;
  result: Result;
  selectedTags: string[];
  wentFirst: boolean;
}) {
  return (
    <aside className="rounded-md bg-[#0F1A2D]/74 p-4 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.09)] backdrop-blur lg:sticky lg:top-6 lg:self-start">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
        Live summary
      </p>
      <div className="mt-3 flex items-center gap-3">
        <ArchetypeSprites archetype={opponent} size="md" />
        <div>
          <p className="text-lg font-semibold text-[#F8FAFC]">{opponent}</p>
          <p className="text-sm text-[#94A3B8]/76">
            {result === "win" ? "Win" : "Loss"} · Went {wentFirst ? "first" : "second"}
          </p>
        </div>
      </div>
      <div className="mt-4 rounded-md bg-[#07111F]/52 p-3 text-sm leading-6 text-[#F8FAFC]/90">
        {summary}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <span key={tag} className="rounded bg-[#F5C84C]/12 px-2 py-1 text-xs font-semibold text-[#F5C84C]">
            {tag}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-[#94A3B8]/76">
        Demo insight: this would update the matchup sample and confidence badge,
        but it never writes to production data.
      </p>
    </aside>
  );
}
