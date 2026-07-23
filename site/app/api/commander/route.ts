import { NextResponse } from "next/server";
import { existe, archetypeParId } from "@/lib/catalogue";
import { comboId } from "@/lib/combo";
import { accessoireExiste } from "@/lib/accessoires";
import {
  stripe,
  stripeActif,
  PRIX_CENTIMES,
  LIVRAISON_CENTIMES,
  DEVISE,
  PRODUIT_NOM,
  PAYS_LIVRAISON,
} from "@/lib/stripe";
import { comboEnCache, enregistrerCommande } from "@/lib/supabase";

interface Corps {
  archetype1?: string;
  archetype2?: string;
  prenom1?: string;
  prenom2?: string;
  email?: string;
  accessoire?: string | null;
  langue?: string;
}

const LANGUES = new Set(["fr", "en", "es", "de"]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Corps;
  const a1 = body.archetype1 ?? "";
  const a2 = body.archetype2 ?? "";
  const p1 = (body.prenom1 ?? "").trim();
  const p2 = (body.prenom2 ?? "").trim();
  const email = (body.email ?? "").trim();
  // L'accessoire distinctif ne s'applique qu'aux paires identiques.
  const acc =
    a1 === a2 && body.accessoire && accessoireExiste(body.accessoire)
      ? body.accessoire
      : null;
  // Langue du TEXTE du livre (les images sont communes à toutes les langues).
  const langue = LANGUES.has(body.langue ?? "") ? body.langue! : "fr";

  if (!existe(a1) || !existe(a2)) {
    return NextResponse.json({ ok: false, erreur: "Archétype inconnu." }, { status: 400 });
  }
  if (!p1 || !p2) {
    return NextResponse.json(
      { ok: false, erreur: "Les deux prénoms sont requis." },
      { status: 400 },
    );
  }

  const cid = comboId(a1, a2, acc);
  const origin = new URL(req.url).origin;

  // --- Paiement réel via Stripe si configuré ---
  if (stripeActif && stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DEVISE,
            unit_amount: PRIX_CENTIMES,
            product_data: {
              name: PRODUIT_NOM,
              // Libellés clients uniquement (jamais les ids techniques des
              // archétypes, qui décrivent la carnation).
              description: `${p1} (${archetypeParId(a1)?.label ?? ""}) & ${p2} (${archetypeParId(a2)?.label ?? ""})`,
            },
          },
        },
      ],
      customer_email: email || undefined,
      // Adresse indispensable pour l'impression à la demande (Gelato expédie
      // directement chez le client).
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
      cancel_url: `${origin}/#creer`,
      metadata: { combo_id: cid, archetype1: a1, archetype2: a2, prenom1: p1, prenom2: p2, langue },
    });
    return NextResponse.json({ ok: true, url: session.url });
  }

  // --- Repli : paiement simulé (aucune clé Stripe) ---
  const cache = await comboEnCache(cid);
  const statut = cache ? "cache" : "a_produire";
  await enregistrerCommande({
    combo_id: cid,
    archetype1: a1,
    archetype2: a2,
    prenom1: p1,
    prenom2: p2,
    email: email || null,
    statut,
    paiement: "simulé",
    ref: null,
    langue,
    montant_centimes: PRIX_CENTIMES + LIVRAISON_CENTIMES,
  });

  const message = cache
    ? "Votre livre personnalisé est prêt : il part à l'impression et vous est expédié directement."
    : "Cette combinaison est créée pour la première fois : nos illustrations sont validées puis votre livre est imprimé et expédié sous 1 à 2 jours.";

  return NextResponse.json({ ok: true, mock: true, combo_id: cid, statut, message });
}
