"""Produit CADRE — affiche encadrée des deux jumeaux (aquarelle + prénoms).

    python affiche.py <livre-id>                          # prépare + génère + trie
    python affiche.py <livre-id> --prenoms "A,B" --taille 30x40   # PDF d'impression
    python affiche.py <livre-id> --prenoms "A,B" --toutes         # les 4 tailles

L'illustration est une unité « affiche » du livre (flag `affiche: true` dans
livre.yaml) : générée une fois par paire (portrait 1024×1536, ~0,17 $), triée
comme les pages (tri local ou --tri-web), puis MISE EN CACHE — toutes les
commandes de cadre suivantes de la même paire sont instantanées et gratuites
(prénoms injectés en texte vectoriel).

Sortie : livres/<id>/affiche-<P1>-<P2>-<taille>.pdf (avec fond perdu 3 mm)
+ aperçu livres/<id>/apercus/affiche.jpg. Expédition : expedier.py (produit
cadre, uid Gelato par taille via GELATO_CADRE_<TAILLE> dans .env).
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import livre as moteur

ROOT = Path(__file__).resolve().parent

# Tailles du produit (mm, sans fond perdu) — mêmes clés que le site et expedier.py.
TAILLES = {
    "21x30": (210, 300),
    "30x40": (300, 400),
    "40x50": (400, 500),
    "50x70": (500, 700),
}
FOND_PERDU_MM = 3
DPI = 300


def composer(livre_id: str, prenoms: tuple[str, str], taille: str) -> Path:
    """Compose le PDF d'impression du cadre : illustration validée recadrée à la
    taille (fond perdu compris) + prénoms en texte vectoriel (halo doux)."""
    from PIL import Image
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
    import io

    livre, _, dossier = moteur.charger(livre_id)
    sel = livre.get("selections", {}).get("affiche")
    if not sel:
        raise SystemExit("Affiche pas encore générée/triée — lance : "
                         f"python affiche.py {livre_id}")
    if taille not in TAILLES:
        raise SystemExit(f"Taille inconnue : {taille} (choix : {', '.join(TAILLES)})")

    l_mm, h_mm = TAILLES[taille]
    L, H = l_mm + 2 * FOND_PERDU_MM, h_mm + 2 * FOND_PERDU_MM
    MM = 72.0 / 25.4
    cible_px = (int(L * DPI / 25.4), int(H * DPI / 25.4))

    art = Image.open(moteur.variantes_dir(dossier, "affiche") / f"{sel}.png").convert("RGB")
    # Upscale Real-ESRGAN si la source est trop petite pour la taille demandée.
    if art.width < cible_px[0] or art.height < cible_px[1]:
        try:
            from upscaler import RealESRGANUpscaler
            import numpy as np
            print("Upscale Real-ESRGAN ×4…")
            up = RealESRGANUpscaler(ROOT / "models/RealESRGAN_x4plus.pth", device="auto")
            art = Image.fromarray(up.upscale(np.asarray(art)))
        except Exception as e:  # noqa: BLE001
            print(f"(upscale indisponible : {e} — interpolation simple)")
    # Recadrage « cover » au ratio de la taille.
    ratio = cible_px[0] / cible_px[1]
    aw, ah = art.size
    if aw / ah > ratio:
        nw = int(ah * ratio)
        art = art.crop(((aw - nw) // 2, 0, (aw + nw) // 2, ah))
    else:
        nh = int(aw / ratio)
        art = art.crop((0, (ah - nh) // 2, aw, (ah + nh) // 2))
    art = art.resize(cible_px, Image.LANCZOS)

    p1, p2 = prenoms
    pdf_path = dossier / (f"affiche-{p1}-{p2}-{taille}.pdf".replace(" ", "_"))
    pdfmetrics.registerFont(TTFont("AffTitre", str(ROOT / "fonts/Andika-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("AffTexte", str(ROOT / "fonts/Andika-Regular.ttf")))
    c = canvas.Canvas(str(pdf_path), pagesize=(L * MM, H * MM))
    buf = io.BytesIO()
    art.save(buf, "JPEG", quality=92)
    buf.seek(0)
    c.drawImage(ImageReader(buf), 0, 0, width=L * MM, height=H * MM)

    def _halo(x, y, txt, fonte, pts):
        c.setFont(fonte, pts)
        c.saveState(); c.setFillColor(HexColor("#ffffff")); c.setFillAlpha(0.78)
        for dx, dy in ((-.7, 0), (.7, 0), (0, -.7), (0, .7),
                       (-.5, -.5), (.5, .5), (-.5, .5), (.5, -.5)):
            c.drawCentredString(x + dx * MM, y + dy * MM, txt)
        c.restoreState()
        c.setFillColor(HexColor("#3a3230"))
        c.drawCentredString(x, y, txt)

    # Prénoms dans le tiers bas (zone calme prévue par la scène), taille
    # proportionnelle à l'affiche.
    corps = H * MM * 0.052
    _halo(L * MM / 2, H * MM * 0.115, f"{p1} & {p2}", "AffTitre", corps)
    _halo(L * MM / 2, H * MM * 0.115 - corps * 0.95, "deux comme nous", "AffTexte",
          corps * 0.38)
    c.showPage()
    c.save()

    (dossier / "apercus").mkdir(exist_ok=True)
    apercu = art.copy()
    apercu.thumbnail((900, 1300))
    apercu.save(dossier / "apercus" / "affiche.jpg", quality=88)
    print(f"🖼️ PDF cadre : {pdf_path}")
    return pdf_path


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("livre", help="id du livre/combo (dossier dans livres/)")
    ap.add_argument("--prenoms", help='"Prenom1,Prenom2" pour le PDF d\'impression')
    ap.add_argument("--taille", help=f"taille du cadre : {', '.join(TAILLES)}")
    ap.add_argument("--toutes", action="store_true", help="PDF des 4 tailles")
    ap.add_argument("--tri-web", action="store_true", help="tri depuis le téléphone")
    args = ap.parse_args()

    livre, _, dossier = moteur.charger(args.livre)

    # 1. Activer l'unité « affiche » si absente, puis générer + trier via la
    #    machine à états habituelle (coût annoncé par livre.py).
    if not livre.get("affiche"):
        livre["affiche"] = True
        moteur.sauver(livre, dossier)
        print("Unité « affiche » activée pour ce livre.")
    if "affiche" not in livre.get("selections", {}):
        cmdline = [sys.executable, "livre.py", args.livre] + \
                  (["--tri-web"] if args.tri_web else [])
        print("Génération + tri de l'affiche (machine à états livre.py)…")
        r = subprocess.run(cmdline, cwd=ROOT)
        if r.returncode != 0:
            raise SystemExit("Échec de livre.py")
        livre, _, dossier = moteur.charger(args.livre)
        if "affiche" not in livre.get("selections", {}):
            print("Affiche pas encore triée — relance quand le tri est fait.")
            return

    # 2. PDF d'impression si prénoms fournis.
    if args.prenoms:
        p1, p2 = [s.strip() for s in args.prenoms.split(",")]
        tailles = list(TAILLES) if args.toutes else [args.taille or "30x40"]
        for t in tailles:
            composer(args.livre, (p1, p2), t)
    else:
        print(f"Affiche validée ✔ — PDF : python affiche.py {args.livre} "
              f'--prenoms "A,B" --taille 30x40 (ou --toutes)')


if __name__ == "__main__":
    main()
