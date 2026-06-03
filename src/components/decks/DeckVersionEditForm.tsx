"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, PencilLine } from "lucide-react";
import {
  inputH10,
  label,
  pageCopy,
  primaryButton,
  secondaryButton,
  sectionCopy,
  textarea,
} from "@/components/brand-styles";
import { analyzeDeckList, getDecklistHealth } from "@/lib/decklist";
import type { DeckVersionActionState } from "@/app/decks/[deckId]/actions";

type DeckVersionEditFormProps = {
  action: (
    state: DeckVersionActionState,
    formData: FormData
  ) => Promise<DeckVersionActionState>;
  versionId: string;
  versionName: string;
  decklist: string;
  notes: string;
  isActive: boolean;
  unresolvedLines: string[];
  parseError: string | null;
};

const initialState: DeckVersionActionState = {
  error: null,
  success: null,
};

function normalizeDecklistUiText(value: string) {
  if (!/[ÃÂâ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (character) => character.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return value;
  }
}

function SaveVersionSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

export function DeckVersionEditForm({
  action,
  versionId,
  versionName,
  decklist,
  notes,
  isActive,
  unresolvedLines,
  parseError,
}: DeckVersionEditFormProps) {
  const [actionState, formAction] = useActionState(action, initialState);
  const [isOpen, setIsOpen] = useState(Boolean(unresolvedLines.length || parseError));
  const [nameValue, setNameValue] = useState(versionName);
  const [decklistValue, setDecklistValue] = useState(decklist);
  const [notesValue, setNotesValue] = useState(notes);
  const [dismissedSuccessKey, setDismissedSuccessKey] = useState<string | null>(null);

  const analysis = useMemo(() => analyzeDeckList(decklistValue), [decklistValue]);
  const decklistHealth = useMemo(
    () => getDecklistHealth(analysis, null, Boolean(decklistValue.trim())),
    [analysis, decklistValue]
  );
  const unresolvedCount = analysis.unresolved.length;
  const visibleUnresolvedLines =
    unresolvedCount > 0
      ? analysis.unresolved.map((line) => line.raw)
      : unresolvedLines;
  const success = actionState.success?.versionId === versionId ? actionState.success : null;
  const successKey = success ? `${success.versionId}:${success.submittedAt}` : null;
  const visibleSuccess = successKey && dismissedSuccessKey !== successKey ? success : null;
  const editorIsOpen = isOpen || Boolean(visibleSuccess);

  return (
    <div className="grid gap-3">
      {(visibleUnresolvedLines.length > 0 || parseError) && !editorIsOpen ? (
        <div className="rounded-[18px] bg-[#F5C84C]/10 p-4 text-sm text-[#FFE28A] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.16)]">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/14 text-[#F5C84C]">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-[#F8FAFC]">
                {visibleUnresolvedLines.length === 1
                  ? "1 line needs review"
                  : `${visibleUnresolvedLines.length} lines need review`}
              </p>
              <p className="mt-1 leading-6 text-[#FFE28A]/88">
                {parseError
                  ? parseError
                  : "SixPrizer could not parse this line. Edit the decklist to improve archetype detection and card counts."}
              </p>
              {visibleUnresolvedLines.length > 0 ? (
                <div className="mt-3 rounded-[16px] bg-[#0B1020]/66 p-3 text-xs text-[#D6E0F0] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  {visibleUnresolvedLines.slice(0, 3).map((line) => (
                    <p key={line} className="truncate">
                      {line}
                    </p>
                  ))}
                  {visibleUnresolvedLines.length > 3 ? (
                    <p className="mt-1 text-[#94A3B8]">
                      +{visibleUnresolvedLines.length - 3} more line
                      {visibleUnresolvedLines.length - 3 === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`${secondaryButton} mt-3`}
              >
                Edit decklist
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={secondaryButton}
        >
          <PencilLine className="mr-2 size-4" aria-hidden="true" />
          {isOpen ? "Hide editor" : "Edit version"}
        </button>
      </div>

      {editorIsOpen ? (
        <form
          action={formAction}
          className="grid gap-4 rounded-[20px] bg-[#07111F]/42 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
        >
          {visibleSuccess ? (
            <div className="rounded-[18px] bg-emerald-500/10 p-4 text-sm text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300">
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-emerald-200">Version updated</p>
                  <p className="mt-1 leading-6 text-emerald-100/90">
                    {visibleSuccess.versionName} was saved as{" "}
                    {visibleSuccess.isActive ? "the active test version" : "a saved version"}.
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.08em] text-emerald-200/84">
                    {normalizeDecklistUiText(decklistHealth.summary)}
                    {unresolvedCount > 0 ? ` · ${unresolvedCount} unresolved` : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {actionState.error ? (
            <div className="rounded-[18px] bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
              {actionState.error}
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#4F8CFF]">
              Edit version
            </p>
            <h4 className="mt-2 text-xl font-semibold text-[#F8FAFC]">
              Update the list or details
            </h4>
            <p className={pageCopy}>
              Fix unresolved lines, rename the build, or refresh the notes. Historical match rows stay intact.
            </p>
          </div>

          <div className="grid gap-2">
            <label htmlFor={`edit-name-${versionId}`} className={label}>
              Version name
            </label>
            <input
              id={`edit-name-${versionId}`}
              name="name"
              required
              value={nameValue}
              onChange={(event) => setNameValue(event.target.value)}
              className={inputH10}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor={`edit-list-${versionId}`} className={label}>
              Decklist
            </label>
            <textarea
              id={`edit-list-${versionId}`}
              name="decklist"
              rows={8}
              value={decklistValue}
              onChange={(event) => setDecklistValue(event.target.value)}
              className={textarea}
            />
          </div>

          <div className="grid gap-3 rounded-[18px] bg-[#0B1020]/66 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${decklistHealth.toneClass}`}
              >
                {decklistHealth.label}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]/76">
                {normalizeDecklistUiText(decklistHealth.summary)}
              </span>
            </div>
            <div className="grid gap-3 grid-cols-2 min-[430px]:grid-cols-5">
              {[
                {
                  label: "Total",
                  value: decklistValue.trim() ? `${analysis.totalCards} / 60` : "0 / 60",
                },
                { label: "Pokémon", value: String(analysis.pokemonCount) },
                { label: "Trainer", value: String(analysis.trainerCount) },
                { label: "Energy", value: String(analysis.energyCount) },
                { label: "Unresolved", value: String(unresolvedCount) },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[16px] bg-[#07111F]/72 p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#F8FAFC]">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <p className={sectionCopy}>{normalizeDecklistUiText(decklistHealth.detail)}</p>
          </div>

          <div className="grid gap-2">
            <label htmlFor={`edit-notes-${versionId}`} className={label}>
              Notes
            </label>
            <textarea
              id={`edit-notes-${versionId}`}
              name="notes"
              rows={3}
              value={notesValue}
              onChange={(event) => setNotesValue(event.target.value)}
              className={textarea}
            />
          </div>

          {!isActive ? (
            <label className="flex items-center gap-3 rounded-[18px] bg-[#07111F]/42 p-3 text-sm text-[#D6E0F0] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              <input
                type="checkbox"
                name="is_active"
                className="h-4 w-4 rounded border-white/20 accent-[#F5C84C]"
              />
              Make this the active test version used for new match logs
            </label>
          ) : (
            <div className="rounded-[18px] bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.14)]">
              This version is currently active for new match logs.
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (successKey) {
                  setDismissedSuccessKey(successKey);
                }
              }}
              className={secondaryButton}
            >
              Close
            </button>
            <SaveVersionSubmitButton />
          </div>
        </form>
      ) : null}
    </div>
  );
}
