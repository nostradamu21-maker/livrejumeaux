import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

export const stripeActif = key.startsWith("sk_");

// Instancié uniquement si une clé est présente (sinon repli « mock »).
export const stripe = stripeActif ? new Stripe(key) : null;

export const PRIX_CENTIMES = Number(process.env.PRIX_CENTIMES ?? 4490);
export const DEVISE = "eur";
export const PRODUIT_NOM = "Deux comme nous — livre personnalisé";
