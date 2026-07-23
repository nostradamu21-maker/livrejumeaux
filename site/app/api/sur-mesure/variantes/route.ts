import { NextResponse } from "next/server";
import { stripe, stripeActif } from "@/lib/stripe";
import {
  lireSurMesure,
  creerSurMesure,
  majSurMesure,
  lienPhotoSurMesure,
  supabaseAdmin,
} from "@/lib/supabase";
import { genererVariantes, generationActive } from "@/lib/generation";
import { emailChoixVariantes } from "@/lib/email";
import { uploaderVariante } from "@/lib/supabase";

// La génération de 3 variantes peut prendre ~1-2 minutes.
export const maxDuration = 300;

async function sessionPayee(sessionId: string) {
  if (!stripeActif || !stripe) return null;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (s.payment_status !== "paid") return null;
    if (s.metadata?.combo_id !== "sur-mesure") return null;
    return s;
  } catch {
    return null;
  }
}

/** Ligne sur_mesure existante, sinon créée depuis les métadonnées Stripe
 *  (repli si le webhook n'est pas encore passé). */
async function ligne(sessionId: string) {
  const existante = await lireSurMesure(sessionId);
  if (existante) return existante;
  const s = await sessionPayee(sessionId);
  if (!s) return null;
  const m = s.metadata ?? {};
  const row = {
    ref: sessionId,
    monozygote: m.monozygote === "1",
    prenom1: m.prenom1 ?? "",
    prenom2: m.prenom2 ?? "",
    photos: [m.photo, m.photo2].filter(Boolean) as string[],
    variantes: null,
    choix: null,
  };
  await creerSurMesure(row);
  return row;
}

async function signer(chemins: string[]): Promise<string[]> {
  const urls = await Promise.all(chemins.map((c) => lienPhotoSurMesure(c)));
  return urls.map((u) => u ?? "");
}

/** État courant : prénoms, variantes déjà générées (URLs signées), choix. */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!(await sessionPayee(sessionId))) {
    return NextResponse.json({ ok: false, erreur: "Paiement introuvable." }, { status: 403 });
  }
  const row = await ligne(sessionId);
  if (!row) {
    return NextResponse.json({ ok: false, erreur: "Commande introuvable." }, { status: 404 });
  }
  const variantes: Record<string, string[]> = {};
  for (const [enfant, chemins] of Object.entries(row.variantes ?? {})) {
    variantes[enfant] = await signer(chemins);
  }
  return NextResponse.json({
    ok: true,
    actif: generationActive && !!supabaseAdmin,
    monozygote: row.monozygote,
    prenoms: [row.prenom1, row.prenom2],
    nEnfants: row.monozygote ? 1 : 2,
    variantes,
    choix: row.choix ?? {},
  });
}

interface Corps {
  session_id?: string;
  action?: "generer" | "choix";
  enfant?: number; // 1 ou 2
  choix?: Record<string, number>; // index de la variante retenue par enfant
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Corps;
  const sessionId = body.session_id ?? "";
  if (!(await sessionPayee(sessionId))) {
    return NextResponse.json({ ok: false, erreur: "Paiement introuvable." }, { status: 403 });
  }
  const row = await ligne(sessionId);
  if (!row) {
    return NextResponse.json({ ok: false, erreur: "Commande introuvable." }, { status: 404 });
  }

  if (body.action === "generer") {
    const enfant = body.enfant === 2 ? 2 : 1;
    if (enfant === 2 && row.monozygote) {
      return NextResponse.json({ ok: false, erreur: "Un seul enfant à générer." }, { status: 400 });
    }
    const deja = row.variantes?.[String(enfant)];
    if (deja?.length) {
      return NextResponse.json({ ok: true, urls: await signer(deja) });
    }
    if (!generationActive || !supabaseAdmin) {
      return NextResponse.json({ ok: false, repli: true });
    }
    const cheminPhoto = row.photos[enfant - 1] ?? row.photos[0];
    if (!cheminPhoto) {
      return NextResponse.json({ ok: false, erreur: "Photo introuvable." }, { status: 404 });
    }
    const url = await lienPhotoSurMesure(cheminPhoto);
    if (!url) {
      return NextResponse.json({ ok: false, erreur: "Photo inaccessible." }, { status: 500 });
    }
    const photo = await (await fetch(url)).arrayBuffer();
    // Ancre de style : une fiche du catalogue, servie par le site lui-même.
    const origin = new URL(req.url).origin;
    const ancre = await (await fetch(`${origin}/fiches/g1-chatain-clair.png`)).arrayBuffer();
    const images = await genererVariantes(photo, [ancre]);
    const chemins: string[] = [];
    for (const img of images) {
      const c = await uploaderVariante(img);
      if (c) chemins.push(c);
    }
    const variantes = { ...(row.variantes ?? {}), [String(enfant)]: chemins };
    await majSurMesure(sessionId, { variantes });
    return NextResponse.json({ ok: true, urls: await signer(chemins) });
  }

  if (body.action === "choix") {
    const variantes = row.variantes ?? {};
    const choix: Record<string, string> = {};
    for (const [enfant, idx] of Object.entries(body.choix ?? {})) {
      const chemin = variantes[enfant]?.[idx];
      if (chemin) choix[enfant] = chemin;
    }
    if (!Object.keys(choix).length) {
      return NextResponse.json({ ok: false, erreur: "Aucun choix reçu." }, { status: 400 });
    }
    await majSurMesure(sessionId, { choix });
    const liens = await Promise.all(Object.values(choix).map((c) => lienPhotoSurMesure(c)));
    await emailChoixVariantes({
      ref: sessionId,
      prenom1: row.prenom1,
      prenom2: row.prenom2,
      monozygote: row.monozygote,
      liens: liens.filter(Boolean) as string[],
    }).catch((e) => console.error("Email choix variantes:", e));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
