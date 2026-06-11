import "server-only";

import { buildSessionCoachInsight, type CoachMatch } from "@/lib/session-coach";
import {
  countMatchResults,
  formatMatchRecord,
  parseMatchMetadata,
  type MatchOpeningHandQuality,
  type MatchResult,
} from "@/lib/match-types";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const RESERVED_PROFILE_HANDLES = new Set([
  "admin",
  "settings",
  "dashboard",
  "login",
  "signup",
  "api",
  "demo",
  "review",
  "matchups",
  "decks",
  "matches",
  "u",
]);

export const PROFILE_VISIBILITY_OPTIONS = ["private", "link_only", "public"] as const;
export const ANALYTICS_VISIBILITY_OPTIONS = [
  "private",
  "aggregate_only",
  "detailed",
] as const;
export const SHARED_REPORT_VISIBILITY_OPTIONS = [
  "private",
  "link_only",
  "public",
] as const;
export const SHARED_REPORT_TYPES = [
  "profile_summary",
  "matchup",
  "deck",
  "version",
  "review",
  "tournament_prep",
] as const;
export const PROFILE_REACTION_TYPES = [
  "kudos",
  "useful",
  "testing_this_too",
  "good_tech",
] as const;

export type ProfileVisibility = (typeof PROFILE_VISIBILITY_OPTIONS)[number];
export type AnalyticsVisibility = (typeof ANALYTICS_VISIBILITY_OPTIONS)[number];
export type SharedReportVisibility = (typeof SHARED_REPORT_VISIBILITY_OPTIONS)[number];
export type SharedReportType = (typeof SHARED_REPORT_TYPES)[number];
export type ProfileReactionType = (typeof PROFILE_REACTION_TYPES)[number];

export type ProfileRecord = {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  favorite_archetype: string | null;
  main_deck_name: string | null;
  current_testing_focus: string | null;
  profile_visibility: ProfileVisibility;
  analytics_visibility: AnalyticsVisibility;
  created_at: string;
  updated_at: string;
};

export type ProfilePublicStatsRecord = {
  user_id: string;
  total_matches: number;
  total_decks: number;
  total_versions: number;
  win_count: number;
  loss_count: number;
  tie_count: number;
  win_rate: number | null;
  active_weeks: number;
  most_played_deck: string | null;
  strongest_matchup: string | null;
  weakest_matchup: string | null;
  current_focus: string | null;
  best_improvement: string | null;
  updated_at: string;
};

export type SharedReportRecord = {
  id: string;
  user_id: string;
  slug: string;
  report_type: SharedReportType;
  title: string;
  summary: Record<string, unknown>;
  visibility: SharedReportVisibility;
  created_at: string;
  updated_at: string;
};

export type ProfileInput = {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  favoriteArchetype?: string | null;
  mainDeckName?: string | null;
  currentTestingFocus?: string | null;
  profileVisibility: ProfileVisibility;
  analyticsVisibility: AnalyticsVisibility;
};

export type CreateSharedReportInput = {
  reportType: SharedReportType;
  title: string;
  summary: Record<string, unknown>;
  visibility: SharedReportVisibility;
  slugSeed?: string | null;
};

export type MatchupReportInput = {
  deckId?: string | null;
  deckVersionId?: string | null;
  opponentArchetype?: string | null;
  visibility?: SharedReportVisibility;
};

export type PublicProfileCounts = {
  followerCount: number;
  followingCount: number;
  profileReactions: Record<ProfileReactionType, number>;
  reportReactions: number;
};

export type PublicProfilePageData = {
  profile: ProfileRecord;
  stats: ProfilePublicStatsRecord | null;
  sharedReports: SharedReportRecord[];
  counts: PublicProfileCounts;
  isOwner: boolean;
  isFollowing: boolean;
  viewerReactions: ProfileReactionType[];
  analyticsMode: "private" | "aggregate_only" | "detailed";
};

export type PublicReportPageData = {
  report: SharedReportRecord;
  ownerProfile: Pick<ProfileRecord, "user_id" | "handle" | "display_name" | "avatar_url"> | null;
  isOwner: boolean;
  viewerReactions: ProfileReactionType[];
  reactionCounts: Record<ProfileReactionType, number>;
};

type AdminDeckRow = {
  id: string;
  name: string;
  archetype: string;
};

type AdminVersionRow = {
  id: string;
  deck_id: string;
  name: string | null;
  is_active: boolean | null;
};

type AdminMatchRow = {
  id: string;
  deck_version_id: string;
  opponent_archetype: string;
  result: MatchResult;
  went_first: boolean | null;
  played_at: string;
  metadata: Record<string, unknown> | null;
  deck_versions:
    | {
        id: string;
        name: string | null;
        deck_id: string;
        decks:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
      }
    | {
        id: string;
        name: string | null;
        deck_id: string;
        decks:
          | {
              id: string;
              name: string;
            }
          | {
              id: string;
              name: string;
            }[]
          | null;
      }[]
    | null;
};

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanOptionalText(value: unknown, maxLength: number) {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function validateHandle(handle: string) {
  const normalized = normalizeHandle(handle);

  if (!normalized) {
    return "Enter a handle.";
  }

  if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
    return "Handle must be 3-30 characters and use only lowercase letters, numbers, underscores, or hyphens.";
  }

  if (RESERVED_PROFILE_HANDLES.has(normalized)) {
    return "That handle is reserved.";
  }

  return null;
}

function getDeckVersion(match: Pick<AdminMatchRow, "deck_versions">) {
  return Array.isArray(match.deck_versions)
    ? match.deck_versions[0]
    : match.deck_versions;
}

function getDeckNameFromMatch(match: Pick<AdminMatchRow, "deck_versions">) {
  const decks = getDeckVersion(match)?.decks;
  const deck = Array.isArray(decks) ? decks[0] : decks;
  return deck?.name ?? "Unknown deck";
}

function getWeekKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-${String(weekNumber).padStart(2, "0")}`;
}

function getWinRateValue(wins: number, total: number) {
  if (!total) {
    return null;
  }

  return Number(((wins / total) * 100).toFixed(1));
}

function canViewProfile(profile: ProfileRecord, viewerUserId: string | null) {
  return profile.user_id === viewerUserId || profile.profile_visibility !== "private";
}

function canViewAnalytics(profile: ProfileRecord, viewerUserId: string | null) {
  return (
    profile.user_id === viewerUserId ||
    (profile.profile_visibility !== "private" &&
      profile.analytics_visibility !== "private")
  );
}

function canViewReport(report: SharedReportRecord, viewerUserId: string | null) {
  return report.user_id === viewerUserId || report.visibility !== "private";
}

async function getViewerUserId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

function toProfileRecord(value: unknown): ProfileRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    typeof row.user_id !== "string" ||
    typeof row.handle !== "string" ||
    typeof row.display_name !== "string" ||
    !isOneOf(row.profile_visibility, PROFILE_VISIBILITY_OPTIONS) ||
    !isOneOf(row.analytics_visibility, ANALYTICS_VISIBILITY_OPTIONS) ||
    typeof row.created_at !== "string" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    handle: row.handle,
    display_name: row.display_name,
    avatar_url: typeof row.avatar_url === "string" ? row.avatar_url : null,
    bio: typeof row.bio === "string" ? row.bio : null,
    country: typeof row.country === "string" ? row.country : null,
    favorite_archetype:
      typeof row.favorite_archetype === "string" ? row.favorite_archetype : null,
    main_deck_name: typeof row.main_deck_name === "string" ? row.main_deck_name : null,
    current_testing_focus:
      typeof row.current_testing_focus === "string" ? row.current_testing_focus : null,
    profile_visibility: row.profile_visibility,
    analytics_visibility: row.analytics_visibility,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toStatsRecord(value: unknown): ProfilePublicStatsRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (
    typeof row.user_id !== "string" ||
    typeof row.total_matches !== "number" ||
    typeof row.total_decks !== "number" ||
    typeof row.total_versions !== "number" ||
    typeof row.win_count !== "number" ||
    typeof row.loss_count !== "number" ||
    typeof row.tie_count !== "number" ||
    typeof row.active_weeks !== "number" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }

  return {
    user_id: row.user_id,
    total_matches: row.total_matches,
    total_decks: row.total_decks,
    total_versions: row.total_versions,
    win_count: row.win_count,
    loss_count: row.loss_count,
    tie_count: row.tie_count,
    win_rate:
      typeof row.win_rate === "number"
        ? row.win_rate
        : typeof row.win_rate === "string"
          ? Number(row.win_rate)
          : null,
    active_weeks: row.active_weeks,
    most_played_deck: typeof row.most_played_deck === "string" ? row.most_played_deck : null,
    strongest_matchup:
      typeof row.strongest_matchup === "string" ? row.strongest_matchup : null,
    weakest_matchup:
      typeof row.weakest_matchup === "string" ? row.weakest_matchup : null,
    current_focus: typeof row.current_focus === "string" ? row.current_focus : null,
    best_improvement:
      typeof row.best_improvement === "string" ? row.best_improvement : null,
    updated_at: row.updated_at,
  };
}

function toSharedReportRecord(value: unknown): SharedReportRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (
    typeof row.id !== "string" ||
    typeof row.user_id !== "string" ||
    typeof row.slug !== "string" ||
    !isOneOf(row.report_type, SHARED_REPORT_TYPES) ||
    typeof row.title !== "string" ||
    !isOneOf(row.visibility, SHARED_REPORT_VISIBILITY_OPTIONS) ||
    typeof row.created_at !== "string" ||
    typeof row.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    slug: row.slug,
    report_type: row.report_type,
    title: row.title,
    summary:
      row.summary && typeof row.summary === "object" && !Array.isArray(row.summary)
        ? (row.summary as Record<string, unknown>)
        : {},
    visibility: row.visibility,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function generateUniqueReportSlug(seed: string) {
  const admin = createAdminSupabaseClient();
  const base = slugify(seed) || "sixprizer-report";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      attempt === 0
        ? base
        : `${base}-${Math.random().toString(36).slice(2, 8)}`;
    const { data } = await admin
      .from("shared_reports")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${base}-${Date.now().toString(36)}`;
}

function buildMatchupSummary(
  matches: AdminMatchRow[],
  minimumGames: number,
  selector: "strongest" | "weakest"
) {
  const grouped = new Map<
    string,
    { wins: number; losses: number; ties: number; total: number }
  >();

  matches.forEach((match) => {
    const opponent = match.opponent_archetype.trim();
    if (!opponent) {
      return;
    }

    const current = grouped.get(opponent) ?? {
      wins: 0,
      losses: 0,
      ties: 0,
      total: 0,
    };

    if (match.result === "win") {
      current.wins += 1;
    } else if (match.result === "loss") {
      current.losses += 1;
    } else {
      current.ties += 1;
    }

    current.total += 1;
    grouped.set(opponent, current);
  });

  const sorted = Array.from(grouped.entries())
    .map(([opponent, record]) => ({
      opponent,
      ...record,
      winRate: record.total ? record.wins / record.total : 0,
    }))
    .filter((item) => item.total >= minimumGames)
    .sort((left, right) => {
      if (selector === "strongest") {
        if (right.winRate !== left.winRate) {
          return right.winRate - left.winRate;
        }
      } else if (left.winRate !== right.winRate) {
        return left.winRate - right.winRate;
      }

      return right.total - left.total;
    });

  return sorted[0]?.opponent ?? null;
}

function getMostCommonStrings(values: string[], limit = 3) {
  return Array.from(
    values.reduce((counts, value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1);
      return counts;
    }, new Map<string, number>())
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function getBestImprovementSummary(
  matches: AdminMatchRow[],
  versionMap: Map<string, AdminVersionRow>,
  deckMap: Map<string, AdminDeckRow>
) {
  const groupedByDeck = new Map<
    string,
    Map<string, { name: string; matches: AdminMatchRow[] }>
  >();

  matches.forEach((match) => {
    const version = versionMap.get(match.deck_version_id);
    if (!version) {
      return;
    }

    const deckGroups =
      groupedByDeck.get(version.deck_id) ??
      new Map<string, { name: string; matches: AdminMatchRow[] }>();
    const versionGroup = deckGroups.get(version.id) ?? {
      name: version.name?.trim() || "Version",
      matches: [],
    };

    versionGroup.matches.push(match);
    deckGroups.set(version.id, versionGroup);
    groupedByDeck.set(version.deck_id, deckGroups);
  });

  const signals: { delta: number; summary: string }[] = [];

  groupedByDeck.forEach((versions, deckId) => {
    const deck = deckMap.get(deckId);
    const versionStats = Array.from(versions.entries())
      .map(([versionId, group]) => {
        const record = countMatchResults(group.matches);
        const openingKnown = group.matches
          .map((match) => parseMatchMetadata(match.metadata).opening_hand_quality)
          .filter(
            (value): value is MatchOpeningHandQuality => Boolean(value)
          );
        const strongOpening = openingKnown.filter(
          (value) => value === "good" || value === "great"
        ).length;

        return {
          versionId,
          name: group.name,
          matches: group.matches,
          record,
          winRate: record.total ? record.wins / record.total : 0,
          openingKnown: openingKnown.length,
          strongOpeningRate: openingKnown.length
            ? strongOpening / openingKnown.length
            : 0,
        };
      })
      .filter((item) => item.record.total >= 3);

    if (versionStats.length < 2 || !deck) {
      return;
    }

    const strongestOpening = [...versionStats].sort(
      (left, right) => right.strongOpeningRate - left.strongOpeningRate
    );
    const bestOpening = strongestOpening[0];
    const worstOpening = strongestOpening[strongestOpening.length - 1];

    if (
      bestOpening &&
      worstOpening &&
      bestOpening.versionId !== worstOpening.versionId &&
      bestOpening.openingKnown >= 3 &&
      worstOpening.openingKnown >= 3
    ) {
      const openingDelta = Math.round(
        (bestOpening.strongOpeningRate - worstOpening.strongOpeningRate) * 100
      );

      if (openingDelta >= 10) {
        const summary = `${deck.name}: ${bestOpening.name} improved opening quality from ${Math.round(
          worstOpening.strongOpeningRate * 100
        )}% to ${Math.round(bestOpening.strongOpeningRate * 100)}%`;

        signals.push({ delta: openingDelta, summary });
      }
    }

    const strongestWinRate = [...versionStats].sort(
      (left, right) => right.winRate - left.winRate
    );
    const bestVersion = strongestWinRate[0];
    const worstVersion = strongestWinRate[strongestWinRate.length - 1];

    if (
      bestVersion &&
      worstVersion &&
      bestVersion.versionId !== worstVersion.versionId
    ) {
      const delta = Math.round((bestVersion.winRate - worstVersion.winRate) * 100);

      if (delta >= 15) {
        const summary = `${deck.name}: ${bestVersion.name} is ${delta} win-rate points above ${worstVersion.name}`;

        signals.push({ delta, summary });
      }
    }
  });

  return [...signals].sort((left, right) => right.delta - left.delta)[0]?.summary ?? null;
}

async function getProfileByUserIdInternal(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toProfileRecord(data);
}

async function getProfileByIdInternal(profileId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toProfileRecord(data);
}

async function getSharedReportByIdInternal(reportId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("shared_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toSharedReportRecord(data);
}

export async function getOwnProfile(userId: string) {
  return getProfileByUserIdInternal(userId);
}

export async function getProfileByHandle(handle: string) {
  const admin = createAdminSupabaseClient();
  const viewerUserId = await getViewerUserId();
  const normalizedHandle = normalizeHandle(handle);
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("handle", normalizedHandle)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const profile = toProfileRecord(data);
  if (!profile || !canViewProfile(profile, viewerUserId)) {
    return null;
  }

  return profile;
}

export async function createOrUpdateProfile(userId: string, input: ProfileInput) {
  const admin = createAdminSupabaseClient();
  const handleError = validateHandle(input.handle);

  if (handleError) {
    return {
      ok: false as const,
      error: handleError,
      profile: null,
    };
  }

  if (!cleanText(input.displayName)) {
    return {
      ok: false as const,
      error: "Display name is required.",
      profile: null,
    };
  }

  if (!PROFILE_VISIBILITY_OPTIONS.includes(input.profileVisibility)) {
    return {
      ok: false as const,
      error: "Choose a valid profile visibility.",
      profile: null,
    };
  }

  if (!ANALYTICS_VISIBILITY_OPTIONS.includes(input.analyticsVisibility)) {
    return {
      ok: false as const,
      error: "Choose a valid analytics visibility.",
      profile: null,
    };
  }

  const normalizedHandle = normalizeHandle(input.handle);
  const payload = {
    user_id: userId,
    handle: normalizedHandle,
    display_name: cleanText(input.displayName),
    avatar_url: cleanOptionalText(input.avatarUrl, 500),
    bio: cleanOptionalText(input.bio, 220),
    country: cleanOptionalText(input.country, 40),
    favorite_archetype: cleanOptionalText(input.favoriteArchetype, 80),
    main_deck_name: cleanOptionalText(input.mainDeckName, 80),
    current_testing_focus: cleanOptionalText(input.currentTestingFocus, 120),
    profile_visibility: input.profileVisibility,
    analytics_visibility: input.analyticsVisibility,
  };

  const { data, error } = await admin
    .from("profiles")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("profiles_handle_key") || message.includes("duplicate")) {
      return {
        ok: false as const,
        error: "That handle is already taken.",
        profile: null,
      };
    }

    return {
      ok: false as const,
      error: error.message,
      profile: null,
    };
  }

  const profile = toProfileRecord(data);
  if (!profile) {
    return {
      ok: false as const,
      error: "Profile could not be saved.",
      profile: null,
    };
  }

  await buildPublicProfileStats(userId);

  return {
    ok: true as const,
    error: null,
    profile,
  };
}

export async function buildPublicProfileStats(userId: string) {
  const admin = createAdminSupabaseClient();
  const profile = await getProfileByUserIdInternal(userId);

  const [
    { data: decks, error: decksError },
    { data: matches, error: matchesError },
  ] = await Promise.all([
    admin
      .from("decks")
      .select("id, name, archetype")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    admin
      .from("matches")
      .select(
        "id, deck_version_id, opponent_archetype, result, went_first, played_at, metadata, deck_versions(id, name, deck_id, decks(id, name))"
      )
      .eq("user_id", userId)
      .order("played_at", { ascending: false }),
  ]);

  if (decksError) {
    throw new Error(decksError.message);
  }

  const deckRows = (decks ?? []) as AdminDeckRow[];
  const deckIds = deckRows.map((deck) => deck.id);

  const versionsResponse = deckIds.length
    ? await admin
        .from("deck_versions")
        .select("id, deck_id, name, is_active")
    .in("deck_id", deckIds)
    : { data: [], error: null };

  if (versionsResponse.error) {
    throw new Error(versionsResponse.error.message);
  }

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const versionRows = (versionsResponse.data ?? []) as AdminVersionRow[];
  const matchRows = (matches ?? []) as AdminMatchRow[];
  const versionMap = new Map(versionRows.map((version) => [version.id, version]));
  const deckMap = new Map(deckRows.map((deck) => [deck.id, deck]));

  const record = countMatchResults(matchRows);
  const winRate = getWinRateValue(record.wins, record.total);
  const weekKeys = new Set(
    matchRows
      .map((match) => getWeekKey(match.played_at))
      .filter((value): value is string => Boolean(value))
  );
  const mostPlayedDeck = Array.from(
    matchRows.reduce((counts, match) => {
      const deckName = getDeckNameFromMatch(match);
      counts.set(deckName, (counts.get(deckName) ?? 0) + 1);
      return counts;
    }, new Map<string, number>())
  ).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;

  const strongestMatchup = buildMatchupSummary(matchRows, 5, "strongest");
  const weakestMatchup = buildMatchupSummary(matchRows, 5, "weakest");
  const sessionCoach = buildSessionCoachInsight(matchRows as unknown as CoachMatch[]);
  const bestImprovement = getBestImprovementSummary(matchRows, versionMap, deckMap);

  const payload = {
    user_id: userId,
    total_matches: record.total,
    total_decks: deckRows.length,
    total_versions: versionRows.length,
    win_count: record.wins,
    loss_count: record.losses,
    tie_count: record.ties,
    win_rate: winRate,
    active_weeks: weekKeys.size,
    most_played_deck: mostPlayedDeck,
    strongest_matchup: strongestMatchup,
    weakest_matchup: weakestMatchup,
    current_focus:
      cleanText(profile?.current_testing_focus) ??
      sessionCoach?.missionTitle ??
      null,
    best_improvement: bestImprovement,
  };

  const { data, error } = await admin
    .from("profile_public_stats")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toStatsRecord(data);
}

export async function getPublicProfileStats(userId: string) {
  const admin = createAdminSupabaseClient();
  const viewerUserId = await getViewerUserId();
  const profile = await getProfileByUserIdInternal(userId);

  if (!profile || !canViewAnalytics(profile, viewerUserId)) {
    return null;
  }

  const { data, error } = await admin
    .from("profile_public_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toStatsRecord(data);
}

async function getPublicCounts(userId: string, profileId: string) {
  const admin = createAdminSupabaseClient();

  const [
    { count: followerCount, error: followerError },
    { count: followingCount, error: followingError },
    { data: reactionRows, error: reactionError },
  ] = await Promise.all([
    admin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId),
    admin
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId),
    admin
      .from("profile_reactions")
      .select("reaction_type, target_type")
      .eq("target_type", "profile")
      .eq("target_id", profileId),
  ]);

  if (followerError) {
    throw new Error(followerError.message);
  }

  if (followingError) {
    throw new Error(followingError.message);
  }

  if (reactionError) {
    throw new Error(reactionError.message);
  }

  const profileReactions = PROFILE_REACTION_TYPES.reduce(
    (counts, reactionType) => {
      counts[reactionType] = 0;
      return counts;
    },
    {} as Record<ProfileReactionType, number>
  );

  ((reactionRows ?? []) as Array<{ reaction_type: unknown }>).forEach((row) => {
    if (isOneOf(row.reaction_type, PROFILE_REACTION_TYPES)) {
      profileReactions[row.reaction_type] += 1;
    }
  });

  const { count: reportReactions, error: reportReactionError } = await admin
    .from("profile_reactions")
    .select("*", { count: "exact", head: true })
    .eq("target_type", "shared_report")
    .eq("target_user_id", userId);

  if (reportReactionError) {
    throw new Error(reportReactionError.message);
  }

  return {
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
    profileReactions,
    reportReactions: reportReactions ?? 0,
  };
}

export async function getPublicProfilePageData(handle: string): Promise<PublicProfilePageData | null> {
  const admin = createAdminSupabaseClient();
  const viewerUserId = await getViewerUserId();
  const normalizedHandle = normalizeHandle(handle);
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .eq("handle", normalizedHandle)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const profile = toProfileRecord(data);
  if (!profile || !canViewProfile(profile, viewerUserId)) {
    return null;
  }

  const isOwner = viewerUserId === profile.user_id;
  const [stats, counts, visibleReports, isFollowing, viewerReactions] = await Promise.all([
    getPublicProfileStats(profile.user_id),
    getPublicCounts(profile.user_id, profile.id),
    (async () => {
      const query = admin
        .from("shared_reports")
        .select("*")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false });

      if (!isOwner) {
        query.eq("visibility", "public");
      }

      const { data: reports, error: reportsError } = await query;
      if (reportsError) {
        throw new Error(reportsError.message);
      }

      return (reports ?? [])
        .map(toSharedReportRecord)
        .filter((report): report is SharedReportRecord => Boolean(report));
    })(),
    (async () => {
      if (!viewerUserId || isOwner) {
        return false;
      }

      const { data: followRow, error: followError } = await admin
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewerUserId)
        .eq("following_id", profile.user_id)
        .maybeSingle();

      if (followError) {
        throw new Error(followError.message);
      }

      return Boolean(followRow);
    })(),
    (async () => {
      if (!viewerUserId) {
        return [] as ProfileReactionType[];
      }

      const { data: reactions, error: reactionsError } = await admin
        .from("profile_reactions")
        .select("reaction_type")
        .eq("actor_id", viewerUserId)
        .eq("target_type", "profile")
        .eq("target_id", profile.id);

      if (reactionsError) {
        throw new Error(reactionsError.message);
      }

      return (reactions ?? [])
        .map((row) =>
          isOneOf(row.reaction_type, PROFILE_REACTION_TYPES)
            ? row.reaction_type
            : null
        )
        .filter((reaction): reaction is ProfileReactionType => Boolean(reaction));
    })(),
  ]);

  return {
    profile,
    stats: canViewAnalytics(profile, viewerUserId) ? stats : null,
    sharedReports: visibleReports,
    counts,
    isOwner,
    isFollowing,
    viewerReactions,
    analyticsMode:
      profile.user_id === viewerUserId
        ? profile.analytics_visibility
        : profile.analytics_visibility === "private"
          ? "private"
          : profile.analytics_visibility,
  };
}

export async function createSharedReport(userId: string, input: CreateSharedReportInput) {
  const admin = createAdminSupabaseClient();

  if (!SHARED_REPORT_TYPES.includes(input.reportType)) {
    throw new Error("Invalid report type.");
  }

  if (!SHARED_REPORT_VISIBILITY_OPTIONS.includes(input.visibility)) {
    throw new Error("Invalid report visibility.");
  }

  const title = cleanText(input.title);
  if (!title) {
    throw new Error("Report title is required.");
  }

  await getProfileByUserIdInternal(userId);
  const slug = await generateUniqueReportSlug(input.slugSeed ?? title);

  const { data, error } = await admin
    .from("shared_reports")
    .insert({
      user_id: userId,
      slug,
      report_type: input.reportType,
      title,
      summary: input.summary ?? {},
      visibility: input.visibility,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const report = toSharedReportRecord(data);
  if (!report) {
    throw new Error("Report could not be created.");
  }

  return report;
}

export async function getSharedReportBySlug(slug: string): Promise<PublicReportPageData | null> {
  const admin = createAdminSupabaseClient();
  const viewerUserId = await getViewerUserId();
  const normalizedSlug = slugify(slug);
  const { data, error } = await admin
    .from("shared_reports")
    .select("*")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const report = toSharedReportRecord(data);
  if (!report || !canViewReport(report, viewerUserId)) {
    return null;
  }

  const ownerProfile = await getProfileByUserIdInternal(report.user_id);
  const isOwner = viewerUserId === report.user_id;
  const [{ data: reactions, error: reactionsError }, { data: viewerRows, error: viewerError }] =
    await Promise.all([
      admin
        .from("profile_reactions")
        .select("reaction_type")
        .eq("target_type", "shared_report")
        .eq("target_id", report.id),
      viewerUserId
        ? admin
            .from("profile_reactions")
            .select("reaction_type")
            .eq("actor_id", viewerUserId)
            .eq("target_type", "shared_report")
            .eq("target_id", report.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (reactionsError) {
    throw new Error(reactionsError.message);
  }

  if (viewerError) {
    throw new Error(viewerError.message);
  }

  const reactionCounts = PROFILE_REACTION_TYPES.reduce(
    (counts, reactionType) => {
      counts[reactionType] = 0;
      return counts;
    },
    {} as Record<ProfileReactionType, number>
  );

  (reactions ?? []).forEach((row) => {
    if (isOneOf(row.reaction_type, PROFILE_REACTION_TYPES)) {
      reactionCounts[row.reaction_type] += 1;
    }
  });

  const viewerReactions = ((viewerRows ?? []) as Array<{ reaction_type: unknown }>)
    .map((row) =>
      isOneOf(row.reaction_type, PROFILE_REACTION_TYPES)
        ? row.reaction_type
        : null
    )
    .filter((reaction): reaction is ProfileReactionType => Boolean(reaction));

  return {
    report,
    ownerProfile: ownerProfile && canViewProfile(ownerProfile, viewerUserId)
      ? {
          user_id: ownerProfile.user_id,
          handle: ownerProfile.handle,
          display_name: ownerProfile.display_name,
          avatar_url: ownerProfile.avatar_url,
        }
      : null,
    isOwner,
    viewerReactions,
    reactionCounts,
  };
}

export async function followUser(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) {
    throw new Error("You cannot follow yourself.");
  }

  const targetProfile = await getProfileByUserIdInternal(targetUserId);
  if (!targetProfile || !canViewProfile(targetProfile, currentUserId)) {
    throw new Error("That profile cannot be followed.");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("follows").upsert(
    {
      follower_id: currentUserId,
      following_id: targetUserId,
    },
    {
      onConflict: "follower_id,following_id",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function unfollowUser(currentUserId: string, targetUserId: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("follows")
    .delete()
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function reactToProfileOrReport(input: {
  actorId: string;
  targetUserId: string;
  targetType: "profile" | "shared_report";
  targetId: string;
  reactionType: ProfileReactionType;
}) {
  if (!PROFILE_REACTION_TYPES.includes(input.reactionType)) {
    throw new Error("Invalid reaction.");
  }

  if (input.targetType === "profile") {
    const profile = await getProfileByIdInternal(input.targetId);
    if (
      !profile ||
      profile.user_id !== input.targetUserId ||
      !canViewProfile(profile, input.actorId)
    ) {
      throw new Error("That profile is not available for reactions.");
    }
  } else {
    const report = await getSharedReportByIdInternal(input.targetId);
    if (
      !report ||
      report.user_id !== input.targetUserId ||
      !canViewReport(report, input.actorId)
    ) {
      throw new Error("That report is not available for reactions.");
    }
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("profile_reactions").upsert(
    {
      actor_id: input.actorId,
      target_user_id: input.targetUserId,
      target_type: input.targetType,
      target_id: input.targetId,
      reaction_type: input.reactionType,
    },
    {
      onConflict: "actor_id,target_type,target_id,reaction_type",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeReaction(input: {
  actorId: string;
  targetType: "profile" | "shared_report";
  targetId: string;
  reactionType: ProfileReactionType;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("profile_reactions")
    .delete()
    .eq("actor_id", input.actorId)
    .eq("target_type", input.targetType)
    .eq("target_id", input.targetId)
    .eq("reaction_type", input.reactionType);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createMatchupSharedReport(
  userId: string,
  input: MatchupReportInput
) {
  const admin = createAdminSupabaseClient();
  const profile = await getProfileByUserIdInternal(userId);

  if (!profile) {
    throw new Error("Create a profile before sharing reports.");
  }

  const { data: matches, error: matchesError } = await admin
    .from("matches")
    .select(
      "id, deck_version_id, opponent_archetype, result, went_first, played_at, metadata, deck_versions(id, name, deck_id, decks(id, name))"
    )
    .eq("user_id", userId)
    .order("played_at", { ascending: false });

  if (matchesError) {
    throw new Error(matchesError.message);
  }

  const matchRows = (matches ?? []) as AdminMatchRow[];
  const deckFiltered = matchRows.filter((match) => {
    const version = getDeckVersion(match);
    if (input.deckVersionId && match.deck_version_id !== input.deckVersionId) {
      return false;
    }

    if (input.deckId && version?.deck_id !== input.deckId) {
      return false;
    }

    return true;
  });

  const groupedByOpponent = Array.from(
    deckFiltered.reduce((groups, match) => {
      const key = match.opponent_archetype.trim();
      if (!key) {
        return groups;
      }

      groups.set(key, [...(groups.get(key) ?? []), match]);
      return groups;
    }, new Map<string, AdminMatchRow[]>())
  )
    .map(([opponent, groupedMatches]) => {
      const record = countMatchResults(groupedMatches);
      const winRate = record.total ? Math.round((record.wins / record.total) * 100) : 0;
      return {
        opponent,
        groupedMatches,
        record,
        winRate,
      };
    })
    .sort((left, right) => {
      if (left.winRate !== right.winRate) {
        return left.winRate - right.winRate;
      }

      return right.record.total - left.record.total;
    });

  const targetOpponent =
    cleanText(input.opponentArchetype) ?? groupedByOpponent[0]?.opponent ?? null;

  if (!targetOpponent) {
    throw new Error("No matchup data is available to share yet.");
  }

  const focusedMatches = deckFiltered.filter(
    (match) => match.opponent_archetype.trim() === targetOpponent
  );

  if (!focusedMatches.length) {
    throw new Error("That matchup has no logged games in the current filter.");
  }

  const record = countMatchResults(focusedMatches);
  const issueTags = getMostCommonStrings(
    focusedMatches
      .filter((match) => match.result === "loss")
      .flatMap((match) => parseMatchMetadata(match.metadata).issue_tags ?? [])
  );
  const positiveTags = getMostCommonStrings(
    focusedMatches
      .filter((match) => match.result === "win")
      .flatMap((match) => parseMatchMetadata(match.metadata).positive_tags ?? [])
  );
  const deckName =
    cleanText(
      input.deckVersionId
        ? getDeckVersion(focusedMatches[0])?.name
        : input.deckId
          ? getDeckNameFromMatch(focusedMatches[0])
          : null
    ) ?? "All decks";
  const winRate = record.total ? Math.round((record.wins / record.total) * 100) : 0;
  const recommendation =
    winRate <= 45
      ? `Keep ${targetOpponent} on the watchlist and tag what breaks first in the next few games.`
      : `Keep logging the ${targetOpponent} matchup before changing the plan.`;

  const report = await createSharedReport(userId, {
    reportType: "matchup",
    visibility: input.visibility ?? "link_only",
    title: `${deckName} vs ${targetOpponent}`,
    slugSeed: `${deckName}-${targetOpponent}`,
    summary: {
      deckName,
      matchup: targetOpponent,
      record: formatMatchRecord(record.wins, record.losses, record.ties),
      matches: record.total,
      winRate: `${winRate}%`,
      issueTags,
      positiveTags,
      recommendation,
      scope:
        input.deckVersionId
          ? "version"
          : input.deckId
            ? "deck"
            : "all_decks",
      generatedBy: "SixPrizer",
    },
  });

  return report;
}

export function buildProfileSummaryText(
  profile: ProfileRecord,
  stats: ProfilePublicStatsRecord | null
) {
  const parts = [`I'm testing on SixPrizer as @${profile.handle}.`];

  if (stats?.total_matches) {
    parts.push(`${stats.total_matches} games logged.`);
  }

  if (profile.current_testing_focus || stats?.current_focus) {
    parts.push(
      `Current focus: ${profile.current_testing_focus ?? stats?.current_focus}.`
    );
  }

  if (stats?.best_improvement) {
    parts.push(`Biggest improvement: ${stats.best_improvement}.`);
  }

  return parts.join(" ");
}

export function buildReportSummaryText(report: SharedReportRecord) {
  const summary = report.summary;
  const deckName = typeof summary.deckName === "string" ? summary.deckName : "Current deck";
  const matchup = typeof summary.matchup === "string" ? summary.matchup : report.title;
  const record = typeof summary.record === "string" ? summary.record : "0-0";
  const issueTags = Array.isArray(summary.issueTags)
    ? summary.issueTags
        .map((entry) =>
          entry && typeof entry === "object" && "value" in entry
            ? String((entry as { value: unknown }).value)
            : null
        )
        .filter((value): value is string => Boolean(value))
    : [];
  const recommendation =
    typeof summary.recommendation === "string"
      ? summary.recommendation
      : "Keep logging the next few games before changing the list.";

  return `${deckName} vs ${matchup}: ${record}. Main issue: ${issueTags
    .slice(0, 2)
    .join(" and ") || "keep tagging losses honestly"}. Current plan: ${recommendation}`;
}
