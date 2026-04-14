import { OTHER_ARCHETYPE } from "@/lib/archetypes";

export type ArchetypeSprite = {
  filename: string;
  label: string;
};

export const FALLBACK_ARCHETYPE_SPRITES: ArchetypeSprite[] = [
  {
    filename: "other-emerging.webp",
    label: OTHER_ARCHETYPE,
  },
];

export const ARCHETYPE_SPRITES: Record<string, ArchetypeSprite[]> = {
  "Dragapult ex": [{ filename: "dragapult-ex.webp", label: "Dragapult ex" }],
  "Dragapult Blaziken": [
    { filename: "dragapult-ex.webp", label: "Dragapult ex" },
    { filename: "blaziken.webp", label: "Blaziken" },
  ],
  "Dragapult Dusknoir": [
    { filename: "dragapult-ex.webp", label: "Dragapult ex" },
    { filename: "dusknoir.webp", label: "Dusknoir" },
  ],
  "Grimmsnarl Froslass": [
    { filename: "grimmsnarl.webp", label: "Grimmsnarl" },
    { filename: "froslass.webp", label: "Froslass" },
  ],
  "Lucario Hariyama": [
    { filename: "lucario.webp", label: "Lucario" },
    { filename: "hariyama.webp", label: "Hariyama" },
  ],
  "Mega Lucario ex": [
    { filename: "mega-lucario-ex.webp", label: "Mega Lucario ex" },
  ],
  "Mega Absol Box": [
    { filename: "mega-absol.webp", label: "Mega Absol" },
  ],
  "N's Zoroark": [{ filename: "ns-zoroark.webp", label: "N's Zoroark" }],
  "Ogerpon Meganium": [
    { filename: "ogerpon.webp", label: "Ogerpon" },
    { filename: "meganium.webp", label: "Meganium" },
  ],
  "Festival Lead": [{ filename: "festival-lead.webp", label: "Festival Lead" }],
  "Rocket's Spidops": [
    { filename: "rockets-spidops.webp", label: "Rocket's Spidops" },
  ],
  "Rocket Box": [{ filename: "rocket-box.webp", label: "Rocket Box" }],
  "Froslass Munkidori": [
    { filename: "froslass.webp", label: "Froslass" },
    { filename: "munkidori.webp", label: "Munkidori" },
  ],
  "Joltik Box": [{ filename: "joltik.webp", label: "Joltik" }],
  Crustle: [{ filename: "crustle.webp", label: "Crustle" }],
  "Raging Bolt Ogerpon": [
    { filename: "raging-bolt.webp", label: "Raging Bolt" },
    { filename: "ogerpon.webp", label: "Ogerpon" },
  ],
  Alakazam: [{ filename: "alakazam.webp", label: "Alakazam" }],
  [OTHER_ARCHETYPE]: FALLBACK_ARCHETYPE_SPRITES,

  "Charizard ex": [{ filename: "charizard-ex.webp", label: "Charizard ex" }],
  "Gardevoir ex": [{ filename: "gardevoir-ex.webp", label: "Gardevoir ex" }],
  "Gholdengo ex": [{ filename: "gholdengo-ex.webp", label: "Gholdengo ex" }],
  "Miraidon ex": [{ filename: "miraidon-ex.webp", label: "Miraidon ex" }],
  "Roaring Moon ex": [
    { filename: "roaring-moon-ex.webp", label: "Roaring Moon ex" },
  ],
  "Lost Zone Box": [
    { filename: "lost-zone-box.webp", label: "Lost Zone Box" },
  ],
  "Chien-Pao ex": [{ filename: "chien-pao-ex.webp", label: "Chien-Pao ex" }],
  "Ancient Box": [{ filename: "ancient-box.webp", label: "Ancient Box" }],
  "Future Box": [{ filename: "future-box.webp", label: "Future Box" }],
  "Lugia VSTAR": [{ filename: "lugia-vstar.webp", label: "Lugia VSTAR" }],
};

export function getArchetypeSprites(archetype: string | null | undefined) {
  if (!archetype) {
    return FALLBACK_ARCHETYPE_SPRITES;
  }

  return ARCHETYPE_SPRITES[archetype] ?? FALLBACK_ARCHETYPE_SPRITES;
}
