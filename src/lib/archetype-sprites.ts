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
    { filename: "mega-lucario-ex.png", label: "Mega Lucario ex" },
  ],
  "Mega Absol Box": [
    { filename: "mega-absol.png", label: "Mega Absol" },
  ],
  "N's Zoroark": [{ filename: "ns-zoroark.png", label: "N's Zoroark" }],
  "Ogerpon Meganium": [
    { filename: "ogerpon.png", label: "Ogerpon" },
    { filename: "meganium.png", label: "Meganium" },
  ],
  "Festival Lead": [{ filename: "festival-lead.png", label: "Festival Lead" }],
  "Rocket's Spidops": [
    { filename: "rockets-spidops.png", label: "Rocket's Spidops" },
  ],
  "Rocket Box": [{ filename: "rocket-box.png", label: "Rocket Box" }],
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
  [OTHER_ARCHETYPE]: FALLBACK_ARCHETYPE_SPRITES,

  "Charizard ex": [{ filename: "charizard-ex.png", label: "Charizard ex" }],
  "Gardevoir ex": [{ filename: "gardevoir-ex.png", label: "Gardevoir ex" }],
  "Gholdengo ex": [{ filename: "gholdengo-ex.png", label: "Gholdengo ex" }],
  "Miraidon ex": [{ filename: "miraidon-ex.png", label: "Miraidon ex" }],
  "Roaring Moon ex": [
    { filename: "roaring-moon-ex.png", label: "Roaring Moon ex" },
  ],
  "Lost Zone Box": [
    { filename: "lost-zone-box.png", label: "Lost Zone Box" },
  ],
  "Chien-Pao ex": [{ filename: "chien-pao-ex.png", label: "Chien-Pao ex" }],
  "Ancient Box": [{ filename: "ancient-box.png", label: "Ancient Box" }],
  "Future Box": [{ filename: "future-box.png", label: "Future Box" }],
  "Lugia VSTAR": [{ filename: "lugia-vstar.png", label: "Lugia VSTAR" }],
};

export function getArchetypeSprites(archetype: string | null | undefined) {
  if (!archetype) {
    return FALLBACK_ARCHETYPE_SPRITES;
  }

  return ARCHETYPE_SPRITES[archetype] ?? FALLBACK_ARCHETYPE_SPRITES;
}
