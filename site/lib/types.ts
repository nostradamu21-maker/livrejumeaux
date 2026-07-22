export type Genre = "garçon" | "fille";

export interface Archetype {
  id: string;
  genre: Genre;
  label: string;
  description: string;
  tenue: string;
  distinctif: string;
}

export interface ArchetypePublic extends Archetype {
  fiche: string;      // URL de la fiche de référence
  disponible: boolean;
}

export interface Commande {
  archetype1: string;
  archetype2: string;
  prenom1: string;
  prenom2: string;
  email: string;
}
