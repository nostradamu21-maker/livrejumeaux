"""TEST ISOLÉ : re-rendre des fiches de personnage en PIXAR (3D).

    python fiches_pixar.py --livre test-papy        # les 3 fiches du livre test papy
    python fiches_pixar.py --archetypes g1-chatain-clair f1-natte-brune
    python fiches_pixar.py --fichiers ~/Desktop/papy.png

À faire AVANT `test_pixar.py` : convertir le 2D en 3D à chaque page oblige le
modèle à réinventer le volume du visage à chaque fois, donc à dériver d'une page
à l'autre. Des fiches Pixar validées une bonne fois servent de référence stable,
exactement comme les fiches 2D aujourd'hui.

Ne modifie RIEN : les fiches d'origine ne sont pas touchées, tout sort dans
`output/test-pixar/fiches/`. Le style graphique du produit reste la décision de
Simon ; ce script sert à comparer, pas à basculer.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml

from test_pixar import STYLE_PIXAR

ROOT = Path(__file__).resolve().parent
SORTIE = ROOT / "output" / "test-pixar" / "fiches"
PRIX_FICHE = 0.25  # $ par image 1024x1536 en qualité haute


PROMPT = (
    "Re-rends CE MÊME PERSONNAGE en 3D. L'image de référence est une "
    "illustration 2D : conserve son IDENTITÉ à l'identique — même visage, même "
    "forme de tête, même coiffure et même implantation, mêmes couleurs de "
    "cheveux, de peau et d'yeux, même âge, même morphologie, même tenue avec les "
    "mêmes couleurs, mêmes accessoires (lunettes : même forme de monture, même "
    "couleur). On doit reconnaître exactement le même personnage. "
    "Mais ne recopie NI le trait NI les aplats : sculpte-le en volume, avec de "
    "vrais matériaux, de vraies ombres et du relief. "
    f"\n\nSTYLE DE RENDU : {STYLE_PIXAR}\n\n"
    "CADRAGE : fiche de personnage (character sheet) — personnage debout, corps "
    "entier entièrement visible de la tête aux pieds, face au lecteur, bras le "
    "long du corps, expression neutre et douce. Fond uni gris très clair, sans "
    "décor. Mains bien formées à cinq doigts, anatomie correcte. "
    "Pas de texte dans l'image."
)


def sources(a) -> list[Path]:
    if a.fichiers:
        return [Path(f).expanduser() for f in a.fichiers]
    if a.archetypes:
        return [ROOT / "archetypes" / f"{i}.png" for i in a.archetypes]
    livre_yaml = ROOT / "livres" / a.livre / "livre.yaml"
    if not livre_yaml.exists():
        sys.exit(f"Livre introuvable : {livre_yaml}")
    data = yaml.safe_load(livre_yaml.read_text(encoding="utf-8")) or {}
    refs = data.get("references") or []
    if not refs:
        sys.exit(f"Aucune `references` dans {livre_yaml}")
    return [ROOT / r if not Path(r).is_absolute() else Path(r) for r in refs]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--livre", default="test-papy", help="reprend les `references` du livre.yaml")
    g.add_argument("--archetypes", nargs="+", help="ids du catalogue (archetypes/<id>.png)")
    g.add_argument("--fichiers", nargs="+", help="chemins de fiches quelconques")
    ap.add_argument("--n", type=int, default=2, help="propositions par fiche (défaut 2)")
    a = ap.parse_args()

    fiches = sources(a)
    manquantes = [f for f in fiches if not f.exists()]
    if manquantes:
        sys.exit("Fiche(s) introuvable(s) :\n  " + "\n  ".join(str(m) for m in manquantes))

    total = len(fiches) * a.n
    print("FICHES EN PIXAR — " + ", ".join(f.stem for f in fiches))
    print(f"{total} image(s) en 1024x1536 ≈ {total * PRIX_FICHE:.2f} $.")
    print("Les fiches d'origine ne sont pas touchées ; sorties dans output/test-pixar/fiches/.")
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
    for f in fiches:
        print(f"  {f.stem} → Pixar…")
        # Aucune image de style jointe : style1/style2.png sont les planches du
        # style 2D maison et ramèneraient l'image vers l'aplat.
        res = provider.generate(
            reference_image=f, style_images=[], prompt=PROMPT,
            n=a.n, size="1024x1536", quality="high", input_fidelity="high")
        for i, img in enumerate(res.images, 1):
            (SORTIE / f"{f.stem}-pixar-v{i}.png").write_bytes(img)
        if res.cost_usd:
            reel += res.cost_usd

    print(f"\nTerminé (~{reel:.2f} $ réels). Fiches dans {SORTIE}/")
    print("\nSi elles te plaisent, teste des PAGES avec ces fiches-là :")
    print("  python test_pixar.py 01 27 --refs \\")
    print("      output/test-pixar/fiches/papy-pixar-v1.png \\")
    print("      output/test-pixar/fiches/perso-1-pixar-v1.png \\")
    print("      output/test-pixar/fiches/perso-2-pixar-v1.png")


if __name__ == "__main__":
    main()
