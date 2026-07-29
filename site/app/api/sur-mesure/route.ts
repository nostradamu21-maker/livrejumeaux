import { NextResponse } from "next/server";
import {
  stripe,
  stripeActif,
  PRIX_SUR_MESURE_CENTIMES,
  REDUC_REUTILISATION_CENTIMES,
  LIVRAISON_CENTIMES,
  DEVISE,
  PAYS_LIVRAISON,
  remisePromo,
  estCodeTest,
  CODE_PROMO,
  CODE_TEST,
  PRODUIT_SUR_MESURE_ID,
  PRODUIT_AFFICHE_ID,
  AFFICHE_TAILLES,
  PRIX_AFFICHE_CENTIMES,
  AFFICHE_SM_SUPPLEMENT,
  type AfficheTaille,
} from "@/lib/stripe";
import { enregistrerCommande, uploaderPhotoSurMesure, supabaseActif } from "@/lib/supabase";
import { accessoireExiste, ACCESSOIRE_DEFAUT } from "@/lib/accessoires";

const TAILLE_MAX = 4 * 1024 * 1024; // les photos sont réduites côté navigateur
const TYPES_OK = new Set(["image/jpeg", "image/png"]);

function photoValide(p: unknown): p is File {
  return p instanceof File && p.size > 0 && p.size <= TAILLE_MAX && TYPES_OK.has(p.type);
}

// Édition sur mesure : monozygotes = 1 photo (les deux se ressemblent),
// dizygotes = 1 photo PAR enfant. Les photos sont stockées dans un bucket
// privé puis supprimées après génération du livre (RGPD). Après paiement, le
// client choisit ses variantes de personnages sur /commande/variantes.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, erreur: "Requête invalide." }, { status: 400 });
  }
  const p1 = String(form.get("prenom1") ?? "").trim();
  const p2 = String(form.get("prenom2") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const reutilisation = form.get("reutilisation") === "1";
  const monozygote = form.get("monozygote") === "1";
  // Monozygotes : signe distinctif porté par le second jumeau (obligatoire
  // pour les distinguer dans le livre et générer sa variante).
  const accBrut = String(form.get("accessoire") ?? "");
  const accessoire = monozygote
    ? accessoireExiste(accBrut)
      ? accBrut
      : ACCESSOIRE_DEFAUT
    : "";
  const photo1 = form.get("photo1");
  const photo2 = form.get("photo2");
  const RELATIONS = new Set(["parent", "grand-parent", "oncle-tante", "parrain-marraine", "proche"]);
  const relBrut = String(form.get("relation") ?? "");
  const relation = RELATIONS.has(relBrut) ? relBrut : "parent";
  const consentement = form.get("consentement") === "1";
  const codePromo = String(form.get("code") ?? "");
  // Produit : le LIVRE sur mesure (défaut) ou l'AFFICHE seule (poster d'après
  // photo, sans livre) — même tunnel photos/variantes dans les deux cas.
  const produit = form.get("produit") === "affiche" ? "affiche" : "livre";
  const taille = (AFFICHE_TAILLES as readonly string[]).includes(String(form.get("taille")))
    ? (String(form.get("taille")) as AfficheTaille)
    : "30x40";
  // Sexe de chaque enfant → accords du texte imprimé (2 filles = féminin,
  // 2 garçons = masculin, mixte = épicène). Monozygotes : même sexe pour les deux.
  const SEXES = new Set(["garcon", "fille"]);
  const sx1 = String(form.get("sexe1") ?? "");
  const sx2 = String(form.get("sexe2") ?? "");
  const sexe1 = SEXES.has(sx1) ? sx1 : "";
  const sexe2 = monozygote ? sexe1 : SEXES.has(sx2) ? sx2 : "";
  const LANGUES = new Set(["fr", "en", "es", "de"]);
  const langueBrut = String(form.get("langue") ?? "");
  const langue = LANGUES.has(langueBrut) ? langueBrut : "fr";

  // Droit à l'image de mineurs : certification obligatoire (majeur +
  // autorisation parentale pour la photo).
  if (!consentement) {
    return NextResponse.json(
      {
        ok: false,
        erreur:
          "Merci de certifier être majeur et autorisé à utiliser cette photo.",
      },
      { status: 400 },
    );
  }

  if (!p1 || !p2) {
    return NextResponse.json(
      { ok: false, erreur: "Les deux prénoms sont requis." },
      { status: 400 },
    );
  }
  if (!photoValide(photo1)) {
    return NextResponse.json(
      { ok: false, erreur: "Ajoutez une photo (JPEG ou PNG)." },
      { status: 400 },
    );
  }
  if (!monozygote && !photoValide(photo2)) {
    return NextResponse.json(
      { ok: false, erreur: `Ajoutez aussi la photo de ${p2} (jumeaux différents).` },
      { status: 400 },
    );
  }

  // Stockage des photos AVANT le paiement (bucket privé « sur-mesure »).
  const chemins: string[] = [];
  if (supabaseActif) {
    const fichiers = monozygote ? [photo1] : [photo1, photo2 as File];
    for (const f of fichiers) {
      const chemin = await uploaderPhotoSurMesure(await f.arrayBuffer(), f.type);
      if (!chemin) {
        return NextResponse.json(
          { ok: false, erreur: "Impossible d'enregistrer la photo. Réessayez." },
          { status: 500 },
        );
      }
      chemins.push(chemin);
    }
  }

  // Minimum Stripe (0,50 €) : garde-fou contre un prix de test très bas
  // combiné à la remise réutilisation (éviterait un montant négatif).
  // Réductions cumulables (réutilisation + code promo), montrées comme UNE
  // ligne « Remise » au checkout (Stripe n'accepte qu'un coupon par session).
  const test = estCodeTest(codePromo);
  const prixBase = produit === "affiche"
    ? PRIX_AFFICHE_CENTIMES[taille] + AFFICHE_SM_SUPPLEMENT
    : PRIX_SUR_MESURE_CENTIMES;
  const reducReuse = reutilisation ? REDUC_REUTILISATION_CENTIMES : 0;
  const reducPromo = remisePromo(codePromo);
  const remise = Math.min(reducReuse + reducPromo, prixBase - 50);
  const livraison = test ? 0 : LIVRAISON_CENTIMES;
  const partsRemise: string[] = [];
  if (reducReuse) partsRemise.push("réutilisation du personnage");
  if (reducPromo) partsRemise.push(`code ${test ? CODE_TEST : CODE_PROMO}`);
  const prix = prixBase - remise; // pour le repli sans Stripe
  const origin = new URL(req.url).origin;
  const metadata = {
    combo_id: "sur-mesure",
    produit,
    ...(produit === "affiche" ? { taille } : {}),
    archetype1: "sur-mesure",
    archetype2: reutilisation ? "reutilisation-ok" : "sans-reutilisation",
    prenom1: p1,
    prenom2: p2,
    monozygote: monozygote ? "1" : "0",
    accessoire,
    relation,
    consentement: "1",
    sexe1,
    sexe2,
    langue,
    photo: chemins[0] ?? "",
    photo2: chemins[1] ?? "",
  };

  if (stripeActif && stripe) {
   try {
    // Remise en ligne dédiée ; repli sur le prix si le coupon échoue. Nom du
    // coupon limité à 40 car. (contrainte Stripe).
    let unitAmount = prixBase;
    const discounts: { coupon: string }[] = [];
    if (remise > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: remise,
          currency: DEVISE,
          duration: "once",
          name: `Remise (${partsRemise.join(" + ")})`.slice(0, 40),
        });
        discounts.push({ coupon: coupon.id });
      } catch (e) {
        console.error("Coupon (sur-mesure):", e);
        unitAmount = prixBase - remise;
      }
    }
    // Rattachement Stripe par TYPE de produit : une affiche sur mesure compte
    // dans le produit « affiche », pas dans le « sur mesure » (reporting CA).
    const produitStripe = produit === "affiche"
      ? PRODUIT_AFFICHE_ID || PRODUIT_SUR_MESURE_ID
      : PRODUIT_SUR_MESURE_ID;
    const priceData = produitStripe
      ? { currency: DEVISE, unit_amount: unitAmount, product: produitStripe }
      : {
          currency: DEVISE,
          unit_amount: unitAmount,
          product_data: {
            name: produit === "affiche"
              ? `Deux comme nous, l'affiche sur mesure (${taille.replace("x", "×")} cm)`
              : "Deux comme nous, édition sur mesure",
            description: `${p1} & ${p2}, d'après vos photos`,
          },
        };
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      discounts,
      line_items: [{ quantity: 1, price_data: priceData }],
      customer_email: email || undefined,
      shipping_address_collection: { allowed_countries: [...PAYS_LIVRAISON] },
      // Téléphone requis (Gelato le veut pour la livraison) : collecté aussi
      // via Apple Pay / Link, remonte dans customer_details.phone au webhook.
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
      cancel_url: `${origin}/livre#sur-mesure`,
      metadata,
    });
    return NextResponse.json({ ok: true, url: session.url });
   } catch (e) {
     console.error("Stripe checkout (sur-mesure):", e);
     const msg = e instanceof Error ? e.message : "Erreur Stripe";
     return NextResponse.json({ ok: false, erreur: msg }, { status: 502 });
   }
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
    ref: chemins.join(","),
    langue,
    montant_centimes: prix + livraison,
    produit,
    taille: produit === "affiche" ? taille : null,
  });
  return NextResponse.json({
    ok: true,
    mock: true,
    message: "Commande sur mesure enregistrée, photos bien reçues.",
  });
}
