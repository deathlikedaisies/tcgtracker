import Link from "next/link";
import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import { logoOnDark, pageHeaderCard } from "@/components/brand-styles";
import { SignOutButton } from "@/components/SignOutButton";
import type { AppSection } from "@/lib/app-navigation";

type AuthenticatedPageHeaderProps = {
  current: AppSection;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  userEmail?: string;
  actions?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function AuthenticatedPageHeader({
  current,
  title,
  subtitle,
  eyebrow,
  userEmail,
  actions,
  className = "",
  compact = false,
}: AuthenticatedPageHeaderProps) {
  return (
    <header
      className={`${pageHeaderCard} overflow-hidden ${
        compact ? "p-2.5 sm:p-3 xl:px-4 xl:py-3" : "p-3 sm:p-4 xl:px-6 xl:py-5"
      } ${className}`}
    >
      <div className={`flex flex-col ${compact ? "gap-2" : "gap-3 sm:gap-4"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 xl:hidden">
          <Link
            href="/dashboard"
            aria-label="Go to dashboard"
            className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5C84C]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]"
          >
            <SixPrizerLogo
              {...logoOnDark}
              size="sm"
              hideTextOnMobile
              className="min-w-0"
            />
          </Link>
          <SignOutButton compact />
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
          <div className="min-w-0 max-w-3xl">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4F8CFF]/86">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={`mt-1 font-bold tracking-tight text-[#F8FAFC] ${
                compact
                  ? "text-[1.35rem] sm:text-2xl xl:text-[1.65rem]"
                  : "text-[1.55rem] sm:mt-2 sm:text-4xl xl:text-[2rem]"
              }`}
            >
              {title}
            </h1>
            {subtitle ? (
              <p
                className={`mt-1 text-sm text-[#94A3B8]/72 ${
                  compact ? "leading-5" : "leading-5 sm:mt-2 sm:leading-6"
                }`}
              >
                {subtitle}
              </p>
            ) : null}
            {userEmail ? (
              <p
                className={`mt-1 truncate text-[11px] text-[#94A3B8]/62 ${
                  compact ? "" : "sm:mt-2 sm:text-xs"
                }`}
              >
                {userEmail}
              </p>
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
