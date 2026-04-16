export const LATEST_FORMAT = "Post-rotation 2026";
export const PRE_ROTATION_FORMAT = "Pre-rotation 2025–2026";

export const MATCH_FORMATS = [LATEST_FORMAT] as const;

const HIDDEN_HISTORICAL_FORMATS = new Set([PRE_ROTATION_FORMAT]);

export function getFormatOptions(existingFormats: (string | null)[] = []) {
  const customFormats = existingFormats
    .filter((format): format is string => Boolean(format))
    .filter((format) => !MATCH_FORMATS.includes(format as never))
    .filter((format) => !HIDDEN_HISTORICAL_FORMATS.has(format));

  return Array.from(new Set([...MATCH_FORMATS, ...customFormats]));
}
