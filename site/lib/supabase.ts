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
