export const MATCH_RESULTS = ["win", "loss", "tie"] as const;

export const EVENT_TYPES = ["casual", "testing", "tournament"] as const;

export const MATCH_TAGS = [
  "dead draw",
  "misplay",
  "setup issue",
  "prize plan",
  "sequencing",
  "bad matchup",
] as const;

export const MATCH_ISSUE_TAG_OPTIONS = [
  "missed setup",
  "poor prize trade",
  "bad sequencing",
  "supporter drought",
  "energy issue",
  "bench pressure",
  "tempo loss",
  "misplay",
  "matchup knowledge",
  "unlucky draws",
] as const;

export const MATCH_POSITIVE_TAG_OPTIONS = [
  "strong setup",
  "good prize plan",
  "clean sequencing",
  "key tech mattered",
  "opponent bricked",
  "strong recovery",
  "favorable matchup",
] as const;

const LEGACY_TAG_MAP: Partial<Record<string, string[]>> = {
  "missed setup": ["setup issue"],
  "poor prize trade": ["prize plan"],
  "bad sequencing": ["sequencing"],
  "supporter drought": ["dead draw"],
  "energy issue": ["dead draw"],
  misplay: ["misplay"],
  "matchup knowledge": ["bad matchup"],
  "unlucky draws": ["dead draw"],
};

export function parseSelectedTags(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(values.map((tag) => String(tag).trim()).filter(Boolean))
  );
}

export function flattenStructuredMatchTags({
  issueTags,
  positiveTags,
}: {
  issueTags: string[];
  positiveTags: string[];
}) {
  return Array.from(
    new Set(
      [...issueTags, ...positiveTags].flatMap((tag) => [
        tag,
        ...(LEGACY_TAG_MAP[tag] ?? []),
      ])
    )
  );
}
