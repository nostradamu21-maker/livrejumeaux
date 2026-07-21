#!/usr/bin/env python3
"""Front-end de commande (phase 1) — « Deux comme nous ».

Petit serveur Flask local : configurateur d'archétypes + prénoms, aperçu live,
et tunnel de commande SIMULÉ (paiement + Gelato mock) qui écrit la commande dans
`livres/commandes.json` et prépare la combo via `combo.py`.

    python serveur.py            # http://127.0.0.1:5001/

Respecte les règles du projet :
  - le parcours client ne GÉNÈRE aucune image et ne déclenche aucun tri ;
  - une combo déjà en cache est livrable tout de suite (statut « cache ») ;
  - une combo inédite est seulement ENREGISTRÉE + préparée (livre.yaml) : la
    génération des pages et le tri par Simon restent hors du parcours client
    (fenêtre print-on-demand de 1–2 jours).
"""

from __future__ import annotations

import datetime
import json
import os
from pathlib import Path

from flask import (Flask, abort, jsonify, redirect, request, send_file,
                   send_from_directory)

import combo  # réutilise la logique de préparation de combo (aucune image générée)

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
LIVRES = ROOT / "livres"
JOURNAL = LIVRES / "commandes.json"

# --- Paiement (Stripe Checkout) --------------------------------------------
# Clé lue dans .env : STRIPE_SECRET_KEY (clé de test « sk_test_… » pour tester).
# Tant qu'aucune clé n'est configurée, on retombe automatiquement sur un
# paiement SIMULÉ : l'app reste testable sans compte Stripe.
PRIX_CENTIMES = 4490          # 44,90 €
DEVISE = "eur"
PRODUIT_NOM = "Deux comme nous — livre personnalisé"

try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except Exception:
    pass

STRIPE_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()
STRIPE_ON = STRIPE_KEY.startswith("sk_")
if STRIPE_ON:
    import stripe
    stripe.api_key = STRIPE_KEY

app = Flask(__name__, static_folder=None)



def catalogue() -> dict:
    return combo.charger_catalogue()


def combo_dossier(cid: str) -> Path:
    return LIVRES / cid


def pdf_cache(cid: str):
    d = combo_dossier(cid)
    return next(d.glob("impression-*.pdf"), None) if d.exists() else None


def valider_commande(data: dict):
    """Valide une commande. Renvoie (infos, None) ou (None, message d'erreur)."""
    a1 = data.get("archetype1")
    a2 = data.get("archetype2")
    p1 = (data.get("prenom1") or "").strip()
    p2 = (data.get("prenom2") or "").strip()
    email = (data.get("email") or "").strip()

    archs = catalogue()
    if a1 not in archs or a2 not in archs:
        return None, "Archétype inconnu."
    if not p1 or not p2:
        return None, "Les deux prénoms sont requis."

    return {
        "a1": a1, "a2": a2, "p1": p1, "p2": p2, "email": email,
        "cid": combo.combo_id(a1, a2),
    }, None


def enregistrer_commande(infos: dict, paiement: str, ref: str = "") -> dict:
    """Prépare la combo (sans générer d'image), journalise, renvoie un résumé."""
    cid = infos["cid"]
    en_cache = pdf_cache(cid) is not None

    # Prépare la combo (écrit livre.yaml + copie les fiches) si besoin.
    # Aucune image générée ici : génération + tri restent hors parcours client.
    if not combo_dossier(cid).exists():
        combo.construire(infos["a1"], infos["a2"], [infos["p1"], infos["p2"]],
                         force=False)

    statut = "cache" if en_cache else "a_produire"
    commande = {
        "date": datetime.datetime.now().isoformat(timespec="seconds"),
        "combo_id": cid,
        "archetype1": infos["a1"],
        "archetype2": infos["a2"],
        "prenom1": infos["p1"],
        "prenom2": infos["p2"],
        "email": infos["email"],
        "statut": statut,
        "paiement": paiement,
        "ref": ref,
    }
    journal = json.loads(JOURNAL.read_text(encoding="utf-8")) if JOURNAL.exists() else []
    journal.append(commande)
    JOURNAL.write_text(json.dumps(journal, ensure_ascii=False, indent=2),
                       encoding="utf-8")

    if statut == "cache":
        message = ("Votre livre personnalisé est prêt : il part à l'impression "
                   "et vous est expédié directement.")
        prochaine = f'python livre.py {cid} --prenoms "{infos["p1"]},{infos["p2"]}"'
    else:
        message = ("Cette combinaison est créée pour la première fois : nos "
                   "illustrations sont validées puis votre livre est imprimé et "
                   "expédié sous 1 à 2 jours.")
        prochaine = f"python livre.py {cid}"

    return {"combo_id": cid, "statut": statut, "message": message,
            "prochaine_etape": prochaine}


def page_retour(titre: str, message: str, ok: bool) -> str:
    """Petite page HTML de retour après paiement (succès / échec)."""
    couleur = "#5f8a70" if ok else "#b96c44"
    emoji = "✓" if ok else "⚠"
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titre}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body{{margin:0;min-height:100vh;display:grid;place-items:center;
       background:radial-gradient(circle at 30% 20%,#f5ead9,#fbf5ec);
       font-family:Nunito,sans-serif;color:#4a3a30;padding:2rem;}}
  .carte{{background:#fff;border-radius:22px;padding:2.6rem 2.4rem;max-width:520px;
          text-align:center;box-shadow:0 24px 60px rgba(74,58,48,.14);}}
  .pastille{{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;
             margin:0 auto 1.2rem;font-size:2rem;color:#fff;background:{couleur};}}
  h1{{font-family:Fraunces,serif;font-size:1.7rem;margin:0 0 .8rem;}}
  p{{line-height:1.65;color:#6f5d51;font-size:1.05rem;}}
  a{{display:inline-block;margin-top:1.6rem;background:#d98f63;color:#fff;
     text-decoration:none;font-weight:700;padding:.8rem 1.6rem;border-radius:999px;}}
</style></head><body>
  <div class="carte">
    <div class="pastille">{emoji}</div>
    <h1>{titre}</h1>
    <p>{message}</p>
    <a href="/">Revenir à l'accueil</a>
  </div>
</body></html>"""


# ---------------------------------------------------------------------------
# Fichiers statiques
# ---------------------------------------------------------------------------


@app.get("/")
def index():
    return send_from_directory(WEB, "index.html")


@app.get("/web/<path:fichier>")
def web_static(fichier: str):
    return send_from_directory(WEB, fichier)


@app.get("/fiche/<aid>.png")
def fiche(aid: str):
    p = combo.fiche_path(aid)
    if not p.exists():
        abort(404)
    return send_file(p)


@app.get("/apercu/<cid>/<fichier>")
def apercu(cid: str, fichier: str):
    p = combo_dossier(cid) / "apercus" / fichier
    if not p.exists():
        abort(404)
    return send_file(p)


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------


@app.get("/api/archetypes")
def api_archetypes():
    archs = catalogue()
    out = []
    for aid, d in archs.items():
        out.append({
            "id": aid,
            "genre": d["genre"],
            "description": d["description"],
            "tenue": d["tenue"],
            "distinctif": d.get("distinctif", ""),
            "fiche": f"/fiche/{aid}.png",
            "disponible": combo.fiche_path(aid).exists(),
        })
    return jsonify(out)


@app.get("/api/combo/<a1>/<a2>")
def api_combo(a1: str, a2: str):
    archs = catalogue()
    if a1 not in archs or a2 not in archs:
        abort(404)
    cid = combo.combo_id(a1, a2)
    d = combo_dossier(cid)
    apercus = []
    ap_dir = d / "apercus"
    if ap_dir.exists():
        apercus = [f"/apercu/{cid}/{p.name}" for p in sorted(ap_dir.glob("*.jpg"))]
    return jsonify({
        "combo_id": cid,
        "cache": pdf_cache(cid) is not None,
        "identique": a1 == a2,
        "apercus": apercus,
    })


@app.post("/api/commander")
def commander():
    data = request.get_json(force=True, silent=True) or {}
    infos, err = valider_commande(data)
    if err:
        return jsonify({"ok": False, "erreur": err}), 400

    # Paiement réel via Stripe si configuré, sinon simulation.
    if STRIPE_ON:
        base = request.url_root.rstrip("/")
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "quantity": 1,
                "price_data": {
                    "currency": DEVISE,
                    "unit_amount": PRIX_CENTIMES,
                    "product_data": {
                        "name": PRODUIT_NOM,
                        "description": (
                            f"{infos['p1']} & {infos['p2']} — "
                            f"{infos['a1']} + {infos['a2']}"),
                    },
                },
            }],
            customer_email=infos["email"] or None,
            success_url=f"{base}/commande/succes?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base}/#creer",
            metadata={
                "combo_id": infos["cid"],
                "archetype1": infos["a1"],
                "archetype2": infos["a2"],
                "prenom1": infos["p1"],
                "prenom2": infos["p2"],
            },
        )
        return jsonify({"ok": True, "url": session.url})

    # --- Repli : paiement simulé (aucune clé Stripe) ---
    resultat = enregistrer_commande(infos, paiement="simulé")
    return jsonify({"ok": True, "mock": True, **resultat})


@app.get("/commande/succes")
def commande_succes():
    """Retour Stripe après paiement réussi : on vérifie puis on enregistre."""
    if not STRIPE_ON:
        return redirect("/")
    sid = request.args.get("session_id", "")
    try:
        session = stripe.checkout.Session.retrieve(sid)
    except Exception:
        return page_retour("Paiement introuvable",
                           "Nous n'avons pas pu retrouver votre paiement. "
                           "Aucun montant n'a été débité si l'opération a échoué.",
                           ok=False)
    if session.get("payment_status") != "paid":
        return page_retour("Paiement non finalisé",
                           "Le paiement n'a pas été confirmé.", ok=False)

    m = session.get("metadata", {}) or {}
    infos, err = valider_commande({
        "archetype1": m.get("archetype1"),
        "archetype2": m.get("archetype2"),
        "prenom1": m.get("prenom1"),
        "prenom2": m.get("prenom2"),
        "email": (session.get("customer_details") or {}).get("email", ""),
    })
    if err:
        return page_retour("Commande incomplète", err, ok=False)

    resultat = enregistrer_commande(
        infos, paiement="stripe", ref=session.get("id", ""))
    return page_retour("Merci ! Commande confirmée", resultat["message"], ok=True)


if __name__ == "__main__":
    print("Configurateur « Deux comme nous » : http://127.0.0.1:5001/")
    app.run(host="127.0.0.1", port=5001, debug=False)
