"""Emails de suivi de commande envoyés depuis le pipeline (via Resend).

Utilisé par expedier.py au lancement RÉEL de l'impression (--imprimer) :
le client reçoit « le livre / l'affiche de X & Y part à l'impression »,
dans la langue de sa commande (colonne `langue`).

.env : RESEND_API_KEY (re_...), EMAIL_FROM (défaut : commandes@gemellite.com).
Sans clé → no-op journalisé, le pipeline continue (comme site/lib/email.ts).
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent

# ------------------------------- .env -------------------------------------


def _env() -> dict[str, str]:
    valeurs: dict[str, str] = {}
    f = ROOT / ".env"
    if f.exists():
        for ligne in f.read_text(encoding="utf-8").splitlines():
            ligne = ligne.strip()
            if ligne and not ligne.startswith("#") and "=" in ligne:
                cle, _, val = ligne.partition("=")
                valeurs[cle.strip()] = val.strip().strip('"').strip("'")
    return valeurs


# ------------------------------ Textes -------------------------------------
# {p} = « Prenom1 & Prenom2 », {taille} = ex. « 30×40 cm » (affiche seulement).

TEXTES = {
    "fr": {
        "livre": {
            "sujet": "Le livre de {p} part à l'impression 🎉",
            "titre": "Leur histoire est en route !",
            "corps": (
                "Bonne nouvelle : les illustrations du livre de <strong>{p}</strong> "
                "ont toutes été vérifiées une à une, et le livre vient de partir à "
                "l'impression — couverture rigide 20 × 20 cm, 30 pages, avec leurs "
                "prénoms sur chaque page."),
            "delai": (
                "Comptez 2 à 3 jours ouvrés d'impression, puis la livraison suivie "
                "jusqu'à chez vous — environ une semaine au total."),
            "merci": "Merci de faire confiance à Deux comme nous 💛",
        },
        "affiche": {
            "sujet": "L'affiche de {p} part à l'impression 🎉",
            "titre": "Leur portrait est en route !",
            "corps": (
                "Bonne nouvelle : l'illustration de l'affiche de <strong>{p}</strong> "
                "a été vérifiée et vient de partir à l'impression — format {taille}, "
                "papier premium mat, livrée roulée dans un tube, prête à encadrer."),
            "delai": (
                "Comptez 2 à 3 jours ouvrés d'impression, puis la livraison suivie "
                "jusqu'à chez vous — environ une semaine au total."),
            "merci": "Merci de faire confiance à Deux comme nous 💛",
        },
    },
    "en": {
        "livre": {
            "sujet": "{p}'s book is off to print 🎉",
            "titre": "Their story is on its way!",
            "corps": (
                "Good news: every illustration in <strong>{p}</strong>'s book has "
                "been checked one by one, and the book has just been sent to print — "
                "20 × 20 cm hardcover, 30 pages, with their names on every page."),
            "delai": (
                "Allow 2–3 business days for printing, then tracked delivery to "
                "your door — about a week in total."),
            "merci": "Thank you for trusting Deux comme nous 💛",
        },
        "affiche": {
            "sujet": "{p}'s poster is off to print 🎉",
            "titre": "Their portrait is on its way!",
            "corps": (
                "Good news: the illustration of <strong>{p}</strong>'s poster has "
                "been checked and just went to print — {taille}, premium matte "
                "paper, delivered rolled in a tube, ready to frame."),
            "delai": (
                "Allow 2–3 business days for printing, then tracked delivery to "
                "your door — about a week in total."),
            "merci": "Thank you for trusting Deux comme nous 💛",
        },
    },
    "es": {
        "livre": {
            "sujet": "El libro de {p} ya está en imprenta 🎉",
            "titre": "¡Su historia está en camino!",
            "corps": (
                "Buenas noticias: todas las ilustraciones del libro de "
                "<strong>{p}</strong> han sido revisadas una a una, y el libro acaba "
                "de enviarse a imprimir — tapa dura 20 × 20 cm, 30 páginas, con sus "
                "nombres en cada página."),
            "delai": (
                "Cuenta con 2-3 días laborables de impresión y el envío con "
                "seguimiento hasta tu casa — aproximadamente una semana en total."),
            "merci": "Gracias por confiar en Deux comme nous 💛",
        },
        "affiche": {
            "sujet": "El póster de {p} ya está en imprenta 🎉",
            "titre": "¡Su retrato está en camino!",
            "corps": (
                "Buenas noticias: la ilustración del póster de <strong>{p}</strong> "
                "ha sido revisada y acaba de enviarse a imprimir — formato {taille}, "
                "papel premium mate, entregado enrollado en un tubo, listo para "
                "enmarcar."),
            "delai": (
                "Cuenta con 2-3 días laborables de impresión y el envío con "
                "seguimiento hasta tu casa — aproximadamente una semana en total."),
            "merci": "Gracias por confiar en Deux comme nous 💛",
        },
    },
    "de": {
        "livre": {
            "sujet": "Das Buch von {p} ist im Druck 🎉",
            "titre": "Ihre Geschichte ist unterwegs!",
            "corps": (
                "Gute Nachrichten: Alle Illustrationen im Buch von "
                "<strong>{p}</strong> wurden einzeln geprüft, und das Buch ist "
                "soeben in den Druck gegangen — Hardcover 20 × 20 cm, 30 Seiten, "
                "mit ihren Namen auf jeder Seite."),
            "delai": (
                "Rechnen Sie mit 2-3 Werktagen Druckzeit plus versichertem "
                "Versand zu Ihnen — insgesamt etwa eine Woche."),
            "merci": "Danke für Ihr Vertrauen in Deux comme nous 💛",
        },
        "affiche": {
            "sujet": "Das Poster von {p} ist im Druck 🎉",
            "titre": "Ihr Porträt ist unterwegs!",
            "corps": (
                "Gute Nachrichten: Die Illustration des Posters von "
                "<strong>{p}</strong> wurde geprüft und ist soeben in den Druck "
                "gegangen — Format {taille}, mattes Premiumpapier, gerollt in "
                "einer Tube geliefert, bereit zum Einrahmen."),
            "delai": (
                "Rechnen Sie mit 2-3 Werktagen Druckzeit plus versichertem "
                "Versand zu Ihnen — insgesamt etwa eine Woche."),
            "merci": "Danke für Ihr Vertrauen in Deux comme nous 💛",
        },
    },
}


def _html(t: dict[str, str], p: str, taille: str) -> str:
    corps = t["corps"].format(p=p, taille=taille)
    return f"""\
<div style="background:#fbf5ec;padding:32px 16px;font-family:Georgia,serif;color:#4a3a30">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;
              padding:32px 28px;border:1px solid #eadfce">
    <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;
              color:#7fa98d;margin:0 0 10px">Deux comme nous</p>
    <h1 style="font-size:24px;margin:0 0 16px;color:#c4744a">{t['titre']}</h1>
    <p style="font-size:16px;line-height:1.6;margin:0 0 14px">{corps}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 14px">{t['delai']}</p>
    <p style="font-size:16px;line-height:1.6;margin:24px 0 0">{t['merci']}</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#8b7a6c;margin:18px 0 0">
    Deux comme nous · boutique.gemellite.com</p>
</div>"""


def email_production(cmd: dict) -> bool:
    """Prévient le client que sa commande part à l'impression.
    `cmd` = ligne `commandes` Supabase (email, langue, produit, taille, prénoms).
    Retourne True si l'email est parti."""
    env = _env()
    cle = env.get("RESEND_API_KEY", "")
    dest = (cmd.get("email") or "").strip()
    if not cle.startswith("re_"):
        print("  (email production sauté : RESEND_API_KEY absente du .env)")
        return False
    if not dest:
        print("  (email production sauté : commande sans adresse email)")
        return False

    langue = (cmd.get("langue") or "fr").lower()
    produit = "affiche" if cmd.get("produit") == "affiche" else "livre"
    t = TEXTES.get(langue, TEXTES["fr"])[produit]
    p = f"{cmd.get('prenom1', '')} & {cmd.get('prenom2', '')}".strip(" &")
    taille = (cmd.get("taille") or "30x40").replace("x", "×") + " cm"

    payload = {
        "from": env.get("EMAIL_FROM", "Deux comme nous <commandes@gemellite.com>"),
        "to": [dest],
        "subject": t["sujet"].format(p=p),
        "html": _html(t, p, taille),
    }
    r = subprocess.run(
        ["curl", "-sS", "-X", "POST", "https://api.resend.com/emails",
         "-H", f"Authorization: Bearer {cle}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps(payload)],
        capture_output=True, text=True, timeout=60)
    try:
        reponse = json.loads(r.stdout or "{}")
    except json.JSONDecodeError:
        reponse = {}
    if reponse.get("id"):
        print(f"  📧 Email « part à l'impression » envoyé à {dest} ({langue}).")
        return True
    print(f"  ⚠️ Email production non envoyé : {r.stdout[:300] or r.stderr[:300]}")
    return False


if __name__ == "__main__":
    # Aperçu local : écrit le HTML des 8 combinaisons dans output/emails/.
    out = ROOT / "output" / "emails"
    out.mkdir(parents=True, exist_ok=True)
    for langue, produits in TEXTES.items():
        for produit, t in produits.items():
            html = _html(t, "Elia & Luna", "30×40 cm")
            (out / f"production-{produit}-{langue}.html").write_text(html, encoding="utf-8")
    print(f"Aperçus écrits dans {out}/ (8 fichiers).")
