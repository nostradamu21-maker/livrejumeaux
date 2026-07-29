"""Fiche PAPY SUR MESURE pour le livre test « Papy & nous » : le grand-père
est dessiné d'après SA photo, exactement comme le fera le produit final.

    python papy_test.py chemin/vers/photo-papy.jpg     # 3 propositions (~0,50 $)

Photo : visage bien visible, de face de préférence, JPEG ou PNG.
Les variantes vont dans livres/test-papy/_variantes-papy/ ; choisis la plus
ressemblante et copie-la :
    cp livres/test-papy/_variantes-papy/v2.png livres/test-papy/papy.png
Puis lance le livre :  python livre.py test-papy
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).parent
N_VARIANTES = 3
PRIX_IMAGE = 0.17  # $ par image en haute qualité (même base que livre.py)


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    photo = Path(sys.argv[1]).expanduser()
    if not photo.exists():
        sys.exit(f"Photo introuvable : {photo}")

    scenes = yaml.safe_load((ROOT / "manuscrits" / "papy.yaml").read_text(encoding="utf-8"))
    style = scenes["style"].strip()
    # Même formulation éprouvée que le sur-mesure du site (site/lib/generation.ts),
    # adaptée à un adulte : fidélité au visage réel, style figé du projet.
    prompt = (
        f"{style}. Transforme l'adulte de la photo de référence en personnage "
        "d'album jeunesse : character sheet, debout, corps entier, face au "
        "lecteur, grand sourire chaleureux, fond uni gris clair. Fidèle à la "
        "personne réelle (visage, coiffure, couleur des cheveux, lunettes "
        "éventuelles) mais entièrement stylisé aquarelle douce. Tenue simple "
        "et douce inspirée de la photo. Mains bien formées à cinq doigts. "
        "Pas de texte dans l'image."
    )

    cout = N_VARIANTES * PRIX_IMAGE
    print(f"Fiche PAPY d'après {photo.name} : {N_VARIANTES} variantes ≈ {cout:.2f} $.")
    if input("Continuer ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        sys.exit("Annulé.")

    from dotenv import dotenv_values
    from providers import build_provider
    key = dotenv_values(ROOT / ".env").get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY introuvable dans .env")
    provider = build_provider("openai", api_key=key)

    out = ROOT / "livres" / "test-papy" / "_variantes-papy"
    out.mkdir(parents=True, exist_ok=True)
    res = provider.generate(
        reference_image=photo,
        style_images=[ROOT / "style1.png", ROOT / "style2.png"],
        prompt=prompt,
        n=N_VARIANTES, size="1024x1536", quality="high")
    for j, img in enumerate(res.images, 1):
        (out / f"v{j}.png").write_bytes(img)
    if res.cost_usd:
        print(f"Généré (~{res.cost_usd:.2f} $ réels).")
    print(f"\nVariantes dans {out}/ — choisis la plus ressemblante puis :")
    print("  cp livres/test-papy/_variantes-papy/vN.png livres/test-papy/papy.png")
    print("  python livre.py test-papy")


if __name__ == "__main__":
    main()
