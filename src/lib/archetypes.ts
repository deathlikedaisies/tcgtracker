export const OTHER_ARCHETYPE = "Other / Emerging";

export const POST_ROTATION_2026_ARCHETYPES = [
  "Dragapult Dusknoir",
  "N's Zoroark",
  "Grimmsnarl Froslass",
  "Mega Absol Box",
  "Alakazam Dudunsparce",
  "Raging Bolt Ogerpon",
  "Froslass Munkidori",
  "Starmie Froslass",
  "Dragapult Blaziken",
  "Dragapult ex",
  "Ogerpon Meganium",
  "Joltik Box",
  "Crustle",
  "Lucario Hariyama",
  "Mega Lucario",
  "Rocket's Mewtwo",
  "Rocket's Honchkrow",
  "Festival Lead",
  "Cynthia's Garchomp",
  "Okidogi",
  "Marnie's Grimmsnarl",
  "Mega Froslass",
  "Greninja Froslass",
  "Dragapult Froslass",
  "Sinistcha Ogerpon",
  "Farigiraf Milotic",
  "Archaludon Zoroark",
  "Alakazam",
  "Garchomp",
  "Spidops",
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
