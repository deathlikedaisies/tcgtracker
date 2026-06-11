"use client";

import { useMemo, useState } from "react";
import { SixPrizerLogo } from "@/components/SixPrizerLogo";
import {
  glassPanelStrong,
  premiumInset,
  premiumInsetStrong,
  primaryButton,
  secondaryButton,
} from "@/components/brand-styles";

export type ShareReport = {
  title: string;
  deckName: string;
  winRate: string;
  worstMatchup: string;
  bestMatchup: string;
  totalMatches: number;
  context?: string;
};

type ShareReportButtonProps = {
  report: ShareReport;
};

function buildShareText(report: ShareReport) {
  return [
    `${report.title}`,
    `${report.deckName}: ${report.winRate} win rate over ${report.totalMatches} matches`,
    `Best matchup: ${report.bestMatchup}`,
    `Worst matchup: ${report.worstMatchup}`,
    "Generated with SixPrizer",
  ].join("\n");
}

export function ShareReportButton({ report }: ShareReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const shareText = useMemo(() => buildShareText(report), [report]);

  async function copyText() {
    await navigator.clipboard.writeText(shareText);
    setMessage("Text summary copied.");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setMessage("Page link copied.");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setMessage("");
        }}
        className={`${secondaryButton} h-10 px-4`}
      >
        Share report
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/85 px-4 py-8 backdrop-blur-sm">
          <div className={`w-full max-w-3xl p-4 sm:p-6 ${glassPanelStrong}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                  Matchup Report
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                  Copy a text summary or the link to this filtered view.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`${secondaryButton} h-10 px-4`}
              >
                Close
              </button>
            </div>

            <div className={`${premiumInsetStrong} mt-5 p-5`}>
              <div className="flex items-center justify-between gap-4">
                <SixPrizerLogo
                  markClassName="size-8 bg-[#1A2238]"
                  textClassName="text-sm text-[#F8FAFC]"
                />
                <span className="text-xs font-medium uppercase text-[#94A3B8]">
                  Generated with SixPrizer
                </span>
              </div>

              <div className="mt-8">
                <p className="text-sm font-semibold text-[#4F8CFF]">
                  {report.context ?? "Matchup Report"}
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#F8FAFC]">
                  {report.title}
                </h3>
                <p className="mt-2 text-sm text-[#94A3B8]">{report.deckName}</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className={`${premiumInset} p-4`}>
                  <p className="text-xs font-medium uppercase text-[#94A3B8]">
                    Win rate
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#F8FAFC]">
                    {report.winRate}
                  </p>
                </div>
                <div className={`${premiumInset} p-4`}>
                  <p className="text-xs font-medium uppercase text-[#94A3B8]">
                    Matches
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#F8FAFC]">
                    {report.totalMatches}
                  </p>
                </div>
                <div className="rounded-[22px] bg-emerald-500/10 p-4 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.16)]">
                  <p className="text-xs font-medium uppercase text-emerald-300">
                    Best
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                    {report.bestMatchup}
                  </p>
                </div>
                <div className="rounded-[22px] bg-[#F43F5E]/10 p-4 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.16)]">
                  <p className="text-xs font-medium uppercase text-rose-200">
                    Worst
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                    {report.worstMatchup}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyText}
                className={`${primaryButton} h-10 px-4`}
              >
                Copy text summary
              </button>
              <button
                type="button"
                onClick={copyLink}
                className={`${secondaryButton} h-10 px-4`}
              >
                Copy page link
              </button>
            </div>

            {message ? (
              <p className="mt-4 text-sm font-medium text-emerald-300">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
