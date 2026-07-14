import {
  countMatchResults,
  formatMatchRecord,
  type MatchMetadata,
  type MatchResult,
} from "@/lib/match-types";

export const TESTING_BLOCK_STATUS_OPTIONS = [
  "active",
  "completed",
  "archived",
] as const;

export type TestingBlockStatus = (typeof TESTING_BLOCK_STATUS_OPTIONS)[number];

export type TestingBlockListRow = {
  id: string;
  deck_id: string | null;
  deck_version_id: string | null;
  target_matchup: string | null;
  focus_tags: string[] | null;
  target_games: number | null;
  notes: string | null;
  status: TestingBlockStatus;
  source_review_reason: string | null;
  created_at: string;
  completed_at: string | null;
  deck?: {
    name: string | null;
    archetype: string | null;
  } | null;
  deck_version?: {
    name: string | null;
  } | null;
};

export type TestingBlockMatchRow = {
  id: string;
  testing_block_id: string | null;
  opponent_archetype: string;
  result: MatchResult;
  metadata: MatchMetadata | Record<string, unknown> | null;
  played_at: string;
  match_tags: { tag: string }[] | null;
};

export type TestingBlockSummary = {
  block: TestingBlockListRow;
  matches: TestingBlockMatchRow[];
  targetGames: number;
  progressCount: number;
  progressLabel: string;
  record: string;
  winRate: string;
  commonIssueTags: { tag: string; count: number }[];
  commonTags: { tag: string; count: number }[];
  isComplete: boolean;
  deckLabel: string;
};

export type TestingBlockCheckIn = {
  id: string;
  targetMatchup: string | null;
};

type TestingBlockQueryClient = {
  from: (table: "testing_blocks") => {
    select: (columns: string) => TestingBlockQuery;
  };
};

type TestingBlockQuery = PromiseLike<{
  data: unknown;
  error: { message: string; code?: string } | null;
}> & {
  eq: (column: string, value: unknown) => TestingBlockQuery;
  order: (
    column: string,
    options?: { ascending?: boolean }
  ) => TestingBlockQuery;
  limit: (count: number) => TestingBlockQuery;
};

export function isTestingBlocksMissingError(
  error: { message?: string; code?: string } | null | undefined
) {
  if (!error) return false;

  return (
    error.code === "42P01" ||
    /testing_blocks|testing_block_id|schema cache|does not exist/i.test(
      error.message ?? ""
    )
  );
}

export async function getActiveTestingBlockCheckIn(
  supabase: unknown,
  userId: string
): Promise<TestingBlockCheckIn | null> {
  const client = supabase as TestingBlockQueryClient;
  const { data, error } = await client
    .from("testing_blocks")
    .select("id, target_matchup")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    if (isTestingBlocksMissingError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : null;

  if (!row || typeof row !== "object" || !("id" in row)) {
    return null;
  }

  return {
    id: String(row.id),
    targetMatchup:
      "target_matchup" in row && typeof row.target_matchup === "string"
        ? row.target_matchup
        : null,
  };
}

function getMetadataTags(
  metadata: TestingBlockMatchRow["metadata"],
  key: "issue_tags" | "positive_tags"
) {
  if (!metadata || !Array.isArray(metadata[key])) {
    return [];
  }

  return metadata[key].filter(
    (tag): tag is string => typeof tag === "string" && Boolean(tag.trim())
  );
}

function countTags(tags: string[]) {
  const counts = new Map<string, number>();

  tags.forEach((tag) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 4)
    .map(([tag, count]) => ({ tag, count }));
}

export function buildTestingBlockSummary(
  block: TestingBlockListRow,
  matches: TestingBlockMatchRow[]
): TestingBlockSummary {
  const targetGames = Math.max(block.target_games ?? 5, 1);
  const progressCount = matches.length;
  const { wins, losses, ties, total } = countMatchResults(matches);
  const issueTags = matches.flatMap((match) =>
    getMetadataTags(match.metadata, "issue_tags")
  );
  const positiveTags = matches.flatMap((match) =>
    getMetadataTags(match.metadata, "positive_tags")
  );
  const legacyTags = matches.flatMap((match) =>
    match.match_tags?.map((tag) => tag.tag).filter(Boolean) ?? []
  );
  const deckName = block.deck?.name?.trim();
  const versionName = block.deck_version?.name?.trim();

  return {
    block,
    matches,
    targetGames,
    progressCount,
    progressLabel: `${progressCount} / ${targetGames} games`,
    record: formatMatchRecord(wins, losses, ties),
    winRate: total ? `${Math.round((wins / total) * 100)}%` : "No games yet",
    commonIssueTags: countTags(issueTags),
    commonTags: countTags([...issueTags, ...positiveTags, ...legacyTags]),
    isComplete: progressCount >= targetGames,
    deckLabel: [deckName, versionName].filter(Boolean).join(" · ") || "Any deck",
  };
}

export function getTestingBlockNextStepCopy(summary: TestingBlockSummary) {
  if (summary.progressCount === 0) {
    return "This block is designed to test whether the issue is real. Log the first game before changing more cards.";
  }

  if (!summary.isComplete) {
    return "Low sample: finish the block before drawing conclusions.";
  }

  return "Block target reached. Review the record, tags, and matchup notes before deciding whether to change the list.";
}

export function isTestingBlockStatus(value: string): value is TestingBlockStatus {
  return TESTING_BLOCK_STATUS_OPTIONS.includes(value as TestingBlockStatus);
}
