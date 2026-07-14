import { LATEST_FORMAT } from "@/lib/formats";
import { flattenStructuredMatchTags } from "@/lib/match-options";
import type { MatchMetadata, MatchResult } from "@/lib/match-types";

type SupabaseMutationClient = unknown;

type MutationValue = Record<string, unknown> | Record<string, unknown>[];

type QueryBuilder = PromiseLike<{
  data?: unknown;
  error: { message: string } | null;
}> & {
  select: (columns: string) => QueryBuilder;
  insert: (values: MutationValue) => QueryBuilder;
  update: (values: MutationValue) => QueryBuilder;
  eq: (column: string, value: unknown) => QueryBuilder;
  single: () => Promise<{ data: unknown; error: { message: string } | null }>;
};

function getClient(supabase: SupabaseMutationClient) {
  return supabase as {
    from: (table: string) => QueryBuilder;
  };
}

export type CreateMatchInput = {
  userId: string;
  deckVersionId: string;
  opponentArchetype: string;
  opponentVariant?: string | null;
  result: MatchResult;
  wentFirst: boolean | null;
  eventType: "casual" | "testing" | "tournament" | null;
  notes?: string | null;
  metadata: MatchMetadata & Record<string, unknown>;
  playedAt?: string;
  format?: string | null;
  testingBlockId?: string | null;
};

export async function createMatchWithTags(
  supabase: SupabaseMutationClient,
  input: CreateMatchInput
) {
  const client = getClient(supabase);
  const { data: ownedDeckVersion, error: ownershipError } = await client
    .from("deck_versions")
    .select("id, decks!inner(user_id)")
    .eq("id", input.deckVersionId)
    .eq("decks.user_id", input.userId)
    .single();

  if (ownershipError || !ownedDeckVersion) {
    throw new Error("Deck version not found.");
  }

  const { data: match, error: matchError } = await client
    .from("matches")
    .insert({
      user_id: input.userId,
      deck_version_id: input.deckVersionId,
      opponent_archetype: input.opponentArchetype,
      opponent_variant: input.opponentVariant ?? null,
      result: input.result,
      went_first: input.wentFirst,
      event_type: input.eventType,
      format: input.format ?? LATEST_FORMAT,
      notes: input.notes ?? null,
      metadata: input.metadata,
      ...(input.testingBlockId ? { testing_block_id: input.testingBlockId } : {}),
      ...(input.playedAt ? { played_at: input.playedAt } : {}),
    })
    .select("id")
    .single();

  const matchId =
    match && typeof match === "object" && "id" in match
      ? String(match.id)
      : null;

  if (matchError || !matchId) {
    throw new Error(matchError?.message ?? "Could not log match.");
  }

  const tags = flattenStructuredMatchTags({
    issueTags: input.metadata.issue_tags ?? [],
    positiveTags: input.metadata.positive_tags ?? [],
  });

  if (tags.length) {
    const { error: tagsError } = await client
      .from("match_tags")
      .insert(
        tags.map((tag) => ({
          match_id: matchId,
          tag,
        }))
      );

    if (tagsError) {
      throw new Error(tagsError.message);
    }
  }

  return { id: matchId };
}

export async function updateMatchMetadata(
  supabase: SupabaseMutationClient,
  matchId: string,
  metadata: MatchMetadata & Record<string, unknown>
) {
  const client = getClient(supabase);
  const { error } = await client
    .from("matches")
    .update({ metadata })
    .eq("id", matchId);

  if (error) {
    throw new Error(error.message);
  }
}
