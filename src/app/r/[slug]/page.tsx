import Link from "next/link";
import { CopySummaryButtons } from "@/components/community/CopySummaryButtons";
import {
  appBackground,
  card,
  cardLarge,
  pageCopy,
  premiumInset,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from "@/components/brand-styles";
import {
  buildReportSummaryText,
  getSharedReportBySlug,
  type ProfileReactionType,
} from "@/lib/community";
import { toggleReportReactionAction } from "@/app/community/actions";

const REACTION_LABELS: Record<ProfileReactionType, string> = {
  kudos: "Kudos",
  useful: "Useful",
  testing_this_too: "Testing this too",
  good_tech: "Good tech",
};

function formatVisibility(value: string) {
  return value === "link_only"
    ? "Link-only"
    : value === "public"
      ? "Public"
      : "Private";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getTagLabel(item: unknown) {
  if (item && typeof item === "object" && "value" in item) {
    return String((item as { value: unknown }).value);
  }

  return String(item);
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getSharedReportBySlug(slug);

  if (!data) {
    return (
      <main className={`${appBackground} min-h-screen px-4 py-6 text-[#F8FAFC] sm:px-6`}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <section className={`grid gap-4 p-6 sm:p-7 ${cardLarge}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                Shared report
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC]">
                Report unavailable
              </h1>
              <p className={pageCopy}>
                This report does not exist, or it is not shared publicly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className={secondaryButton}>
                Back to SixPrizer
              </Link>
              <Link href="/matchups" className={primaryButton}>
                Open Matchups
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { report, ownerProfile, isOwner, viewerReactions, reactionCounts } = data;
  const reportUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  }/r/${report.slug}`;
  const summaryText = buildReportSummaryText(report);
  const summary = report.summary;
  const issueTags = Array.isArray(summary.issueTags) ? summary.issueTags : [];
  const positiveTags = Array.isArray(summary.positiveTags) ? summary.positiveTags : [];
  const matchup = typeof summary.matchup === "string" ? summary.matchup : report.title;
  const deckName = typeof summary.deckName === "string" ? summary.deckName : "Current deck";
  const record = typeof summary.record === "string" ? summary.record : "0-0";
  const winRate = typeof summary.winRate === "string" ? summary.winRate : "0%";
  const recommendation =
    typeof summary.recommendation === "string"
      ? summary.recommendation
      : "Keep tagging what breaks first in the next few games.";

  return (
    <main className={`${appBackground} min-h-screen px-4 py-6 text-[#F8FAFC] sm:px-6`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <section
          data-share-card="report"
          className={`grid gap-4 p-5 sm:p-6 ${cardLarge}`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                  Shared from SixPrizer
                </p>
                <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-[11px] font-semibold text-[#94A3B8]">
                  {report.report_type.replaceAll("_", " ")}
                </span>
                {isOwner ? (
                  <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-[11px] font-semibold text-[#94A3B8]">
                    {formatVisibility(report.visibility)}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
                {report.title}
              </h1>
              <p className={pageCopy}>
                Competitive summary only. This page shares the matchup read and current recommendation, never raw logs, private notes, or full decklists.
              </p>

              <div className={`${premiumInset} mt-5 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Matchup
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{matchup}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Deck context
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{deckName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Record
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{record}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Win rate
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{winRate}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 xl:w-[280px] xl:justify-items-end">
              <CopySummaryButtons
                link={reportUrl}
                summaryText={summaryText}
                linkLabel="Copy report link"
                summaryLabel="Copy report summary"
              />
              <div className={`${premiumInset} grid gap-3 p-4 text-sm`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Shared context
                  </p>
                  <p className="mt-2 font-semibold text-[#F8FAFC]">
                    {ownerProfile ? `Shared by ${ownerProfile.display_name}` : "Shared anonymously from a private profile"}
                  </p>
                </div>
                <p className="leading-6 text-[#94A3B8]/78">
                  Created {formatDate(report.created_at)}. Shared reports stay summary-only in this MVP so other players can read the testing signal without seeing the underlying prep notes or match history.
                </p>
                {ownerProfile ? (
                  <Link href={`/u/${ownerProfile.handle}`} className={secondaryButton}>
                    Open profile
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className={`grid gap-4 p-5 ${cardLarge}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                What this means
              </p>
              <h2 className={`mt-2 ${sectionTitle}`}>Current recommendation</h2>
              <p className="mt-3 text-sm leading-7 text-[#D6E0F0]/84">
                {recommendation}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[#07111F]/54 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Key issue tags
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {issueTags.length ? (
                    issueTags.map((item, index) => {
                      const label = getTagLabel(item);

                      return (
                        <span
                          key={`${label}-${index}`}
                          className="rounded-full bg-[#F43F5E]/10 px-3 py-1 text-xs font-semibold text-rose-200"
                        >
                          {label}
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[#94A3B8]">No public issue tags.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[18px] bg-[#07111F]/54 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Positive tags
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {positiveTags.length ? (
                    positiveTags.map((item, index) => {
                      const label = getTagLabel(item);

                      return (
                        <span
                          key={`${label}-${index}`}
                          className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200"
                        >
                          {label}
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[#94A3B8]">No public positive tags.</p>
                  )}
                </div>
              </div>
            </div>

            <div className={`${premiumInset} p-4`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Safe summary only
              </p>
              <p className="mt-2 text-sm leading-6 text-[#D6E0F0]/82">
                Shared reports are designed to show the matchup read, not the private preparation behind it. No raw logs, match ids, decklists, or private notes are exposed here.
              </p>
            </div>
          </article>

          <aside className={`grid gap-4 p-5 ${cardLarge}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                Community feedback
              </p>
              <h2 className={`mt-2 ${sectionTitle}`}>Reactions</h2>
              <p className={pageCopy}>
                Lightweight feedback only. No comments or feed in this MVP.
              </p>
            </div>

            <div className="grid gap-2">
              {(Object.keys(REACTION_LABELS) as ProfileReactionType[]).map((reactionType) => {
                const hasReacted = viewerReactions.includes(reactionType);
                return (
                  <form
                    key={reactionType}
                    action={toggleReportReactionAction.bind(
                      null,
                      report.user_id,
                      report.id,
                      report.slug,
                      reactionType,
                      hasReacted
                    )}
                  >
                    <button
                      type="submit"
                      className={`flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-sm font-medium transition ${
                        hasReacted
                          ? "bg-[#4F8CFF]/16 text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(79,140,255,0.18)]"
                          : "bg-[#07111F]/54 text-[#D6E0F0] hover:bg-[#0B1730]/72"
                      }`}
                    >
                      <span>{REACTION_LABELS[reactionType]}</span>
                      <span>{reactionCounts[reactionType] ?? 0}</span>
                    </button>
                  </form>
                );
              })}
            </div>

            <div className={`${card} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Export readiness
              </p>
              <p className="mt-2 text-sm leading-6 text-[#94A3B8]/78">
                This report card is now wrapped as a stable share surface so image export can be added later without rebuilding the report layout.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
