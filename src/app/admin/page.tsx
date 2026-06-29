import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowLeft, BarChart3, MessageSquareText, ShieldCheck, Users } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthenticatedPageHeader } from "@/components/AuthenticatedPageHeader";
import {
  appShell,
  cardLarge,
  glassPanel,
  pageTitle,
  secondaryButton,
  sectionCopy,
} from "@/components/brand-styles";
import {
  ADMIN_EMAIL,
  getAdminAnalytics,
  type AdminActivityItem,
  type AdminAnalytics,
} from "@/lib/admin-analytics";
import { getBetaSignupStatus, type BetaSignupStatus } from "@/lib/beta-signup";
import { hasAdminSupabaseConfig } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function formatDateTime(value: string | null) {
  if (!value) {
    return "None";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "None";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function activityLabel(kind: AdminActivityItem["kind"]) {
  switch (kind) {
    case "deck":
      return "Deck";
    case "version":
      return "Version";
    case "match":
      return "Match";
    case "feedback":
      return "Feedback";
  }
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[22px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
      <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#94A3B8]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#F8FAFC]">{value}</p>
    </div>
  );
}

function BetaMetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[22px] bg-[#0F1A2D]/82 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.10)]">
      <p className="text-xs font-semibold uppercase tracking-[0.10em] text-[#94A3B8]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#F8FAFC]">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Active tester"
      ? "bg-emerald-400/12 text-emerald-200"
      : status === "Logged games"
        ? "bg-[#4F8CFF]/14 text-[#B8D1FF]"
        : status === "Created deck"
          ? "bg-[#F5C84C]/12 text-[#FFE28A]"
          : "bg-[#1A2238] text-[#94A3B8]";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function AdminDashboard({
  analytics,
  betaSignupStatus,
}: {
  analytics: AdminAnalytics;
  betaSignupStatus: BetaSignupStatus;
}) {
  return (
    <div className={appShell}>
      <AppSidebar current="settings" />
      <main className="min-w-0 flex-1 space-y-6">
        <AuthenticatedPageHeader
          eyebrow="Internal"
          title="Beta activity dashboard"
          subtitle="Admin-only view of signup, deck, match, archetype, and feedback activity."
          current="settings"
        />

        <section className={`${glassPanel} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-[#4F8CFF]/12 px-3 py-1.5 text-sm font-semibold text-[#B8D1FF]">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Admin-only
              </p>
              <h1 className={`mt-3 ${pageTitle}`}>Beta activity</h1>
              <p className={`mt-2 max-w-3xl ${sectionCopy}`}>
                Aggregated from auth users, decks, versions, matches, and feedback. Full match notes,
                decklists, and raw pasted logs are intentionally not shown.
              </p>
            </div>
            <Link href="/dashboard" className={`${secondaryButton} h-11 px-4`}>
              <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
              Back to app
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Signed-up users" value={analytics.summary.totalUsers} />
          <SummaryCard label="Users with decks" value={analytics.summary.usersWithDeck} />
          <SummaryCard label="Users with games" value={analytics.summary.usersWithMatch} />
          <SummaryCard label="Active last 7 days" value={analytics.summary.activeUsersLast7Days} />
          <SummaryCard label="Total decks" value={analytics.summary.totalDecks} />
          <SummaryCard label="Deck versions" value={analytics.summary.totalVersions} />
          <SummaryCard label="Logged games" value={analytics.summary.totalMatches} />
          <SummaryCard label="Feedback reports" value={analytics.summary.feedbackReports} />
        </section>

        <section className={`${glassPanel} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#F5C84C]">
                Beta signup gate
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#F8FAFC]">
                {betaSignupStatus.inviteGateEnabled
                  ? "Invite-only signup is active"
                  : "Signup gate is open"}
              </h2>
              <p className={`mt-2 max-w-3xl ${sectionCopy}`}>
                Invite codes are checked server-side before Supabase Auth creates a user.
                The invite code is never exposed through a public variable.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[440px]">
              <BetaMetricCard
                label="Beta users"
                value={betaSignupStatus.currentBetaUsers ?? analytics.summary.totalUsers}
              />
              <BetaMetricCard
                label="Signup cap"
                value={betaSignupStatus.maxBetaUsers ?? "No cap"}
              />
              <BetaMetricCard
                label="Spots left"
                value={betaSignupStatus.remainingSpots ?? "Open"}
              />
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#94A3B8]">
            {betaSignupStatus.maxBetaUsers === null
              ? "No MAX_BETA_USERS cap is configured."
              : betaSignupStatus.canCountUsers
                ? "The cap count excludes the owner admin account."
                : "Signup cap is configured, but user counting is unavailable without the server-only service role key."}
          </p>
        </section>

        <section className={`${cardLarge} overflow-hidden`}>
          <div className="flex items-center gap-3">
            <Users className="size-5 text-[#F5C84C]" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">User activity</h2>
              <p className="text-sm text-[#94A3B8]">One row per signed-up account.</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[1100px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.10em] text-[#94A3B8]">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Signup</th>
                  <th className="py-3 pr-4">Decks</th>
                  <th className="py-3 pr-4">Versions</th>
                  <th className="py-3 pr-4">Games</th>
                  <th className="py-3 pr-4">Last game</th>
                  <th className="py-3 pr-4">Recent deck</th>
                  <th className="py-3 pr-4">Archetype</th>
                  <th className="py-3 pr-4">Active deck</th>
                  <th className="py-3 pr-4">Feedback</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-[#D6E0F0]">
                {analytics.users.map((user) => (
                  <tr key={user.userId}>
                    <td className="py-3 pr-4 font-semibold text-[#F8FAFC]">{user.email}</td>
                    <td className="py-3 pr-4">{formatDate(user.signupDate)}</td>
                    <td className="py-3 pr-4">{user.decks}</td>
                    <td className="py-3 pr-4">{user.versions}</td>
                    <td className="py-3 pr-4">{user.matches}</td>
                    <td className="py-3 pr-4">{formatDateTime(user.lastLoggedGameDate)}</td>
                    <td className="py-3 pr-4">{user.mostRecentDeckName ?? "None"}</td>
                    <td className="py-3 pr-4">{user.mostRecentArchetype ?? "None"}</td>
                    <td className="py-3 pr-4">{user.activeDeckName ?? "None"}</td>
                    <td className="py-3 pr-4">{user.feedbackCount}</td>
                    <td className="py-3">
                      <StatusPill status={user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className={cardLarge}>
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5 text-[#4F8CFF]" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold text-[#F8FAFC]">Deck/archetype overview</h2>
                <p className="text-sm text-[#94A3B8]">What beta users are testing.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {analytics.archetypes.length ? (
                analytics.archetypes.map((item) => (
                  <div
                    key={item.archetype}
                    className="rounded-[18px] bg-[#0F1A2D]/72 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#F8FAFC]">{item.archetype}</p>
                      <p className="text-sm font-semibold text-[#F5C84C]">{item.matches} games</p>
                    </div>
                    <p className="mt-2 text-sm text-[#94A3B8]">
                      {item.users} users testing · {item.decks} decks
                    </p>
                  </div>
                ))
              ) : (
                <p className={sectionCopy}>No decks created yet.</p>
              )}
            </div>
          </section>

          <section className={cardLarge}>
            <div className="flex items-center gap-3">
              <Activity className="size-5 text-[#F5C84C]" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold text-[#F8FAFC]">Recent activity</h2>
                <p className="text-sm text-[#94A3B8]">Latest 20 derived activity items.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {analytics.recentActivity.length ? (
                analytics.recentActivity.map((item) => (
                  <div
                    key={`${item.kind}-${item.createdAt}-${item.email}-${item.description}`}
                    className="rounded-[18px] bg-[#0F1A2D]/72 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.09)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-[#4F8CFF]/12 px-2.5 py-1 text-xs font-semibold text-[#B8D1FF]">
                        {activityLabel(item.kind)}
                      </span>
                      <span className="text-xs text-[#94A3B8]">{formatDateTime(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#F8FAFC]">{item.email}</p>
                    <p className="mt-1 text-sm text-[#C7D2E5]">{item.description}</p>
                  </div>
                ))
              ) : (
                <p className={sectionCopy}>No activity yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className={cardLarge}>
          <div className="flex items-center gap-3">
            <MessageSquareText className="size-5 text-[#F5C84C]" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC]">Recent feedback</h2>
              <p className="text-sm text-[#94A3B8]">Message previews only, no private match data.</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[920px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.10em] text-[#94A3B8]">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Severity</th>
                  <th className="py-3 pr-4">Area</th>
                  <th className="py-3 pr-4">Message</th>
                  <th className="py-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-[#D6E0F0]">
                {analytics.recentFeedback.length ? (
                  analytics.recentFeedback.map((item) => (
                    <tr key={`${item.createdAt}-${item.email}-${item.messagePreview}`}>
                      <td className="py-3 pr-4">{formatDateTime(item.createdAt)}</td>
                      <td className="py-3 pr-4 font-semibold text-[#F8FAFC]">{item.email}</td>
                      <td className="py-3 pr-4">{item.type}</td>
                      <td className="py-3 pr-4">{item.severity}</td>
                      <td className="py-3 pr-4">{item.pageArea ?? "None"}</td>
                      <td className="py-3 pr-4">{item.messagePreview}</td>
                      <td className="py-3">{item.contactOk ? "Yes" : "No"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-[#94A3B8]">
                      No feedback submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  if (!hasAdminSupabaseConfig()) {
    return (
      <div className={appShell}>
        <AppSidebar current="settings" />
        <main className="min-w-0 flex-1">
          <AuthenticatedPageHeader
            eyebrow="Internal"
            title="Beta activity dashboard"
            subtitle="Admin-only view of beta activity."
            current="settings"
          />
          <section className={`${cardLarge} mt-6`}>
            <h1 className="text-2xl font-black text-[#F8FAFC]">Admin service key missing</h1>
            <p className={`mt-3 ${sectionCopy}`}>
              Set `SUPABASE_SERVICE_ROLE_KEY` server-side to aggregate cross-user activity.
              The key must not be prefixed with `NEXT_PUBLIC`.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const [analytics, betaSignupStatus] = await Promise.all([
    getAdminAnalytics(),
    getBetaSignupStatus(),
  ]);

  return <AdminDashboard analytics={analytics} betaSignupStatus={betaSignupStatus} />;
}
