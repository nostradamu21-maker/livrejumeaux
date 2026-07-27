"""Tri web MOBILE des variantes d'un livre — « Deux comme nous ».

Remplace le tri local (navigateur du Mac) par une page sécurisée du site,
utilisable depuis un téléphone. Flux :

    python tri_web.py <livre-id>               # envoie les variantes à trier + URL
    python tri_web.py <livre-id> --rapatrier   # applique les choix dans livre.yaml
    python tri_web.py <livre-id> --attendre    # envoie, POLL toutes les 30 s,
                                               # applique dès le tri terminé
                                               # (c'est le mode du worker VPS)

Étapes : les variantes générées non triées (références, couverture, pages) sont
compressées (JPEG ≤ 1024 px) et téléversées dans le bucket privé `tri`, une
ligne est créée dans la table `tris`, et l'URL du tri s'affiche :

    https://boutique.gemellite.com/admin/tri/<livre-id>?cle=<ADMIN_TRI_SECRET>

Sur la page, un tap = un choix (enregistré aussitôt) ; « À refaire » marque
l'unité `regen`. Au rapatriement : `vN` → sélection dans livre.yaml ; `regen` →
le dossier de variantes est supprimé (regénérées à la prochaine passe de
livre.py). Les fichiers du bucket et la ligne `tris` sont nettoyés à la fin.

.env : SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY,
ADMIN_TRI_SECRET (même valeur que la variable Vercel), SITE_URL (défaut
https://boutique.gemellite.com).
"""

from __future__ import annotations

import io
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

from dotenv import dotenv_values

import livre as moteur

ROOT = Path(__file__).resolve().parent
BUCKET = "tri"
ENV = dotenv_values(ROOT / ".env")
SITE = (ENV.get("SITE_URL") or "https://boutique.gemellite.com").rstrip("/")


def _supabase() -> tuple[str, str]:
    url = (ENV.get("SUPABASE_URL") or ENV.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    cle = ENV.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not url or not cle:
        raise SystemExit("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env")
    return url, cle


def _secret() -> str:
    s = (ENV.get("ADMIN_TRI_SECRET") or "").strip()
    if not s:
        raise SystemExit(
            "ADMIN_TRI_SECRET manquant dans .env (même valeur que sur Vercel).\n"
            "Choisis une longue chaîne aléatoire, ex. : openssl rand -hex 24")
    return s


def _curl(args: list[str], binaire: Path | None = None, timeout: int = 120) -> dict | list:
    url, cle = _supabase()
    base = ["curl", "-sS", "--fail-with-body",
            "-H", f"apikey: {cle}", "-H", f"Authorization: Bearer {cle}"]
    if binaire is not None:
        base += ["--data-binary", f"@{binaire}"]
    p = subprocess.run(base + args, capture_output=True, text=True, timeout=timeout)
    if p.returncode != 0:
        raise RuntimeError(f"curl ({p.returncode}) : {p.stderr.strip()} {p.stdout[:400]}")
    return json.loads(p.stdout) if p.stdout.strip() else {}


def _rest(chemin: str, methode: str = "GET", corps: dict | None = None) -> dict | list:
    url, _ = _supabase()
    args: list[str] = []
    if methode != "GET":
        args += ["-X", methode, "-H", "Content-Type: application/json",
                 "-H", "Prefer: resolution=merge-duplicates,return=representation",
                 "-d", json.dumps(corps or {})]
    return _curl(args + [f"{url}/rest/v1/{chemin}"])


def _upload_jpeg(chemin_bucket: str, image_png: Path) -> None:
    """Compresse la variante (JPEG ≤ 1024 px) puis la téléverse : page mobile rapide."""
    from PIL import Image
    url, _ = _supabase()
    im = Image.open(image_png).convert("RGB")
    im.thumbnail((1024, 1024))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=82, optimize=True)
    tmp = Path("/tmp") / "tri-upload.jpg"
    tmp.write_bytes(buf.getvalue())
    _curl(["-X", "POST", "-H", "Content-Type: image/jpeg", "-H", "x-upsert: true",
           f"{url}/storage/v1/object/{BUCKET}/{chemin_bucket}"], binaire=tmp)


def _supprimer_objets(livre_id: str) -> None:
    url, _ = _supabase()
    try:
        objets = _curl(["-X", "POST", "-H", "Content-Type: application/json",
                        "-d", json.dumps({"prefix": f"{livre_id}/", "limit": 500}),
                        f"{url}/storage/v1/object/list/{BUCKET}"])
        noms = [f"{livre_id}/{o['name']}" for o in objets if isinstance(o, dict) and o.get("name")]
        if noms:
            _curl(["-X", "DELETE", "-H", "Content-Type: application/json",
                   "-d", json.dumps({"prefixes": noms}),
                   f"{url}/storage/v1/object/{BUCKET}"])
    except Exception as e:  # noqa: BLE001 — le nettoyage ne doit jamais bloquer
        print(f"(nettoyage bucket ignoré : {e})")


# ------------------------------- Envoi --------------------------------------

def unites_a_trier(livre: dict, scenes: dict, dossier: Path) -> list[str]:
    return [n for n in moteur.unites_references(livre) + ["couv"] + list(scenes["pages"])
            if moteur.page_generee(dossier, n) and n not in livre["selections"]]


def envoyer(livre_id: str) -> bool:
    """Téléverse les variantes à trier + crée la ligne `tris`. False si rien à trier."""
    livre, scenes, dossier = moteur.charger(livre_id)
    restantes = unites_a_trier(livre, scenes, dossier)
    if not restantes:
        print("Rien à trier (tout est généré ? déjà trié ?).")
        return False
    print(f"{len(restantes)} unité(s) à trier — téléversement des variantes…")
    unites = []
    for num in restantes:
        chemins = []
        for i in range(1, moteur.N_VARIANTES + 1):
            src = moteur.variantes_dir(dossier, num) / f"v{i}.png"
            cible = f"{livre_id}/{num}/v{i}.jpg"
            _upload_jpeg(cible, src)
            chemins.append(cible)
        unites.append({"unite": num, "variantes": chemins})
        print(f"  {num} ✓")
    _rest("tris?on_conflict=livre_id", "POST", {
        "livre_id": livre_id, "unites": unites, "choix": None, "termine": False})
    print(f"\n📱 Tri : {SITE}/admin/tri/{livre_id}?cle={_secret()}")
    return True


# ---------------------------- Rapatriement ----------------------------------

def rapatrier(livre_id: str) -> bool:
    """Applique les choix web dans livre.yaml. True si le tri était terminé."""
    livre, scenes, dossier = moteur.charger(livre_id)
    lignes = _rest(f"tris?livre_id=eq.{livre_id}&select=*")
    if not lignes:
        print("Aucun tri web en cours pour ce livre.")
        return False
    ligne = lignes[0]
    choix = ligne.get("choix") or {}
    if not ligne.get("termine"):
        faits = len(choix)
        total = len(ligne.get("unites") or [])
        print(f"Tri incomplet ({faits}/{total}) — retente plus tard ou finis-le : "
              f"{SITE}/admin/tri/{livre_id}?cle={_secret()}")
        return False
    notes = ligne.get("notes") or {}
    regen = []
    for unite, v in choix.items():
        if v == "regen":
            # Consigne de correction de Simon → injectée dans le prompt de
            # regénération (livre.yaml retouches). Invalide aussi les pages
            # ancrées sur celle-ci (décor à refaire).
            note = str(notes.get(unite) or "").strip()[:300]
            if note:
                livre.setdefault("retouches", {})[unite] = note
                print(f"  correction demandée ({unite}) : {note}")
            regen += moteur.invalider(livre, scenes, dossier, unite)
        else:
            livre["selections"][unite] = v
            # page validée → la consigne de retouche a fait son travail
            (livre.get("retouches") or {}).pop(unite, None)
    # Une page peut avoir été invalidée en cascade APRÈS avoir reçu un choix :
    # l'invalidation prime (sa sélection a été retirée par invalider()).
    for unite in regen:
        livre["selections"].pop(unite, None)
    moteur.sauver(livre, dossier)
    _rest(f"tris?livre_id=eq.{livre_id}", "DELETE")
    _supprimer_objets(livre_id)
    print(f"✅ Choix appliqués ({len(choix) - len(regen)} sélection(s)"
          + (f", {len(regen)} à regénérer : {', '.join(regen)}" if regen else "") + ").")
    print(f"→ poursuivre : python livre.py {livre_id}")
    return True


def attendre(livre_id: str, intervalle: int = 30) -> None:
    """Mode worker : envoie (si besoin), attend la fin du tri, applique."""
    envoyer(livre_id)
    print("Attente du tri (Ctrl-C pour arrêter)…")
    while True:
        lignes = _rest(f"tris?livre_id=eq.{livre_id}&select=termine,choix,unites")
        if not lignes:
            print("Ligne de tri disparue (déjà rapatriée ?).")
            return
        if lignes[0].get("termine"):
            rapatrier(livre_id)
            return
        faits = len(lignes[0].get("choix") or {})
        total = len(lignes[0].get("unites") or [])
        print(f"  … {faits}/{total}", end="\r")
        time.sleep(intervalle)


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return
    livre_id = args[0]
    if "--rapatrier" in args:
        rapatrier(livre_id)
    elif "--attendre" in args:
        attendre(livre_id)
    else:
        envoyer(livre_id)


if __name__ == "__main__":
    main()
