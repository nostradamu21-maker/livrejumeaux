"""Publie les aperçus d'un livre-combo produit sur le site (visionneuse
« vraies pages, vos prénoms » du configurateur).

    python publier_apercu.py <combo-id>
    python publier_apercu.py <combo-id> --pages 01,04,10,16,22,27

Copie `livres/<combo-id>/apercus/couverture.jpg` + les pages choisies vers
`site/public/apercus/<combo-id>/`, puis enregistre la combo dans
`site/lib/apercus.json` (lu par le configurateur). Après ça : commit + push,
Vercel redéploie, et la paire d'archétypes correspondante propose « Feuilleter
de vraies pages avec vos prénoms ».

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

# Pages représentatives par défaut (réveil, jeux, complicité, danse, final).
PAGES_DEFAUT = ["01", "05", "09", "14", "21", "27"]


def main() -> None:
    args = sys.argv[1:]
    if not args:
        sys.exit("Usage : python publier_apercu.py <combo-id> [--pages 01,05,...]")
    combo = args[0].strip("/").split("/")[-1]
    pages = PAGES_DEFAUT
    if "--pages" in args:
        pages = [p.strip() for p in args[args.index("--pages") + 1].split(",") if p.strip()]

    # La clé de cache ignore l'accessoire (même fond d'aperçu que la paire).
    cle = combo.split("__acc-")[0]

    src = LIVRES / combo / "apercus"
    if not src.exists():
        sys.exit(f"Aperçus introuvables : {src}\n"
                 f"Produis d'abord le livre : python livre.py {combo}")

    # Confirmation avec les prénoms par défaut du livre (repère humain).
    ly = LIVRES / combo / "livre.yaml"
    prenoms = ""
    if ly.exists():
        p = (yaml.safe_load(ly.read_text(encoding="utf-8")) or {}).get("prenoms_defaut")
        if p:
            prenoms = f" (exemplaire {p[0]} & {p[1]})"
    print(f"Combo : {combo}{prenoms}")

    # Copie couverture + pages choisies.
    dest = SITE_APERCUS / combo
    dest.mkdir(parents=True, exist_ok=True)
    fichiers = ["couverture.jpg"] + [f"page-{p}.jpg" for p in pages]
    manquants = [f for f in fichiers if not (src / f).exists()]
    if manquants:
        sys.exit(f"Fichiers d'aperçu manquants dans {src} : {', '.join(manquants)}")
    for f in fichiers:
        shutil.copy2(src / f, dest / f)
    print(f"  {len(fichiers)} images copiées → site/public/apercus/{combo}/")

    # Enregistre la combo dans le catalogue JSON.
    cat = json.loads(CATALOGUE.read_text(encoding="utf-8")) if CATALOGUE.exists() else {}
    cat[cle] = {"dossier": f"/apercus/{combo}", "pages": pages}
    CATALOGUE.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    print(f"  Enregistré dans site/lib/apercus.json ({len(cat)} combo(s) au total)")

    print("\n✅ Publié. Étapes suivantes :")
    print(f"   git add site/public/apercus/{combo} site/lib/apercus.json")
    print('   git commit -m "Aperçu vraies pages : ' + combo + '"')
    print("   git push")
    print("   → après redéploiement Vercel, la paire propose « Feuilleter de "
          "vraies pages avec vos prénoms ».")


if __name__ == "__main__":
    main()
