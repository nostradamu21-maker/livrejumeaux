"""Fiche PAPY SUR MESURE pour le livre test « Papy & nous » : le grand-père
est dessiné d'après SA photo, exactement comme le fera le produit final.

Deux étapes, parce que la ressemblance se joue au nombre de PIXELS DE VISAGE.
Une fiche corps entier en 1024x1536 ne donne qu'environ 150 px de tête : le
modèle n'a pas de quoi porter des traits reconnaissables. On fabrique donc
d'abord un PORTRAIT SERRÉ (visage plein cadre, ~700 px de tête), on choisit le
plus ressemblant, puis on le déplie en fiche corps entier — à ce moment-là le
visage est déjà stylisé et validé, le modèle n'a plus qu'à le reporter.

    # étape 1 — portraits serrés (plusieurs photos = meilleure structure du visage)
    python papy_test.py portrait photo1.jpg [photo2.jpg ...]
    #   → livres/test-papy/_variantes-papy/portrait-v1.png, -v2, -v3

    # étape 2 — la fiche corps entier, à partir du portrait retenu
    python papy_test.py fiche 2
    #   → livres/test-papy/_variantes-papy/fiche-v1.png, -v2, -v3

    # puis
    cp livres/test-papy/_variantes-papy/fiche-v2.png livres/test-papy/papy.png
    python livre.py test-papy

Photos : visage bien visible. Deux ou trois angles différents (face + 3/4)
valent mieux qu'une seule photo — le modèle en déduit le VOLUME du visage.

Options : --n 4 (nombre de propositions), --sans-lecture (saute la description
de la photo par le modèle de vision).
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).parent
OUT = ROOT / "livres" / "test-papy" / "_variantes-papy"
SOURCE = OUT / "source.json"          # mémorise les photos entre les deux étapes
MODELE_VISION = "gpt-4o"

# Coût de sortie gpt-image-1 en qualité « high » (tokens image x 40 $/M).
PRIX = {"1024x1024": 0.17, "1024x1536": 0.25, "1536x1024": 0.25}


# ---------------------------------------------------------------------------
# Étape 0 : faire LIRE la photo au modèle de vision
# ---------------------------------------------------------------------------
def decrire_photo(key: str, photos: list[Path]) -> str:
    """Description morphologique écrite du visage, injectée dans les prompts.

    Le générateur d'image « regarde » la photo, mais il raisonne beaucoup mieux
    sur des ancres TEXTUELLES explicites (« menton en galoche », « sourcils
    broussailleux gris »). Décrire d'abord, dessiner ensuite : c'est quelques
    centimes et ça change beaucoup la ressemblance.
    """
    from openai import OpenAI

    contenu: list[dict] = [{
        "type": "text",
        "text": (
            "Décris le visage de cette personne pour qu'un illustrateur qui ne "
            "l'a jamais vue puisse le dessiner de mémoire et qu'on la reconnaisse. "
            "Sois factuel, précis et concis (une dizaine de lignes maximum, en "
            "français). Couvre dans l'ordre : âge apparent ; forme générale du "
            "visage et de la mâchoire ; front (hauteur, rides) ; implantation, "
            "densité, longueur et couleur exactes des cheveux ; sourcils ; forme "
            "et couleur des yeux, paupières, poches, pattes-d'oie ; nez (longueur, "
            "largeur, arête, pointe) ; bouche et lèvres ; plis nasogéniens ; joues "
            "(creusées ou pleines) ; menton ; pilosité (barbe, moustache : couleur "
            "et longueur) ; lunettes s'il y en a (forme de monture, épaisseur, "
            "couleur, position sur le nez) ; carrure et corpulence ; tenue visible "
            "avec ses couleurs. Ne dis rien du décor, de la pose ni de l'éclairage. "
            "N'invente aucun détail que tu ne vois pas."
        ),
    }]
    for p in photos:
        mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
        b64 = base64.b64encode(p.read_bytes()).decode()
        contenu.append({"type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "high"}})

    rep = OpenAI(api_key=key).chat.completions.create(
        model=MODELE_VISION,
        messages=[{"role": "user", "content": contenu}],
    )
    return (rep.choices[0].message.content or "").strip()


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
def _style() -> str:
    scenes = yaml.safe_load((ROOT / "manuscrits" / "papy.yaml").read_text(encoding="utf-8"))
    return scenes["style"].strip()


# Règles héritées du premier essai raté (visage rajeuni, arrondi, générique) :
#  - la FIDÉLITÉ passe en tête et de façon impérative, le style vient après ;
#  - ne jamais imposer « grand sourire » (ça refabrique tout le bas du visage) ;
#  - nommer explicitement les marqueurs d'ÂGE, sinon le modèle rajeunit ;
#  - reproduire les lunettes RÉELLES (forme + couleur de monture) ;
#  - ne PAS joindre style1/style2.png : ces planches montrent des ENFANTS et
#    tirent un visage adulte vers le cartoon enfantin.
_FIDELITE = (
    "Dessine LA MÊME PERSONNE que sur la ou les photos de référence. La "
    "RESSEMBLANCE est la priorité absolue, avant toute considération de style : "
    "si un choix graphique s'oppose à la ressemblance, c'est la ressemblance qui "
    "gagne. Conserve la forme exacte du visage et de la mâchoire, l'ÂGE RÉEL "
    "avec tous ses marqueurs (rides du front et du contour des yeux, plis "
    "nasogéniens, paupières tombantes, peau mature), l'implantation et la "
    "coiffure exactes, la couleur des cheveux et des yeux, la forme du nez, de "
    "la bouche et du menton, la pilosité, la carrure et la corpulence. "
    "Reproduis les LUNETTES telles qu'elles sont : même forme de monture, même "
    "épaisseur, même couleur. Garde l'EXPRESSION de la photo, bouche fermée ou "
    "sourire discret. N'invente rien, ne rajeunis pas, n'arrondis pas le "
    "visage, ne lisse pas la peau, ne fabrique pas un visage de dessin animé "
    "générique."
)


def prompt_portrait(description: str) -> str:
    return (
        "Portrait fidèle, en illustration. " + _FIDELITE + " "
        + (f"\n\nSIGNALEMENT à respecter point par point : {description}\n\n" if description else " ")
        + f"Rendu : {_style()}. Stylisation douce, mais chaque trait distinctif "
        "de la personne reste parfaitement reconnaissable. "
        "CADRAGE : portrait serré, tête et épaules uniquement, le visage occupe "
        "la plus grande partie de l'image, de face, regard vers le lecteur. "
        "Fond uni gris très clair. Pas de texte dans l'image."
    )


def prompt_fiche(description: str) -> str:
    return (
        "La PREMIÈRE image est le portrait déjà validé de ce personnage : "
        "reprends son visage EXACTEMENT, trait pour trait, sans le redessiner "
        "ni le réinterpréter — même forme de visage, mêmes rides, mêmes "
        "lunettes, même coiffure, même expression. Les images suivantes sont "
        "les photos de la vraie personne, pour contrôle. "
        "Ta seule tâche est de montrer ce MÊME personnage en pied. " + _FIDELITE
        + (f"\n\nSIGNALEMENT à respecter point par point : {description}\n\n" if description else " ")
        + f"Rendu : {_style()}. "
        "Character sheet : personnage debout, corps entier entièrement visible "
        "de la tête aux pieds, face au lecteur, bras le long du corps, fond uni "
        "gris très clair. Tenue reprise de la photo (pull, chemise, pantalon, "
        "chaussures : mêmes couleurs). Mains bien formées à cinq doigts, "
        "anatomie correcte. Pas de texte dans l'image."
    )


# ---------------------------------------------------------------------------
def _cle() -> str:
    from dotenv import dotenv_values
    key = dotenv_values(ROOT / ".env").get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY introuvable dans .env")
    return key


def _confirmer(quoi: str, n: int, taille: str) -> None:
    cout = n * PRIX[taille]
    print(f"{quoi} : {n} proposition(s) en {taille} ≈ {cout:.2f} $.")
    if input("Continuer ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        sys.exit("Annulé.")


def _generer(key: str, *, ref: Path, extras: list[Path], prompt: str,
             n: int, taille: str, prefixe: str) -> None:
    from providers import build_provider
    provider = build_provider("openai", api_key=key)
    res = provider.generate(
        reference_image=ref, style_images=extras, prompt=prompt,
        n=n, size=taille, quality="high", input_fidelity="high")
    OUT.mkdir(parents=True, exist_ok=True)
    for j, img in enumerate(res.images, 1):
        (OUT / f"{prefixe}-v{j}.png").write_bytes(img)
    if res.cost_usd:
        print(f"Généré (~{res.cost_usd:.2f} $ réels).")


def etape_portrait(photos: list[Path], n: int, lecture: bool) -> None:
    for p in photos:
        if not p.exists():
            sys.exit(f"Photo introuvable : {p}")
    _confirmer(f"PORTRAITS d'après {len(photos)} photo(s)", n, "1024x1024")
    key = _cle()

    description = ""
    if lecture:
        print("Lecture de la photo par le modèle de vision…")
        try:
            description = decrire_photo(key, photos)
            print("\n--- signalement retenu ---\n" + description + "\n--------------------------\n")
        except Exception as e:                                   # noqa: BLE001
            print(f"  (lecture impossible : {e} — on continue sans signalement)")

    _generer(key, ref=photos[0], extras=photos[1:], prompt=prompt_portrait(description),
             n=n, taille="1024x1024", prefixe="portrait")
    OUT.mkdir(parents=True, exist_ok=True)
    SOURCE.write_text(json.dumps(
        {"photos": [str(p) for p in photos], "description": description},
        ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nPortraits dans {OUT}/ — ouvre-les côte à côte avec la photo,")
    print("repère le numéro du plus ressemblant, puis :")
    print("  python papy_test.py fiche <numéro>")


def etape_fiche(numero: int, n: int) -> None:
    portrait = OUT / f"portrait-v{numero}.png"
    if not portrait.exists():
        sys.exit(f"{portrait} introuvable — lance d'abord l'étape « portrait ».")
    src = json.loads(SOURCE.read_text(encoding="utf-8")) if SOURCE.exists() else {}
    photos = [Path(p) for p in src.get("photos", []) if Path(p).exists()]
    description = src.get("description", "")

    _confirmer(f"FICHE corps entier d'après portrait-v{numero}", n, "1024x1536")
    _generer(_cle(), ref=portrait, extras=photos, prompt=prompt_fiche(description),
             n=n, taille="1024x1536", prefixe="fiche")

    print(f"\nFiches dans {OUT}/ — choisis la meilleure puis :")
    print("  cp livres/test-papy/_variantes-papy/fiche-vN.png livres/test-papy/papy.png")
    print("  python livre.py test-papy")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="etape", required=True)

    p1 = sub.add_parser("portrait", help="portraits serrés d'après photo(s)")
    p1.add_argument("photos", nargs="+", help="une ou plusieurs photos du visage")
    p1.add_argument("--n", type=int, default=3)
    p1.add_argument("--sans-lecture", action="store_true",
                    help="ne pas faire décrire la photo par le modèle de vision")

    p2 = sub.add_parser("fiche", help="fiche corps entier à partir du portrait retenu")
    p2.add_argument("numero", type=int, help="numéro du portrait choisi (1, 2, 3…)")
    p2.add_argument("--n", type=int, default=3)

    a = ap.parse_args()
    if a.etape == "portrait":
        etape_portrait([Path(p).expanduser() for p in a.photos], a.n, not a.sans_lecture)
    else:
        etape_fiche(a.numero, a.n)


if __name__ == "__main__":
    main()
