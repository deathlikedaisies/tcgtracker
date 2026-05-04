export const OTHER_ARCHETYPE = "Other / Emerging";

export const POST_ROTATION_2026_ARCHETYPES = [
  "Dragapult ex",
  "Lucario Hariyama",
  "Dragapult Blaziken",
  "Alakazam Dudunsparce",
  "N's Zoroark",
  "Dragapult Dusknoir",
  "Rocket's Mewtwo",
  "Starmie Froslass",
  "Ogerpon Meganium",
  "Festival Lead",
  "Cynthia's Garchomp",
  "Grimmsnarl Froslass",
  "Raging Bolt Ogerpon",
  "Okidogi Barbaracle",
  "Rocket's Honchkrow",
  "Crustle",
  "Slowking",
  "Mega Absol Box",
  "Greninja",
  "Mega Venusaur",
  "Steven's Metagross",
  "Clefairy Ogerpon",
  "Dragapult Dudunsparce",
  "Mega Lucario",
  "Ogerpon Box",
  "Flareon Noctowl",
  "Ceruledge",
  "Starmie Dusknoir",
  "Froslass Munkidori",
  "Diancie Dusknoir",
  "Hop's Trevenant",
  "Lopunny Dudunsparce",
  "Rocket's Spidops",
  "Ursaluna Lunatone",
  "Tera Box",
  "Jellicent Dusknoir",
  "Mega Froslass",
  "Decidueye",
  "Ethan's Typhlosion",
  "Hydrapple Ogerpon",
  "Mega Starmie",
  "Yanmega",
  "Toxtricity Box",
  "Archaludon",
  "Hydreigon",
  "Marnie's Grimmsnarl",
  "Sharpedo Toxtricity",
  "Hop's Zacian",
  "Kangaskhan Bouffalant",
  "Zygarde Barbaracle",
  "Mega Abomasnow",
  "Archaludon Zoroark",
  "Mega Dragonite",
  "Eelektrik",
  "Dudunsparce Control",
  "Joltik Box",
  "Mega Zygarde ex",
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
