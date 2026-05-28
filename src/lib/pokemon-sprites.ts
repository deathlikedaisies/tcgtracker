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
  abomasnow: "460.png",
  azumarill: "184.png",
  barbaracle: "689.png",
  beedrill: "15.png",
  bellibolt: "939.png",
  blaziken: "257.png",
  bouffalant: "626.png",
  bronzong: "437.png",
  ceruledge: "937.png",
  charizard: "6.png",
  "chien-pao": "1002.png",
  cinderace: "815.png",
  clefairy: "35.png",
  comfey: "764.png",
  crustle: "558.png",
  decidueye: "724.png",
  diancie: "719.png",
  dipplin: "1011.png",
  dragonite: "149.png",
  dragapult: "887.png",
  doublade: "680.png",
  dudunsparce: "982.png",
  dusknoir: "477.png",
  eelektrik: "603.png",
  farigiraf: "981.png",
  flareon: "136.png",
  feraligatr: "160.png",
  froslass: "478.png",
  garchomp: "445.png",
  gardevoir: "282.png",
  galvantula: "596.png",
  gengar: "94.png",
  gholdengo: "1000.png",
  greninja: "658.png",
  grimmsnarl: "861.png",
  gyarados: "130.png",
  hariyama: "297.png",
  heatran: "485.png",
  honchkrow: "430.png",
  hydreigon: "635.png",
  hydrapple: "1019.png",
  jellicent: "593.png",
  joltik: "595.png",
  kangaskhan: "115.png",
  lucario: "448.png",
  lopunny: "428.png",
  lugia: "249.png",
  lunatone: "337.png",
  magcargo: "219.png",
  mamoswine: "473.png",
  manectric: "310.png",
  meganium: "154.png",
  metang: "375.png",
  metagross: "376.png",
  mewtwo: "150.png",
  milotic: "350.png",
  miraidon: "1008.png",
  munkidori: "1015.png",
  noctowl: "164.png",
  ogerpon: "1017.png",
  okidogi: "1014.png",
  palafin: "964.png",
  pidgeot: "18.png",
  "raging-bolt": "1021.png",
  "roaring-moon": "1005.png",
  sharpedo: "319.png",
  sinistcha: "1013.png",
  slaking: "289.png",
  slowking: "199.png",
  spidops: "918.png",
  starmie: "121.png",
  terapagos: "1024.png",
  tauros: "128.png",
  toxtricity: "849.png",
  trevenant: "709.png",
  typhlosion: "157.png",
  ursaluna: "901.png",
  venusaur: "3.png",
  yanmega: "469.png",
  zacian: "888.png",
  zygarde: "718.png",
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
