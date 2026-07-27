import { NextResponse } from "next/server";
import { emailContact } from "@/lib/email";

const LANGUES = new Set(["fr", "en", "es", "de"]);

function emailValide(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Formulaire de contact du site : envoie le message à contact@jumelio.com
// (via Resend), avec le visiteur en reply-to. No-op silencieux -> erreur 502
// si Resend n'est pas configuré (le message inviterait alors à écrire en direct).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const nom = String(body.nom ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const message = String(body.message ?? "").trim().slice(0, 5000);
  const langue = LANGUES.has(String(body.langue)) ? String(body.langue) : undefined;

  if (!emailValide(email) || message.length < 2) {
    return NextResponse.json({ ok: false, erreur: "champs" }, { status: 400 });
  }

  const envoye = await emailContact({
    nom: nom || "(sans nom)",
    email,
    message,
    langue,
  }).catch(() => false);

  if (!envoye) {
    return NextResponse.json({ ok: false, erreur: "envoi" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
