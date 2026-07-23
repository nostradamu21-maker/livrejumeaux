// Envoi d'emails transactionnels via l'API Resend (https://resend.com).
// No-op silencieux tant que RESEND_API_KEY n'est pas configurée : le site
// fonctionne sans, seuls les emails sont sautés (journalisés en console).
//
// Variables d'environnement :
//   RESEND_API_KEY  clé API Resend (re_...)
//   EMAIL_FROM      expéditeur, ex. "Deux comme nous <commandes@gemellite.com>"
//                   (domaine à vérifier dans Resend)
//   EMAIL_NOTIF     adresse interne prévenue à chaque commande (Simon)

const key = process.env.RESEND_API_KEY?.trim() ?? "";
export const emailActif = key.startsWith("re_");

const FROM =
  process.env.EMAIL_FROM?.trim() ||
  "Deux comme nous <commandes@gemellite.com>";
const NOTIF = process.env.EMAIL_NOTIF?.trim() ?? "";

export interface InfosCommande {
  prenom1: string;
  prenom2: string;
  archetype1: string;
  archetype2: string;
  combo_id: string;
  email: string | null;
  nomClient: string | null;
  montant_centimes: number;
  ref: string | null;
  adresse: string | null; // adresse de livraison, texte multi-lignes
  statut: string; // "cache" | "a_produire"
  photoUrl?: string | null; // sur-mesure : lien temporaire vers la photo 1
  photoUrl2?: string | null; // sur-mesure dizygote : photo du 2e enfant
  monozygote?: boolean; // sur-mesure : jumeaux identiques (1 photo)
}

async function envoyer(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailActif) {
    console.log(`[email désactivé] à=${to} sujet=${subject}`);
    return false;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!r.ok) {
    console.error("Resend:", r.status, await r.text().catch(() => ""));
    return false;
  }
  return true;
}

const euros = (c: number) =>
  (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function gabarit(contenu: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#fbf5ec;font-family:Georgia,serif;color:#4a3a30;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="font-size:26px;margin:0 0 24px;color:#b96c44;font-weight:bold;">Deux comme nous</p>
    <div style="background:#ffffff;border-radius:16px;padding:28px 26px;box-shadow:0 2px 10px rgba(74,58,48,0.08);font-family:Verdana,Arial,sans-serif;font-size:15px;line-height:1.6;">
      ${contenu}
    </div>
    <p style="font-size:12px;color:#6f5d51;margin:22px 0 0;text-align:center;font-family:Verdana,Arial,sans-serif;">
      Deux comme nous · le livre personnalisé des jumeaux et jumelles<br>
      Par les créateurs de Jumelio &amp; Gemellite.com
    </p>
  </div></body></html>`;
}

/** Email de confirmation envoyé au client après paiement. */
export async function emailConfirmationClient(c: InfosCommande): Promise<boolean> {
  if (!c.email) return false;
  const surMesure = c.combo_id === "sur-mesure";
  const lienVariantes = c.ref
    ? `https://boutique.gemellite.com/commande/variantes?session_id=${c.ref}`
    : "";
  const delai = surMesure
    ? `<strong>Vos photos sont bien reçues.</strong> Prochaine étape : <a href="${lienVariantes}">choisissez les personnages de vos enfants</a> parmi les propositions dessinées d'après vos photos. Nous créons ensuite le livre, vous validez, puis il part à l'impression. Vos photos sont supprimées dès la génération du livre.`
    : c.statut === "cache"
      ? "Votre livre part très vite à l'impression."
      : "Cette combinaison de personnages est créée pour la première fois : nos illustrations sont vérifiées une à une à la main (1 à 2 jours), puis votre livre part à l'impression.";
  const contenu = `
    <p style="margin:0 0 14px;">Bonjour${c.nomClient ? ` ${c.nomClient}` : ""},</p>
    <p style="margin:0 0 14px;"><strong>Merci pour votre commande !</strong>
    Le livre de <strong>${c.prenom1}</strong> &amp; <strong>${c.prenom2}</strong> est en préparation.</p>
    <p style="margin:0 0 14px;">${delai} Il est ensuite expédié directement chez vous en livraison suivie. Comptez environ une semaine en tout.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:18px 0;">
      <tr><td style="padding:6px 0;color:#6f5d51;">Livre</td><td style="text-align:right;">« Deux comme nous », ${c.combo_id === "sur-mesure" ? "édition sur mesure" : "personnalisé"}</td></tr>
      <tr><td style="padding:6px 0;color:#6f5d51;">Héros</td><td style="text-align:right;">${c.prenom1} &amp; ${c.prenom2}</td></tr>
      <tr><td style="padding:6px 0;color:#6f5d51;border-top:1px solid #ecdfce;">Total payé</td><td style="text-align:right;border-top:1px solid #ecdfce;"><strong>${euros(c.montant_centimes)}</strong></td></tr>
    </table>
    <p style="margin:0;">Une question ? Répondez simplement à cet email, nous lisons tout.</p>
    <p style="margin:14px 0 0;">Avec toute notre tendresse,<br>l'équipe Deux comme nous 💛</p>`;
  return envoyer(
    c.email,
    `Votre livre pour ${c.prenom1} & ${c.prenom2} est en préparation 💛`,
    gabarit(contenu),
  );
}

/** Notification interne (Simon) avec tout le nécessaire pour produire. */
export async function emailNotifInterne(c: InfosCommande): Promise<boolean> {
  if (!NOTIF) return false;
  const contenu = `
    <p style="margin:0 0 14px;"><strong>Nouvelle commande payée 🎉</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 0;color:#6f5d51;">Combo</td><td style="text-align:right;"><code>${c.combo_id}</code></td></tr>
      <tr><td style="padding:4px 0;color:#6f5d51;">Statut</td><td style="text-align:right;"><strong>${c.statut === "cache" ? "EN CACHE (générer le PDF prénoms)" : "À PRODUIRE (générer + trier)"}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#6f5d51;">Archétypes</td><td style="text-align:right;">${c.archetype1} + ${c.archetype2}</td></tr>
      <tr><td style="padding:4px 0;color:#6f5d51;">Prénoms</td><td style="text-align:right;">${c.prenom1} &amp; ${c.prenom2}</td></tr>
      <tr><td style="padding:4px 0;color:#6f5d51;">Client</td><td style="text-align:right;">${c.nomClient ?? "?"} · ${c.email ?? "email inconnu"}</td></tr>
      <tr><td style="padding:4px 0;color:#6f5d51;">Montant</td><td style="text-align:right;">${euros(c.montant_centimes)}</td></tr>
      <tr><td style="padding:4px 0;color:#6f5d51;">Réf. Stripe</td><td style="text-align:right;"><code>${c.ref ?? ""}</code></td></tr>
    </table>
    <p style="margin:14px 0 6px;color:#6f5d51;">Adresse de livraison :</p>
    <pre style="margin:0;background:#fbf5ec;border-radius:10px;padding:12px;font-size:13px;white-space:pre-wrap;">${c.adresse ?? "non transmise"}</pre>
    ${c.combo_id === "sur-mesure"
      ? `<p style="margin:16px 0 0;"><strong>Édition SUR MESURE</strong> (${c.monozygote ? "monozygotes, 1 photo" : "dizygotes, 2 photos"}) :
         ${c.photoUrl ? `<a href="${c.photoUrl}">photo ${c.monozygote ? "des enfants" : `de ${c.prenom1}`}</a>` : "photo indisponible"}
         ${c.photoUrl2 ? ` · <a href="${c.photoUrl2}">photo de ${c.prenom2}</a>` : ""}
         (liens valables 30 jours). Le client choisit ses variantes de personnages en ligne — un e-mail suivra avec son choix. Supprimer les photos du bucket après génération.</p>`
      : `<p style="margin:16px 0 0;">Commande à lancer : <code>python livre.py ${c.combo_id} --prenoms "${c.prenom1},${c.prenom2}"</code></p>`}`;
  return envoyer(NOTIF, `🧸 Commande : ${c.prenom1} & ${c.prenom2} (${c.combo_id})`, gabarit(contenu));
}

/** Notification interne : le client a choisi ses variantes de personnages. */
export async function emailChoixVariantes(c: {
  ref: string;
  prenom1: string;
  prenom2: string;
  monozygote: boolean;
  liens: string[];
}): Promise<boolean> {
  if (!NOTIF) return false;
  const lignes = c.liens
    .map((u, i) => {
      const nom = c.monozygote ? "les deux enfants" : i === 0 ? c.prenom1 : c.prenom2;
      return `<li><a href="${u}">Personnage retenu pour ${nom}</a></li>`;
    })
    .join("");
  const contenu = `
    <p style="margin:0 0 14px;"><strong>Variantes choisies ✅</strong> — ${c.prenom1} &amp; ${c.prenom2}</p>
    <p style="margin:0 0 10px;">Le client a validé ses personnages de référence (liens 30 jours) :</p>
    <ul style="margin:0 0 14px;padding-left:1.2em;">${lignes}</ul>
    <p style="margin:0;">Réf. Stripe : <code>${c.ref}</code>. Produire le livre à partir de ces références, puis supprimer photos et variantes du bucket.</p>`;
  return envoyer(
    NOTIF,
    `🎨 Variantes choisies : ${c.prenom1} & ${c.prenom2}`,
    gabarit(contenu),
  );
}
