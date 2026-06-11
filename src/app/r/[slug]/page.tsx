import Link from "next/link";
import { CopySummaryButtons } from "@/components/community/CopySummaryButtons";
import {
  appBackground,
  card,
  cardLarge,
  pageCopy,
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
  const cards = [
    {
      label: "Matchup",
      value:
        typeof summary.matchup === "string" ? summary.matchup : report.title,
    },
    {
      label: "Deck",
      value:
        typeof summary.deckName === "string" ? summary.deckName : "Current deck",
    },
    {
      label: "Record",
      value: typeof summary.record === "string" ? summary.record : "0-0",
    },
    {
      label: "Win rate",
      value: typeof summary.winRate === "string" ? summary.winRate : "0%",
    },
  ];

  return (
    <main className={`${appBackground} min-h-screen px-4 py-6 text-[#F8FAFC] sm:px-6`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header className={`grid gap-4 p-5 sm:p-6 ${cardLarge}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                {report.report_type.replaceAll("_", " ")}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC]">
                {report.title}
              </h1>
              <p className={pageCopy}>
                Shared from SixPrizer as a safe aggregate report.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#94A3B8]">
                {ownerProfile ? (
                  <Link
                    href={`/u/${ownerProfile.handle}`}
                    className="font-medium text-[#DCE8FF] hover:text-white"
                  >
                    @{ownerProfile.handle}
                  </Link>
                ) : null}
                <span>Created {formatDate(report.created_at)}</span>
                {isOwner ? (
                  <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-xs font-semibold">
                    {formatVisibility(report.visibility)}
                  </span>
                ) : null}
              </div>
            </div>

            <CopySummaryButtons
              link={reportUrl}
              summaryText={summaryText}
              linkLabel="Copy report link"
              summaryLabel="Copy report summary"
            />
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((cardItem) => (
            <div key={cardItem.label} className={`p-4 ${card}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                {cardItem.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                {cardItem.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className={`grid gap-4 p-5 ${cardLarge}`}>
            <div>
              <h2 className={sectionTitle}>Summary</h2>
              <p className={pageCopy}>
                {typeof summary.recommendation === "string"
                  ? summary.recommendation
                  : "Keep logging the matchup before making a list change."}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[#07111F]/54 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Key issue tags
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray(summary.issueTags) && summary.issueTags.length ? (
                    summary.issueTags.map((item, index) => {
                      const label =
                        item && typeof item === "object" && "value" in item
                          ? String((item as { value: unknown }).value)
                          : String(item);

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
              <div className="rounded-[18px] bg-[#07111F]/54 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  Positive tags
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.isArray(summary.positiveTags) && summary.positiveTags.length ? (
                    summary.positiveTags.map((item, index) => {
                      const label =
                        item && typeof item === "object" && "value" in item
                          ? String((item as { value: unknown }).value)
                          : String(item);

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

            <div className="rounded-[18px] bg-[#07111F]/54 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                Recommendation
              </p>
              <p className="mt-2 text-sm leading-6 text-[#F8FAFC]">
                {typeof summary.recommendation === "string"
                  ? summary.recommendation
                  : "Keep tagging what breaks first in the next few games."}
              </p>
            </div>
          </article>

          <aside className={`grid gap-4 p-5 ${cardLarge}`}>
            <div>
              <h2 className={sectionTitle}>Reactions</h2>
              <p className={pageCopy}>
                Lightweight feedback only. No comments or feed in this MVP.
              </p>
            </div>
            <div className="grid gap-2">
              {(Object.keys(REACTION_LABELS) as ProfileReactionType[]).map(
                (reactionType) => {
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
                }
              )}
            </div>
            {ownerProfile ? (
              <Link href={`/u/${ownerProfile.handle}`} className={secondaryButton}>
                Open profile
              </Link>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}
