import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeActif, PRIX_CENTIMES } from "@/lib/stripe";
import { comboEnCache, enregistrerCommande } from "@/lib/supabase";

// Le webhook doit lire le corps BRUT pour vérifier la signature Stripe.
export async function POST(req: Request) {
  if (!stripeActif || !stripe) {
    return NextResponse.json({ recu: false, raison: "Stripe non configuré" }, { status: 200 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const signature = req.headers.get("stripe-signature") ?? "";
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "signature invalide";
    return NextResponse.json({ erreur: `Webhook: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const m = session.metadata ?? {};
    const cid = m.combo_id ?? "";
    if (cid) {
      const statut = (await comboEnCache(cid)) ? "cache" : "a_produire";
      await enregistrerCommande({
        combo_id: cid,
        archetype1: m.archetype1 ?? "",
        archetype2: m.archetype2 ?? "",
        prenom1: m.prenom1 ?? "",
        prenom2: m.prenom2 ?? "",
        email: session.customer_details?.email ?? null,
        statut,
        paiement: "stripe",
        ref: session.id,
        montant_centimes: session.amount_total ?? PRIX_CENTIMES,
      });
    }
  }

  return NextResponse.json({ recu: true });
}
