"""TEST ISOLÉ : à quoi ressemblerait un livre en style PIXAR (3D) ?

    python test_pixar.py 01 03            # deux pages du livre test-papy
    python test_pixar.py 01 --livre test-filles --n 2

Ne modifie RIEN : ni `scenes.yaml`, ni les manuscrits, ni les livres. Le style
graphique du produit est une décision structurante de Simon — ce script se
contente de régénérer une ou deux pages avec une formulation Pixar, pour qu'il
puisse comparer côte à côte et trancher. Sorties dans `output/test-pixar/`.

Si le rendu est retenu, basculer coûte cher : il faudra refaire les 14 fiches
d'archétypes, les aperçus du site et les livres déjà en cache. À décider en
connaissance de cause, pas sur un coup de tête.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import livre as moteur

ROOT = Path(__file__).resolve().parent
SORTIE = ROOT / "output" / "test-pixar"
PRIX_PAYSAGE = 0.25  # $ par image 1536x1024 en qualité haute


# Formulation PIXAR — volontairement écrite dans le même esprit que le style
# maison (matières, lumière, palette) pour que la comparaison porte sur le
# RENDU et pas sur la qualité de rédaction du prompt.
STYLE_PIXAR = (
    "Image de synthèse 3D dans le style d'un long-métrage d'animation Pixar : "
    "personnages modélisés en volume, formes rondes et attachantes, grands yeux "
    "expressifs, peau traitée en subsurface scattering avec un léger duvet, "
    "cheveux en mèches sculptées. Éclairage cinématographique doux et chaleureux, "
    "illumination globale, lumière rasante de fin de journée, ombres portées "
    "réalistes et douces. Décors riches et texturés (bois, tissu, végétation) avec "
    "une légère profondeur de champ. Palette chaude et lumineuse, tons crème, "
    "miel, vert tendre et bleu doux. Rendu haut de gamme, chaleureux et tendre, "
    "jamais photoréaliste ni inquiétant : c'est un film d'animation familial."
)

# Les fiches personnage existantes sont en 2D. Sans cette consigne, le modèle
# recopie leur aplat au lieu de passer en volume — on obtient un hybride mou.
PONT_2D_VERS_3D = (
    "IMPORTANT : les fiches de personnage fournies sont dessinées en 2D. Tu dois "
    "en conserver l'IDENTITÉ (visage, coiffure, couleurs, tenue, âge, morphologie) "
    "mais les RE-RENDRE entièrement en 3D volumétrique selon le style ci-dessus. "
    "Ne recopie pas le trait ni les aplats des fiches : sculpte les personnages en "
    "volume, avec de vraies ombres et de vrais matériaux."
)


def construire_prompt(scenes: dict, livre: dict, num: str, nb_refs: int) -> str:
    """Même squelette de prompt que livre.py, avec le style Pixar à la place."""
    p = scenes["pages"][num]
    parts = [STYLE_PIXAR, PONT_2D_VERS_3D]

    roles = livre.get("roles") or []
    if nb_refs > 1 and len(roles) >= nb_refs:
        liste = "; ".join(f"la {i}{'re' if i == 1 else 'e'} image = {r}"
                          for i, r in enumerate(roles[:nb_refs], 1))
        parts.append(
            f"IDENTIFICATION DES RÉFÉRENCES : les {nb_refs} PREMIÈRES images fournies "
            f"sont les fiches des personnages, dans cet ordre — {liste}. Chaque "
            "personnage doit être dessiné d'après SA fiche et uniquement la sienne. "
            "Chaque personnage apparaît UNE SEULE FOIS dans l'image : ne duplique "
            "personne, ne dessine jamais la version réduite d'un adulte à la place "
            "d'un enfant, ne mélange pas les visages entre les personnages.")

    if not p.get("solo"):
        parts.append(livre.get("description_paire", scenes.get("jumeaux", "")).strip())
        if scenes.get("casting"):
            parts.append(scenes["casting"])
        parts.append(
            "COMPOSITION : quand les deux enfants font la même action, ils sont côte "
            "à côte, au MÊME plan et à la même distance du lecteur, de taille "
            "identique — jamais l'un devant et l'autre loin derrière.")

    if scenes.get("format_page") == "paysage":
        parts.append(
            "CADRAGE : image au format PAYSAGE (plus large que haute). Compose la "
            "scène entière dans ce cadre horizontal : personnages et décor tiennent "
            "en entier, rien n'est coupé par les bords. Aucune zone n'a besoin d'être "
            "réservée au texte : il sera imprimé SOUS l'image.")

    parts.append(moteur.champ_page(p, livre, "scene").strip())
    if scenes.get("contraintes"):
        parts.append(scenes["contraintes"].strip())
    parts.append("Pas de texte dans l'image.")
    return " ".join(x for x in parts if x)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pages", nargs="+", help="numéros de page du manuscrit (ex. 01 03)")
    ap.add_argument("--livre", default="test-papy", help="id du livre (défaut test-papy)")
    ap.add_argument("--n", type=int, default=1, help="variantes par page (défaut 1)")
    a = ap.parse_args()

    livre, scenes, dossier = moteur.charger(a.livre)
    inconnues = [p for p in a.pages if p not in scenes["pages"]]
    if inconnues:
        sys.exit(f"Page(s) inconnue(s) : {', '.join(inconnues)}")

    refs = moteur.chemins_references(livre, dossier)
    manquantes = [r for r in refs if not Path(r).exists()]
    if manquantes:
        sys.exit("Fiches personnage introuvables :\n  "
                 + "\n  ".join(str(m) for m in manquantes))

    paysage = scenes.get("format_page") == "paysage"
    taille = "1536x1024" if paysage else "1024x1024"
    prix = PRIX_PAYSAGE if paysage else moteur.PRIX_IMAGE
    total = len(a.pages) * a.n
    print(f"TEST PIXAR sur « {a.livre} » — pages {', '.join(a.pages)}")
    print(f"{total} image(s) en {taille} ≈ {total * prix:.2f} $.")
    print("Aucun fichier du projet n'est modifié ; sorties dans output/test-pixar/.")
    if input("Continuer ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        sys.exit("Annulé.")

    from dotenv import dotenv_values
    from providers import build_provider
    key = dotenv_values(ROOT / ".env").get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY introuvable dans .env")
    provider = build_provider("openai", api_key=key)

    SORTIE.mkdir(parents=True, exist_ok=True)
    reel = 0.0
    for num in a.pages:
        print(f"  page {num} en Pixar…")
        # On N'ATTACHE PAS style1/style2.png : ces planches sont la définition du
        # style 2D maison, elles ramèneraient l'image vers l'aplat.
        res = provider.generate(
            reference_image=refs[0], style_images=list(refs[1:]),
            prompt=construire_prompt(scenes, livre, num, len(refs)),
            n=a.n, size=taille, quality="high", input_fidelity="high")
        for i, img in enumerate(res.images, 1):
            (SORTIE / f"{a.livre}-page{num}-pixar-v{i}.png").write_bytes(img)
        if res.cost_usd:
            reel += res.cost_usd

    print(f"\nTerminé (~{reel:.2f} $ réels). Images dans {SORTIE}/")
    print(f"Compare avec les pages 2D correspondantes : {dossier}/apercus/")


if __name__ == "__main__":
    main()
