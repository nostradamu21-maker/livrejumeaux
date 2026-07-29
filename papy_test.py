"""Fiche PAPY générique pour le livre test « Papy & nous ».

    python papy_test.py          # génère 3 propositions (~0,50 $), coût annoncé avant

Les variantes vont dans livres/test-papy/_variantes-papy/ ; choisis la meilleure
et copie-la :  cp livres/test-papy/_variantes-papy/v2.png livres/test-papy/papy.png
Puis lance le livre :  python livre.py test-papy

NB : c'est la fiche du TEST uniquement. En production, le papy sera dessiné
d'après la photo du client (sur-mesure), comme décidé par Simon.
"""

from __future__ import annotations

import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).parent
N_VARIANTES = 3
PRIX_IMAGE = 0.17  # $ par image en haute qualité (même base que livre.py)

# Tenue FIXE du papy de test : ancre de cohérence, comme pour les archétypes.
DESCRIPTION = (
    "un grand-père chaleureux d'environ 65 ans, cheveux gris épais bien coiffés, "
    "sourcils gris, fines rides souriantes au coin des yeux, lunettes rondes"
)
TENUE = (
    "gilet de laine vert forêt boutonné sur une chemise à petits carreaux beige, "
    "pantalon de velours côtelé marron, chaussures de marche marron"
)


def main() -> None:
    scenes = yaml.safe_load((ROOT / "manuscrits" / "papy.yaml").read_text(encoding="utf-8"))
    style = scenes["style"].strip()
    prompt = (
        f"{style}. Character sheet d'un personnage d'album jeunesse : un SEUL "
        "adulte debout, corps entier bien visible et cadré en entier, face au "
        "lecteur, grand sourire chaleureux, fond uni gris clair. Même style "
        "aquarelle douce que les images de référence. "
        f"Le personnage est : {DESCRIPTION}. "
        f"Tenue : {TENUE}. "
        "Mains bien formées à cinq doigts, aucun texte ni logo dans l'image."
    )

    cout = N_VARIANTES * PRIX_IMAGE
    print(f"Fiche PAPY de test : {N_VARIANTES} variantes ≈ {cout:.2f} $.")
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
        reference_image=ROOT / "reference.png",
        style_images=[ROOT / "style1.png", ROOT / "style2.png"],
        prompt=prompt,
        n=N_VARIANTES, size="1024x1536", quality="high")
    for j, img in enumerate(res.images, 1):
        (out / f"v{j}.png").write_bytes(img)
    if res.cost_usd:
        print(f"Généré (~{res.cost_usd:.2f} $ réels).")
    print(f"\nVariantes dans {out}/ — choisis la meilleure puis :")
    print("  cp livres/test-papy/_variantes-papy/vN.png livres/test-papy/papy.png")
    print("  python livre.py test-papy")


if __name__ == "__main__":
    main()
