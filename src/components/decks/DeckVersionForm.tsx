"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  Beaker,
  CheckCircle2,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";
import { ArchetypeSprites } from "@/components/ArchetypeSprites";
import {
  formSectionCard,
  inputH10,
  label,
  pageCopy,
  primaryButton,
  secondaryButton,
  sectionCopy,
  textarea,
} from "@/components/brand-styles";
import {
  analyzeDeckList,
  getDecklistHealth,
} from "@/lib/decklist";
import type { DeckVersionActionState } from "@/app/decks/[deckId]/actions";

type DeckVersionFormProps = {
  action: (
    state: DeckVersionActionState,
    formData: FormData
  ) => Promise<DeckVersionActionState>;
  deckHref?: string;
  title?: string;
  description?: string;
  className?: string;
  submitLabel?: string;
  notesPlaceholder?: string;
};

type DeckVersionStep = "decklist" | "review" | "details";

const stepOrder: Array<{ id: DeckVersionStep; label: string }> = [
  { id: "decklist", label: "Decklist" },
  { id: "review", label: "Review" },
  { id: "details", label: "Version details" },
];

const initialState: DeckVersionActionState = {
  error: null,
  success: null,
};

function CreateVersionSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${primaryButton} w-full sm:w-auto`}
    >
      {pending ? "Creating..." : label}
    </button>
  );
}

function getStepIndex(step: DeckVersionStep) {
  return stepOrder.findIndex((candidate) => candidate.id === step);
}

export function DeckVersionForm({
  action,
  deckHref = "/decks",
  title = "Add a test version",
  description = "Paste a 60-card list, give the build a clear name, and choose whether it should become the active test version. You'll use this version when logging games.",
  className = "",
  submitLabel = "Create test version",
  notesPlaceholder = "What changed in this build?",
}: DeckVersionFormProps) {
  const router = useRouter();
  const [actionState, formAction] = useActionState(action, initialState);
  const [currentStep, setCurrentStep] = useState<DeckVersionStep>("decklist");
  const [decklist, setDecklist] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [dismissedSuccessId, setDismissedSuccessId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const refreshedSuccessIdRef = useRef<string | null>(null);
  const analysis = useMemo(() => analyzeDeckList(decklist), [decklist]);
  const decklistHealth = useMemo(
    () => getDecklistHealth(analysis, null, Boolean(decklist.trim())),
    [analysis, decklist]
  );
  const hasSuggestion = analysis.suggestion.isClearSuggestion;
  const visibleSuccess =
    actionState.success && actionState.success.versionId !== dismissedSuccessId
      ? actionState.success
      : null;

  useEffect(() => {
    if (!actionState.success) {
      return;
    }

    if (refreshedSuccessIdRef.current === actionState.success.versionId) {
      return;
    }

    refreshedSuccessIdRef.current = actionState.success.versionId;
    router.refresh();
  }, [actionState.success, router]);

  function useSuggestion() {
    if (!hasSuggestion || name.trim()) {
      return;
    }

    setName(`${analysis.suggestion.archetype} test`);
    setCurrentStep("details");
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
  }

  function goToNextStep() {
    if (currentStep === "decklist") {
      setCurrentStep("review");
      return;
    }

    if (currentStep === "review") {
      setCurrentStep("details");
    }
  }

  function resetForAnotherVersion() {
    if (actionState.success) {
    setDismissedSuccessId(actionState.success.versionId);
    }

    setCurrentStep("decklist");
    setDecklist("");
    setNotes("");
    setIsActive(true);
    setName("");
    refreshedSuccessIdRef.current = null;
  }

  const currentStepIndex = getStepIndex(currentStep);
  const progressPercent = ((currentStepIndex + 1) / stepOrder.length) * 100;
  const totalCardTone =
    analysis.totalCards === 60 && decklist.trim()
      ? "text-emerald-200"
      : "text-[#FFE28A]";
  const unresolvedTone =
    analysis.unresolved.length === 0 ? "text-emerald-200" : "text-[#FFE28A]";
  const suggestionTone =
    analysis.suggestion.confidence === "high"
      ? "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]"
      : "bg-[#F5C84C]/12 text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]";

  if (visibleSuccess) {
    return (
      <div className={`p-5 sm:p-6 ${formSectionCard} ${className}`}>
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-300">
                Version created
              </p>
              <h3 className="mt-1 text-2xl font-semibold text-[#F8FAFC]">
                {visibleSuccess.versionName}
              </h3>
              <p className={`mt-2 ${sectionCopy}`}>
                {visibleSuccess.isActive
                  ? "This version is now the active test version used when logging new games."
                  : "This version was saved. You can make it active later if you want to log games with it."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Status",
                value: visibleSuccess.isActive ? "Active test version" : "Saved version",
              },
              {
                label: "List health",
                value: decklistHealth.label,
              },
              {
                label: "Detected archetype",
                value: hasSuggestion ? analysis.suggestion.archetype : "No clear archetype",
              },
              {
                label: "Summary",
                value: decklistHealth.summary,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Link
              href={`/matches/new?deck_version_id=${visibleSuccess.versionId}`}
              className={primaryButton}
            >
              Log a game with this version
            </Link>
            <button type="button" onClick={resetForAnotherVersion} className={secondaryButton}>
              Add another version
            </button>
            <Link href={deckHref} className={secondaryButton}>
              Back to deck
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className={`p-4 sm:p-5 ${formSectionCard} ${className}`}>
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="decklist" value={decklist} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="is_active" value={isActive ? "on" : ""} />

      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
            <Beaker className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[#F8FAFC]">{title}</h2>
            <p className={`mt-1 ${sectionCopy}`}>{description}</p>
          </div>
        </div>

        <div className="rounded-[20px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Step {currentStepIndex + 1} of {stepOrder.length}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#F8FAFC]">
                {stepOrder[currentStepIndex]?.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stepOrder.map((step, index) => {
                const isCurrent = currentStep === step.id;
                const isDone = index < currentStepIndex;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (index <= currentStepIndex) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                      isCurrent
                        ? "bg-[#4F8CFF]/16 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.22)]"
                        : isDone
                          ? "bg-emerald-500/10 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]"
                          : "bg-[#0B1020]/66 text-[#94A3B8]"
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-4 h-2 rounded-full bg-[#0B1020]/72">
            <div
              className="h-2 rounded-full bg-[#4F8CFF] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {actionState.error ? (
          <div className="rounded-[18px] bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
            {actionState.error}
          </div>
        ) : null}

        {currentStep === "decklist" ? (
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Decklist
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                Paste the list first
              </h3>
              <p className={pageCopy}>
                Start with the build you actually want to test. You can still continue without a perfect 60-card list.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="decklist" className={label}>
                Decklist
              </label>
              <textarea
                id="decklist"
                rows={10}
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

              <div className="mt-4 grid gap-3 grid-cols-2 min-[430px]:grid-cols-3 sm:grid-cols-5">
                {[
                  {
                    label: "Total",
                    value: decklist.trim() ? `${analysis.totalCards} / 60` : "0 / 60",
                    tone: totalCardTone,
                  },
                  { label: "Pokémon", value: String(analysis.pokemonCount), tone: "text-[#F8FAFC]" },
                  { label: "Trainer", value: String(analysis.trainerCount), tone: "text-[#F8FAFC]" },
                  { label: "Energy", value: String(analysis.energyCount), tone: "text-[#F8FAFC]" },
                  {
                    label: "Unresolved",
                    value: String(analysis.unresolved.length),
                    tone: unresolvedTone,
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

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <p className={`self-center ${sectionCopy}`}>
                {decklist.trim()
                  ? "You can continue now and review the parser summary before naming the version."
                  : "No decklist added yet. You can continue, but match labels and archetype detection will be less informative."}
              </p>
              <button type="button" onClick={goToNextStep} className={primaryButton}>
                Continue
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        {currentStep === "review" ? (
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Review
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                Check the list health
              </h3>
              <p className={pageCopy}>
                SixPrizer will not block experimentation, but this is where you catch incomplete lists and weak archetype reads.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-[#F5C84C]" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#F5C84C]">
                    Detected archetype
                  </p>
                </div>

                {hasSuggestion ? (
                  <div className="mt-4 grid gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ArchetypeSprites
                          archetype={analysis.suggestion.archetype}
                          className="shrink-0"
                        />
                        <div>
                          <p className="text-base font-semibold text-[#F8FAFC]">
                            {analysis.suggestion.archetype}
                          </p>
                          <p className="mt-1 text-xs text-[#94A3B8]/72">
                            Suggested archetype
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${suggestionTone}`}
                      >
                        {analysis.suggestion.confidenceLabel}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-[#94A3B8]/72">
                      {analysis.suggestion.reason}
                    </p>
                    {!name.trim() ? (
                      <button type="button" onClick={useSuggestion} className={secondaryButton}>
                        <Sparkles className="mr-2 size-4" aria-hidden="true" />
                        Use suggestion as version name
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-base font-semibold text-[#F8FAFC]">
                      No clear archetype detected
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                      No clear archetype detected. You can still continue or set the deck family manually.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[22px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <div className="flex items-center gap-2">
                  <Layers3 className="size-4 text-[#4F8CFF]" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                    List health
                  </p>
                </div>
                <div className="mt-4 grid gap-3">
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
                  <p className="text-sm leading-6 text-[#94A3B8]/72">
                    {decklistHealth.detail}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep("decklist")}
                className={secondaryButton}
              >
                Back to decklist
              </button>
              <button type="button" onClick={goToNextStep} className={primaryButton}>
                Continue
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        {currentStep === "details" ? (
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
                Version details
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                Name the build and save it
              </h3>
              <p className={pageCopy}>
                This is the version you’ll use when logging games. Make it active now if it’s your current test build.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className={label}>
                Version name
              </label>
              <input
                ref={nameInputRef}
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="v2 Stamina"
                className={inputH10}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="notes" className={label}>
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={notesPlaceholder}
                className={textarea}
              />
            </div>

            <label className="flex items-center gap-3 rounded-[20px] bg-[#07111F]/42 p-3 text-sm text-[#D6E0F0] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded border-white/20 accent-[#F5C84C]"
              />
              Make this the active test version used for new match logs
            </label>

            <div className="grid gap-2 sm:flex sm:flex-row-reverse sm:items-center sm:justify-between">
              <CreateVersionSubmitButton label={submitLabel} />
              <button
                type="button"
                onClick={() => setCurrentStep("review")}
                className={`${secondaryButton} w-full sm:w-auto`}
              >
                Back to review
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}
