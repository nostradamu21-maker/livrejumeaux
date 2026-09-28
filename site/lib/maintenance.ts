// MODE MAINTENANCE — boutique fermée aux nouvelles commandes (septembre 2026).
//
// ACTIF PAR DÉFAUT. Pour rouvrir la boutique : variable d'environnement
// MAINTENANCE=0 sur Vercel (puis redéployer), ou supprimer ce mécanisme.
//
// Ce qui reste accessible pendant la maintenance (commandes déjà payées) :
//  - /commande/* (page de succès, choix des variantes du sur-mesure) ;
//  - /contact, /mentions-legales, /cgv, /confidentialite ;
//  - toutes les API sauf les trois qui ouvrent un paiement (webhook Stripe,
//    génération des variantes, tri admin, contact, keepalive Supabase…).
// Tout le reste reçoit une page « boutique en pause » en 503 + Retry-After,
// le code que les moteurs de recherche comprennent comme temporaire.

export const MAINTENANCE = (process.env.MAINTENANCE ?? "").trim() !== "0";

const OUVERTES = /^\/(?:(?:en|es|de)(?:\/|$))?(?:commande|contact|mentions-legales|cgv|confidentialite)(?:\/|$)/;

/** Vrai si la page reste servie normalement pendant la maintenance. */
export function pageOuverte(pathname: string): boolean {
  return OUVERTES.test(pathname);
}

type Langue = "fr" | "en" | "es" | "de";

const TEXTES: Record<Langue, { titre: string; texte: string; deja: string; contact: string }> = {
  fr: {
    titre: "La boutique fait une pause",
    texte: "Nous ne prenons plus de nouvelles commandes pour le moment.",
    deja: "Vous avez déjà commandé ? Votre commande est bien enregistrée. Pour toute question, écrivez-nous :",
    contact: "Nous contacter",
  },
  en: {
    titre: "The shop is taking a break",
    texte: "We are not taking new orders at the moment.",
    deja: "Already ordered? Your order is safely recorded. For any question, write to us:",
    contact: "Contact us",
  },
  es: {
    titre: "La tienda hace una pausa",
    texte: "Por el momento no aceptamos nuevos pedidos.",
    deja: "¿Ya hiciste un pedido? Está bien registrado. Para cualquier pregunta, escríbenos:",
    contact: "Contáctanos",
  },
  de: {
    titre: "Der Shop macht eine Pause",
    texte: "Derzeit nehmen wir keine neuen Bestellungen an.",
    deja: "Sie haben bereits bestellt? Ihre Bestellung ist gut erfasst. Bei Fragen schreiben Sie uns:",
    contact: "Kontakt",
  },
};

export function langueDuChemin(pathname: string): Langue {
  const m = pathname.match(/^\/(en|es|de)(?:\/|$)/);
  return (m?.[1] as Langue) ?? "fr";
}

/** Page autonome (aucune dépendance au reste du site), servie par le middleware. */
export function pageMaintenance(l: Langue): string {
  const t = TEXTES[l];
  const contact = l === "fr" ? "/contact" : `/${l}/contact`;
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deux comme nous · ${t.titre}</title>
<link rel="icon" href="/icon.svg">
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; box-sizing: border-box;
    background: #fbf5ec; color: #4a3a30; font-family: Georgia, "Times New Roman", serif; }
  .carte { background: #fff; border-radius: 22px; padding: 2.6rem 2.2rem; max-width: 480px; text-align: center;
    box-shadow: 0 24px 60px rgba(74, 58, 48, .14); }
  .marque { color: #b96c44; font-size: 1.1rem; letter-spacing: .02em; margin: 0 0 1.4rem; }
  h1 { font-size: 1.7rem; line-height: 1.2; margin: 0 0 1rem; font-weight: 600; }
  p { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.6; color: #6f5d51; margin: 0 0 1rem; }
  a { color: #b96c44; font-weight: 700; }
  .btn { display: inline-block; margin-top: .6rem; background: #d98f63; color: #fff; text-decoration: none;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif; border-radius: 999px; padding: .8rem 1.5rem; }
</style>
</head>
<body>
  <main class="carte">
    <p class="marque">Deux comme nous</p>
    <h1>${t.titre}</h1>
    <p>${t.texte}</p>
    <p>${t.deja} <a href="mailto:contact@jumelio.com">contact@jumelio.com</a></p>
    <a class="btn" href="${contact}">${t.contact}</a>
  </main>
</body>
</html>`;
}
