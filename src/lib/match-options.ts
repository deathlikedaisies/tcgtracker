export const MATCH_RESULTS = ["win", "loss"] as const;

export const EVENT_TYPES = ["casual", "testing", "tournament"] as const;

export const MATCH_TAGS = [
  "dead draw",
  "misplay",
  "setup issue",
  "prize issue",
  "sequencing",
  "bad matchup",
] as const;

export function parseSelectedTags(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(values.map((tag) => String(tag).trim()).filter(Boolean))
  );
}
