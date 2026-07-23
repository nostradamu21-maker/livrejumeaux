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
    monozygote: monozygote ? "1" : "0",
    accessoire,
    relation,
    consentement: "1",
    langue,
    photo: chemins[0] ?? "",
    photo2: chemins[1] ?? "",
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
                ? `${p1} & ${p2}, d'après vos photos (option réutilisation −15 €)`
                : `${p1} & ${p2}, d'après vos photos`,
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
    ref: chemins.join(","),
    langue,
    montant_centimes: prix + LIVRAISON_CENTIMES,
  });
  return NextResponse.json({
    ok: true,
    mock: true,
    message: "Commande sur mesure enregistrée, photos bien reçues.",
  });
}
