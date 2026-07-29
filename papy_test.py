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
    # PRIORITÉ N°1 : la RESSEMBLANCE. La fidélité passe en tête du prompt et de
    # façon impérative ; le style vient après. Trois pièges corrigés après le
    # premier essai (visage trop jeune et générique) :
    #  - ne PAS imposer un « grand sourire » : il refabrique tout le bas du
    #    visage. On demande l'expression de la photo.
    #  - nommer explicitement les marqueurs d'ÂGE, sinon le modèle rajeunit et
    #    arrondit systématiquement (biais « album jeunesse ».)
    #  - reproduire les lunettes RÉELLES (forme + couleur de monture).
    prompt = (
        "Portrait fidèle : dessine LA MÊME PERSONNE que sur la photo de "
        "référence, en illustration. La RESSEMBLANCE est la priorité absolue, "
        "avant toute considération de style. Conserve précisément : la forme du "
        "visage (allongé, joues creusées, pommettes marquées), l'ÂGE RÉEL et "
        "tous ses marqueurs (rides du front et du contour des yeux, plis autour "
        "de la bouche, peau mature), la coiffure exacte (implantation, longueur, "
        "mèches, couleur), la couleur des yeux, la carrure et la corpulence. "
        "Reproduis les LUNETTES telles qu'elles sont sur la photo : même forme "
        "de monture, même couleur. Garde l'EXPRESSION de la photo — sourire "
        "discret et bienveillant, bouche fermée. N'invente rien, ne rajeunis "
        "pas, n'arrondis pas le visage, ne transforme pas les traits en visage "
        "de dessin animé générique. "
        f"Rendu : {style}. Stylisation douce mais les traits distinctifs de la "
        "personne restent parfaitement reconnaissables. "
        "Character sheet : personnage debout, corps entier bien cadré en entier, "
        "face au lecteur, bras le long du corps, fond uni gris clair très clair. "
        "Tenue reprise de la photo (pull, chemise, pantalon : mêmes couleurs). "
        "Mains bien formées à cinq doigts. Pas de texte dans l'image."
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
    # La photo est la SEULE image d'entrée : les planches de style du livre
    # représentent des ENFANTS et tiraient le visage adulte vers le cartoon
    # (cause du « trop jeune » au premier essai). Le style passe par le texte.
    # input_fidelity=high : le réglage qui préserve les visages (déjà utilisé
    # côté site dans lib/generation.ts, il manquait au pipeline Python).
    res = provider.generate(
        reference_image=photo,
        style_images=[],
        prompt=prompt,
        n=N_VARIANTES, size="1024x1536", quality="high",
        input_fidelity="high")
    for j, img in enumerate(res.images, 1):
        (out / f"v{j}.png").write_bytes(img)
    if res.cost_usd:
        print(f"Généré (~{res.cost_usd:.2f} $ réels).")
    print(f"\nVariantes dans {out}/ — choisis la plus ressemblante puis :")
    print("  cp livres/test-papy/_variantes-papy/vN.png livres/test-papy/papy.png")
    print("  python livre.py test-papy")


if __name__ == "__main__":
    main()
