import {
  type MatchGameContext,
  type MatchMetadata,
  MATCH_GAME_CONTEXT_OPTIONS,
  MATCH_OPENING_HAND_OPTIONS,
  MATCH_SEQUENCING_OPTIONS,
  MATCH_START_QUALITY_OPTIONS,
} from "@/lib/match-types";
import { parseSelectedTags } from "@/lib/match-options";

export function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function optionalArray(formData: FormData, fieldName: string) {
  const values = parseSelectedTags(formData.getAll(fieldName));
  return values.length ? values : undefined;
}

function isOneOf<T extends readonly string[]>(
  value: string | null,
  options: T
): value is T[number] {
  return Boolean(value) && options.includes(value as T[number]);
}

export function getGameContextEventType(context: MatchGameContext) {
  return context === "competitive" ? "tournament" : "testing";
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

  return metadata;
}
