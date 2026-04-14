export const LATEST_FORMAT = "Post-rotation 2026";

export const MATCH_FORMATS = [
  LATEST_FORMAT,
  "Pre-rotation 2025–2026",
] as const;

export function getFormatOptions(existingFormats: (string | null)[] = []) {
  const customFormats = existingFormats
    .filter((format): format is string => Boolean(format))
    .filter((format) => !MATCH_FORMATS.includes(format as never));

  return Array.from(new Set([...MATCH_FORMATS, ...customFormats]));
}
