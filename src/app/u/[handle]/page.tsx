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
  buildProfileSummaryText,
  getPublicProfilePageData,
  type ProfileReactionType,
} from "@/lib/community";
import {
  refreshProfileStatsAction,
  toggleFollowAction,
  toggleProfileReactionAction,
} from "@/app/community/actions";

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || "S";
}

function formatVisibility(value: string) {
  return value === "link_only"
    ? "Link-only"
    : value === "public"
      ? "Public"
      : "Private";
}

function formatAnalytics(value: string) {
  return value === "aggregate_only"
    ? "Aggregate only"
    : value === "detailed"
      ? "Detailed"
      : "Private";
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) {
    return "No public stats yet";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const REACTION_LABELS: Record<ProfileReactionType, string> = {
  kudos: "Kudos",
  useful: "Useful",
  testing_this_too: "Testing this too",
  good_tech: "Good tech",
};

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ refreshed?: string }>;
}) {
  const { handle } = await params;
  const { refreshed } = await searchParams;
  const data = await getPublicProfilePageData(handle);

  if (!data) {
    return (
      <main className={`${appBackground} min-h-screen px-4 py-6 text-[#F8FAFC] sm:px-6`}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <section className={`grid gap-4 p-6 sm:p-7 ${cardLarge}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                Community profile
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC]">
                Profile unavailable
              </h1>
              <p className={pageCopy}>
                This profile does not exist, or it is still private.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className={secondaryButton}>
                Back to SixPrizer
              </Link>
              <Link href="/login" className={primaryButton}>
                Log in
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { profile, stats, counts, isOwner, isFollowing, viewerReactions, sharedReports } = data;
  const profileUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  }/u/${profile.handle}`;
  const summaryText = buildProfileSummaryText(profile, stats);
  const refreshAction = refreshProfileStatsAction.bind(
    null,
    profile.handle,
    `/u/${profile.handle}`
  );
  const analyticsVisible = Boolean(stats);
  const publicStats = stats;

  const identityChips = [
    profile.country ? `Country: ${profile.country}` : null,
    profile.favorite_archetype ? `Favorite archetype: ${profile.favorite_archetype}` : null,
    profile.main_deck_name ? `Main deck: ${profile.main_deck_name}` : null,
    profile.current_testing_focus || stats?.current_focus
      ? `Current focus: ${profile.current_testing_focus ?? stats?.current_focus}`
      : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <main className={`${appBackground} min-h-screen px-4 py-6 text-[#F8FAFC] sm:px-6`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section
          data-share-card="profile"
          className={`grid gap-4 p-5 sm:p-6 ${cardLarge}`}
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-4">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="size-20 rounded-[22px] object-cover shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                  />
                ) : (
                  <div className="inline-flex size-20 items-center justify-center rounded-[22px] bg-[linear-gradient(180deg,rgba(79,140,255,0.24),rgba(16,28,48,0.88))] text-2xl font-bold text-[#F8FAFC] shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                    {getInitial(profile.display_name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                      SixPrizer profile
                    </p>
                    {isOwner ? (
                      <span className="rounded-full bg-[#4F8CFF]/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#B8D1FF]">
                        Owner view
                      </span>
                    ) : null}
                    <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-[11px] font-semibold text-[#94A3B8]">
                      {formatVisibility(profile.profile_visibility)}
                    </span>
                    <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-[11px] font-semibold text-[#94A3B8]">
                      {formatAnalytics(profile.analytics_visibility)}
                    </span>
                  </div>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F8FAFC] sm:text-4xl">
                    {profile.display_name}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-[#94A3B8]">@{profile.handle}</p>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-[#D6E0F0]">
                    {profile.bio ??
                      "This player has not added a public bio yet, but their testing identity is set up on SixPrizer."}
                  </p>

                  {identityChips.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {identityChips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full bg-[#07111F]/62 px-3 py-1.5 text-xs font-semibold text-[#DCE8FF] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={`${premiumInset} mt-5 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Sharing mode
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                    Summary only
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Raw match logs
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">Private</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Private notes
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">Private</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Decklists
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">
                    Hidden unless shared separately
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 xl:w-[320px] xl:justify-items-end">
              {isOwner ? (
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <Link href="/settings/profile" className={secondaryButton}>
                    Edit profile
                  </Link>
                  <form action={refreshAction}>
                    <button type="submit" className={secondaryButton}>
                      Refresh public stats
                    </button>
                  </form>
                  <Link href="/matchups" className={primaryButton}>
                    Share matchup report
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <form
                    action={toggleFollowAction.bind(
                      null,
                      profile.user_id,
                      profile.handle,
                      isFollowing
                    )}
                  >
                    <button type="submit" className={primaryButton}>
                      {isFollowing ? "Following" : "Follow"}
                    </button>
                  </form>
                </div>
              )}

              <CopySummaryButtons
                link={profileUrl}
                summaryText={summaryText}
                linkLabel="Copy profile link"
                summaryLabel="Copy profile summary"
              />

              <div className={`${premiumInset} grid gap-3 p-4 text-sm`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Public stats
                  </p>
                  <p className="mt-2 font-semibold text-[#F8FAFC]">
                    {analyticsVisible ? "Safe aggregate summary visible" : "Testing stats are private"}
                  </p>
                </div>
                <p className="leading-6 text-[#94A3B8]/78">
                  {analyticsVisible
                    ? `Updated ${formatUpdatedAt(stats?.updated_at)}. Other players only see aggregate trends, never raw logs, notes, or decklists.`
                    : "This profile shares player identity only right now. Testing stats stay private until the owner chooses to surface aggregate signal."}
                </p>
                {refreshed === "1" ? (
                  <p className="text-sm font-medium text-emerald-300">
                    Public stats refreshed.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {publicStats ? (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Games logged", value: String(publicStats.total_matches) },
              { label: "Record", value: `${publicStats.win_count}-${publicStats.loss_count}-${publicStats.tie_count}` },
              {
                label: "Win rate",
                value:
                  publicStats.win_rate !== null && publicStats.win_rate !== undefined
                    ? `${publicStats.win_rate}%`
                    : "Not enough games",
              },
              { label: "Decks", value: String(publicStats.total_decks) },
              { label: "Active weeks", value: String(publicStats.active_weeks) },
            ].map((stat) => (
              <div key={stat.label} className={`p-4 ${card}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">{stat.value}</p>
              </div>
            ))}
          </section>
        ) : (
          <section className={`${card} p-4 sm:p-5`}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
              Stats visibility
            </p>
            <h2 className={`mt-2 ${sectionTitle}`}>Testing stats are private</h2>
            <p className={pageCopy}>
              This public profile shares player identity only. Aggregate analytics can be turned on later without exposing raw games, notes, or full lists.
            </p>
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4">
            <article className={`grid gap-4 p-5 ${cardLarge}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                  Current testing
                </p>
                <h2 className={`mt-2 ${sectionTitle}`}>
                  {profile.current_testing_focus ?? stats?.current_focus ?? "No public focus set"}
                </h2>
                <p className={pageCopy}>
                  {analyticsVisible
                    ? "This is a summary-only coaching view. It is meant to show what the player is testing, not expose their raw preparation work."
                    : "Identity is public here, but the player has kept testing analytics private for now."}
                </p>
              </div>

              {publicStats ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Most played deck", value: publicStats.most_played_deck ?? "Not enough games" },
                    { label: "Weakest matchup", value: publicStats.weakest_matchup ?? "Needs 5 games" },
                    { label: "Strongest matchup", value: publicStats.strongest_matchup ?? "Needs 5 games" },
                    { label: "Best improvement", value: publicStats.best_improvement ?? "No clear version gap yet" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[18px] bg-[#07111F]/54 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#F8FAFC]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>

            <article className={`grid gap-4 p-5 ${cardLarge}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                    Shared reports
                  </p>
                  <h2 className={`mt-2 ${sectionTitle}`}>Shareable analytics</h2>
                </div>
                {isOwner ? (
                  <Link href="/matchups" className={secondaryButton}>
                    Create report
                  </Link>
                ) : null}
              </div>

              {sharedReports.length ? (
                <div className="grid gap-3">
                  {sharedReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/r/${report.slug}`}
                      className="rounded-[18px] bg-[#07111F]/54 p-4 transition hover:bg-[#0B1730]/72"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                            {report.report_type.replaceAll("_", " ")}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-[#F8FAFC]">
                            {report.title}
                          </p>
                        </div>
                        {isOwner ? (
                          <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-xs font-semibold text-[#94A3B8]">
                            {formatVisibility(report.visibility)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#94A3B8]/74">
                        Shared reports stay aggregate-only in this MVP. They highlight matchup or testing signal without exposing raw game history.
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[20px] bg-[#07111F]/54 p-4 text-sm leading-6 text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  No public reports yet.
                </div>
              )}
            </article>
          </div>

          <aside className="grid gap-4">
            <div className={`grid gap-4 p-5 ${cardLarge}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4F8CFF]">
                  Community
                </p>
                <h2 className={`mt-2 ${sectionTitle}`}>Testing reputation</h2>
                <p className={pageCopy}>
                  Lightweight signals only. No comments, no feed, no raw logs.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[18px] bg-[#07111F]/54 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Followers
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                    {counts.followerCount}
                  </p>
                </div>
                <div className="rounded-[18px] bg-[#07111F]/54 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Following
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">
                    {counts.followingCount}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {(Object.keys(REACTION_LABELS) as ProfileReactionType[]).map((reactionType) => {
                  const hasReacted = viewerReactions.includes(reactionType);
                  return (
                    <form
                      key={reactionType}
                      action={toggleProfileReactionAction.bind(
                        null,
                        profile.user_id,
                        profile.id,
                        profile.handle,
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
                        <span>{counts.profileReactions[reactionType] ?? 0}</span>
                      </button>
                    </form>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
