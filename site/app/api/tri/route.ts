import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Tri web mobile (admin) : GET = unités + liens signés des variantes,
// POST = enregistre les choix {unite: 'v1'|'v2'|'regen'}.
// Protégé par ADMIN_TRI_SECRET (même valeur dans le .env du pipeline, qui la
// met dans l'URL envoyée à Simon). Jamais indexé, jamais lié publiquement.

const BUCKET = "tri";
const SIGNE_SECONDES = 3600; // liens image valables 1 h (la page les recharge)

function autorise(req: Request): boolean {
  const cle = new URL(req.url).searchParams.get("cle") ?? "";
  const secret = process.env.ADMIN_TRI_SECRET?.trim() ?? "";
  return !!secret && cle === secret;
}

export async function GET(req: Request) {
  if (!autorise(req)) {
    return NextResponse.json({ ok: false, erreur: "non autorisé" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, erreur: "Supabase non configuré" }, { status: 500 });
  }
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const { data, error } = await supabaseAdmin
    .from("tris")
    .select("*")
    .eq("livre_id", id)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ ok: false, erreur: "tri introuvable" }, { status: 404 });
  }
  const unites = (data.unites ?? []) as { unite: string; variantes: string[] }[];
  const signees = await Promise.all(
    unites.map(async (u) => ({
      unite: u.unite,
      variantes: await Promise.all(
        u.variantes.map(async (chemin) => {
          const { data: s } = await supabaseAdmin!.storage
            .from(BUCKET)
            .createSignedUrl(chemin, SIGNE_SECONDES);
          return { chemin, url: s?.signedUrl ?? "" };
        }),
      ),
    })),
  );
  return NextResponse.json({
    ok: true,
    livre_id: data.livre_id,
    unites: signees,
    choix: data.choix ?? {},
    notes: data.notes ?? {},
    termine: data.termine ?? false,
  });
}

export async function POST(req: Request) {
  if (!autorise(req)) {
    return NextResponse.json({ ok: false, erreur: "non autorisé" }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ ok: false, erreur: "Supabase non configuré" }, { status: 500 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    choix?: Record<string, string>;
    notes?: Record<string, string>;
  };
  const id = body.id ?? "";
  const brut = body.choix ?? {};
  // Valeurs admises uniquement (v1..v9 ou regen) : rien d'arbitraire en base.
  const choix: Record<string, string> = {};
  for (const [unite, v] of Object.entries(brut)) {
    if (/^(v[1-9]|regen)$/.test(v) && /^[A-Za-z0-9_-]{1,32}$/.test(unite)) {
      choix[unite] = v;
    }
  }
  // Consignes de correction (texte libre borné) pour les unités « à refaire ».
  const notes: Record<string, string> = {};
  for (const [unite, n] of Object.entries(body.notes ?? {})) {
    const txt = String(n ?? "").trim().slice(0, 300);
    if (txt && /^[A-Za-z0-9_-]{1,32}$/.test(unite)) notes[unite] = txt;
  }
  const { data: ligne } = await supabaseAdmin
    .from("tris")
    .select("unites")
    .eq("livre_id", id)
    .maybeSingle();
  if (!ligne) {
    return NextResponse.json({ ok: false, erreur: "tri introuvable" }, { status: 404 });
  }
  const attendues = ((ligne.unites ?? []) as { unite: string }[]).map((u) => u.unite);
  const termine = attendues.every((u) => choix[u]);
  const { error } = await supabaseAdmin
    .from("tris")
    .update({ choix, notes, termine })
    .eq("livre_id", id);
  if (error) {
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, termine });
}
