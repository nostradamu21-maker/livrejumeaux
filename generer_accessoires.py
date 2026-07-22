#!/usr/bin/env python3
"""Génère les vignettes d'aperçu des accessoires « distinctif » du sélecteur.

Décline l'archétype-échantillon g1 avec chaque accessoire (comme le test doudou),
pour que le parent voie le rendu réel dans le configurateur. Écrit les PNG dans
`site/public/accessoires/<id>.png`. Le doudou lapin, déjà généré en test, est
réutilisé tel quel (gratuit).

    python generer_accessoires.py            # medium, 1 variante/accessoire
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from dotenv import load_dotenv

from providers import build_provider

ROOT = Path(__file__).resolve().parent
FICHE = ROOT / "archetypes" / "g1-chatain-clair.png"
STYLES = [ROOT / "style1.png", ROOT / "style2.png"]
SORTIE = ROOT / "site" / "public" / "accessoires"

SIZE = "1024x1536"
QUALITY = "medium"

STYLE_PROMPT = (
    "illustration aquarelle douce pour album jeunesse, contours légers, "
    "palette pastel, éclairage tendre, rendu cohérent d'une page à l'autre"
)

# Le doudou lapin est déjà généré (test) : on le réutilise tel quel.
DEJA_GENERES = {
    "doudou-lapin": ROOT / "output" / "test-doudou" / "v1.png",
}

# id → détail à ajouter (formulé « ajoute UNIQUEMENT … »)
ACCESSOIRES = {
    "doudou-ours": "l'enfant tient dans ses bras, contre lui, un petit doudou ours "
    "en peluche tout doux (peluche brun clair aux petites oreilles rondes), tenu "
    "avec tendresse",
    "doudou-chat": "l'enfant tient dans ses bras, contre lui, un petit doudou chat "
    "en peluche tout doux (peluche gris clair aux oreilles pointues et longue queue), "
    "tenu avec tendresse",
    "lunettes": "l'enfant porte de petites lunettes rondes à fine monture dorée",
    "casquette": "l'enfant porte une petite casquette bleue posée sur la tête",
    "foulard": "l'enfant porte un foulard léger joliment noué autour du cou",
}


def prompt_pour(detail: str) -> str:
    return (
        f"Style : {STYLE_PROMPT}\n"
        "Conserve EXACTEMENT le même personnage que l'image de référence : même "
        "visage, même coiffure et couleur de cheveux, même carnation, MÊME TENUE "
        "(t-shirt jaune, short bleu, baskets blanches), mêmes proportions. Ne change "
        "ni l'identité ni les vêtements.\n"
        f"Ajoute UNIQUEMENT ce détail : {detail}. C'est le seul élément ajouté.\n"
        "Contraintes impératives : fond neutre uni gris clair ; un seul enfant dans "
        "l'image ; personnage entier visible dans le cadre ; mains bien formées ; "
        "pas de texte ni de logo."
    )


def main() -> None:
    load_dotenv(ROOT / ".env")
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("OPENAI_API_KEY manquant dans .env")

    SORTIE.mkdir(parents=True, exist_ok=True)

    # Réutilisation gratuite des déjà-générés.
    for aid, src in DEJA_GENERES.items():
        if src.exists():
            shutil.copyfile(src, SORTIE / f"{aid}.png")
            print(f"  {aid} : réutilisé (gratuit) → {SORTIE / (aid + '.png')}")

    provider = build_provider("openai", api_key)
    est = provider.estimate_cost(n=len(ACCESSOIRES), size=SIZE, quality=QUALITY)
    print(f"Génération de {len(ACCESSOIRES)} accessoire(s) ({QUALITY}, {SIZE}) "
          f"— coût estimé ~{est:.2f} $")

    total = 0.0
    for aid, detail in ACCESSOIRES.items():
        print(f"  {aid} : génération…")
        res = provider.generate(
            reference_image=FICHE,
            style_images=STYLES,
            prompt=prompt_pour(detail),
            n=1,
            size=SIZE,
            quality=QUALITY,
        )
        (SORTIE / f"{aid}.png").write_bytes(res.images[0])
        if res.cost_usd:
            total += res.cost_usd
        print(f"    → {SORTIE / (aid + '.png')}")

    print(f"Terminé — coût réel ~{total:.2f} $")


if __name__ == "__main__":
    main()
