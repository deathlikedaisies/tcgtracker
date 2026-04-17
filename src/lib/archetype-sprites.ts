import { OTHER_ARCHETYPE } from "@/lib/archetypes";
import { getPokemonSprite } from "@/lib/pokemon-sprites";

export type ArchetypeSprite = {
  filename: string;
  label: string;
};

type ArchetypePokemon = {
  pokemon: string | number;
  label?: string;
};

export const FALLBACK_ARCHETYPE_SPRITES: ArchetypeSprite[] = [];

export const ARCHETYPE_POKEMON: Record<string, ArchetypePokemon[]> = {
  "Starmie Froslass": [
    { pokemon: "Starmie" },
    { pokemon: "Froslass" },
  ],
  "Dragapult ex": [{ pokemon: "Dragapult", label: "Dragapult ex" }],
  "Dragapult Blaziken": [
    { pokemon: "Dragapult", label: "Dragapult ex" },
    { pokemon: "Blaziken" },
  ],
  "Dragapult Dusknoir": [
    { pokemon: "Dragapult", label: "Dragapult ex" },
    { pokemon: "Dusknoir" },
  ],
  "Grimmsnarl Froslass": [
    { pokemon: "Grimmsnarl" },
    { pokemon: "Froslass" },
  ],
  "Lucario Hariyama": [
    { pokemon: "Lucario" },
    { pokemon: "Hariyama" },
  ],
  "Mega Lucario ex": [{ pokemon: "Lucario", label: "Mega Lucario ex" }],
  "Mega Lucario": [{ pokemon: "Lucario", label: "Mega Lucario" }],
  "Mega Absol Box": [{ pokemon: "Absol", label: "Mega Absol" }],
  "Gholdengo Lunatone": [
    { pokemon: "Gholdengo" },
    { pokemon: "Lunatone" },
  ],
  "N's Zoroark": [{ pokemon: "Zoroark", label: "N's Zoroark" }],
  "Ogerpon Meganium": [
    { pokemon: "Ogerpon" },
    { pokemon: "Meganium" },
  ],
  "Festival Lead": [{ pokemon: "Dipplin", label: "Festival Lead" }],
  "Rocket's Spidops": [{ pokemon: "Spidops", label: "Rocket's Spidops" }],
  "Rocket's Mewtwo": [{ pokemon: "Mewtwo", label: "Rocket's Mewtwo" }],
  "Rocket's Honchkrow": [{ pokemon: "Honchkrow", label: "Rocket's Honchkrow" }],
  "Rocket Box": [{ pokemon: "Spidops", label: "Rocket Box" }],
  "Froslass Munkidori": [
    { pokemon: "Froslass" },
    { pokemon: "Munkidori" },
  ],
  "Joltik Box": [{ pokemon: "Joltik" }],
  Crustle: [{ pokemon: "Crustle" }],
  "Raging Bolt Ogerpon": [
    { pokemon: "Raging Bolt" },
    { pokemon: "Ogerpon" },
  ],
  Alakazam: [{ pokemon: "Alakazam" }],
  "Alakazam Dudunsparce": [
    { pokemon: "Alakazam" },
    { pokemon: "Dudunsparce" },
  ],
  "Cynthia's Garchomp": [{ pokemon: "Garchomp", label: "Cynthia's Garchomp" }],
  Okidogi: [{ pokemon: "Okidogi" }],
  "Marnie's Grimmsnarl": [{ pokemon: "Grimmsnarl", label: "Marnie's Grimmsnarl" }],
  "Mega Froslass": [{ pokemon: "Froslass", label: "Mega Froslass" }],
  "Gardevoir Jellicent": [
    { pokemon: "Gardevoir" },
    { pokemon: "Jellicent" },
  ],
  "Charizard Noctowl": [
    { pokemon: "Charizard" },
    { pokemon: "Noctowl" },
  ],
  "Charizard Pidgeot": [
    { pokemon: "Charizard" },
    { pokemon: "Pidgeot" },
  ],
  "Greninja Froslass": [
    { pokemon: "Greninja" },
    { pokemon: "Froslass" },
  ],
  "Dragapult Froslass": [
    { pokemon: "Dragapult", label: "Dragapult ex" },
    { pokemon: "Froslass" },
  ],
  "Gholdengo Dragapult": [
    { pokemon: "Gholdengo" },
    { pokemon: "Dragapult", label: "Dragapult ex" },
  ],
  "Sinistcha Ogerpon": [
    { pokemon: "Sinistcha" },
    { pokemon: "Ogerpon" },
  ],
  "Farigiraf Milotic": [
    { pokemon: "Farigiraf" },
    { pokemon: "Milotic" },
  ],
  "Archaludon Zoroark": [
    { pokemon: "Archaludon" },
    { pokemon: "Zoroark" },
  ],
  Garchomp: [{ pokemon: "Garchomp" }],
  Spidops: [{ pokemon: "Spidops" }],
  [OTHER_ARCHETYPE]: [],

  "Charizard ex": [{ pokemon: "Charizard", label: "Charizard ex" }],
  "Gardevoir ex": [{ pokemon: "Gardevoir", label: "Gardevoir ex" }],
  "Gholdengo ex": [{ pokemon: "Gholdengo", label: "Gholdengo ex" }],
  "Miraidon ex": [{ pokemon: "Miraidon", label: "Miraidon ex" }],
  "Roaring Moon ex": [{ pokemon: "Roaring Moon", label: "Roaring Moon ex" }],
  "Lost Zone Box": [{ pokemon: "Comfey", label: "Lost Zone Box" }],
  "Chien-Pao ex": [{ pokemon: "Chien-Pao", label: "Chien-Pao ex" }],
  "Ancient Box": [{ pokemon: "Raging Bolt", label: "Ancient Box" }],
  "Future Box": [{ pokemon: "Miraidon", label: "Future Box" }],
  "Lugia VSTAR": [{ pokemon: "Lugia", label: "Lugia VSTAR" }],
};

function toArchetypeSprite(ref: ArchetypePokemon): ArchetypeSprite | null {
  const sprite = getPokemonSprite(ref.pokemon);

  if (!sprite) {
    return null;
  }

  return {
    filename: sprite.filename,
    label: ref.label ?? sprite.pokemon,
  };
}

function isArchetypeSprite(
  sprite: ArchetypeSprite | null
): sprite is ArchetypeSprite {
  return sprite !== null;
}

export const ARCHETYPE_SPRITES: Record<string, ArchetypeSprite[]> =
  Object.fromEntries(
    Object.entries(ARCHETYPE_POKEMON).map(([archetype, pokemon]) => [
      archetype,
      pokemon.map(toArchetypeSprite).filter(isArchetypeSprite),
    ])
  );

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
