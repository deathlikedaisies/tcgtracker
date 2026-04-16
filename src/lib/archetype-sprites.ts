import { OTHER_ARCHETYPE } from "@/lib/archetypes";

export type ArchetypeSprite = {
  filename: string;
  label: string;
};

export const FALLBACK_ARCHETYPE_SPRITES: ArchetypeSprite[] = [
  {
    filename: "other-emerging.png",
    label: OTHER_ARCHETYPE,
  },
];

export const ARCHETYPE_SPRITES: Record<string, ArchetypeSprite[]> = {
  "Starmie Froslass": [
    { filename: "other-emerging.png", label: "Starmie" },
    { filename: "froslass.png", label: "Froslass" },
  ],
  "Dragapult ex": [{ filename: "dragapult-ex.png", label: "Dragapult ex" }],
  "Dragapult Blaziken": [
    { filename: "dragapult-ex.png", label: "Dragapult ex" },
    { filename: "blaziken.png", label: "Blaziken" },
  ],
  "Dragapult Dusknoir": [
    { filename: "dragapult-ex.png", label: "Dragapult ex" },
    { filename: "dusknoir.png", label: "Dusknoir" },
  ],
  "Grimmsnarl Froslass": [
    { filename: "grimmsnarl.png", label: "Grimmsnarl" },
    { filename: "froslass.png", label: "Froslass" },
  ],
  "Lucario Hariyama": [
    { filename: "lucario.png", label: "Lucario" },
    { filename: "hariyama.png", label: "Hariyama" },
  ],
  "Mega Lucario ex": [
    { filename: "lucario.png", label: "Mega Lucario ex" },
  ],
  "Mega Lucario": [
    { filename: "lucario.png", label: "Mega Lucario" },
  ],
  "Mega Absol Box": [
    { filename: "absol.png", label: "Mega Absol" },
  ],
  "N's Zoroark": [{ filename: "zoroark.png", label: "N's Zoroark" }],
  "Ogerpon Meganium": [
    { filename: "ogerpon.png", label: "Ogerpon" },
    { filename: "meganium.png", label: "Meganium" },
  ],
  "Festival Lead": [{ filename: "other-emerging.png", label: "Festival Lead" }],
  "Rocket's Spidops": [
    { filename: "spidops.png", label: "Rocket's Spidops" },
  ],
  "Rocket's Mewtwo": [
    { filename: "other-emerging.png", label: "Rocket's Mewtwo" },
  ],
  "Rocket's Honchkrow": [
    { filename: "other-emerging.png", label: "Rocket's Honchkrow" },
  ],
  "Rocket Box": [{ filename: "spidops.png", label: "Rocket Box" }],
  "Froslass Munkidori": [
    { filename: "froslass.png", label: "Froslass" },
    { filename: "munkidori.png", label: "Munkidori" },
  ],
  "Joltik Box": [{ filename: "joltik.png", label: "Joltik" }],
  Crustle: [{ filename: "crustle.png", label: "Crustle" }],
  "Raging Bolt Ogerpon": [
    { filename: "raging-bolt.png", label: "Raging Bolt" },
    { filename: "ogerpon.png", label: "Ogerpon" },
  ],
  Alakazam: [{ filename: "alakazam.png", label: "Alakazam" }],
  "Alakazam Dudunsparce": [
    { filename: "alakazam.png", label: "Alakazam" },
    { filename: "other-emerging.png", label: "Dudunsparce" },
  ],
  "Cynthia's Garchomp": [
    { filename: "other-emerging.png", label: "Cynthia's Garchomp" },
  ],
  Okidogi: [{ filename: "other-emerging.png", label: "Okidogi" }],
  "Marnie's Grimmsnarl": [
    { filename: "grimmsnarl.png", label: "Marnie's Grimmsnarl" },
  ],
  "Mega Froslass": [{ filename: "froslass.png", label: "Mega Froslass" }],
  [OTHER_ARCHETYPE]: FALLBACK_ARCHETYPE_SPRITES,

  "Charizard ex": [{ filename: "charizard-ex.png", label: "Charizard ex" }],
  "Gardevoir ex": [{ filename: "gardevoir-ex.png", label: "Gardevoir ex" }],
  "Gholdengo ex": [{ filename: "gholdengo-ex.png", label: "Gholdengo ex" }],
  "Miraidon ex": [{ filename: "other-emerging.png", label: "Miraidon ex" }],
  "Roaring Moon ex": [
    { filename: "raging-bolt.png", label: "Roaring Moon ex" },
  ],
  "Lost Zone Box": [
    { filename: "other-emerging.png", label: "Lost Zone Box" },
  ],
  "Chien-Pao ex": [{ filename: "other-emerging.png", label: "Chien-Pao ex" }],
  "Ancient Box": [{ filename: "raging-bolt.png", label: "Ancient Box" }],
  "Future Box": [{ filename: "other-emerging.png", label: "Future Box" }],
  "Lugia VSTAR": [{ filename: "other-emerging.png", label: "Lugia VSTAR" }],
};

function normalizeArchetype(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const NORMALIZED_ARCHETYPE_SPRITES = Object.fromEntries(
  Object.entries(ARCHETYPE_SPRITES).map(([archetype, sprites]) => [
    normalizeArchetype(archetype),
    sprites,
  ])
);

export function getArchetypeSprites(archetype: string | null | undefined) {
  if (!archetype) {
    return FALLBACK_ARCHETYPE_SPRITES;
  }

  const sprites =
    ARCHETYPE_SPRITES[archetype] ??
    NORMALIZED_ARCHETYPE_SPRITES[normalizeArchetype(archetype)];

  return sprites ?? FALLBACK_ARCHETYPE_SPRITES;
}
