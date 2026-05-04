export type NormalizedCard = {
  id: string;
  imageLarge: string | null;
  imageSmall: string | null;
  legalities: Record<string, string> | null;
  name: string;
  number: string | null;
  regulationMark: string | null;
  rarity: string | null;
  setCode: string | null;
  setId: string | null;
  setName: string | null;
  subtypes: string[];
  supertype: string | null;
  types: string[];
};

export type CardLookupResult = {
  available: boolean;
  cards: NormalizedCard[];
  error: string | null;
};

export type CardSearchInput = {
  name: string;
  number: string | null;
  setCode: string | null;
};
