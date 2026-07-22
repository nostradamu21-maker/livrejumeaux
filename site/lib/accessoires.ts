// Accessoires « distinctif » : proposés au parent UNIQUEMENT quand les deux
// jumeaux ont le même archétype, pour distinguer le second et mapper les prénoms.
// `distinctif` est la consigne envoyée au pipeline (format « le second … »).
// `emoji` est un repère visuel temporaire — remplacé plus tard par une icône
// illustrée dans le style du livre (fichier /accessoires/<id>.png).

export interface Accessoire {
  id: string;
  label: string;
  emoji: string;
  distinctif: string;
}

export const ACCESSOIRES: Accessoire[] = [
  {
    id: "doudou-lapin",
    label: "Doudou lapin",
    emoji: "🐰",
    distinctif: "le second tient un doudou lapin tout doux dans les bras",
  },
  {
    id: "doudou-ours",
    label: "Doudou ours",
    emoji: "🧸",
    distinctif: "le second tient un doudou ours tout doux dans les bras",
  },
  {
    id: "doudou-chat",
    label: "Doudou chat",
    emoji: "🐱",
    distinctif: "le second tient un doudou chat tout doux dans les bras",
  },
  {
    id: "lunettes",
    label: "Lunettes rondes",
    emoji: "👓",
    distinctif: "le second porte de petites lunettes rondes",
  },
  {
    id: "casquette",
    label: "Casquette",
    emoji: "🧢",
    distinctif: "le second porte une petite casquette",
  },
  {
    id: "foulard",
    label: "Foulard",
    emoji: "🧣",
    distinctif: "le second porte un foulard léger noué au cou",
  },
];

export const ACCESSOIRE_DEFAUT = ACCESSOIRES[0].id;

const PAR_ID = new Map(ACCESSOIRES.map((a) => [a.id, a]));

export function accessoireParId(id: string | null | undefined): Accessoire | undefined {
  return id ? PAR_ID.get(id) : undefined;
}

export function accessoireExiste(id: string): boolean {
  return PAR_ID.has(id);
}
