import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

export const supabaseActif = !!url && !!serviceRole;

// Client serveur avec la clé service_role (ne JAMAIS l'exposer au navigateur).
// Null tant que Supabase n'est pas configuré → l'app reste testable sans base.
export const supabaseAdmin: SupabaseClient | null = supabaseActif
  ? createClient(url, serviceRole, { auth: { persistSession: false } })
  : null;

export interface CommandeRow {
  combo_id: string;
  archetype1: string;
  archetype2: string;
  prenom1: string;
  prenom2: string;
  email: string | null;
  statut: string;          // "a_produire" | "cache"
  paiement: string;        // "stripe" | "simulé"
  ref: string | null;      // id de session Stripe
  montant_centimes: number;
}

/** Insère une commande. Renvoie true si écrite, false si Supabase absent. */
export async function enregistrerCommande(row: CommandeRow): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { error } = await supabaseAdmin.from("commandes").insert(row);
  if (error) {
    console.error("Supabase insert commande:", error.message);
    return false;
  }
  return true;
}

/** Vrai si un livre-combo est déjà produit (mis en cache). */
export async function comboEnCache(comboId: string): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin
    .from("combos")
    .select("combo_id")
    .eq("combo_id", comboId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

// ---------------- Photos du sur-mesure (Storage, bucket privé) ----------------

const BUCKET_PHOTOS = "sur-mesure";

/** Stocke la photo du sur-mesure. Renvoie son chemin, ou null si indisponible. */
export async function uploaderPhotoSurMesure(
  contenu: ArrayBuffer,
  contentType: string,
): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const ext = contentType === "image/png" ? "png" : "jpg";
  const chemin = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_PHOTOS)
    .upload(chemin, contenu, { contentType, upsert: false });
  if (error) {
    console.error("Supabase upload photo:", error.message);
    return null;
  }
  return chemin;
}

/** Lien de téléchargement temporaire (30 jours) vers une photo stockée. */
export async function lienPhotoSurMesure(chemin: string): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_PHOTOS)
    .createSignedUrl(chemin, 60 * 60 * 24 * 30);
  if (error) {
    console.error("Supabase lien photo:", error.message);
    return null;
  }
  return data.signedUrl;
}
