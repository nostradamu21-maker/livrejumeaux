"""Prépare + produit une commande SUR-MESURE (personnages dessinés d'après photo).

    python sur_mesure.py --liste          # commandes sur-mesure prêtes à produire
    python sur_mesure.py <ref>            # tout : dossier + livre.yaml + production
    python sur_mesure.py <ref> --preparer # dossier + livre.yaml seulement (sans lancer)

Le client a déjà payé, envoyé sa/ses photo(s) et CHOISI ses personnages en ligne
(page /commande/variantes). Ce script :
  1. lit la commande dans Supabase (table `sur_mesure` : personnages retenus ;
     table `commandes` : langue du livre) ;
  2. télécharge les personnages choisis depuis le bucket privé `sur-mesure` ;
  3. crée `livres/sur-mesure-<prenoms>/` avec son `livre.yaml` (references,
     prénoms, flag monozygote, langue, description_paire) ;
  4. enchaîne `python livre.py <id>` : génération des 28 pages depuis ces
     personnages (coût annoncé + confirmation), TRI dans le navigateur, PDF final.

Le tri Simon reste requis. La commande Gelato (adresse client) reste manuelle
pour l'instant. Clés lues dans .env : SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL)
+ SUPABASE_SERVICE_ROLE_KEY. Appels via curl (comme gelato.py / commandes.py).
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import yaml
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent
LIVRES = ROOT / "livres"
BUCKET = "sur-mesure"

# Signe distinctif du 2ᵉ jumeau (monozygotes) — aligné sur site/lib/accessoires.ts.
ACCESSOIRES = {
    "doudou-lapin": "tient un doudou lapin tout doux dans les bras",
    "doudou-ours": "tient un doudou ours tout doux dans les bras",
    "doudou-chat": "tient un doudou chat tout doux dans les bras",
    "lunettes": "porte de petites lunettes rondes",
    "casquette": "porte une petite casquette",
    "foulard": "porte un foulard léger noué au cou",
}


# ------------------------------ Supabase -----------------------------------

def _config() -> tuple[str, str]:
    env = dotenv_values(ROOT / ".env")
    url = (env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL") or "").rstrip("/")
    cle = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    if not url or not cle:
        raise SystemExit(
            "SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY "
            "sont requis dans .env"
        )
    return url, cle


def _rest(chemin: str) -> list | dict:
    url, cle = _config()
    cmd = ["curl", "-sS", "--fail-with-body",
           "-H", f"apikey: {cle}", "-H", f"Authorization: Bearer {cle}",
           f"{url}/rest/v1/{chemin}"]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if p.returncode != 0:
        raise RuntimeError(f"Supabase GET {chemin} : {p.stderr.strip()} {p.stdout[:400]}")
    return json.loads(p.stdout) if p.stdout.strip() else []


def _download(chemin_bucket: str, dest: Path) -> None:
    """Télécharge un objet du bucket privé (clé service_role → bypass RLS)."""
    url, cle = _config()
    cmd = ["curl", "-sS", "--fail",
           "-H", f"apikey: {cle}", "-H", f"Authorization: Bearer {cle}",
           "-o", str(dest),
           f"{url}/storage/v1/object/{BUCKET}/{chemin_bucket}"]
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if p.returncode != 0 or not dest.exists() or dest.stat().st_size == 0:
        raise RuntimeError(f"Téléchargement échoué : {chemin_bucket} ({p.stderr.strip()})")


def lire_sur_mesure(ref: str) -> dict:
    data = _rest(f"sur_mesure?ref=eq.{ref}&select=*")
    if not data:
        raise SystemExit(f"Aucune commande sur-mesure avec ref={ref} (choix client fait ?)")
    return data[0]


def langue_commande(ref: str) -> str:
    data = _rest(f"commandes?ref=eq.{ref}&select=langue")
    return (data[0]["langue"] if data else "fr") or "fr"


# ------------------------------- Utilitaires -------------------------------

def slug(txt: str) -> str:
    # Translittère les accents (Léo → leo, Éléa → elea) avant de nettoyer.
    base = unicodedata.normalize("NFKD", txt or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", base.lower().strip()).strip("-") or "x"


def _lancer(args: list[str]) -> None:
    print(f"\n$ {' '.join(args)}")
    r = subprocess.run([sys.executable] + args, cwd=ROOT)
    if r.returncode != 0:
        raise SystemExit(f"Échec : {' '.join(args)} (code {r.returncode})")


# ------------------------------- Préparation -------------------------------

def preparer(ref: str) -> str:
    """Crée le dossier + livre.yaml depuis la commande. Retourne l'id du livre."""
    cmd = lire_sur_mesure(ref)
    p1, p2 = cmd.get("prenom1") or "Enfant1", cmd.get("prenom2") or "Enfant2"
    mono = bool(cmd.get("monozygote"))
    choix = cmd.get("choix") or {}
    if not choix.get("1") or not choix.get("2"):
        raise SystemExit("Le client n'a pas encore choisi ses deux personnages.")
    langue = langue_commande(ref)

    book_id = f"sur-mesure-{slug(p1)}-{slug(p2)}"
    dossier = LIVRES / book_id
    dossier.mkdir(parents=True, exist_ok=True)

    # Téléchargement des personnages retenus.
    refs_rel = []
    for i, cle in (("1", "1"), ("2", "2")):
        dest = dossier / f"perso-{i}.png"
        print(f"  Téléchargement du personnage {i} ({p1 if i == '1' else p2})…")
        _download(choix[cle], dest)
        refs_rel.append(f"livres/{book_id}/perso-{i}.png")

    # Description de la paire : les deux fiches SONT les personnages validés.
    desc = (f"La PREMIÈRE image de référence est {p1}, la SECONDE est {p2}. "
            "Reproduire fidèlement ces deux personnages (visage, coiffure, tenue, "
            "couleurs), entièrement stylisés aquarelle douce.")
    acc = cmd.get("accessoire")
    if mono and acc in ACCESSOIRES:
        desc += f" Le second ({p2}) {ACCESSOIRES[acc]} pour le distinguer."

    livre = {
        "id": book_id,
        "description": f"Sur-mesure — {p1} & {p2} (ref {ref})",
        "references": refs_rel,
        "prenoms_defaut": [p1, p2],
        "monozygote": mono,
        "langue": langue,
        "description_paire": desc,
        "selections": {},
    }
    (dossier / "livre.yaml").write_text(
        yaml.safe_dump(livre, allow_unicode=True, sort_keys=False), encoding="utf-8")

    print(f"\n✅ Dossier prêt : livres/{book_id}/")
    print(f"   Personnages : perso-1.png ({p1}), perso-2.png ({p2})")
    print(f"   {'Monozygotes' if mono else 'Dizygotes'} · langue {langue.upper()}")
    return book_id


# ---------------------------------- Liste ----------------------------------

def lister() -> None:
    data = _rest("sur_mesure?choix=not.is.null&select=ref,prenom1,prenom2,monozygote,accessoire"
                 "&order=cree_le.asc")
    if not data:
        print("Aucune commande sur-mesure avec personnages choisis. ☕")
        return
    print(f"\n{len(data)} commande(s) sur-mesure prête(s) à produire :\n")
    for c in data:
        zy = "mono" if c.get("monozygote") else "di"
        acc = f" · acc:{c['accessoire']}" if c.get("accessoire") else ""
        print(f"  • {c['prenom1']} & {c['prenom2']:<12} [{zy}{acc}]  ref={c['ref']}")
    print("\nProduire : python sur_mesure.py <ref>")


# ---------------------------------- Main -----------------------------------

def main() -> None:
    args = [a for a in sys.argv[1:]]
    if not args or "--liste" in args:
        lister()
        return
    ref = args[0]
    book_id = preparer(ref)
    if "--preparer" in args:
        print(f"\nQuand tu veux : python livre.py {book_id}")
        return
    if input("\nLancer la production maintenant (génération + tri + PDF) ? [o/N] ") \
            .strip().lower() not in ("o", "oui", "y"):
        print(f"OK. Plus tard : python livre.py {book_id}")
        return
    _lancer(["livre.py", book_id])
    print(f"\n🎉 Terminé. PDF dans livres/{book_id}/ — vérifie, puis commande Gelato "
          "(adresse client dans l'email de commande).")


if __name__ == "__main__":
    main()
