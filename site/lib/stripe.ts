import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

export const stripeActif = key.startsWith("sk_");

// Instancié uniquement si une clé est présente (sinon repli « mock »).
export const stripe = stripeActif ? new Stripe(key) : null;

export const PRIX_CENTIMES = Number(process.env.PRIX_CENTIMES ?? 4490);
export const LIVRAISON_CENTIMES = Number(process.env.LIVRAISON_CENTIMES ?? 499);
// Édition sur mesure (personnages dessinés d'après photo).
export const PRIX_SUR_MESURE_CENTIMES = Number(process.env.PRIX_SUR_MESURE_CENTIMES ?? 6499);
export const REDUC_REUTILISATION_CENTIMES = Number(process.env.REDUC_REUTILISATION_CENTIMES ?? 1000);
// Code promo communauté (posté dans le groupe Gémellité) : -10 € sur toute
// commande. Modifiable via les variables d'env CODE_PROMO / REDUC_PROMO_CENTIMES.
export const CODE_PROMO = (process.env.CODE_PROMO ?? "JUMEAUX10").trim().toUpperCase();
export const REDUC_PROMO_CENTIMES = Number(process.env.REDUC_PROMO_CENTIMES ?? 1000);

// Code de TEST caché (jamais communiqué publiquement) : ramène le livre au
// minimum Stripe (0,50 €) et la livraison à 0 € pour tester le tunnel complet
// en conditions réelles. Changeable via CODE_TEST dans les variables Vercel.
export const CODE_TEST = (process.env.CODE_TEST ?? "JUMELIO-TEST-77").trim().toUpperCase();

/** Vrai si le code saisi est le code de test interne. */
export function estCodeTest(code: unknown): boolean {
  const c = String(code ?? "").trim().toUpperCase();
  return !!c && c === CODE_TEST;
}

/** Remise (en centimes) accordée pour un code promo saisi par le client.
 *  Comparaison insensible à la casse/aux espaces ; 0 si le code ne correspond pas.
 *  Le code de test renvoie une remise « infinie », plafonnée ensuite par les
 *  routes au minimum Stripe (0,50 €). */
export function remisePromo(code: unknown): number {
  if (estCodeTest(code)) return 9_999_900;
  const c = String(code ?? "").trim().toUpperCase();
  return c && c === CODE_PROMO ? REDUC_PROMO_CENTIMES : 0;
}

export const DEVISE = "eur";
export const PRODUIT_NOM = "Deux comme nous, livre personnalisé";

// Vrais produits du catalogue Stripe (créés une fois dans le dashboard) : toutes
// les ventes s'y rattachent → suivi propre par produit / CA par produit. On garde
// le prix côté code (unit_amount), seul le PRODUIT est référencé. Si l'ID n'est pas
// fourni, repli sur un product_data à la volée (comportement historique).
export const PRODUIT_LIVRE_ID = process.env.STRIPE_PRODUIT_LIVRE?.trim() || "";
export const PRODUIT_SUR_MESURE_ID = process.env.STRIPE_PRODUIT_SUR_MESURE?.trim() || "";

// Produit AFFICHE (poster des jumeaux, livré roulé, à encadrer) : prix par
// taille, en centimes, surchargeables via PRIX_AFFICHE_21X30 etc. sur Vercel.
export const AFFICHE_TAILLES = ["21x30", "30x40", "40x50", "50x70"] as const;
export type AfficheTaille = (typeof AFFICHE_TAILLES)[number];
export const PRIX_AFFICHE_CENTIMES: Record<AfficheTaille, number> = {
  "21x30": Number(process.env.PRIX_AFFICHE_21X30 ?? 2990),
  "30x40": Number(process.env.PRIX_AFFICHE_30X40 ?? 3490),
  "40x50": Number(process.env.PRIX_AFFICHE_40X50 ?? 3990),
  "50x70": Number(process.env.PRIX_AFFICHE_50X70 ?? 4990),
};
export const PRODUIT_AFFICHE_ID = process.env.STRIPE_PRODUIT_AFFICHE?.trim() || "";
// Affiche SUR MESURE seule (personnages dessinés d'après photo, sans livre) :
// prix unique, identique au catalogue — un seul prix annoncé partout, aucun écart
// possible entre la vitrine et la page. Un supplément reste activable par env.
export const AFFICHE_SM_SUPPLEMENT = Number(process.env.PRIX_AFFICHE_SM_SUPPLEMENT ?? 0);

// Pays de livraison proposés au checkout (Gelato livre bien au-delà ;
// on ouvre d'abord la zone francophone et ses voisins).
export const PAYS_LIVRAISON = [
  "FR", "BE", "LU", "CH", "MC", "AD", "DE", "ES", "IT", "NL", "PT", "AT", "IE", "GB", "CA",
] as const;
