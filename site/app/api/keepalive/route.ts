import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseActif } from "@/lib/supabase";

// Garde-éveil Supabase : le plan gratuit met le projet en PAUSE après 7 jours
// sans requête, et le site tomberait en panne silencieusement entre deux
// commandes. Un cron Vercel (vercel.json) appelle cette route chaque jour ;
// la petite requête compte comme de l'activité et la base ne s'endort jamais.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Vercel signe ses appels cron avec CRON_SECRET (si défini) : on rejette le
  // reste pour que la route ne serve pas de sonde publique sur l'état de la base.
  const secret = process.env.CRON_SECRET?.trim();
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!supabaseActif || !supabaseAdmin) {
    return NextResponse.json({ ok: true, supabase: "non configuré" });
  }
  const { error } = await supabaseAdmin
    .from("commandes")
    .select("id", { count: "exact", head: true })
    .limit(1);
  if (error) {
    // 500 → visible dans les logs cron de Vercel si la base a un souci.
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
