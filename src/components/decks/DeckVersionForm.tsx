"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Beaker, Layers3, Sparkles } from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  inputH10,
  label,
  primaryButton,
  sectionCopy,
  textarea,
} from "@/components/brand-styles";
import { analyzeDeckList, getDecklistHealth } from "@/lib/decklist";

type DeckVersionFormProps = {
  action: (formData: FormData) => void;
  title?: string;
  description?: string;
  className?: string;
  submitLabel?: string;
};

export function DeckVersionForm({
  action,
  title = "Add a test version",
  description = "Paste a 60-card list, give the build a clear name, and choose whether it should become the active test version. You'll use this version when logging games.",
  className = "",
  submitLabel = "Create test version",
}: DeckVersionFormProps) {
  const [decklist, setDecklist] = useState("");
  const [name, setName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const analysis = useMemo(() => analyzeDeckList(decklist), [decklist]);
  const decklistHealth = useMemo(
    () => getDecklistHealth(analysis, null, Boolean(decklist.trim())),
    [analysis, decklist]
  );
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
    <form
      action={action}
      className={`rounded-[24px] bg-[linear-gradient(180deg,rgba(15,26,45,0.92),rgba(7,17,31,0.88))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(148,163,184,0.08)] sm:p-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
          <Beaker className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">{title}</h2>
          <p className={`mt-1 ${sectionCopy}`}>
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded-[20px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#4F8CFF]/10 text-[#B8D1FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]">
              <Layers3 className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                Version setup
              </h3>
              <p className="mt-1 text-sm leading-6 text-[#94A3B8]/72">
                Versions are what SixPrizer uses for match logging, version comparison, and archetype evidence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={label}>
            Version name
          </label>
          <input
            ref={nameInputRef}
            id="name"
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="v2 Stamina"
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

        <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${decklistHealth.toneClass}`}
            >
              {decklistHealth.label}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/76">
              {decklistHealth.summary}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {[
              {
                label: "Total",
                value: decklist.trim() ? `${analysis.totalCards} / 60` : "0 / 60",
                tone:
                  analysis.totalCards === 60 && decklist.trim()
                    ? "text-emerald-200"
                    : "text-[#FFE28A]",
              },
              { label: "Pokémon", value: String(analysis.pokemonCount), tone: "text-[#F8FAFC]" },
              { label: "Trainer", value: String(analysis.trainerCount), tone: "text-[#F8FAFC]" },
              { label: "Energy", value: String(analysis.energyCount), tone: "text-[#F8FAFC]" },
              {
                label: "Unresolved",
                value: String(analysis.unresolved.length),
                tone:
                  analysis.unresolved.length === 0
                    ? "text-emerald-200"
                    : "text-[#FFE28A]",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[18px] bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  {stat.label}
                </p>
                <p className={`mt-2 text-base font-semibold ${stat.tone}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-[#94A3B8]/76">
            {decklistHealth.detail}
          </p>
        </div>

        {hasCards ? (
          <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/76">
              <span>{analysis.totalCards} cards</span>
              <span>{analysis.pokemonCount} Pokémon</span>
              <span>{analysis.trainerCount} Trainer</span>
              <span>{analysis.energyCount} Energy</span>
              {analysis.unresolved.length ? (
                <span className="text-[#FFE28A]">
                  {analysis.unresolved.length} unresolved
                </span>
              ) : null}
            </div>

            {hasSuggestion ? (
              <div className="mt-4 rounded-[20px] bg-[#0B1020]/66 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <ArchetypeSprites
                      archetype={analysis.suggestion.archetype}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#F8FAFC]">
                          {analysis.suggestion.archetype}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
                            analysis.suggestion.confidence === "high"
                              ? "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]"
                              : "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]"
                          }`}
                        >
                          {analysis.suggestion.confidenceLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#94A3B8]/70">
                        Suggested archetype
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                        Matched core cards: {analysis.suggestion.matchedCoreCards.join(", ")}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={useSuggestion}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#4F8CFF]/12 px-4 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#4F8CFF]/18 active:scale-[0.98]"
                  >
                    <Sparkles className="mr-2 size-4" aria-hidden="true" />
                    Use suggestion
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] bg-[#0B1020]/66 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <p className="text-sm font-semibold text-[#F8FAFC]">
                  No clear archetype detected
                </p>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                  No clear archetype detected. Complete the list or set manually if you already know the deck family.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className={label}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="What changed in this build?"
            className={textarea}
          />
        </div>

        <label className="flex items-center gap-3 rounded-[20px] bg-[#07111F]/42 p-3 text-sm text-[#D6E0F0] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <input
            type="checkbox"
            name="is_active"
            className="h-4 w-4 rounded border-white/20 accent-[#F5C84C]"
          />
          Make this version active for future match logs
        </label>

        <button type="submit" className={primaryButton}>
          {submitLabel}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
