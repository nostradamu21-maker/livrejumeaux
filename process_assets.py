#!/usr/bin/env python3
"""Brique 2 — détourage + montée en résolution.

Prend les images retenues d'un archétype (une par pose, sur fond uni) et produit
pour chacune un PNG transparent haute résolution, prêt pour la composition :
  1. détourage (rembg / BiRefNet + alpha matting)
  2. défrangeage des bords (extension des couleurs de premier plan sous l'alpha)
  3. upscale ×4 (Real-ESRGAN via spandrel), alpha agrandi séparément puis recombiné
  4. recadrage sur le personnage avec 2 % de marge

Usage :
    python process_assets.py selected/archetype1
    python process_assets.py selected/archetype1 --pose courir --force
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("assets")

DEFAULT_MODEL = "birefnet-general"
# CoreML EP compile/plante sur BiRefNet (macOS) : on force le CPU pour onnxruntime.
REMBG_PROVIDERS = ["CPUExecutionProvider"]
ALPHA_OPAQUE = 250  # seuil « pixel de premier plan sûr » pour le défrangeage
ALPHA_BBOX = 10  # seuil pour délimiter le personnage au recadrage
CROP_MARGIN = 0.02  # 2 % autour du personnage
ERODE_PX = 2  # contraction du masque (à la résolution native) pour tuer le liseré clair


# ---------------------------------------------------------------------------
# Étapes de traitement
# ---------------------------------------------------------------------------


def cutout(session, img: Image.Image) -> Image.Image:
    """Détoure l'image → RGBA. Le masque BiRefNet est net : l'alpha matting de rembg
    délave le contour en clair (halo), on ne l'utilise pas — on nettoie les bords
    nous-mêmes (défrangeage + bouchage des trous + légère érosion)."""
    from rembg import remove

    return remove(img, session=session, post_process_mask=True).convert("RGBA")


def refine_alpha(alpha: np.ndarray, erode_px: int = ERODE_PX) -> np.ndarray:
    """Bouche les poches de fond enfermées dans le personnage (trous de masque)
    puis contracte légèrement la silhouette pour supprimer le liseré clair."""
    a = alpha.copy()
    filled = ndimage.binary_fill_holes(a > 0)
    a[filled & (a == 0)] = 255
    if erode_px > 0:
        keep = ndimage.binary_erosion(a > 0, iterations=erode_px)
        a = (a * keep).astype(np.uint8)
    return a


def defringe(rgba: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Sépare RGB/alpha et remplace les couleurs semi/transparentes par la couleur
    de premier plan opaque la plus proche → pas de halo du fond gris aux bords."""
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    opaque = alpha >= ALPHA_OPAQUE
    if not opaque.any():
        return rgb.copy(), alpha
    # Pour chaque pixel, indices du pixel opaque le plus proche.
    idx = ndimage.distance_transform_edt(
        ~opaque, return_distances=False, return_indices=True
    )
    rgb_filled = rgb[tuple(idx)]
    return rgb_filled, alpha


def upscale_rgba(
    upscaler, rgb: np.ndarray, alpha: np.ndarray
) -> Image.Image:
    """Upscale RGB via Real-ESRGAN, alpha via LANCZOS, puis recombine en RGBA."""
    rgb_up = upscaler.upscale(rgb)  # HxWx3 uint8, dims ×scale
    h, w = rgb_up.shape[:2]
    alpha_up = np.asarray(
        Image.fromarray(alpha).resize((w, h), Image.LANCZOS)
    )
    rgba_up = np.dstack([rgb_up, alpha_up]).astype(np.uint8)
    return Image.fromarray(rgba_up)


def crop_to_subject(img: Image.Image) -> Image.Image:
    """Rogne la zone transparente en gardant 2 % de marge autour du personnage."""
    alpha = np.asarray(img)[:, :, 3]
    ys, xs = np.where(alpha > ALPHA_BBOX)
    if len(xs) == 0:
        return img
    x0, x1 = xs.min(), xs.max()
    y0, y1 = ys.min(), ys.max()
    mx = int((x1 - x0 + 1) * CROP_MARGIN)
    my = int((y1 - y0 + 1) * CROP_MARGIN)
    W, H = img.size
    box = (max(x0 - mx, 0), max(y0 - my, 0), min(x1 + 1 + mx, W), min(y1 + 1 + my, H))
    return img.crop(box)


# ---------------------------------------------------------------------------
# Planche contact + manifest
# ---------------------------------------------------------------------------


def write_contact_sheet(out_root: Path, archetype: str, assets: list[dict]) -> Path:
    sheet = out_root / "contact_sheet.html"
    cards = []
    for a in assets:
        name = Path(a["file"]).name
        dims = f'{a["width"]}×{a["height"]} px'
        cards.append(
            f'<figure><figcaption>{a["pose_id"]} — {dims}</figcaption>'
            f'<div class="pair">'
            f'<div class="cell checker"><img src="{name}" loading="lazy"></div>'
            f'<div class="cell vivid"><img src="{name}" loading="lazy"></div>'
            f"</div></figure>"
        )
    html = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Assets — {archetype}</title>
<style>
 body {{ font-family: system-ui, sans-serif; margin:2rem; background:#1e1e1e; color:#eee; }}
 h1 {{ margin-bottom:.2rem; }}
 .meta {{ color:#aaa; margin-bottom:2rem; }}
 figure {{ margin:0 0 2.5rem; }}
 figcaption {{ font-weight:600; margin-bottom:.5rem; }}
 .pair {{ display:grid; grid-template-columns:1fr 1fr; gap:1rem; }}
 .cell {{ border-radius:8px; display:flex; align-items:center; justify-content:center;
          min-height:260px; padding:1rem; }}
 .cell img {{ max-width:100%; max-height:520px; display:block; }}
 /* damier pour vérifier la transparence */
 .checker {{ background-image:
   linear-gradient(45deg,#bbb 25%,transparent 25%),
   linear-gradient(-45deg,#bbb 25%,transparent 25%),
   linear-gradient(45deg,transparent 75%,#bbb 75%),
   linear-gradient(-45deg,transparent 75%,#bbb 75%);
   background-size:24px 24px;
   background-position:0 0,0 12px,12px -12px,-12px 0; background-color:#fff; }}
 /* couleur vive pour vérifier bords/halos */
 .vivid {{ background:#ff2e88; }}
</style></head><body>
<h1>Assets détourés — {archetype}</h1>
<p class="meta">{len(assets)} poses · gauche = damier (transparence) · droite = fond vif (bords/halos)</p>
{''.join(cards)}
</body></html>
"""
    sheet.write_text(html, encoding="utf-8")
    return sheet


def _ver(pkg: str) -> str:
    try:
        return version(pkg)
    except PackageNotFoundError:
        return "inconnu"


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "input_dir", type=Path, help="Dossier selected/{archetype} (une image par pose)"
    )
    parser.add_argument("--pose", help="Ne retraiter que cette pose (id = nom de fichier)")
    parser.add_argument("--force", action="store_true", help="Retraiter même si l'asset existe")
    parser.add_argument("--output-dir", type=Path, default=Path("assets"))
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Modèle rembg (défaut birefnet-general)")
    parser.add_argument(
        "--weights", type=Path, default=Path("models/RealESRGAN_x4plus.pth")
    )
    parser.add_argument("--device", default="auto", help="auto | cpu | mps | cuda")
    args = parser.parse_args()

    input_dir = args.input_dir
    if not input_dir.is_dir():
        log.error("Dossier introuvable : %s", input_dir)
        return 2
    archetype = input_dir.name
    if not args.weights.exists():
        log.error("Poids Real-ESRGAN introuvables : %s", args.weights)
        return 2

    images = sorted(p for p in input_dir.glob("*.png") if not p.name.startswith("."))
    if args.pose:
        images = [p for p in images if p.stem == args.pose]
        if not images:
            log.error("Pose %r absente de %s", args.pose, input_dir)
            return 2
    if not images:
        log.error("Aucune image .png dans %s", input_dir)
        return 2

    out_root = args.output_dir / archetype
    out_root.mkdir(parents=True, exist_ok=True)

    # Reprise : on ne garde que ce qui reste à faire.
    todo = []
    for p in images:
        dst = out_root / f"{p.stem}.png"
        if dst.exists() and not args.force:
            log.info("Asset %-14s déjà présent — ignoré (--force pour refaire).", p.stem)
        else:
            todo.append(p)
    if not todo:
        log.info("Rien à traiter. Régénération de la planche contact uniquement.")

    # Chargement des modèles (une seule fois) si besoin.
    session = None
    upscaler = None
    if todo:
        from rembg import new_session

        log.info("Chargement du modèle de détourage : %s (CPU)…", args.model)
        session = new_session(args.model, providers=REMBG_PROVIDERS)
        log.info("Chargement de l'upscaler Real-ESRGAN (%s) …", args.weights.name)
        from upscaler import RealESRGANUpscaler

        upscaler = RealESRGANUpscaler(args.weights, device=args.device)
        log.info("Device : %s", upscaler.device)

    # Traitement.
    for p in todo:
        pid = p.stem
        log.info("Pose %-14s : détourage…", pid)
        img = Image.open(p).convert("RGB")
        cut = cutout(session, img)
        rgb, alpha = defringe(np.asarray(cut))
        alpha = refine_alpha(alpha)
        log.info("Pose %-14s : upscale ×%d…", pid, upscaler.scale)
        up = upscale_rgba(upscaler, rgb, alpha)
        final = crop_to_subject(up)
        dst = out_root / f"{pid}.png"
        final.save(dst)
        log.info("Pose %-14s ✓ %s (%d×%d px)", pid, dst.name, final.width, final.height)

    # Manifest (recense TOUS les assets présents, pas seulement ceux refaits).
    assets = []
    for p in images:
        dst = out_root / f"{p.stem}.png"
        if not dst.exists():
            continue
        with Image.open(dst) as im:
            w, h = im.size
        assets.append(
            {"pose_id": p.stem, "file": str(dst), "width": w, "height": h}
        )

    manifest = {
        "archetype": archetype,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cutout": {"tool": "rembg", "version": _ver("rembg"), "model": args.model,
                   "provider": "CPUExecutionProvider", "alpha_matting": False,
                   "edge_refine": {"defringe": True, "fill_holes": True,
                                   "erode_px": ERODE_PX}},
        "upscale": {"tool": "Real-ESRGAN via spandrel", "spandrel": _ver("spandrel"),
                    "torch": _ver("torch"), "weights": args.weights.name,
                    "device": upscaler.device if upscaler else "n/a", "scale": 4},
        "libs": {"pillow": _ver("pillow"), "numpy": _ver("numpy"),
                 "scipy": _ver("scipy"), "onnxruntime": _ver("onnxruntime")},
        "crop_margin_pct": CROP_MARGIN * 100,
        "assets": assets,
    }
    (out_root / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    log.info("Manifest écrit : %s", out_root / "manifest.json")

    sheet = write_contact_sheet(out_root, archetype, assets)
    log.info("Planche contact : %s", sheet)

    min_h = min((a["height"] for a in assets), default=0)
    if assets:
        status = "✓" if min_h >= 4000 else "⚠"
        log.info("%s Hauteur min des assets : %d px (critère ≥ 4000)", status, min_h)
    return 0


if __name__ == "__main__":
    sys.exit(main())
