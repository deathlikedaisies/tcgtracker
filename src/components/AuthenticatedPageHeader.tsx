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
    <header className={`${pageHeaderCard} p-3.5 sm:p-5 xl:px-6 xl:py-5 ${className}`}>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 pb-3 xl:hidden">
          <SixPrizerLogo
            {...logoOnDark}
            size="sm"
            hideTextOnMobile
            className="min-w-0"
          />
          <SignOutButton compact />
        </div>

        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
          <div className="min-w-0 max-w-3xl">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]/86">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-1.5 text-[1.75rem] font-bold tracking-tight text-[#F8FAFC] sm:mt-2 sm:text-4xl xl:text-[2rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 text-sm leading-5 text-[#94A3B8]/72 sm:mt-2 sm:leading-6">
                {subtitle}
              </p>
            ) : null}
            {userEmail ? (
              <p className="mt-1.5 truncate text-[11px] text-[#94A3B8]/62 sm:mt-2 sm:text-xs">{userEmail}</p>
            ) : null}
          </div>

          {actions ? (
            <div className="grid gap-3 xl:min-w-[220px] xl:justify-items-end">{actions}</div>
          ) : null}
        </div>

        <div className="xl:hidden">
          <AppNav current={current} />
        </div>
      </div>
    </header>
  );
}
