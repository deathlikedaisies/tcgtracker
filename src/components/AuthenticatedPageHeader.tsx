import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { logoOnDark, pageHeaderCard } from "@/components/brand-styles";
import { SignOutButton } from "@/components/SignOutButton";

type AppNavSection =
  | "dashboard"
  | "decks"
  | "matches"
  | "log"
  | "matchups"
  | "review"
  | "settings";

type AuthenticatedPageHeaderProps = {
  current: AppNavSection;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  userEmail?: string;
  actions?: ReactNode;
  className?: string;
};

export function AuthenticatedPageHeader({
  current,
  title,
  subtitle,
  eyebrow,
  userEmail,
  actions,
  className = "",
}: AuthenticatedPageHeaderProps) {
  return (
    <header className={`${pageHeaderCard} p-4 sm:p-5 lg:p-6 ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-4">
          <SixPrizerLogo
            {...logoOnDark}
            size="sm"
            hideTextOnMobile
            className="min-w-0"
          />
          <SignOutButton />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]/86">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/72">
                {subtitle}
              </p>
            ) : null}
            {userEmail ? (
              <p className="mt-2 truncate text-xs text-[#94A3B8]/62">{userEmail}</p>
            ) : null}
          </div>

          {actions ? (
            <div className="grid gap-3 lg:justify-items-end">{actions}</div>
          ) : null}
        </div>

        <div className="lg:hidden">
          <AppNav current={current} />
        </div>
      </div>
    </header>
  );
}
