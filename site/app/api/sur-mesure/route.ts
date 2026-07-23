import { NextResponse } from "next/server";
import {
  stripe,
  stripeActif,
  PRIX_SUR_MESURE_CENTIMES,
  REDUC_REUTILISATION_CENTIMES,
  LIVRAISON_CENTIMES,
  DEVISE,
  PAYS_LIVRAISON,
} from "@/lib/stripe";
import { enregistrerCommande } from "@/lib/supabase";

interface Corps {
  email?: string;
  prenom1?: string;
  prenom2?: string;
  reutilisation?: boolean;
}

// Paiement de l'édition sur mesure : le client paie d'abord, puis envoie sa
// photo en répondant à l'e-mail de confirmation (aucun upload sur le site).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Corps;
  const email = (body.email ?? "").trim();
  const p1 = (body.prenom1 ?? "").trim();
  const p2 = (body.prenom2 ?? "").trim();
  const reutilisation = !!body.reutilisation;

  if (!p1 || !p2) {
    return NextResponse.json(
      { ok: false, erreur: "Les deux prénoms sont requis." },
      { status: 400 },
    );
  }

  const prix = reutilisation
    ? PRIX_SUR_MESURE_CENTIMES - REDUC_REUTILISATION_CENTIMES
    : PRIX_SUR_MESURE_CENTIMES;
  const origin = new URL(req.url).origin;
  const metadata = {
    combo_id: "sur-mesure",
    archetype1: "sur-mesure",
    archetype2: reutilisation ? "reutilisation-ok" : "sans-reutilisation",
    prenom1: p1,
    prenom2: p2,
  };

  if (stripeActif && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DEVISE,
            unit_amount: prix,
            product_data: {
              name: "Deux comme nous, édition sur mesure",
              description: reutilisation
                ? `${p1} & ${p2}, d'après votre photo (option réutilisation −15 €)`
                : `${p1} & ${p2}, d'après votre photo`,
            },
          },
        },
      ],
      customer_email: email || undefined,
      shipping_address_collection: { allowed_countries: [...PAYS_LIVRAISON] },
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: "Livraison suivie",
            type: "fixed_amount",
            fixed_amount: { amount: LIVRAISON_CENTIMES, currency: DEVISE },
          },
        },
      ],
      success_url: `${origin}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#sur-mesure`,
      metadata,
    });
    return NextResponse.json({ ok: true, url: session.url });
  }

  // --- Repli : paiement simulé (aucune clé Stripe) ---
  await enregistrerCommande({
    combo_id: "sur-mesure",
    archetype1: metadata.archetype1,
    archetype2: metadata.archetype2,
    prenom1: p1,
    prenom2: p2,
    email: email || null,
    statut: "a_produire",
    paiement: "simulé",
    ref: null,
    montant_centimes: prix + LIVRAISON_CENTIMES,
  });
  return NextResponse.json({
    ok: true,
    mock: true,
    message:
      "Commande sur mesure enregistrée. Envoyez votre photo en réponse à l'e-mail de confirmation.",
  });
}
