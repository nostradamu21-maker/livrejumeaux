import { NextResponse } from "next/server";
import { existe, archetypeParId } from "@/lib/catalogue";
import { comboId } from "@/lib/combo";
import {
  stripe,
  stripeActif,
  LIVRAISON_CENTIMES,
  DEVISE,
  PAYS_LIVRAISON,
  remisePromo,
  estCodeTest,
  CODE_PROMO,
  CODE_TEST,
  AFFICHE_TAILLES,
  PRIX_AFFICHE_CENTIMES,
  PRODUIT_AFFICHE_ID,
  type AfficheTaille,
} from "@/lib/stripe";
import { enregistrerCommande, lireSurMesure } from "@/lib/supabase";

interface Corps {
  archetype1?: string;
  archetype2?: string;
  prenom1?: string;
  prenom2?: string;
  taille?: string;
  email?: string;
  langue?: string;
  code?: string;
  // Affiche SUR MESURE : ref (session Stripe) d'une commande sur-mesure dont
  // les personnages validés servent d'illustration.
  sm?: string;
}

const LANGUES = new Set(["fr", "en", "es", "de"]);

// Produit AFFICHE : poster des deux jumeaux (illustration dédiée,
// générée/triée à la première commande de la paire puis mise en cache).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Corps;
  const a1 = body.archetype1 ?? "";
  const a2 = body.archetype2 ?? "";
  const p1 = (body.prenom1 ?? "").trim();
  const p2 = (body.prenom2 ?? "").trim();
  const email = (body.email ?? "").trim();
  const taille = (AFFICHE_TAILLES as readonly string[]).includes(body.taille ?? "")
    ? (body.taille as AfficheTaille)
    : "30x40";
  const langue = LANGUES.has(body.langue ?? "") ? body.langue! : "fr";

  // Mode SUR MESURE : la ref d'une commande sur-mesure remplace les archétypes.
  const smRef = String(body.sm ?? "").trim();
  let smValide = false;
  let prenom1 = p1;
  let prenom2 = p2;
  if (smRef) {
    if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(smRef)) {
      return NextResponse.json({ ok: false, erreur: "Référence invalide." }, { status: 400 });
    }
    const row = await lireSurMesure(smRef);
    if (!row) {
      return NextResponse.json(
        { ok: false, erreur: "Commande sur mesure introuvable." },
        { status: 404 },
      );
    }
    smValide = true;
    prenom1 = p1 || row.prenom1;
    prenom2 = p2 || row.prenom2;
  } else {
    if (!existe(a1) || !existe(a2)) {
      return NextResponse.json({ ok: false, erreur: "Personnage inconnu." }, { status: 400 });
    }
  }
  if (!prenom1 || !prenom2) {
    return NextResponse.json(
      { ok: false, erreur: "Les deux prénoms sont requis." },
      { status: 400 },
    );
  }

  const cid = smValide ? "sur-mesure" : comboId(a1, a2, null);
  const origin = new URL(req.url).origin;
  const prixPlein = PRIX_AFFICHE_CENTIMES[taille];
  const test = estCodeTest(body.code);
  const remise = Math.min(remisePromo(body.code), prixPlein - 50);
  const livraison = test ? 0 : LIVRAISON_CENTIMES;
  const prix = prixPlein - remise;

  const metadata = {
    produit: "affiche",
    taille,
    combo_id: cid,
    archetype1: smValide ? "sur-mesure" : a1,
    archetype2: smValide ? smRef : a2,
    prenom1,
    prenom2,
    sm_ref: smValide ? smRef : "",
    langue,
  };

  if (stripeActif && stripe) {
    try {
      let unitAmount = prixPlein;
      const discounts: { coupon: string }[] = [];
      if (remise > 0) {
        try {
          const coupon = await stripe.coupons.create({
            amount_off: remise,
            currency: DEVISE,
            duration: "once",
            name: (test ? `Code ${CODE_TEST}` : `Code ${CODE_PROMO}`).slice(0, 40),
          });
          discounts.push({ coupon: coupon.id });
        } catch (e) {
          console.error("Coupon (cadre):", e);
          unitAmount = prixPlein - remise;
        }
      }
      const priceData = PRODUIT_AFFICHE_ID
        ? { currency: DEVISE, unit_amount: unitAmount, product: PRODUIT_AFFICHE_ID }
        : {
            currency: DEVISE,
            unit_amount: unitAmount,
            product_data: {
              name: `Deux comme nous, l'affiche (${taille.replace("x", "×")} cm)`,
              description: smValide
                ? `${prenom1} & ${prenom2}, d'après vos personnages sur mesure`
                : `${prenom1} (${archetypeParId(a1)?.label ?? ""}) & ${prenom2} (${archetypeParId(a2)?.label ?? ""})`,
            },
          };
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        discounts,
        line_items: [{ quantity: 1, price_data: priceData }],
        customer_email: email || undefined,
        shipping_address_collection: { allowed_countries: [...PAYS_LIVRAISON] },
        phone_number_collection: { enabled: true },
        shipping_options: [
          {
            shipping_rate_data: {
              display_name: "Livraison suivie",
              type: "fixed_amount",
              fixed_amount: { amount: livraison, currency: DEVISE },
            },
          },
        ],
        success_url: `${origin}/commande/succes?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/#affiche`,
        metadata,
      });
      return NextResponse.json({ ok: true, url: session.url });
    } catch (e) {
      console.error("Stripe checkout (affiche):", e);
      const msg = e instanceof Error ? e.message : "Erreur Stripe";
      return NextResponse.json({ ok: false, erreur: msg }, { status: 502 });
    }
  }

  // --- Repli : paiement simulé (aucune clé Stripe) ---
  await enregistrerCommande({
    combo_id: cid,
    archetype1: smValide ? "sur-mesure" : a1,
    archetype2: smValide ? smRef : a2,
    prenom1,
    prenom2,
    email: email || null,
    statut: "a_produire",
    paiement: "simulé",
    ref: null,
    langue,
    montant_centimes: prix + livraison,
    produit: "affiche",
    taille,
  });
  return NextResponse.json({
    ok: true,
    mock: true,
    message: "Commande d’affiche enregistrée.",
  });
}
