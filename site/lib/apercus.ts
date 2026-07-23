// Combos dont de VRAIES pages existent déjà (livre produit + trié) : on peut
// montrer un aperçu authentique avec les prénoms du visiteur injectés (le
// texte du livre est vectoriel, seul le visuel est fixe).
// S'enrichit à chaque nouvelle combo produite (dossier public/apercus/<id>/).

export interface ApercuCombo {
  dossier: string; // sous /public
  pages: string[]; // numéros de pages montrées dans la visionneuse
}

export const APERCUS: Record<string, ApercuCombo> = {
  // Livre test « Elia & Luna » : mêmes personnages que la paire f1 + f2.
  "combo-f1-natte-brune__f2-nattes-brune": {
    dossier: "/apercus/test-filles",
    pages: ["01", "05", "09", "14", "21", "27"],
  },
};

export function apercuPourCombo(id: string): ApercuCombo | undefined {
  // L'accessoire ne change pas les pages de fond de l'aperçu.
  return APERCUS[id.replace(/__acc-.*$/, "")];
}
