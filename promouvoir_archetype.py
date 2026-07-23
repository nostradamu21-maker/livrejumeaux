"""Promeut les personnages d'un livre SUR-MESURE en ARCHÉTYPES publics
(mécanisme de l'option −30 € : le client a accepté que son personnage validé
soit réutilisé → il rejoint le catalogue commandable par tous).

    python promouvoir_archetype.py <sur-mesure-id> \\
        --a1 "g7-marceau:garçon:Brun, cheveux courts" \\
        --a2 "f7-jade:fille:Brune, couettes"

Chaque `--aN` = "id:genre:label" (id en minuscules-tirets, genre garçon|fille,
label = intitulé CLIENT court et SANS mention de peau). Options :
    --desc1/--desc2   description technique (prompts de génération) ; défaut = label
    --tenue1/--tenue2 tenue fixe ; défaut générique
    --exemple         ajoute aussi le livre au flipbook (exemples.json)

Le script, pour chaque personnage :
  • copie la fiche (livres/<id>/perso-N.png) → archetypes/<aid>.png ET
    site/public/fiches/<aid>.png (pour le pipeline ET le configurateur) ;
  • ajoute l'archétype à archetypes.yaml (pipeline) et à site/lib/catalogue.json
    (site) ;
puis enregistre l'aperçu « vraies pages » de la paire (site/lib/apercus.json)
et, si --exemple, l'exemple du flipbook. Ensuite : git add/commit/push.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
LIVRES = ROOT / "livres"
ARCHETYPES_DIR = ROOT / "archetypes"
FICHES = ROOT / "site" / "public" / "fiches"
CATALOGUE_JSON = ROOT / "site" / "lib" / "catalogue.json"
ARCHETYPES_YAML = ROOT / "archetypes.yaml"
APERCUS_JSON = ROOT / "site" / "lib" / "apercus.json"
EXEMPLES_JSON = ROOT / "site" / "lib" / "exemples.json"
PAGES_APERCU = ["01", "05", "09", "14", "21", "27"]
PAGES_FLIPBOOK = ["01", "02", "05", "08", "11", "14", "17", "20", "27"]

# Distinctif par défaut (2e jumeau si un client choisit deux fois cet archétype).
DISTINCTIF_DEFAUT = "le second tient un petit doudou dans les bras"


def _opt(args: list[str], nom: str, defaut: str = "") -> str:
    return args[args.index(nom) + 1] if nom in args else defaut


def _parse(spec: str) -> tuple[str, str, str]:
    parts = spec.split(":")
    if len(parts) != 3 or parts[1] not in ("garçon", "fille"):
        sys.exit(f'--aN invalide : "{spec}" (attendu "id:garçon|fille:label")')
    return parts[0].strip(), parts[1].strip(), parts[2].strip()


def _copier_fiche(combo: str, n: int, aid: str) -> None:
    src = LIVRES / combo / f"perso-{n}.png"
    if not src.exists():
        sys.exit(f"Fiche introuvable : {src}")
    ARCHETYPES_DIR.mkdir(exist_ok=True)
    FICHES.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, ARCHETYPES_DIR / f"{aid}.png")
    shutil.copy2(src, FICHES / f"{aid}.png")
    print(f"  fiche {aid} → archetypes/ + site/public/fiches/")


def _ajouter_yaml(aid: str, genre: str, desc: str, tenue: str) -> None:
    data = yaml.safe_load(ARCHETYPES_YAML.read_text(encoding="utf-8"))
    data.setdefault("archetypes", {})
    if aid in data["archetypes"]:
        print(f"  (archetypes.yaml : {aid} déjà présent, mis à jour)")
    data["archetypes"][aid] = {
        "genre": genre,
        "description": desc,
        "tenue": tenue,
        "distinctif": DISTINCTIF_DEFAUT,
        "base": "garcon" if genre == "garçon" else "fille",
        "source_validee": f"archetypes/{aid}.png",
    }
    ARCHETYPES_YAML.write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
    print(f"  archetypes.yaml ← {aid}")


def _ajouter_catalogue(aid: str, genre: str, label: str, desc: str, tenue: str) -> None:
    cat = json.loads(CATALOGUE_JSON.read_text(encoding="utf-8"))
    cat = [e for e in cat if e.get("id") != aid]
    cat.append({"id": aid, "genre": genre, "label": label, "description": desc,
                "tenue": tenue, "distinctif": DISTINCTIF_DEFAUT})
    CATALOGUE_JSON.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n",
                              encoding="utf-8")
    print(f"  catalogue.json ← {aid} ({len(cat)} archétypes)")


def main() -> None:
    args = sys.argv[1:]
    if not args or "--a1" not in args or "--a2" not in args:
        sys.exit('Usage : python promouvoir_archetype.py <sur-mesure-id> '
                 '--a1 "id:genre:label" --a2 "id:genre:label" [--exemple]')
    combo = args[0].strip("/").split("/")[-1]
    id1, g1, l1 = _parse(_opt(args, "--a1"))
    id2, g2, l2 = _parse(_opt(args, "--a2"))
    desc1 = _opt(args, "--desc1") or f"{g1} — {l1.lower()}"
    desc2 = _opt(args, "--desc2") or f"{g2} — {l2.lower()}"
    tenue1 = _opt(args, "--tenue1") or "tenue de la fiche de référence"
    tenue2 = _opt(args, "--tenue2") or "tenue de la fiche de référence"

    src = LIVRES / combo
    if not (src / "perso-1.png").exists():
        sys.exit(f"Livre sur-mesure introuvable ou sans fiches : {src}")
    print(f"Promotion depuis {combo} :\n  {id1} ({g1}) · {id2} ({g2})")

    _copier_fiche(combo, 1, id1)
    _copier_fiche(combo, 2, id2)
    _ajouter_yaml(id1, g1, desc1, tenue1)
    _ajouter_yaml(id2, g2, desc2, tenue2)
    _ajouter_catalogue(id1, g1, l1, desc1, tenue1)
    _ajouter_catalogue(id2, g2, l2, desc2, tenue2)

    # Aperçu « vraies pages » du configurateur pour la paire (id canonique trié).
    if (src / "apercus" / "couverture.jpg").exists():
        dest = ROOT / "site" / "public" / "apercus" / combo
        dest.mkdir(parents=True, exist_ok=True)
        for f in ["couverture.jpg"] + [f"page-{p}.jpg" for p in PAGES_APERCU]:
            if (src / "apercus" / f).exists():
                shutil.copy2(src / "apercus" / f, dest / f)
        cle = "combo-" + "__".join(sorted([id1, id2]))
        cat = json.loads(APERCUS_JSON.read_text(encoding="utf-8")) if APERCUS_JSON.exists() else {}
        cat[cle] = {"dossier": f"/apercus/{combo}", "pages": PAGES_APERCU}
        APERCUS_JSON.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n",
                                encoding="utf-8")
        print(f"  apercus.json ← {cle} (paire commandable avec vraies pages)")

        if "--exemple" in args:
            for f in [f"page-{p}.jpg" for p in PAGES_FLIPBOOK]:
                if (src / "apercus" / f).exists():
                    shutil.copy2(src / "apercus" / f, dest / f)
            p = (yaml.safe_load((src / "livre.yaml").read_text(encoding="utf-8"))
                 or {}).get("prenoms_defaut") or [l1, l2]
            liste = json.loads(EXEMPLES_JSON.read_text(encoding="utf-8")) if EXEMPLES_JSON.exists() else []
            liste = [e for e in liste if e.get("id") != combo]
            liste.append({"id": combo, "dossier": f"/apercus/{combo}",
                          "prenoms": p[:2], "pages": PAGES_FLIPBOOK})
            EXEMPLES_JSON.write_text(json.dumps(liste, ensure_ascii=False, indent=2) + "\n",
                                     encoding="utf-8")
            print(f"  exemples.json ← flipbook ({p[0]} & {p[1]})")

    print("\n✅ Promu. Vérifie les fiches, puis :")
    print(f"   git add archetypes/{id1}.png archetypes/{id2}.png "
          f"site/public/fiches/{id1}.png site/public/fiches/{id2}.png "
          "archetypes.yaml site/lib/catalogue.json site/lib/apercus.json "
          "site/lib/exemples.json site/public/apercus/")
    print('   git commit -m "Archétypes : ' + id1 + ' + ' + id2 + '"')
    print("   git push  → après Vercel, les deux personnages sont commandables par tous.")


if __name__ == "__main__":
    main()
