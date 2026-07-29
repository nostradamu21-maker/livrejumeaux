"""Fiche de personnage SUR MESURE, dessinée d'après PHOTO.

Remplace l'ancien `papy_test.py`, qui ne savait faire qu'un grand-père dans le
style maison. Marche pour n'importe qui, dans le style du produit ou en Pixar.

    # 1. portraits serrés (plusieurs photos = meilleure structure du visage)
    python perso_photo.py portrait ~/Desktop/papy.jpg --nom papy --adulte
    python perso_photo.py portrait ~/Desktop/elia.jpg --nom elia --style pixar

    # 2. la fiche corps entier, à partir du portrait retenu
    python perso_photo.py fiche portrait-v2 --nom papy --adulte

    # RATTRAPAGE, seulement si une image est nettement à côté
    python perso_photo.py affiner fiche-v1 --nom papy

Sorties dans `output/personnages/<nom>/` (ou `<nom>-pixar/`). Rien du projet
n'est modifié : la fiche retenue se copie ensuite à la main là où il faut.

POURQUOI DEUX ÉTAPES : la ressemblance se joue au nombre de PIXELS DE VISAGE.
Sur une fiche corps entier 1024x1536, la tête fait ~150 px — le modèle n'a pas
de quoi porter des traits reconnaissables, quel que soit le prompt. On fabrique
donc d'abord un portrait serré (~700 px de tête), on le valide, puis on le
déplie en pied : à ce moment-là le visage est déjà validé, il n'y a plus qu'à
le reporter.

Photos : visage bien visible. Deux ou trois angles (face + 3/4) valent mieux
qu'une seule photo — le modèle en déduit le VOLUME du visage.

Options : --n 4 (propositions), --sans-lecture (saute la description de la photo
par le modèle de vision), --manuscrit papy (d'où vient le style maison).
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
MODELE_VISION = "gpt-4o"

# Coût de sortie gpt-image-1 en qualité « high » (tokens image x 40 $/M).
PRIX = {"1024x1024": 0.17, "1024x1536": 0.25, "1536x1024": 0.25}


def dossier(nom: str, style: str) -> Path:
    return ROOT / "output" / "personnages" / (nom if style == "maison" else f"{nom}-{style}")


def style_texte(style: str, manuscrit: str) -> str:
    if style == "pixar":
        from test_pixar import STYLE_PIXAR
        return STYLE_PIXAR
    src = ROOT / "manuscrits" / f"{manuscrit}.yaml" if manuscrit else ROOT / "scenes.yaml"
    if not src.exists():
        sys.exit(f"Manuscrit introuvable : {src}")
    return yaml.safe_load(src.read_text(encoding="utf-8"))["style"].strip()


# ---------------------------------------------------------------------------
# Faire LIRE la photo au modèle de vision avant de dessiner
# ---------------------------------------------------------------------------
def decrire_photo(key: str, photos: list[Path]) -> str:
    """Signalement morphologique écrit, injecté dans les prompts.

    Le générateur d'image « regarde » la photo, mais il raisonne beaucoup mieux
    sur des ancres TEXTUELLES explicites (« menton en galoche », « sourcils
    broussailleux gris »). Décrire d'abord, dessiner ensuite : quelques centimes,
    et ça change beaucoup la ressemblance.
    """
    from openai import OpenAI

    contenu: list[dict] = [{
        "type": "text",
        "text": (
            "Décris le visage de cette personne pour qu'un illustrateur qui ne "
            "l'a jamais vue puisse le dessiner de mémoire et qu'on la reconnaisse. "
            "Sois factuel, précis et concis (une dizaine de lignes maximum, en "
            "français). Couvre dans l'ordre : âge apparent ; forme générale du "
            "visage et de la mâchoire ; front ; implantation, densité, longueur et "
            "couleur exactes des cheveux ; sourcils ; forme et couleur des yeux, "
            "paupières ; nez (longueur, largeur, arête, pointe) ; bouche et lèvres ; "
            "joues ; menton ; pilosité s'il y en a ; lunettes s'il y en a (forme de "
            "monture, épaisseur, couleur) ; carrure et corpulence ; tenue visible "
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
        model=MODELE_VISION, messages=[{"role": "user", "content": contenu}])
    return (rep.choices[0].message.content or "").strip()


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
# Règles héritées du premier essai raté (visage rajeuni, arrondi, générique) :
#  - la FIDÉLITÉ passe en tête et de façon impérative, le style vient après ;
#  - ne jamais imposer « grand sourire » (ça refabrique tout le bas du visage) ;
#  - pour un adulte, nommer les marqueurs d'ÂGE, sinon le modèle rajeunit ;
#  - ne PAS joindre style1/style2.png : ces planches montrent des ENFANTS et
#    tirent un visage adulte vers le cartoon enfantin.
_FIDELITE = (
    "Dessine LA MÊME PERSONNE que sur la ou les photos de référence. La "
    "RESSEMBLANCE est la priorité absolue, avant toute considération de style : "
    "si un choix graphique s'oppose à la ressemblance, c'est la ressemblance qui "
    "gagne. Conserve la forme exacte du visage et de la mâchoire, l'implantation "
    "et la coiffure exactes, la couleur des cheveux et des yeux, la forme du nez, "
    "de la bouche et du menton, la carrure et la corpulence. Garde l'EXPRESSION "
    "de la photo, bouche fermée ou sourire discret. N'invente rien, n'arrondis "
    "pas le visage, ne fabrique pas un visage de dessin animé générique."
)
_ADULTE = (
    " Respecte l'ÂGE RÉEL et tous ses marqueurs : rides du front et du contour "
    "des yeux, plis nasogéniens, paupières tombantes, peau mature. Ne rajeunis "
    "pas, ne lisse pas la peau. Reproduis les LUNETTES telles qu'elles sont : "
    "même forme de monture, même épaisseur, même couleur."
)


def _signalement(d: str) -> str:
    return f"\n\nSIGNALEMENT à respecter point par point : {d}\n\n" if d else " "


def prompt_portrait(desc: str, style: str, adulte: bool) -> str:
    return (
        "Portrait fidèle. " + _FIDELITE + (_ADULTE if adulte else "")
        + _signalement(desc)
        + f"STYLE DE RENDU : {style} "
        "Chaque trait distinctif de la personne reste parfaitement reconnaissable. "
        "CADRAGE : portrait serré, tête et épaules uniquement, le visage occupe la "
        "plus grande partie de l'image, de face, regard vers le lecteur. Fond uni "
        "gris très clair. Pas de texte dans l'image."
    )


def prompt_fiche(desc: str, style: str, adulte: bool) -> str:
    return (
        "La PREMIÈRE image est le portrait déjà validé de ce personnage : reprends "
        "son visage EXACTEMENT, trait pour trait, sans le redessiner ni le "
        "réinterpréter — même forme de visage, même coiffure, même expression. Les "
        "images suivantes sont les photos de la vraie personne, pour contrôle. Ta "
        "seule tâche est de montrer ce MÊME personnage en pied. "
        + _FIDELITE + (_ADULTE if adulte else "") + _signalement(desc)
        + f"STYLE DE RENDU : {style} "
        "CADRAGE : fiche de personnage (character sheet) — debout, corps entier "
        "entièrement visible de la tête aux pieds, face au lecteur, bras le long du "
        "corps, fond uni gris très clair. Tenue reprise de la photo, mêmes couleurs. "
        "Mains bien formées à cinq doigts, anatomie correcte. Pas de texte."
    )


# Passe de CORRECTION COMPARATIVE — trouvée par Simon, qui obtenait mieux que le
# pipeline en donnant simplement l'illustration + la photo avec « améliore
# l'image pour qu'il ressemble plus à la photo ». Corriger est plus facile que
# générer : le style, le cadrage et la pose sont déjà là.
# ATTENTION — c'est un RATTRAPAGE, pas une étape de la chaîne. Ça gagne gros sur
# une base ratée et ça FAIT PERDRE sur une base déjà bonne : le modèle repeint et
# dégrade ce qui était juste. Constaté sur le papy.
def prompt_affiner() -> str:
    return (
        "La PREMIÈRE image est une illustration de cette personne. Les images "
        "suivantes sont ses vraies photos. Améliore l'illustration pour qu'elle "
        "ressemble beaucoup plus à la photo. Corrige les proportions du visage et "
        "de la mâchoire, l'implantation et la coupe des cheveux, la forme des yeux, "
        "du nez, de la bouche et du menton, l'âge et les rides, la forme et la "
        "couleur des lunettes. Ne change RIEN d'autre : même style d'illustration, "
        "même cadrage, même pose, même expression, même tenue, même fond. Ne "
        "travaille que la ressemblance. Pas de texte dans l'image."
    )


# ---------------------------------------------------------------------------
def _cle() -> str:
    from dotenv import dotenv_values
    key = dotenv_values(ROOT / ".env").get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY introuvable dans .env")
    return key


def _confirmer(quoi: str, n: int, taille: str) -> None:
    print(f"{quoi} : {n} proposition(s) en {taille} ≈ {n * PRIX[taille]:.2f} $.")
    if input("Continuer ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        sys.exit("Annulé.")


def _generer(key: str, out: Path, *, ref: Path, extras: list[Path], prompt: str,
             n: int, taille: str, prefixe: str) -> None:
    from providers import build_provider
    res = build_provider("openai", api_key=key).generate(
        reference_image=ref, style_images=extras, prompt=prompt,
        n=n, size=taille, quality="high", input_fidelity="high")
    out.mkdir(parents=True, exist_ok=True)
    for j, img in enumerate(res.images, 1):
        (out / f"{prefixe}-v{j}.png").write_bytes(img)
    if res.cost_usd:
        print(f"Généré (~{res.cost_usd:.2f} $ réels).")


def _resoudre(out: Path, nom: str, defaut: str = "portrait") -> Path:
    """Accepte « 2 », « portrait-v2 », « portrait-v2.png » ou un chemin complet."""
    if nom.isdigit():
        nom = f"{defaut}-v{nom}"
    p = Path(nom).expanduser()
    if not p.exists():
        p = out / (nom if nom.endswith(".png") else f"{nom}.png")
    if not p.exists():
        dispo = sorted(f.name for f in out.glob("*.png")) if out.exists() else []
        sys.exit(f"« {nom} » introuvable dans {out}/.\nDisponibles : "
                 + (", ".join(dispo) if dispo else "aucun (lance d'abord « portrait »)"))
    return p


def _source(out: Path) -> tuple[list[Path], str]:
    f = out / "source.json"
    d = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    return [Path(p) for p in d.get("photos", []) if Path(p).exists()], d.get("description", "")


# ---------------------------------------------------------------------------
def etape_portrait(a) -> None:
    out = dossier(a.nom, a.style)
    photos = [Path(p).expanduser() for p in a.photos]
    for p in photos:
        if not p.exists():
            sys.exit(f"Photo introuvable : {p}")
    _confirmer(f"PORTRAITS de « {a.nom} » ({a.style}) d'après {len(photos)} photo(s)",
               a.n, "1024x1024")
    key = _cle()

    desc = ""
    if not a.sans_lecture:
        print("Lecture de la photo par le modèle de vision…")
        try:
            desc = decrire_photo(key, photos)
            print("\n--- signalement retenu ---\n" + desc + "\n--------------------------\n")
        except Exception as e:                                   # noqa: BLE001
            print(f"  (lecture impossible : {e} — on continue sans signalement)")

    _generer(key, out, ref=photos[0], extras=photos[1:],
             prompt=prompt_portrait(desc, style_texte(a.style, a.manuscrit), a.adulte),
             n=a.n, taille="1024x1024", prefixe="portrait")
    (out / "source.json").write_text(json.dumps(
        {"photos": [str(p) for p in photos], "description": desc},
        ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nPortraits dans {out}/ — compare-les à la photo, puis :")
    print(f"  python perso_photo.py fiche 1 --nom {a.nom}"
          + (f" --style {a.style}" if a.style != "maison" else "")
          + (" --adulte" if a.adulte else ""))


def etape_fiche(a) -> None:
    out = dossier(a.nom, a.style)
    portrait = _resoudre(out, a.image)
    photos, desc = _source(out)
    _confirmer(f"FICHE corps entier de « {a.nom} » d'après {portrait.name}",
               a.n, "1024x1536")
    _generer(_cle(), out, ref=portrait, extras=photos,
             prompt=prompt_fiche(desc, style_texte(a.style, a.manuscrit), a.adulte),
             n=a.n, taille="1024x1536", prefixe="fiche")
    print(f"\nFiches dans {out}/ — choisis la meilleure et copie-la où il faut,")
    print("par exemple :  cp {}/fiche-v1.png livres/test-papy/papy.png".format(out))


def etape_affiner(a) -> None:
    out = dossier(a.nom, a.style)
    image = _resoudre(out, a.image)
    photos, _ = _source(out)
    if not photos:
        sys.exit("Photos d'origine introuvables — relance l'étape « portrait ».")
    from PIL import Image
    with Image.open(image) as im:
        taille = "1024x1536" if im.height > im.width else "1024x1024"
    _confirmer(f"CORRECTION de {image.name} d'après {len(photos)} photo(s)", a.n, taille)
    prefixe = f"{image.stem}-plus"
    _generer(_cle(), out, ref=image, extras=photos, prompt=prompt_affiner(),
             n=a.n, taille=taille, prefixe=prefixe)
    print(f"\nCorrections dans {out}/ ({prefixe}-v1…).")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="etape", required=True)

    def commun(p):
        p.add_argument("--nom", required=True, help="nom du personnage (dossier de sortie)")
        p.add_argument("--style", default="maison", choices=["maison", "pixar"])
        p.add_argument("--manuscrit", default="", help="manuscrit d'où vient le style maison")
        p.add_argument("--adulte", action="store_true", help="ajoute les marqueurs d'âge")
        p.add_argument("--n", type=int, default=3)

    p1 = sub.add_parser("portrait", help="portraits serrés d'après photo(s)")
    p1.add_argument("photos", nargs="+")
    p1.add_argument("--sans-lecture", action="store_true")
    commun(p1)

    p2 = sub.add_parser("fiche", help="fiche corps entier depuis le portrait retenu")
    p2.add_argument("image", help="« 1 », « portrait-v1 » ou un chemin")
    commun(p2)

    p3 = sub.add_parser("affiner", help="RATTRAPAGE : corriger une image ratée")
    p3.add_argument("image")
    commun(p3)

    a = ap.parse_args()
    {"portrait": etape_portrait, "fiche": etape_fiche, "affiner": etape_affiner}[a.etape](a)


if __name__ == "__main__":
    main()
