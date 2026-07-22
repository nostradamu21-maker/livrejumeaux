#!/usr/bin/env python3
"""Test ponctuel — un doudou dans les bras d'un archétype validé.

Vérifie que gpt-image-1 sait ajouter un accessoire « doudou » au SECOND jumeau
sans abîmer le personnage ni le style. Génère 2 variantes à partir d'une fiche
déjà validée, sans rien toucher au pipeline.

    python test_doudou.py
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

from providers import build_provider

ROOT = Path(__file__).resolve().parent
FICHE = ROOT / "archetypes" / "g1-chatain-clair.png"
STYLES = [ROOT / "style1.png", ROOT / "style2.png"]
SORTIE = ROOT / "output" / "test-doudou"

STYLE_PROMPT = (
    "illustration aquarelle douce pour album jeunesse, contours légers, "
    "palette pastel, éclairage tendre, rendu cohérent d'une page à l'autre"
)

PROMPT = (
    f"Style : {STYLE_PROMPT}\n"
    "Conserve EXACTEMENT le même personnage que l'image de référence : même "
    "visage, même coiffure et couleur de cheveux, même carnation, MÊME TENUE "
    "(t-shirt jaune, short bleu, baskets blanches), mêmes proportions. Ne change "
    "ni l'identité ni les vêtements.\n"
    "Ajoute UNIQUEMENT ce détail : l'enfant tient dans ses bras, contre lui, un "
    "petit doudou lapin tout doux (peluche beige clair aux longues oreilles "
    "tombantes), tenu avec tendresse. Le doudou est le seul élément ajouté.\n"
    "Contraintes impératives : fond neutre uni gris clair ; un seul enfant dans "
    "l'image ; personnage entier visible dans le cadre ; mains bien formées ; "
    "pas de texte ni de logo."
)

N = 2
SIZE = "1024x1536"
QUALITY = "high"


def main() -> None:
    load_dotenv(ROOT / ".env")
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY manquant dans .env")

    provider = build_provider("openai", api_key)
    est = provider.estimate_cost(n=N, size=SIZE, quality=QUALITY)
    print(f"Génération de {N} variantes ({QUALITY}, {SIZE}) — coût estimé ~{est:.2f} $")

    result = provider.generate(
        reference_image=FICHE,
        style_images=STYLES,
        prompt=PROMPT,
        n=N,
        size=SIZE,
        quality=QUALITY,
    )

    SORTIE.mkdir(parents=True, exist_ok=True)
    for i, img in enumerate(result.images, start=1):
        chemin = SORTIE / f"v{i}.png"
        chemin.write_bytes(img)
        print(f"  écrit : {chemin}")

    if result.cost_usd is not None:
        print(f"Coût réel : {result.cost_usd:.3f} $")


if __name__ == "__main__":
    main()
