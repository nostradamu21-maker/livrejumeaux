import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

export const stripeActif = key.startsWith("sk_");

// Instancié uniquement si une clé est présente (sinon repli « mock »).
export const stripe = stripeActif ? new Stripe(key) : null;

export const PRIX_CENTIMES = Number(process.env.PRIX_CENTIMES ?? 4490);
export const LIVRAISON_CENTIMES = Number(process.env.LIVRAISON_CENTIMES ?? 499);
// Édition sur mesure (personnages dessinés d'après photo).
export const PRIX_SUR_MESURE_CENTIMES = Number(process.env.PRIX_SUR_MESURE_CENTIMES ?? 7900);
export const REDUC_REUTILISATION_CENTIMES = Number(process.env.REDUC_REUTILISATION_CENTIMES ?? 1000);
// Code promo communauté (posté dans le groupe Gémellité) : -10 € sur toute
// commande. Modifiable via les variables d'env CODE_PROMO / REDUC_PROMO_CENTIMES.
export const CODE_PROMO = (process.env.CODE_PROMO ?? "JUMEAUX10").trim().toUpperCase();
export const REDUC_PROMO_CENTIMES = Number(process.env.REDUC_PROMO_CENTIMES ?? 1000);

/** Remise (en centimes) accordée pour un code promo saisi par le client.
 *  Comparaison insensible à la casse/aux espaces ; 0 si le code ne correspond pas. */
export function remisePromo(code: unknown): number {
  const c = String(code ?? "").trim().toUpperCase();
  return c && c === CODE_PROMO ? REDUC_PROMO_CENTIMES : 0;
}

export const DEVISE = "eur";
export const PRODUIT_NOM = "Deux comme nous, livre personnalisé";

// Pays de livraison proposés au checkout (Gelato livre bien au-delà ;
// on ouvre d'abord la zone francophone et ses voisins).
export const PAYS_LIVRAISON = [
  "FR", "BE", "LU", "CH", "MC", "AD", "DE", "ES", "IT", "NL", "PT", "AT", "IE", "GB", "CA",
] as const;
