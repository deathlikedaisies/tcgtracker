import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export const ADMIN_EMAIL = "domzimm888@gmail.com";

type UserSummary = {
  id: string;
  email: string;
  createdAt: string | null;
};

type DeckRow = {
  id: string;
  user_id: string;
  name: string;
  archetype: string;
  created_at: string;
};

type VersionRow = {
  id: string;
  deck_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type MatchRow = {
  id: string;
  user_id: string;
  deck_version_id: string;
  opponent_archetype: string;
  played_at: string;
  created_at: string;
};

type FeedbackRow = {
  id: string;
  user_id: string;
  type: string;
  page_area: string | null;
  severity: string;
  message: string;
  contact_ok: boolean;
  user_email: string | null;
  created_at: string;
};

export type AdminUserActivity = {
  userId: string;
  email: string;
  signupDate: string | null;
  decks: number;
  versions: number;
  matches: number;
  lastLoggedGameDate: string | null;
  mostRecentDeckName: string | null;
  mostRecentArchetype: string | null;
  activeDeckName: string | null;
  feedbackCount: number;
  status: "Signed up only" | "Created deck" | "Logged games" | "Active tester";
};

export type AdminArchetypeOverview = {
  archetype: string;
  users: number;
  decks: number;
  matches: number;
};

export type AdminActivityItem = {
  kind: "deck" | "version" | "match" | "feedback";
  createdAt: string;
  email: string;
  description: string;
};

export type AdminFeedbackItem = {
  createdAt: string;
  email: string;
  type: string;
  severity: string;
  pageArea: string | null;
  messagePreview: string;
  contactOk: boolean;
};

export type AdminAnalytics = {
  summary: {
    totalUsers: number;
    usersWithDeck: number;
    usersWithMatch: number;
    totalDecks: number;
    totalVersions: number;
    totalMatches: number;
    feedbackReports: number;
    activeUsersLast7Days: number;
  };
  users: AdminUserActivity[];
  archetypes: AdminArchetypeOverview[];
  recentActivity: AdminActivityItem[];
  recentFeedback: AdminFeedbackItem[];
};

function isoTime(value: string | null | undefined) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function formatPreview(message: string) {
  const trimmed = message.replace(/\s+/g, " ").trim();
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
}

function getUserStatus(decks: number, matches: number) {
  if (matches >= 5) {
    return "Active tester" as const;
  }

  if (matches > 0) {
    return "Logged games" as const;
  }

  if (decks > 0) {
    return "Created deck" as const;
  }

  return "Signed up only" as const;
}

async function listAllUsers(): Promise<UserSummary[]> {
  const admin = createAdminSupabaseClient();
  const users: UserSummary[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(`Unable to list users: ${error.message}`);
    }

    users.push(
      ...data.users.map((user) => ({
        id: user.id,
        email: user.email ?? "(no email)",
        createdAt: user.created_at ?? null,
      }))
    );

    if (data.users.length < 1000) {
      break;
    }

    page += 1;
  }

  return users;
}

async function fetchTableRows<T>(table: string, select: string, orderColumn: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from(table)
    .select(select)
    .order(orderColumn, { ascending: false });

  if (error) {
    throw new Error(`Unable to load ${table}: ${error.message}`);
  }

  return (data ?? []) as T[];
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [users, decks, versions, matches, feedback] = await Promise.all([
    listAllUsers(),
    fetchTableRows<DeckRow>("decks", "id, user_id, name, archetype, created_at", "created_at"),
    fetchTableRows<VersionRow>(
      "deck_versions",
      "id, deck_id, name, is_active, created_at",
      "created_at"
    ),
    fetchTableRows<MatchRow>(
      "matches",
      "id, user_id, deck_version_id, opponent_archetype, played_at, created_at",
      "played_at"
    ),
    fetchTableRows<FeedbackRow>(
      "beta_feedback",
      "id, user_id, type, page_area, severity, message, contact_ok, user_email, created_at",
      "created_at"
    ),
  ]);

  const usersById = new Map(users.map((user) => [user.id, user]));
  const decksById = new Map(decks.map((deck) => [deck.id, deck]));
  const versionsById = new Map(versions.map((version) => [version.id, version]));
  const deckVersions = new Map<string, VersionRow[]>();
  const userDecks = new Map<string, DeckRow[]>();
  const userMatches = new Map<string, MatchRow[]>();
  const userFeedback = new Map<string, FeedbackRow[]>();

  for (const deck of decks) {
    userDecks.set(deck.user_id, [...(userDecks.get(deck.user_id) ?? []), deck]);
  }

  for (const version of versions) {
    deckVersions.set(version.deck_id, [...(deckVersions.get(version.deck_id) ?? []), version]);
  }

  for (const match of matches) {
    userMatches.set(match.user_id, [...(userMatches.get(match.user_id) ?? []), match]);
  }

  for (const item of feedback) {
    userFeedback.set(item.user_id, [...(userFeedback.get(item.user_id) ?? []), item]);
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeUsers = new Set<string>();

  for (const deck of decks) {
    if (isoTime(deck.created_at) >= sevenDaysAgo) {
      activeUsers.add(deck.user_id);
    }
  }

  for (const version of versions) {
    const deck = decksById.get(version.deck_id);
    if (deck && isoTime(version.created_at) >= sevenDaysAgo) {
      activeUsers.add(deck.user_id);
    }
  }

  for (const match of matches) {
    if (isoTime(match.played_at) >= sevenDaysAgo || isoTime(match.created_at) >= sevenDaysAgo) {
      activeUsers.add(match.user_id);
    }
  }

  const userRows = users
    .map((user) => {
      const decksForUser = userDecks.get(user.id) ?? [];
      const matchesForUser = userMatches.get(user.id) ?? [];
      const feedbackForUser = userFeedback.get(user.id) ?? [];
      const versionsForUser = decksForUser.flatMap((deck) => deckVersions.get(deck.id) ?? []);
      const mostRecentDeck = [...decksForUser].sort(
        (first, second) => isoTime(second.created_at) - isoTime(first.created_at)
      )[0];
      const activeDeck =
        decksForUser.find((deck) =>
          (deckVersions.get(deck.id) ?? []).some((version) => version.is_active)
        ) ?? null;
      const lastMatch = [...matchesForUser].sort(
        (first, second) => isoTime(second.played_at) - isoTime(first.played_at)
      )[0];

      return {
        userId: user.id,
        email: user.email,
        signupDate: user.createdAt,
        decks: decksForUser.length,
        versions: versionsForUser.length,
        matches: matchesForUser.length,
        lastLoggedGameDate: lastMatch?.played_at ?? null,
        mostRecentDeckName: mostRecentDeck?.name ?? null,
        mostRecentArchetype: mostRecentDeck?.archetype ?? null,
        activeDeckName: activeDeck?.name ?? null,
        feedbackCount: feedbackForUser.length,
        status: getUserStatus(decksForUser.length, matchesForUser.length),
      };
    })
    .sort((first, second) => {
      const firstActivity = Math.max(
        isoTime(first.lastLoggedGameDate),
        isoTime(first.signupDate)
      );
      const secondActivity = Math.max(
        isoTime(second.lastLoggedGameDate),
        isoTime(second.signupDate)
      );
      return secondActivity - firstActivity;
    });

  const archetypeMap = new Map<
    string,
    { users: Set<string>; decks: number; matches: number }
  >();

  for (const deck of decks) {
    const entry =
      archetypeMap.get(deck.archetype) ??
      { users: new Set<string>(), decks: 0, matches: 0 };
    entry.users.add(deck.user_id);
    entry.decks += 1;
    archetypeMap.set(deck.archetype, entry);
  }

  for (const match of matches) {
    const version = versionsById.get(match.deck_version_id);
    const deck = version ? decksById.get(version.deck_id) : null;
    if (!deck) {
      continue;
    }

    const entry =
      archetypeMap.get(deck.archetype) ??
      { users: new Set<string>(), decks: 0, matches: 0 };
    entry.users.add(deck.user_id);
    entry.matches += 1;
    archetypeMap.set(deck.archetype, entry);
  }

  const archetypes = [...archetypeMap.entries()]
    .map(([archetype, value]) => ({
      archetype,
      users: value.users.size,
      decks: value.decks,
      matches: value.matches,
    }))
    .sort((first, second) => second.matches - first.matches || second.decks - first.decks);

  const recentActivity: AdminActivityItem[] = [
    ...decks.map((deck) => ({
      kind: "deck" as const,
      createdAt: deck.created_at,
      email: usersById.get(deck.user_id)?.email ?? "(unknown user)",
      description: `Created deck: ${deck.name} (${deck.archetype})`,
    })),
    ...versions.map((version) => {
      const deck = decksById.get(version.deck_id);
      return {
        kind: "version" as const,
        createdAt: version.created_at,
        email: deck ? usersById.get(deck.user_id)?.email ?? "(unknown user)" : "(unknown user)",
        description: `Created version: ${deck?.name ?? "Unknown deck"} / ${version.name}`,
      };
    }),
    ...matches.map((match) => ({
      kind: "match" as const,
      createdAt: match.created_at || match.played_at,
      email: usersById.get(match.user_id)?.email ?? "(unknown user)",
      description: `Logged match vs ${match.opponent_archetype}`,
    })),
    ...feedback.map((item) => ({
      kind: "feedback" as const,
      createdAt: item.created_at,
      email: item.user_email ?? usersById.get(item.user_id)?.email ?? "(unknown user)",
      description: `Submitted feedback: ${item.type} (${item.severity})`,
    })),
  ]
    .sort((first, second) => isoTime(second.createdAt) - isoTime(first.createdAt))
    .slice(0, 20);

  const recentFeedback = feedback.slice(0, 12).map((item) => ({
    createdAt: item.created_at,
    email: item.user_email ?? usersById.get(item.user_id)?.email ?? "(unknown user)",
    type: item.type,
    severity: item.severity,
    pageArea: item.page_area,
    messagePreview: formatPreview(item.message),
    contactOk: item.contact_ok,
  }));

  return {
    summary: {
      totalUsers: users.length,
      usersWithDeck: new Set(decks.map((deck) => deck.user_id)).size,
      usersWithMatch: new Set(matches.map((match) => match.user_id)).size,
      totalDecks: decks.length,
      totalVersions: versions.length,
      totalMatches: matches.length,
      feedbackReports: feedback.length,
      activeUsersLast7Days: activeUsers.size,
    },
    users: userRows,
    archetypes,
    recentActivity,
    recentFeedback,
  };
}
