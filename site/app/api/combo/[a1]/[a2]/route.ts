import { NextResponse } from "next/server";
import { existe } from "@/lib/catalogue";
import { comboId } from "@/lib/combo";
import { comboEnCache } from "@/lib/supabase";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ a1: string; a2: string }> },
) {
  const { a1, a2 } = await ctx.params;
  if (!existe(a1) || !existe(a2)) {
    return NextResponse.json({ erreur: "Archétype inconnu." }, { status: 404 });
  }
  const cid = comboId(a1, a2);
  const cache = await comboEnCache(cid);
  return NextResponse.json({
    combo_id: cid,
    cache,
    identique: a1 === a2,
    apercus: cache ? [`/apercus/${cid}`] : [],
  });
}
