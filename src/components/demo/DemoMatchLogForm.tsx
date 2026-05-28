"use client";

import { useState } from "react";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import { primaryButton, secondaryButton, inputH11, label, textarea } from "@/components/brand-styles";
import { demoDecks } from "@/lib/demo-data";
import { getArchetypeOptions } from "@/lib/archetypes";
import { LATEST_FORMAT } from "@/lib/formats";

export function DemoMatchLogForm() {
  const [opponent, setOpponent] = useState("Mega Greninja");
  const [result, setResult] = useState<"win" | "loss">("loss");
  const [wentFirst, setWentFirst] = useState(false);
  const [saved, setSaved] = useState(false);
  const archetypeOptions = getArchetypeOptions(LATEST_FORMAT);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        className="rounded-md bg-[#0F1A2D]/74 p-4 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.09)] backdrop-blur sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(true);
        }}
      >
        {saved ? (
          <div className="mb-4 rounded-md bg-[#22C55E]/10 p-3 text-sm font-medium text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.24)]">
            Demo game saved locally. No production data was changed.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className={label}>Deck version</span>
            <select className={inputH11} defaultValue="dragapult-v2">
              {demoDecks.flatMap((deck) =>
                deck.versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {deck.archetype} - {version.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="grid gap-2">
            <span className={label}>Event type</span>
            <select className={inputH11} defaultValue="Best-of-three testing">
              <option>Best-of-three testing</option>
              <option>League night</option>
              <option>Solo testing</option>
              <option>Online ladder</option>
            </select>
          </label>
        </div>

        <div className="mt-4">
          <ArchetypePicker
            id="demo-opponent"
            name="opponent_archetype"
            label="Opponent archetype"
            options={archetypeOptions}
            value={opponent}
            onValueChange={setOpponent}
            maxOptions={8}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className={label}>Result</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["win", "loss"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setResult(value)}
                  className={`h-11 rounded-md text-sm font-semibold capitalize transition active:scale-[0.98] ${
                    result === value
                      ? value === "win"
                        ? "bg-[#22C55E]/18 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.38)]"
                        : "bg-[#F43F5E]/18 text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.38)]"
                      : "bg-[#07111F]/58 text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={label}>Turn order</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setWentFirst(value)}
                  className={`h-11 rounded-md text-sm font-semibold transition active:scale-[0.98] ${
                    wentFirst === value
                      ? "bg-[#4F8CFF]/22 text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.38)]"
                      : "bg-[#07111F]/58 text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  {value ? "First" : "Second"}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <label className="mt-4 grid gap-2">
          <span className={label}>Notes / tags</span>
          <textarea
            className={`${textarea} min-h-28`}
            defaultValue="Lost tempo after Mega Greninja pressured the bench. Tag: bench pressure, missed setup"
          />
        </label>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="submit" className={`${primaryButton} h-12`}>
            Save demo game
          </button>
          <button type="button" className={`${secondaryButton} h-12`} onClick={() => setSaved(false)}>
            Reset fake state
          </button>
        </div>
      </form>

      <aside className="rounded-md bg-[#0F1A2D]/74 p-4 shadow-[0_20px_56px_rgba(0,0,0,0.26),inset_0_0_0_1px_rgba(148,163,184,0.09)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#94A3B8]/72">
          Active session
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ArchetypeSprites archetype={opponent} size="md" />
          <div>
            <p className="text-lg font-semibold text-[#F8FAFC]">{opponent}</p>
            <p className="text-sm text-[#94A3B8]/76">Current focus matchup</p>
          </div>
        </div>
        <div className="mt-4 rounded-md bg-[#07111F]/52 p-3 text-sm leading-6 text-[#94A3B8]/78">
          Demo insight: going second into Mega Greninja is the clearest weak spot.
          Log a fake loss here to see the local success state without writing data.
        </div>
      </aside>
    </div>
  );
}
