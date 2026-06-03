"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArchetypePicker } from "@/components/ArchetypePicker";
import {
  formSectionCard,
  inputH10,
  label,
  primaryButton,
  sectionCopy,
  textarea,
} from "@/components/brand-styles";
import { LATEST_FORMAT } from "@/lib/formats";
import { createDeck, type DeckCreateState } from "@/app/decks/actions";

type DeckCreateFormProps = {
  archetypeOptions: string[];
  hasDecks: boolean;
};

function CreateDeckSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? "Creating..." : "Create deck"}
    </button>
  );
}

const initialState: DeckCreateState = {
  error: null,
};

export function DeckCreateForm({
  archetypeOptions,
  hasDecks,
}: DeckCreateFormProps) {
  const [state, formAction] = useActionState(createDeck, initialState);

  return (
    <form action={formAction} className={`p-4 ${formSectionCard}`}>
      <div className="mt-1 flex flex-col gap-4">
        <input type="hidden" name="format" value={LATEST_FORMAT} />

        <div className="flex flex-col gap-2">
          <label htmlFor="name" className={label}>
            Deck name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Mega Lucario Duns"
            className={inputH10}
          />
        </div>

        <ArchetypePicker
          id="archetype"
          name="archetype"
          label="Archetype"
          options={archetypeOptions}
          placeholder="Search or type an archetype"
          customOptionPrefix="Use custom deck archetype"
          required
        />

        <div className="flex flex-col gap-2">
          <label htmlFor="notes" className={label}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="What are you testing with this deck family?"
            className={textarea}
          />
        </div>

        {state.error ? (
          <div className="rounded-[18px] bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
            {state.error}
          </div>
        ) : null}

        <div className="grid gap-2">
          <CreateDeckSubmitButton />
          <p className={sectionCopy}>
            {hasDecks
              ? "You’ll land on the deck page next to add the first version."
              : "Create the deck family first, then add the version you actually want to test."}
          </p>
        </div>
      </div>
    </form>
  );
}
