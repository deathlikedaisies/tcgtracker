"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { MessageSquareText } from "lucide-react";
import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_RATINGS,
  type BetaFeedbackCategory,
} from "@/lib/feedback";
import { submitBetaFeedbackPromptAction } from "@/app/feedback/actions";
import {
  inputH10,
  label,
  premiumInset,
  primaryButton,
  secondaryButton,
  textarea,
} from "@/components/brand-styles";

type BetaFeedbackPromptProps = {
  pageContext: string;
  pagePath: string;
  defaultCategory?: BetaFeedbackCategory;
  question?: string;
  mode?: "form" | "cta";
  className?: string;
};

function BetaFeedbackSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={`${primaryButton} w-full sm:w-auto`}>
      {pending ? "Sending..." : "Send beta note"}
    </button>
  );
}

export function BetaFeedbackPrompt({
  pageContext,
  pagePath,
  defaultCategory = "Review/coaching",
  question = "Did this review help you decide what to test next?",
  mode = "form",
  className = "",
}: BetaFeedbackPromptProps) {
  const id = useId();
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const initialState = {
    success: null,
    error: null,
    fieldErrors: {},
    submittedAt: null,
  };
  const [state, formAction] = useActionState(
    submitBetaFeedbackPromptAction,
    initialState
  );
  const formState = state ?? initialState;
  const fieldErrors = formState.fieldErrors ?? {};

  useEffect(() => {
    if (!formState.success) {
      return;
    }

    if (messageRef.current) {
      messageRef.current.value = "";
    }

    if (contactRef.current) {
      contactRef.current.value = "";
    }
  }, [formState.submittedAt, formState.success]);

  const shellClass = `rounded-[24px] bg-[linear-gradient(180deg,rgba(15,25,44,0.94),rgba(7,17,31,0.88))] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(79,140,255,0.14)] sm:p-5 ${className}`;

  if (mode === "cta") {
    return (
      <section data-testid="beta-feedback-prompt" className={shellClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
              <MessageSquareText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F5C84C]">
                Help improve SixPrizer
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#F8FAFC]">
                {question}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#94A3B8]">
                Demo feedback is most useful when it says what felt useful,
                confusing, or missing.
              </p>
            </div>
          </div>
          <Link href="/feedback" className={`${secondaryButton} h-11 shrink-0`}>
            Send demo feedback
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="beta-feedback-prompt" className={shellClass}>
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="page_context" value={pageContext} />
        <input type="hidden" name="path" value={pagePath} />

        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5C84C]/12 text-[#F5C84C] shadow-[inset_0_0_0_1px_rgba(245,200,76,0.18)]">
            <MessageSquareText className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#F5C84C]">
              Help improve SixPrizer
            </p>
            <h2 className="mt-1 text-lg font-bold text-[#F8FAFC]">{question}</h2>
            <p className="mt-1 text-sm leading-6 text-[#94A3B8]">
              One short note helps tune the beta toward what competitive testers
              actually need.
            </p>
          </div>
        </div>

        <fieldset className="grid gap-2">
          <legend className={label}>Rating</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {BETA_FEEDBACK_RATINGS.map((rating) => (
              <label
                key={rating}
                className={`${premiumInset} flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-[#DCE8FF]`}
              >
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  defaultChecked={rating === "Somewhat useful"}
                  className="size-4 accent-[#F5C84C]"
                />
                {rating}
              </label>
            ))}
          </div>
          {fieldErrors.rating ? (
            <p className="text-xs text-rose-200">{fieldErrors.rating}</p>
          ) : null}
        </fieldset>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <div className="grid gap-2">
            <label htmlFor={`${id}-category`} className={label}>
              Category
            </label>
            <select
              id={`${id}-category`}
              name="category"
              defaultValue={defaultCategory}
              className={inputH10}
            >
              {BETA_FEEDBACK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {fieldErrors.category ? (
              <p className="text-xs text-rose-200">{fieldErrors.category}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label htmlFor={`${id}-contact`} className={label}>
              Contact handle <span className="text-[#94A3B8]">(optional)</span>
            </label>
            <input
              ref={contactRef}
              id={`${id}-contact`}
              name="contact"
              placeholder="Discord handle"
              className={inputH10}
              maxLength={160}
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor={`${id}-feedback`} className={label}>
            Feedback
          </label>
          <textarea
            ref={messageRef}
            id={`${id}-feedback`}
            name="feedback"
            rows={3}
            maxLength={1600}
            placeholder="What was useful, confusing, or broken?"
            className={`${textarea} min-h-[104px]`}
          />
          {fieldErrors.message ? (
            <p className="text-xs text-rose-200">{fieldErrors.message}</p>
          ) : null}
        </div>

        {formState.error ? (
          <div className="rounded-[16px] bg-[#F43F5E]/10 px-4 py-3 text-sm font-medium text-rose-100 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.18)]">
            {formState.error}
          </div>
        ) : null}

        {formState.success ? (
          <div className="rounded-[16px] bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]">
            {formState.success}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#94A3B8]">
            For urgent broken flows, use the full Feedback page too.
          </p>
          <BetaFeedbackSubmitButton />
        </div>
      </form>
    </section>
  );
}
