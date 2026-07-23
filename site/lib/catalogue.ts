import type { Archetype, ArchetypePublic } from "./types";
import catalogue from "./catalogue.json";

// Catalogue des archétypes — source de données : catalogue.json (miroir de
// archetypes.yaml du pipeline Python). S'enrichit via `promouvoir_archetype.py`
// (option −30 € : un personnage sur-mesure validé devient un archétype public).
// Le texte du livre reste ÉPICÈNE : `genre` ne sert qu'à la présentation.
export const ARCHETYPES = catalogue as unknown as Archetype[];

const PAR_ID = new Map(ARCHETYPES.map((a) => [a.id, a]));

export function archetypeParId(id: string): Archetype | undefined {
  return PAR_ID.get(id);
}

export function existe(id: string | undefined | null): boolean {
  return !!id && PAR_ID.has(id);
}

/** Version publique : champs de présentation seulement (pas de description
 *  technique ni de tenue — voir ArchetypePublic). */
export function cataloguePublic(): ArchetypePublic[] {
  return ARCHETYPES.map((a) => ({
    id: a.id,
    genre: a.genre,
    label: a.label,
    fiche: `/fiches/${a.id}.png`,
    disponible: true, // fiches validées présentes dans /public/fiches
  }));
}
