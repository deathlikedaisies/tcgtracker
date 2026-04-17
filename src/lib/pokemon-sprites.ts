export type PokemonSprite = {
  filename: string;
  pokemon: string;
};

const POKEMON_SPRITE_EXTENSION = ".png";

// PokeAPI official-artwork exports are stored locally as public/sprites/{id}.png.
// Keep this table focused on names the app references; adding a future archetype
// usually means adding only the Pokemon name and National/PokeAPI ID here.
export const POKEMON_SPRITE_FILES: Record<string, string> = {
  absol: "359.png",
  alakazam: "65.png",
  blaziken: "257.png",
  charizard: "6.png",
  "chien-pao": "1002.png",
  comfey: "764.png",
  crustle: "558.png",
  dipplin: "1011.png",
  dragapult: "887.png",
  dudunsparce: "982.png",
  dusknoir: "477.png",
  farigiraf: "981.png",
  froslass: "478.png",
  garchomp: "445.png",
  gardevoir: "282.png",
  gholdengo: "1000.png",
  greninja: "658.png",
  grimmsnarl: "861.png",
  hariyama: "297.png",
  honchkrow: "430.png",
  jellicent: "593.png",
  joltik: "595.png",
  lucario: "448.png",
  lugia: "249.png",
  lunatone: "337.png",
  meganium: "154.png",
  mewtwo: "150.png",
  milotic: "350.png",
  miraidon: "1008.png",
  munkidori: "1015.png",
  noctowl: "164.png",
  ogerpon: "1017.png",
  okidogi: "1014.png",
  pidgeot: "18.png",
  "raging-bolt": "1021.png",
  "roaring-moon": "1005.png",
  sinistcha: "1013.png",
  spidops: "918.png",
  starmie: "121.png",
  zoroark: "571.png",
  archaludon: "1018.png",
};

function normalizePokemonName(value: string) {
  return value
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function getPokemonSpriteFilename(
  pokemon: string | number | null | undefined
) {
  if (pokemon === null || pokemon === undefined) {
    return null;
  }

  const value = String(pokemon).trim();

  if (!value) {
    return null;
  }

  if (/^\d+$/.test(value)) {
    return `${value}${POKEMON_SPRITE_EXTENSION}`;
  }

  const normalized = normalizePokemonName(value);

  return (
    POKEMON_SPRITE_FILES[normalized] ??
    `${normalized}${POKEMON_SPRITE_EXTENSION}`
  );
}

export function getPokemonSprite(
  pokemon: string | number | null | undefined
): PokemonSprite | null {
  const filename = getPokemonSpriteFilename(pokemon);

  if (!filename || pokemon === null || pokemon === undefined) {
    return null;
  }

  return {
    filename,
    pokemon: String(pokemon),
  };
}
