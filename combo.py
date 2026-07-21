#!/usr/bin/env python3
"""Générateur de livres-combos — « Deux comme nous ».

Une combo = une PAIRE d'archétypes (mixage libre). Ce script prépare le
`livres/<combo>/livre.yaml` à partir de deux ids du catalogue (archetypes.yaml),
puis il ne reste plus qu'à lancer le pipeline habituel :

    python combo.py g1-chatain-clair f3-blonde-claire   # prépare la combo
    python livre.py combo-...                            # génère + trie + PDF

Principe « combo à la commande + cache » :
  - Les fiches d'archétypes (archetypes/<id>.png) sont DÉJÀ validées : on les
    réutilise TELLES QUELLES comme images de référence (aucune régénération,
    aucun drift, zéro coût) en les pré-plaçant + pré-sélectionnant.
  - Seul cas payant côté référence : les DEUX jumeaux ont le MÊME archétype —
    on génère alors une variante du SECOND avec son `distinctif` pour les
    distinguer (et mapper prénom1 / prénom2). Cette référence-là passe par le
    tri habituel de livre.py.
  - La génération des 28 pages + couverture reste faite par livre.py (coût
    annoncé là-bas) ; une fois la combo triée, elle est en cache et toute vente
    suivante de la même paire est instantanée (`livre.py <combo> --prenoms`).

Aucune image n'est générée par CE script : il n'écrit que des fichiers.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
CATALOGUE = ROOT / "archetypes.yaml"
FICHES = ROOT / "archetypes"
LIVRES = ROOT / "livres"

# Doit rester aligné avec livre.py (nombre de variantes attendues par page).
N_VARIANTES = 2

PRENOMS_DEFAUT = ["Alix", "Sacha"]  # épicènes, pour l'aperçu uniquement


# ---------------------------------------------------------------------------
# Catalogue
# ---------------------------------------------------------------------------


def charger_catalogue() -> dict:
    if not CATALOGUE.exists():
        sys.exit(f"Catalogue introuvable : {CATALOGUE}")
    data = yaml.safe_load(CATALOGUE.read_text(encoding="utf-8"))
    return data["archetypes"]


def fiche_path(aid: str) -> Path:
    return FICHES / f"{aid}.png"


def verifier(archs: dict, aid: str) -> None:
    if aid not in archs:
        dispo = ", ".join(archs)
        sys.exit(f"Archétype inconnu : {aid}\nDisponibles : {dispo}")
    if not fiche_path(aid).exists():
        sys.exit(f"Fiche non validée pour {aid} : {fiche_path(aid)}\n"
                 f"Lance d'abord `python archetypes.py`.")


def combo_id(aid1: str, aid2: str) -> str:
    """Id canonique (paire triée) → une seule combo en cache par paire."""
    a, b = sorted((aid1, aid2))
    return f"combo-{a}__{b}"


# ---------------------------------------------------------------------------
# Construction du livre.yaml
# ---------------------------------------------------------------------------


def accessoire(distinctif: str) -> str:
    """Le champ `distinctif` s'écrit « le second porte X » ; on en extrait X."""
    d = distinctif.strip()
    for prefixe in ("le second porte ", "le second "):
        if d.lower().startswith(prefixe):
            return d[len(prefixe):]
    return d


def description_paire(a: dict, b: dict, identique: bool) -> str:
    if identique:
        return (
            f"Deux enfants JUMEAUX identiques : {a['description']}, vêtus de "
            f"{a['tenue']}, entièrement fidèles à l'image de référence — même "
            "visage, mêmes cheveux, même style aquarelle. On les distingue par un "
            f"seul détail : le SECOND porte {accessoire(b['distinctif'])} (voir la "
            "deuxième image de référence) ; le PREMIER n'a pas ce détail (première "
            "image de référence). Reproduire fidèlement ces deux personnages.")
    return (
        f"Deux enfants. Le PREMIER : {a['description']}, vêtu de {a['tenue']} "
        "(voir la première image de référence). Le SECOND : "
        f"{b['description']}, vêtu de {b['tenue']} (voir la deuxième image de "
        "référence). Reproduire fidèlement CHAQUE enfant d'après SA propre image "
        "de référence, sans mélanger leurs traits ni leurs tenues.")


def construire(aid1: str, aid2: str, prenoms: list[str] | None, force: bool) -> Path:
    archs = charger_catalogue()
    verifier(archs, aid1)
    verifier(archs, aid2)

    a_id, b_id = sorted((aid1, aid2))
    identique = a_id == b_id
    a, b = archs[a_id], archs[b_id]
    cid = combo_id(aid1, aid2)
    dossier = LIVRES / cid

    if dossier.exists() and not force:
        pdf = next(dossier.glob("impression-*.pdf"), None)
        etat = "déjà en cache ✔" if pdf else "déjà préparée (pas encore de PDF)"
        print(f"Combo {cid} {etat}.")
        if pdf:
            print(f"  PDF : {pdf}")
            print(f"  → vente instantanée : python livre.py {cid} --prenoms \"A,B\"")
        else:
            print(f"  → poursuivre : python livre.py {cid}")
        return dossier

    (dossier / "variantes").mkdir(parents=True, exist_ok=True)

    personnages: list[dict] = []
    selections: dict[str, str] = {}
    # personnage 1 : toujours la fiche telle quelle (référence directe, gratuite)
    # personnage 2 : fiche directe si archétype différent ; sinon variante distinctif
    plan = [(1, a_id, a, False),
            (2, b_id, b, identique)]  # (rang, id, données, doit_generer_distinctif)

    for rang, aid, data, distinctif in plan:
        base_local = f"base-ref-{rang}.png"
        shutil.copyfile(fiche_path(aid), dossier / base_local)
        if distinctif:
            personnages.append({
                "archetype": aid,
                "base": base_local,
                "modifications": (
                    "ajoute UNIQUEMENT cet accessoire pour distinguer ce jumeau : "
                    f"{accessoire(data['distinctif'])}. Tout le reste (visage, "
                    "cheveux, tenue, style) reste strictement identique à la fiche "
                    "de référence."),
                "tenue": data["tenue"],
            })
            # laissé à générer + trier par livre.py (seule dépense côté références)
        else:
            personnages.append({
                "archetype": aid,
                "base": base_local,
                "modifications": ("aucune modification : reprends la fiche de "
                                  "référence à l'identique."),
                "tenue": data["tenue"],
            })
            # pré-placement : la fiche EST la référence, aucune génération
            vdir = dossier / "variantes" / f"page-ref-{rang}"
            vdir.mkdir(parents=True, exist_ok=True)
            for j in range(1, N_VARIANTES + 1):
                shutil.copyfile(fiche_path(aid), vdir / f"v{j}.png")
            selections[f"ref-{rang}"] = "v1"

    if prenoms is None:
        prenoms = list(PRENOMS_DEFAUT)

    libelle = f"{a_id} × {b_id}" + (" (paire identique)" if identique else "")
    livre = {
        "id": cid,
        "description": f"Combo — {libelle}",
        "archetypes": [a_id, b_id],
        "personnages": personnages,
        "description_paire": description_paire(a, b, identique),
        "prenoms_defaut": prenoms,
        "selections": selections,
    }
    (dossier / "livre.yaml").write_text(
        yaml.safe_dump(livre, allow_unicode=True, sort_keys=False), encoding="utf-8")
    return dossier


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def lister() -> None:
    archs = charger_catalogue()
    print("Archétypes disponibles :")
    for aid, d in archs.items():
        ok = "✅" if fiche_path(aid).exists() else "⚪"
        print(f"  {ok} {aid:<18} {d['genre']:<7} {d['description']}")
    combos = sorted(p.parent.name for p in LIVRES.glob("combo-*/livre.yaml"))
    if combos:
        print("\nCombos déjà en cache :")
        for c in combos:
            pdf = next((LIVRES / c).glob("impression-*.pdf"), None)
            print(f"  {'✔ PDF' if pdf else '… en cours'}  {c}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Prépare un livre-combo (paire d'archétypes).")
    ap.add_argument("archetype1", nargs="?", help="id du 1er archétype (ex. g1-chatain-clair)")
    ap.add_argument("archetype2", nargs="?", help="id du 2e archétype (ex. f3-blonde-claire)")
    ap.add_argument("--prenoms", help='prénoms d\'aperçu, ex. "Léo,Emma"')
    ap.add_argument("--force", action="store_true",
                    help="réécrit la combo même si elle existe déjà")
    ap.add_argument("--liste", action="store_true",
                    help="liste les archétypes et les combos en cache")
    args = ap.parse_args()

    if args.liste or not (args.archetype1 and args.archetype2):
        if not args.liste:
            print("Usage : python combo.py <archetype1> <archetype2> [--prenoms \"A,B\"]\n")
        lister()
        return

    prenoms = None
    if args.prenoms:
        prenoms = [p.strip() for p in args.prenoms.split(",") if p.strip()]
        if len(prenoms) != 2:
            sys.exit("--prenoms attend exactement deux prénoms séparés par une virgule.")

    dossier = construire(args.archetype1, args.archetype2, prenoms, args.force)
    if not (dossier / "livre.yaml").exists():
        return
    cid = dossier.name
    print(f"Combo préparée : {dossier}")
    print(f"  livre.yaml écrit, fiches de référence réutilisées telles quelles.")
    print(f"\nProchaine étape (génération des 28 pages + couverture, coût annoncé) :")
    print(f"  python livre.py {cid}")


if __name__ == "__main__":
    main()
