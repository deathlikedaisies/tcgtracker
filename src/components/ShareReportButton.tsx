"use client";

import { useMemo, useState } from "react";
import { PrizeMapLogo } from "@/components/PrizeMapLogo";

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

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function buildShareText(report: ShareReport) {
  return [
    `${report.title}`,
    `${report.deckName}: ${report.winRate} win rate over ${report.totalMatches} matches`,
    `Best matchup: ${report.bestMatchup}`,
    `Worst matchup: ${report.worstMatchup}`,
    "Generated with PrizeMap",
  ].join("\n");
}

function buildShareSvg(report: ShareReport) {
  const title = escapeXml(truncate(report.title, 42));
  const deckName = escapeXml(truncate(report.deckName, 42));
  const context = escapeXml(truncate(report.context ?? "Matchup Report", 48));
  const bestMatchup = escapeXml(truncate(report.bestMatchup, 30));
  const worstMatchup = escapeXml(truncate(report.worstMatchup, 30));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1020"/>
      <stop offset="1" stop-color="#1A2238"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="960" cy="90" r="230" fill="#4F8CFF" opacity="0.16"/>
  <circle cx="180" cy="560" r="210" fill="#F5C84C" opacity="0.08"/>
  <rect x="70" y="58" width="1060" height="514" rx="22" fill="#10182E" opacity="0.92" filter="url(#softShadow)"/>
  <path d="M116 112 146 96l30 16v45l-30 31-30-31v-45Z" fill="#0B1020" stroke="#4F8CFF" stroke-width="6" stroke-linejoin="round"/>
  <path d="M146 123 160 131v19l-14 14-14-14v-19l14-8Z" fill="none" stroke="#F5C84C" stroke-width="5" stroke-linejoin="round"/>
  <text x="196" y="137" fill="#F8FAFC" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">PrizeMap</text>
  <text x="196" y="170" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="20">Generated with PrizeMap</text>
  <text x="116" y="244" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">${context}</text>
  <text x="116" y="304" fill="#F8FAFC" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800">${title}</text>
  <text x="116" y="356" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="28">${deckName}</text>
  <rect x="116" y="404" width="250" height="112" rx="16" fill="#0B1020" opacity="0.82"/>
  <text x="140" y="442" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">WIN RATE</text>
  <text x="140" y="494" fill="#F8FAFC" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800">${escapeXml(report.winRate)}</text>
  <rect x="392" y="404" width="250" height="112" rx="16" fill="#0B1020" opacity="0.82"/>
  <text x="416" y="442" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">MATCHES</text>
  <text x="416" y="494" fill="#F8FAFC" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800">${report.totalMatches}</text>
  <rect x="668" y="404" width="190" height="112" rx="16" fill="#10251C" opacity="0.95"/>
  <text x="692" y="442" fill="#22C55E" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">BEST</text>
  <text x="692" y="486" fill="#F8FAFC" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700">${bestMatchup}</text>
  <rect x="884" y="404" width="190" height="112" rx="16" fill="#2A1221" opacity="0.95"/>
  <text x="908" y="442" fill="#F43F5E" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">WORST</text>
  <text x="908" y="486" fill="#F8FAFC" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="700">${worstMatchup}</text>
</svg>`;
}

export function ShareReportButton({ report }: ShareReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const shareText = useMemo(() => buildShareText(report), [report]);

  function buildShareLink() {
    const params = new URLSearchParams({
      deck: report.deckName,
      winRate: report.winRate,
      best: report.bestMatchup,
      worst: report.worstMatchup,
      matches: String(report.totalMatches),
    });

    return `${window.location.origin}${window.location.pathname}?report=${params.toString()}`;
  }

  async function copyText() {
    await navigator.clipboard.writeText(shareText);
    setMessage("Share text copied.");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(buildShareLink());
    setMessage("Share link copied.");
  }

  async function copyImage() {
    const svg = buildShareSvg(report);
    const blob = new Blob([svg], { type: "image/svg+xml" });

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/svg+xml": blob,
        }),
      ]);
      setMessage("Share image copied.");
    } catch {
      await navigator.clipboard.writeText(svg);
      setMessage("Image copy was not supported, so the SVG was copied.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setMessage("");
        }}
        className="inline-flex h-10 items-center justify-center rounded-md bg-[#4F8CFF]/12 px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.3)] transition hover:bg-[#4F8CFF]/18"
      >
        Share report
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1020]/85 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-md bg-[#10182E] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-[#F8FAFC]">
                  Matchup Report
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                  Preview a shareable performance card, then copy an image,
                  text, or link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-10 rounded-md bg-[#0B1020]/60 px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(248,250,252,0.08)]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-md bg-[#0B1020] p-5 shadow-[inset_0_0_0_1px_rgba(248,250,252,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <PrizeMapLogo
                  markClassName="size-8 bg-[#1A2238]"
                  textClassName="text-sm text-[#F8FAFC]"
                />
                <span className="text-xs font-medium uppercase text-[#94A3B8]">
                  Generated with PrizeMap
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
                <div className="rounded-md bg-[#1A2238]/75 p-4">
                  <p className="text-xs font-medium uppercase text-[#94A3B8]">
                    Win rate
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#F8FAFC]">
                    {report.winRate}
                  </p>
                </div>
                <div className="rounded-md bg-[#1A2238]/75 p-4">
                  <p className="text-xs font-medium uppercase text-[#94A3B8]">
                    Matches
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#F8FAFC]">
                    {report.totalMatches}
                  </p>
                </div>
                <div className="rounded-md bg-emerald-500/10 p-4">
                  <p className="text-xs font-medium uppercase text-emerald-300">
                    Best
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                    {report.bestMatchup}
                  </p>
                </div>
                <div className="rounded-md bg-[#F43F5E]/10 p-4">
                  <p className="text-xs font-medium uppercase text-rose-200">
                    Worst
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                    {report.worstMatchup}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={copyImage}
                className="h-10 rounded-md bg-[#4F8CFF]/12 px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.3)] transition hover:bg-[#4F8CFF]/18"
              >
                Copy image
              </button>
              <button
                type="button"
                onClick={copyText}
                className="h-10 rounded-md bg-[#4F8CFF]/12 px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.3)] transition hover:bg-[#4F8CFF]/18"
              >
                Copy text
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="h-10 rounded-md bg-[#4F8CFF]/12 px-4 text-sm font-medium text-[#F8FAFC] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.3)] transition hover:bg-[#4F8CFF]/18"
              >
                Copy link
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
