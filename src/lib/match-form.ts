import {
  type MatchGameContext,
  type MatchMetadata,
  type MatchResult,
  MATCH_GAME_CONTEXT_OPTIONS,
  MATCH_OPENING_HAND_OPTIONS,
  MATCH_SEQUENCING_OPTIONS,
  MATCH_START_QUALITY_OPTIONS,
  parseMatchPrizeRace,
} from "@/lib/match-types";
import { parseSelectedTags } from "@/lib/match-options";
import { isOneOf } from "@/lib/type-guards";

export function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function parseWentFirstChoice(value: string | null | undefined) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

function optionalArray(formData: FormData, fieldName: string) {
  const values = parseSelectedTags(formData.getAll(fieldName));
  return values.length ? values : undefined;
}

function optionalJson(value: FormDataEntryValue | null) {
  const text = optionalText(value);

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export function getGameContextEventType(context: MatchGameContext) {
  return context === "competitive" ? "tournament" : "testing";
}

export function hasRequiredQuality(metadata: MatchMetadata) {
  return Boolean(
    metadata.start_quality &&
      metadata.opening_hand_quality &&
      metadata.sequencing_quality
  );
}

export function hasRequiredReasonTags(
  result: MatchResult,
  metadata: MatchMetadata
) {
  const issueCount = metadata.issue_tags?.length ?? 0;
  const positiveCount = metadata.positive_tags?.length ?? 0;

  if (result === "win") {
    return positiveCount > 0;
  }

  if (result === "loss") {
    return issueCount > 0;
  }

  return issueCount > 0 || positiveCount > 0;
}

export function buildMatchMetadataFromFormData(formData: FormData): MatchMetadata {
  const gameContextValue = optionalText(formData.get("game_context"));
  const startQualityValue = optionalText(formData.get("start_quality"));
  const openingHandValue = optionalText(formData.get("opening_hand_quality"));
  const sequencingValue = optionalText(formData.get("sequencing_quality"));

  const metadata: MatchMetadata = {};

  if (
    gameContextValue &&
    MATCH_GAME_CONTEXT_OPTIONS.includes(gameContextValue as MatchGameContext)
  ) {
    metadata.game_context = gameContextValue as MatchGameContext;
  }

  const eventName = optionalText(formData.get("event_name"));
  const roundNumber = optionalText(formData.get("round_number"));
  const testingSessionName = optionalText(formData.get("testing_session_name"));
  const focusMatchup = optionalText(formData.get("focus_matchup"));
  const source = optionalText(formData.get("source"));

  if (eventName) {
    metadata.event_name = eventName;
  }

  if (roundNumber) {
    metadata.round_number = roundNumber;
  }

  if (testingSessionName) {
    metadata.testing_session_name = testingSessionName;
  }

  if (focusMatchup) {
    metadata.focus_matchup = focusMatchup;
  }

  if (
    source === "manual" ||
    source === "tcg_live_import" ||
    source === "event_round"
  ) {
    metadata.source = source;
  }

  if (isOneOf(startQualityValue, MATCH_START_QUALITY_OPTIONS)) {
    metadata.start_quality = startQualityValue;
  }

  if (isOneOf(openingHandValue, MATCH_OPENING_HAND_OPTIONS)) {
    metadata.opening_hand_quality = openingHandValue;
  }

  if (isOneOf(sequencingValue, MATCH_SEQUENCING_OPTIONS)) {
    metadata.sequencing_quality = sequencingValue;
  }

  const issueTags = optionalArray(formData, "issue_tags");
  const positiveTags = optionalArray(formData, "positive_tags");
  const cardsShined = optionalArray(formData, "cards_shined");
  const cardsFailed = optionalArray(formData, "cards_failed");
  const tcgLiveCardsSeen = optionalArray(formData, "tcg_live_cards_seen");
  const tcgLiveCardsUsed = optionalArray(formData, "tcg_live_cards_used");
  const tcgLiveCardsDiscarded = optionalArray(
    formData,
    "tcg_live_cards_discarded"
  );
  const prizeRace = parseMatchPrizeRace(optionalJson(formData.get("prizeRace")));

  if (issueTags) {
    metadata.issue_tags = issueTags;
  }

  if (positiveTags) {
    metadata.positive_tags = positiveTags;
  }

  if (cardsShined) {
    metadata.cards_shined = cardsShined;
  }

  if (cardsFailed) {
    metadata.cards_failed = cardsFailed;
  }

  if (tcgLiveCardsSeen) {
    metadata.tcg_live_cards_seen = tcgLiveCardsSeen;
  }

  if (tcgLiveCardsUsed) {
    metadata.tcg_live_cards_used = tcgLiveCardsUsed;
  }

  if (tcgLiveCardsDiscarded) {
    metadata.tcg_live_cards_discarded = tcgLiveCardsDiscarded;
  }

  if (prizeRace) {
    metadata.prizeRace = prizeRace;
  }

  return metadata;
}
