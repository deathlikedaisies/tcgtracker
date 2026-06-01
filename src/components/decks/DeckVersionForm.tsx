"use client";

import { useMemo, useRef, useState } from "react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  inputH10,
  label,
  primaryButton,
  sectionCopy,
  textarea,
} from "@/components/brand-styles";
import { analyzeDeckList } from "@/lib/decklist";

type DeckVersionFormProps = {
  action: (formData: FormData) => void;
};

export function DeckVersionForm({ action }: DeckVersionFormProps) {
  const [decklist, setDecklist] = useState("");
  const [name, setName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const analysis = useMemo(() => analyzeDeckList(decklist), [decklist]);
  const hasCards = analysis.cards.length > 0;
  const hasSuggestion = analysis.suggestion.isClearSuggestion;

  function useSuggestion() {
    if (!hasSuggestion) {
      return;
    }

    if (!name.trim()) {
      setName(`${analysis.suggestion.archetype} test`);
      nameInputRef.current?.focus();
    }
  }

  return (
    <form action={action} className="rounded-md bg-[#11182C]/70 p-3.5 shadow-[0_16px_42px_rgba(0,0,0,0.20),inset_0_0_0_1px_rgba(248,250,252,0.04)] sm:p-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC]">New test version</h2>
      <p className={`mt-1 ${sectionCopy}`}>
        Paste a TCG Live list and SixPrizer will read the build.
      </p>
      <div className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={label}>
            Name
          </label>
          <input
            ref={nameInputRef}
            id="name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputH10}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="decklist" className={label}>
            Paste deck list
          </label>
          <textarea
            id="decklist"
            name="decklist"
            rows={8}
            value={decklist}
            onChange={(event) => setDecklist(event.target.value)}
            placeholder="4 Dragapult ex TWM 130"
            className={textarea}
          />
        </div>

        {hasCards ? (
          <div className="rounded-md bg-[#0B1020]/42 p-3 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.04)]">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#94A3B8]">
              <span>{analysis.totalCards} cards</span>
              <span>{analysis.pokemonCount} Pokémon</span>
              <span>{analysis.trainerCount} Trainer</span>
              <span>{analysis.energyCount} Energy</span>
              {analysis.unresolved.length ? (
                <span className="text-[#F5C84C]">
                  {analysis.unresolved.length} unresolved
                </span>
              ) : null}
            </div>
            {hasSuggestion ? (
              <div className="mt-3 flex flex-col gap-3 rounded-md bg-[#11182C]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <ArchetypeSprites
                    archetype={analysis.suggestion.archetype}
                    className="shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase text-[#94A3B8]/70">
                      Suggested archetype
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                        {analysis.suggestion.archetype}
                      </p>
                      <span
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                          analysis.suggestion.confidence === "high"
                            ? "bg-emerald-500/14 text-emerald-200"
                            : "bg-[#F5C84C]/14 text-[#F5C84C]"
                        }`}
                      >
                        {analysis.suggestion.confidenceLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#94A3B8]">
                      Matched core cards:{" "}
                      {analysis.suggestion.matchedCoreCards.join(", ")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={useSuggestion}
                  className="h-9 rounded-md bg-[#4F8CFF]/12 px-3 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/18 active:scale-[0.98]"
                >
                  Use suggestion
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#94A3B8]/72">
                No clear archetype detected. Choose the deck archetype manually if you already know the build family.
              </p>
            )}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className={label}>
            Notes
          </label>
          <textarea id="notes" name="notes" rows={4} className={textarea} />
        </div>
        <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
          <input
            type="checkbox"
            name="is_active"
            className="h-4 w-4 rounded border-white/20 accent-[#F5C84C]"
          />
          Make this version active
        </label>
        <button type="submit" className={primaryButton}>
          Create test version
        </button>
      </div>
    </form>
  );
}
