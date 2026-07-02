"use client";

import { useFormStatus } from "react-dom";

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full px-3 py-2 text-sm font-semibold text-rose-200/82 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.22)] transition hover:bg-rose-500/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Deleting event..." : "Delete event"}
    </button>
  );
}

export function DeleteEventButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete this event and its linked match history entries?"
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <DeleteSubmitButton />
    </form>
  );
}
