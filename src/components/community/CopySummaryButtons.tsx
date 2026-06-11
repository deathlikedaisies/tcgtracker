"use client";

import { useState } from "react";
import { primaryButton, secondaryButton } from "@/components/brand-styles";

type CopySummaryButtonsProps = {
  link: string;
  summaryText: string;
  linkLabel?: string;
  summaryLabel?: string;
};

export function CopySummaryButtons({
  link,
  summaryText,
  linkLabel = "Copy link",
  summaryLabel = "Copy summary",
}: CopySummaryButtonsProps) {
  const [message, setMessage] = useState("");

  async function copy(value: string, nextMessage: string) {
    await navigator.clipboard.writeText(value);
    setMessage(nextMessage);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={secondaryButton}
          onClick={() => copy(link, "Link copied.")}
        >
          {linkLabel}
        </button>
        <button
          type="button"
          className={primaryButton}
          onClick={() => copy(summaryText, "Summary copied.")}
        >
          {summaryLabel}
        </button>
      </div>
      {message ? (
        <p className="text-sm font-medium text-emerald-300">{message}</p>
      ) : null}
    </div>
  );
}
