export type Genre = "garçon" | "fille";

export interface Archetype {
  id: string;
  genre: Genre;
  label: string;
  description: string;
  tenue: string;
  distinctif: string;
}

// Version exposée au navigateur : uniquement les champs de présentation.
// JAMAIS `description` ni `tenue` (vocabulaire technique de génération,
// mentions de carnation) — ils restent côté serveur.
export interface ArchetypePublic {
  id: string;
  genre: Genre;
  label: string;
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
