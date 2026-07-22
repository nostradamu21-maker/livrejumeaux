import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeActif, PRIX_CENTIMES, LIVRAISON_CENTIMES } from "@/lib/stripe";
import { comboEnCache, enregistrerCommande } from "@/lib/supabase";
import { emailConfirmationClient, emailNotifInterne } from "@/lib/email";

/** Adresse de livraison en texte multi-lignes (selon la version de l'API
 *  Stripe, elle arrive dans shipping_details ou collected_information). */
function adresseLivraison(session: Stripe.Checkout.Session): string | null {
  const s =
    (session as unknown as { shipping_details?: { name?: string; address?: Stripe.Address } })
      .shipping_details ??
    (session as unknown as {
      collected_information?: { shipping_details?: { name?: string; address?: Stripe.Address } };
    }).collected_information?.shipping_details;
  const a = s?.address;
  if (!a) return null;
  return [s?.name, a.line1, a.line2, `${a.postal_code ?? ""} ${a.city ?? ""}`.trim(), a.country]
    .filter(Boolean)
    .join("\n");
}

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
      const infos = {
        combo_id: cid,
        archetype1: m.archetype1 ?? "",
        archetype2: m.archetype2 ?? "",
        prenom1: m.prenom1 ?? "",
        prenom2: m.prenom2 ?? "",
        email: session.customer_details?.email ?? null,
        statut,
        paiement: "stripe",
        ref: session.id,
        montant_centimes: session.amount_total ?? PRIX_CENTIMES + LIVRAISON_CENTIMES,
      };
      await enregistrerCommande(infos);
      // Emails (client + interne) : ne doivent jamais faire échouer le webhook.
      const complement = {
        nomClient: session.customer_details?.name ?? null,
        adresse: adresseLivraison(session),
      };
      try {
        await emailConfirmationClient({ ...infos, ...complement });
        await emailNotifInterne({ ...infos, ...complement });
      } catch (e) {
        console.error("Emails de commande :", e);
      }
    }
  }

  return NextResponse.json({ recu: true });
}
