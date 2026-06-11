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
  const refreshAction = refreshProfileStatsAction.bind(null, profile.handle, `/u/${profile.handle}`);

  return (
    <main className={`${appBackground} min-h-screen px-4 py-6 text-[#F8FAFC] sm:px-6`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className={`grid gap-4 p-5 sm:p-6 ${cardLarge}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-[#F8FAFC]">
                    {profile.display_name}
                  </h1>
                  {isOwner ? (
                    <span className="rounded-full bg-[#4F8CFF]/12 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#B8D1FF]">
                      Owner view
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-[#94A3B8]">@{profile.handle}</p>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#D6E0F0]">
                  {profile.bio ?? "No bio added yet."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.favorite_archetype ? (
                    <span className="rounded-full bg-[#4F8CFF]/12 px-3 py-1 text-xs font-semibold text-[#DCE8FF]">
                      Favorite archetype: {profile.favorite_archetype}
                    </span>
                  ) : null}
                  {profile.main_deck_name ? (
                    <span className="rounded-full bg-[#F5C84C]/12 px-3 py-1 text-xs font-semibold text-[#FFE28A]">
                      Main deck: {profile.main_deck_name}
                    </span>
                  ) : null}
                  {profile.current_testing_focus || stats?.current_focus ? (
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Focus: {profile.current_testing_focus ?? stats?.current_focus}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:justify-items-end">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-xs font-semibold text-[#94A3B8]">
                  {formatVisibility(profile.profile_visibility)}
                </span>
                <span className="rounded-full bg-[#07111F]/72 px-3 py-1 text-xs font-semibold text-[#94A3B8]">
                  {formatAnalytics(profile.analytics_visibility)}
                </span>
              </div>

              {isOwner ? (
                <div className="flex flex-wrap gap-2">
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
                <div className="flex flex-wrap gap-2">
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
              {refreshed === "1" ? (
                <p className="text-sm font-medium text-emerald-300">
                  Public stats refreshed.
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Games logged", value: String(stats?.total_matches ?? 0) },
            {
              label: "Record",
              value: stats
                ? `${stats.win_count}-${stats.loss_count}-${stats.tie_count}`
                : "Hidden",
            },
            {
              label: "Win rate",
              value:
                stats?.win_rate !== null && stats?.win_rate !== undefined
                  ? `${stats.win_rate}%`
                  : "Hidden",
            },
            { label: "Decks", value: String(stats?.total_decks ?? 0) },
            { label: "Active weeks", value: String(stats?.active_weeks ?? 0) },
          ].map((stat) => (
            <div key={stat.label} className={`p-4 ${card}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">{stat.value}</p>
            </div>
          ))}
        </section>

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
                  {stats
                    ? "Public profiles use safe aggregate stats and owner-approved reports only."
                    : "This profile keeps analytics private for now."}
                </p>
              </div>

              {stats ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Most played deck", value: stats.most_played_deck ?? "Not enough games" },
                    { label: "Weakest matchup", value: stats.weakest_matchup ?? "Needs 5 games" },
                    { label: "Strongest matchup", value: stats.strongest_matchup ?? "Needs 5 games" },
                    { label: "Best improvement", value: stats.best_improvement ?? "No clear version gap yet" },
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
              ) : (
                <div className="rounded-[20px] bg-[#07111F]/54 p-4 text-sm leading-6 text-[#94A3B8] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
                  Analytics are private on this profile.
                </div>
              )}
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
                        <div>
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
                {(
                  Object.keys(REACTION_LABELS) as ProfileReactionType[]
                ).map((reactionType) => {
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
