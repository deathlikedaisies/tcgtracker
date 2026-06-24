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
  Dragapult: [{ pokemon: "Dragapult", label: "Dragapult" }],
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
  "Mega Greninja": [{ pokemon: "Greninja", label: "Mega Greninja" }],
  "Mega Absol Box": [{ pokemon: "Absol", label: "Mega Absol" }],
  "Mega Lopunny": [{ pokemon: "Lopunny", label: "Mega Lopunny" }],
  "N's Zoroark": [{ pokemon: "Zoroark", label: "N's Zoroark" }],
  "Ogerpon Meganium": [
    { pokemon: "Ogerpon" },
    { pokemon: "Meganium" },
  ],
  "Ogerpon Meganium Hydrapple": [
    { pokemon: "Ogerpon" },
    { pokemon: "Meganium" },
    { pokemon: "Hydrapple" },
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
  "Crustle": [{ pokemon: "Crustle" }],
  "Beedrill": [{ pokemon: "Beedrill" }],
  "Raging Bolt Ogerpon": [
    { pokemon: "Raging Bolt" },
    { pokemon: "Ogerpon" },
  ],
  "Raging Bolt": [{ pokemon: "Raging Bolt" }],
  "Alakazam": [{ pokemon: "Alakazam" }],
  "Alakazam Dudunsparce": [
    { pokemon: "Alakazam" },
    { pokemon: "Dudunsparce" },
  ],
  "Cynthia's Garchomp": [{ pokemon: "Garchomp", label: "Cynthia's Garchomp" }],
  "Okidogi": [{ pokemon: "Okidogi" }],
  "Okidogi Barbaracle": [
    { pokemon: "Okidogi" },
    { pokemon: "Barbaracle" },
  ],
  "Marnie's Grimmsnarl": [{ pokemon: "Grimmsnarl", label: "Marnie's Grimmsnarl" }],
  "Mega Froslass": [{ pokemon: "Froslass", label: "Mega Froslass" }],
  "Greninja Froslass": [
    { pokemon: "Greninja" },
    { pokemon: "Froslass" },
  ],
  "Greninja": [{ pokemon: "Greninja" }],
  "Dragapult Froslass": [
    { pokemon: "Dragapult", label: "Dragapult ex" },
    { pokemon: "Froslass" },
  ],
  "Dragapult Dudunsparce": [
    { pokemon: "Dragapult", label: "Dragapult ex" },
    { pokemon: "Dudunsparce" },
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
  "Garchomp": [{ pokemon: "Garchomp" }],
  "Spidops": [{ pokemon: "Spidops" }],
  "Slowking": [{ pokemon: "Slowking" }],
  "Mega Venusaur": [{ pokemon: "Venusaur", label: "Mega Venusaur" }],
  "Metagross": [{ pokemon: "Metagross" }],
  "Bloodmoon Ursaluna": [
    { pokemon: "Ursaluna", label: "Bloodmoon Ursaluna" },
  ],
  "Steven's Metagross": [
    { pokemon: "Metagross", label: "Steven's Metagross" },
  ],
  "Clefairy Ogerpon": [
    { pokemon: "Clefairy" },
    { pokemon: "Ogerpon" },
  ],
  "Ogerpon Box": [{ pokemon: "Ogerpon", label: "Ogerpon Box" }],
  "Flareon Noctowl": [
    { pokemon: "Flareon" },
    { pokemon: "Noctowl" },
  ],
  "Ceruledge": [{ pokemon: "Ceruledge" }],
  "Starmie Dusknoir": [
    { pokemon: "Starmie" },
    { pokemon: "Dusknoir" },
  ],
  "Diancie Dusknoir": [
    { pokemon: "Diancie" },
    { pokemon: "Dusknoir" },
  ],
  "Hop's Trevenant": [{ pokemon: "Trevenant", label: "Hop's Trevenant" }],
  "Basic Box": [],
  "Lopunny Dudunsparce": [
    { pokemon: "Lopunny" },
    { pokemon: "Dudunsparce" },
  ],
  "Ursaluna Lunatone": [
    { pokemon: "Ursaluna" },
    { pokemon: "Lunatone" },
  ],
  "Tera Box": [{ pokemon: "Terapagos", label: "Tera Box" }],
  "Jellicent Dusknoir": [
    { pokemon: "Jellicent" },
    { pokemon: "Dusknoir" },
  ],
  "Decidueye": [{ pokemon: "Decidueye" }],
  "Ethan's Typhlosion": [
    { pokemon: "Typhlosion", label: "Ethan's Typhlosion" },
  ],
  "Ethan's Magcargo": [
    { pokemon: "Magcargo", label: "Ethan's Magcargo" },
  ],
  "Hydrapple": [{ pokemon: "Hydrapple" }],
  "Hydrapple Ogerpon": [
    { pokemon: "Hydrapple" },
    { pokemon: "Ogerpon" },
  ],
  "Mega Starmie": [{ pokemon: "Starmie", label: "Mega Starmie" }],
  "Yanmega": [{ pokemon: "Yanmega" }],
  "Toxtricity Box": [{ pokemon: "Toxtricity", label: "Toxtricity Box" }],
  "Archaludon": [{ pokemon: "Archaludon" }],
  "Hydreigon": [{ pokemon: "Hydreigon" }],
  "Blaziken": [{ pokemon: "Blaziken" }],
  "Sharpedo Toxtricity": [
    { pokemon: "Sharpedo" },
    { pokemon: "Toxtricity" },
  ],
  "Mega Sharpedo": [{ pokemon: "Sharpedo", label: "Mega Sharpedo" }],
  "Hop's Zacian": [{ pokemon: "Zacian", label: "Hop's Zacian" }],
  "Mega Charizard X": [{ pokemon: "Charizard", label: "Mega Charizard X" }],
  "Mega Diancie": [{ pokemon: "Diancie", label: "Mega Diancie" }],
  "Lillie's Clefairy": [{ pokemon: "Clefairy", label: "Lillie's Clefairy" }],
  "Kangaskhan Bouffalant": [
    { pokemon: "Kangaskhan" },
    { pokemon: "Bouffalant" },
  ],
  "Mega Zygarde": [{ pokemon: "Zygarde", label: "Mega Zygarde" }],
  "Flareon": [{ pokemon: "Flareon" }],
  "Doublade": [{ pokemon: "Doublade" }],
  "Zygarde Barbaracle": [
    { pokemon: "Zygarde" },
    { pokemon: "Barbaracle" },
  ],
  "Mega Abomasnow": [{ pokemon: "Abomasnow", label: "Mega Abomasnow" }],
  "Mega Dragonite": [{ pokemon: "Dragonite", label: "Mega Dragonite" }],
  "Mega Manectric": [{ pokemon: "Manectric", label: "Mega Manectric" }],
  "Bronzong": [{ pokemon: "Bronzong" }],
  "Toxtricity": [{ pokemon: "Toxtricity" }],
  "Paldean Tauros": [{ pokemon: "Tauros", label: "Paldean Tauros" }],
  "Mega Feraligatr": [{ pokemon: "Feraligatr", label: "Mega Feraligatr" }],
  "Mega Gengar": [{ pokemon: "Gengar", label: "Mega Gengar" }],
  "Iono's Bellibolt": [{ pokemon: "Bellibolt", label: "Iono's Bellibolt" }],
  "Palafin": [{ pokemon: "Palafin" }],
  "Eelektrik": [{ pokemon: "Eelektrik" }],
  "Dudunsparce Control": [
    { pokemon: "Dudunsparce", label: "Dudunsparce Control" },
  ],
  "Mamoswine": [{ pokemon: "Mamoswine" }],
  "Azumarill": [{ pokemon: "Azumarill" }],
  "Heatran Metang": [
    { pokemon: "Heatran" },
    { pokemon: "Metang" },
  ],
  "Slaking": [{ pokemon: "Slaking" }],
  "Galvantula": [{ pokemon: "Galvantula" }],
  "Milotic": [{ pokemon: "Milotic" }],
  "Ogerpon": [{ pokemon: "Ogerpon" }],
  "Misty's Gyarados": [{ pokemon: "Gyarados", label: "Misty's Gyarados" }],
  "Cinderace": [{ pokemon: "Cinderace" }],
  "Mega Zygarde ex": [{ pokemon: "Zygarde", label: "Mega Zygarde ex" }],
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
