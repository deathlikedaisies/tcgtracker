import { LATEST_FORMAT, MATCH_FORMATS } from "@/lib/formats";

export const OTHER_ARCHETYPE = "Other / Emerging";

export const POST_ROTATION_2026_ARCHETYPES = [
  "Dragapult ex",
  "Dragapult Blaziken",
  "Dragapult Dusknoir",
  "Grimmsnarl Froslass",
  "Lucario Hariyama",
  "Mega Lucario ex",
  "Mega Absol Box",
  "N's Zoroark",
  "Ogerpon Meganium",
  "Festival Lead",
  "Rocket's Spidops",
  "Rocket Box",
  "Froslass Munkidori",
  "Joltik Box",
  "Crustle",
  "Raging Bolt Ogerpon",
  "Alakazam",
  OTHER_ARCHETYPE,
] as const;

export const PRE_ROTATION_2025_2026_ARCHETYPES = [
  "Charizard ex",
  "Gardevoir ex",
  "Gholdengo ex",
  "Dragapult ex",
  "Raging Bolt Ogerpon",
  "Miraidon ex",
  "Roaring Moon ex",
  "Lost Zone Box",
  "Chien-Pao ex",
  "Ancient Box",
  "Future Box",
  "Lugia VSTAR",
  "Other / Emerging",
] as const;

export function getArchetypeOptions(
  format: string | null | undefined,
  existingArchetypes: (string | null)[] = []
) {
  const base =
    format === LATEST_FORMAT
      ? POST_ROTATION_2026_ARCHETYPES
      : format === MATCH_FORMATS[1]
        ? PRE_ROTATION_2025_2026_ARCHETYPES
        : [...POST_ROTATION_2026_ARCHETYPES, ...PRE_ROTATION_2025_2026_ARCHETYPES];
  const existing = existingArchetypes.filter(
    (archetype): archetype is string => Boolean(archetype)
  );

  return Array.from(new Set([...base, ...existing]));
}
