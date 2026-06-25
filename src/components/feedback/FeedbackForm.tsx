"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  formSectionCard,
  inputH10,
  label,
  pageCopy,
  premiumInset,
  primaryButton,
  secondaryButton,
  sectionCopy,
  sectionTitle,
  textarea,
} from "@/components/brand-styles";
import {
  FEEDBACK_PAGE_AREAS,
  FEEDBACK_SEVERITIES,
  FEEDBACK_TYPES,
} from "@/lib/feedback";
import {
  submitFeedbackAction,
} from "@/app/feedback/actions";

function SubmitFeedbackButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${primaryButton} w-full sm:w-auto`}>
      {pending ? "Saving..." : "Save feedback"}
    </button>
  );
}

export function FeedbackForm() {
  const initialFeedbackFormState = {
    success: null,
    error: null,
    fieldErrors: {},
    submittedAt: null,
  };
  const [state, formAction] = useActionState(
    submitFeedbackAction,
    initialFeedbackFormState
  );
  const formState = state ?? initialFeedbackFormState;
  const fieldErrors = formState.fieldErrors ?? {};
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!formState.success) {
      return;
    }

    if (messageRef.current) {
      messageRef.current.value = "";
    }
  }, [formState.submittedAt, formState.success]);

  return (
    <form action={formAction} className={`grid gap-4 p-4 sm:p-5 ${formSectionCard}`}>
      <input type="hidden" name="path" value="/feedback" />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
          Beta feedback
        </p>
        <h2 className={`mt-2 ${sectionTitle}`}>Tell us what got in your way</h2>
        <p className={pageCopy}>
          Use this for bugs, confusing flow, mobile issues, slow pages, or coaching reads that felt off.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="feedback-type" className={label}>
            Type
          </label>
          <select
            id="feedback-type"
            name="type"
            defaultValue={FEEDBACK_TYPES[0]}
            className={inputH10}
          >
            {FEEDBACK_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {fieldErrors.type ? (
            <p className="text-xs text-rose-200">{fieldErrors.type}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor="feedback-page-area" className={label}>
            Page or area
          </label>
          <select
            id="feedback-page-area"
            name="page_area"
            defaultValue=""
            className={inputH10}
          >
            <option value="">Choose an area</option>
            {FEEDBACK_PAGE_AREAS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="feedback-severity" className={label}>
          Severity
        </label>
        <select
          id="feedback-severity"
          name="severity"
          defaultValue={FEEDBACK_SEVERITIES[1]}
          className={inputH10}
        >
          {FEEDBACK_SEVERITIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {fieldErrors.severity ? (
          <p className="text-xs text-rose-200">{fieldErrors.severity}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="feedback-message" className={label}>
          Message
        </label>
        <textarea
          ref={messageRef}
          id="feedback-message"
          name="message"
          rows={6}
          required
          minLength={5}
          maxLength={2000}
          placeholder="What happened? What did you expect instead?"
          className={`${textarea} min-h-[152px]`}
        />
        <p className={sectionCopy}>Short, concrete reports are the most useful.</p>
        {fieldErrors.message ? (
          <p className="text-xs text-rose-200">{fieldErrors.message}</p>
        ) : null}
      </div>

      <label className={`flex items-start gap-3 p-3 ${premiumInset}`}>
        <input
          type="checkbox"
          name="contact_ok"
          defaultChecked={false}
          className="mt-1 h-4 w-4 rounded border-white/20 accent-[#F5C84C]"
        />
        <span className="text-sm leading-6 text-[#D6E0F0]">
          You can message me about this in WhatsApp if needed.
        </span>
      </label>

      {formState.error ? (
        <div className="rounded-[18px] bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
          {formState.error}
        </div>
      ) : null}

      {formState.success ? (
        <div className="rounded-[18px] bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
          {formState.success}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className={sectionCopy}>
          For urgent bugs or screenshots, the WhatsApp group is still the fastest path.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href="#feedback-message" className={`${secondaryButton} w-full sm:w-auto`}>
            Jump to message
          </a>
          <SubmitFeedbackButton />
        </div>
      </div>
    </form>
  );
}
