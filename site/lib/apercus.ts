// Combos dont de VRAIES pages existent déjà (livre produit + trié) : on peut
// montrer un aperçu authentique avec les prénoms du visiteur injectés (le
// texte du livre est vectoriel, seul le visuel est fixe).
//
// Le catalogue vit dans apercus.json, maintenu par `python publier_apercu.py
// <combo>` : chaque combo produite s'y ajoute (copie des aperçus dans
// public/apercus/<combo>/ + entrée ici). Ne pas éditer le JSON à la main.
import catalogue from "./apercus.json";

export interface ApercuCombo {
  dossier: string; // sous /public
  pages: string[]; // numéros de pages montrées dans la visionneuse
}

export const APERCUS: Record<string, ApercuCombo> = catalogue;

export function apercuPourCombo(id: string): ApercuCombo | undefined {
  // L'accessoire ne change pas les pages de fond de l'aperçu.
  return APERCUS[id.replace(/__acc-.*$/, "")];
}
