"use client";

import { useState } from "react";
import { secondaryButton } from "@/components/brand-styles";

type CopyLinkButtonProps = {
  link: string;
  label?: string;
};

export function CopyLinkButton({
  link,
  label = "Copy profile link",
}: CopyLinkButtonProps) {
  const [message, setMessage] = useState("");

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setMessage("Profile link copied.");
  }

  return (
    <div className="grid gap-2">
      <button type="button" className={secondaryButton} onClick={handleCopy}>
        {label}
      </button>
      {message ? (
        <p className="text-sm font-medium text-emerald-300">{message}</p>
      ) : null}
    </div>
  );
}
