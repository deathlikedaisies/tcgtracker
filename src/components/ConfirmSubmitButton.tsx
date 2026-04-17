"use client";

import type React from "react";

type ConfirmSubmitButtonProps = {
  message: string;
  className: string;
  children: React.ReactNode;
};

export function ConfirmSubmitButton({
  message,
  className,
  children,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
