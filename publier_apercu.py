"""Publie les aperçus d'un livre-combo produit sur le site (visionneuse
« vraies pages, vos prénoms » du configurateur).

    python publier_apercu.py <combo-id>                       # aperçu configurateur
    python publier_apercu.py <combo-id> --pages 01,04,10,...  # pages personnalisées
    python publier_apercu.py <id> --exemple "Marceau,Jade"    # exemple du flipbook

Deux usages :
  • Sans `--exemple` : enregistre une COMBO d'archétypes dans `site/lib/apercus.json`
    (lu par le configurateur → bouton « Feuilleter de vraies pages avec vos prénoms »
    quand un visiteur choisit cette paire).
  • Avec `--exemple "P1,P2"` : ajoute le livre comme EXEMPLE du flipbook « Feuilletez
    un exemplaire réel » (`site/lib/exemples.json`) — convient aussi aux livres
    sur-mesure (pas de paire d'archétypes). Les prénoms affichés = ceux passés.

Dans les deux cas, copie `livres/<id>/apercus/couverture.jpg` + les pages choisies
vers `site/public/apercus/<id>/`. Après : commit + push, Vercel redéploie.

L'id du combo = le nom du dossier dans `livres/` (ex. produit par combo.py :
`combo-f1-natte-brune__f2-nattes-brune`). Une combo à personnages identiques
avec accessoire (`...__acc-xxx`) partage l'aperçu de la paire de base.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
LIVRES = ROOT / "livres"
SITE_APERCUS = ROOT / "site" / "public" / "apercus"
CATALOGUE = ROOT / "site" / "lib" / "apercus.json"
EXEMPLES = ROOT / "site" / "lib" / "exemples.json"

# Pages par défaut : aperçu configurateur (6) et flipbook (9, page-turn).
PAGES_DEFAUT = ["01", "05", "09", "14", "21", "27"]
PAGES_FLIPBOOK = ["01", "02", "05", "08", "11", "14", "17", "20", "27"]


def _copier(combo: str, pages: list[str]) -> None:
    src = LIVRES / combo / "apercus"
    if not src.exists():
        sys.exit(f"Aperçus introuvables : {src}\n"
                 f"Produis d'abord le livre : python livre.py {combo}")
    dest = SITE_APERCUS / combo
    dest.mkdir(parents=True, exist_ok=True)
    fichiers = ["couverture.jpg"] + [f"page-{p}.jpg" for p in pages]
    manquants = [f for f in fichiers if not (src / f).exists()]
    if manquants:
        sys.exit(f"Fichiers d'aperçu manquants dans {src} : {', '.join(manquants)}")
    for f in fichiers:
        shutil.copy2(src / f, dest / f)
    print(f"  {len(fichiers)} images copiées → site/public/apercus/{combo}/")


def publier_exemple(combo: str, prenoms: list[str]) -> None:
    """Ajoute le livre comme exemple du flipbook (convient au sur-mesure)."""
    _copier(combo, PAGES_FLIPBOOK)
    liste = json.loads(EXEMPLES.read_text(encoding="utf-8")) if EXEMPLES.exists() else []
    liste = [e for e in liste if e.get("id") != combo]  # remplace si déjà présent
    liste.append({"id": combo, "dossier": f"/apercus/{combo}",
                  "prenoms": prenoms[:2], "pages": PAGES_FLIPBOOK})
    EXEMPLES.write_text(json.dumps(liste, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
    print(f"  Enregistré dans site/lib/exemples.json ({len(liste)} exemple(s))")
    print("\n✅ Publié. Étapes suivantes :")
    print(f"   git add site/public/apercus/{combo} site/lib/exemples.json")
    print(f'   git commit -m "Flipbook : exemple {prenoms[0]} & {prenoms[1]}"')
    print("   git push  → après Vercel, le flipbook propose ce 2ᵉ exemple.")


def publier_combo(combo: str, pages: list[str]) -> None:
    """Enregistre une combo d'archétypes pour l'aperçu du configurateur."""
    cle = combo.split("__acc-")[0]  # l'accessoire ne change pas le fond
    _copier(combo, pages)
    cat = json.loads(CATALOGUE.read_text(encoding="utf-8")) if CATALOGUE.exists() else {}
    cat[cle] = {"dossier": f"/apercus/{combo}", "pages": pages}
    CATALOGUE.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    print(f"  Enregistré dans site/lib/apercus.json ({len(cat)} combo(s))")
    print("\n✅ Publié. Étapes suivantes :")
    print(f"   git add site/public/apercus/{combo} site/lib/apercus.json")
    print(f'   git commit -m "Aperçu vraies pages : {combo}"')
    print("   git push  → après Vercel, la paire propose « Feuilleter de vraies pages ».")


def main() -> None:
    args = sys.argv[1:]
    if not args:
        sys.exit("Usage : python publier_apercu.py <id> [--exemple \"P1,P2\"] "
                 "[--pages 01,05,...]")
    combo = args[0].strip("/").split("/")[-1]

    if "--exemple" in args:
        prenoms = [p.strip() for p in args[args.index("--exemple") + 1].split(",")]
        if len(prenoms) < 2:
            sys.exit('--exemple attend deux prénoms, ex. --exemple "Marceau,Jade"')
        publier_exemple(combo, prenoms)
        return

    pages = PAGES_DEFAUT
    if "--pages" in args:
        pages = [p.strip() for p in args[args.index("--pages") + 1].split(",") if p.strip()]
    publier_combo(combo, pages)


if __name__ == "__main__":
    main()
