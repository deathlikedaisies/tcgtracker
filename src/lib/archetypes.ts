export const OTHER_ARCHETYPE = "Other / Emerging";

export const POST_ROTATION_2026_ARCHETYPES = [
  "Starmie Froslass",
  "Grimmsnarl Froslass",
  "Froslass Munkidori",
  "Dragapult Dusknoir",
  "Dragapult Blaziken",
  "Dragapult ex",
  "N's Zoroark",
  "Mega Absol Box",
  "Raging Bolt Ogerpon",
  "Ogerpon Meganium",
  "Joltik Box",
  "Crustle",
  "Lucario Hariyama",
  "Mega Lucario",
  "Alakazam Dudunsparce",
  "Rocket's Mewtwo",
  "Rocket's Honchkrow",
  "Festival Lead",
  "Cynthia's Garchomp",
  "Okidogi",
  "Marnie's Grimmsnarl",
  "Mega Froslass",
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
  _format: string | null | undefined,
  existingArchetypes: (string | null)[] = []
) {
  const existing = existingArchetypes.filter(
    (archetype): archetype is string => Boolean(archetype)
  );

  return Array.from(new Set([...POST_ROTATION_2026_ARCHETYPES, ...existing]));
}
