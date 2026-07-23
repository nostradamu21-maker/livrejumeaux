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
import { enregistrerCommande, uploaderPhotoSurMesure, supabaseActif } from "@/lib/supabase";

const TAILLE_MAX = 4 * 1024 * 1024; // la photo est réduite côté navigateur
const TYPES_OK = new Set(["image/jpeg", "image/png"]);

// Édition sur mesure : le client téléverse sa photo puis paie. La photo est
// stockée dans un bucket privé et supprimée après génération du livre (RGPD).
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, erreur: "Requête invalide." }, { status: 400 });
  }
  const p1 = String(form.get("prenom1") ?? "").trim();
  const p2 = String(form.get("prenom2") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const reutilisation = form.get("reutilisation") === "1";
  const photo = form.get("photo");

  if (!p1 || !p2) {
    return NextResponse.json(
      { ok: false, erreur: "Les deux prénoms sont requis." },
      { status: 400 },
    );
  }
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json(
      { ok: false, erreur: "Ajoutez une photo de vos enfants." },
      { status: 400 },
    );
  }
  if (!TYPES_OK.has(photo.type)) {
    return NextResponse.json(
      { ok: false, erreur: "Format d'image non pris en charge (JPEG ou PNG)." },
      { status: 400 },
    );
  }
  if (photo.size > TAILLE_MAX) {
    return NextResponse.json(
      { ok: false, erreur: "Photo trop lourde. Réessayez avec une autre image." },
      { status: 400 },
    );
  }

  // Stockage de la photo AVANT le paiement (bucket privé « sur-mesure »).
  let cheminPhoto: string | null = null;
  if (supabaseActif) {
    cheminPhoto = await uploaderPhotoSurMesure(await photo.arrayBuffer(), photo.type);
    if (!cheminPhoto) {
      return NextResponse.json(
        { ok: false, erreur: "Impossible d'enregistrer la photo. Réessayez." },
        { status: 500 },
      );
    }
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
    photo: cheminPhoto ?? "",
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
    ref: cheminPhoto,
    montant_centimes: prix + LIVRAISON_CENTIMES,
  });
  return NextResponse.json({
    ok: true,
    mock: true,
    message: "Commande sur mesure enregistrée, photo bien reçue.",
  });
}
