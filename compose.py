#!/usr/bin/env python3
"""Brique 3 — composition d'une page et export PDF imprimable.

À partir d'un décor, d'un ou deux personnages détourés et d'un texte à variables,
produit :
  - output/pages/{page_id}.pdf       gabarit d'impression (fond perdu, 300 dpi,
                                      texte VECTORIEL)
  - output/previews/{page_id}.jpg    prévisualisation écran (texte rasterisé,
                                      repères de coupe optionnels via --guides)

Format cible : livre carré 21×21 cm + 3 mm de fond perdu (doc 21,6×21,6 cm), 300 dpi.
Le décor+personnages+ombres sont composés en raster ; le texte est ajouté en
vectoriel dans le PDF (reportlab) et seulement rasterisé dans l'aperçu JPEG.

CLI :
    python compose.py --layout layouts/page-test.json --vars '{"prenom1": "Léo"}'
    python compose.py --layout layouts/page-test.json --guides
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s  %(levelname)-7s %(message)s", datefmt="%H:%M:%S"
)
log = logging.getLogger("compose")

MM_PER_INCH = 25.4


# ---------------------------------------------------------------------------
# Géométrie
# ---------------------------------------------------------------------------


class Geometry:
    """Dimensions dérivées du gabarit (tout en pixels à `dpi`)."""

    def __init__(self, trim_cm: float, bleed_mm: float, safety_mm: float, dpi: int) -> None:
        self.dpi = dpi
        self.trim_mm = trim_cm * 10.0
        self.bleed_mm = bleed_mm
        self.safety_mm = safety_mm
        self.doc_mm = self.trim_mm + 2 * bleed_mm
        self.doc_px = self._mm_to_px(self.doc_mm)
        self.bleed_px = self._mm_to_px(bleed_mm)
        # Zone de sécurité : 5 mm à l'intérieur du format fini (donc bleed+safety du bord doc).
        self.safe_min_px = self._mm_to_px(bleed_mm + safety_mm)
        self.safe_max_px = self.doc_px - self.safe_min_px
        self.pt_per_px = 72.0 / dpi
        self.doc_pt = self.doc_mm / MM_PER_INCH * 72.0

    def _mm_to_px(self, mm: float) -> int:
        return round(mm / MM_PER_INCH * self.dpi)

    def px_to_pt(self, px: float) -> float:
        return px * self.pt_per_px

    def pt_size(self, size_pt: float) -> float:
        return size_pt  # un corps en points reste en points côté PDF

    def px_size(self, size_pt: float) -> float:
        return size_pt * self.dpi / 72.0  # corps en px pour PIL / calcul de retour ligne


# ---------------------------------------------------------------------------
# Layout / variables
# ---------------------------------------------------------------------------


def load_layout(path: Path, cli_vars: dict) -> dict:
    layout = json.loads(path.read_text(encoding="utf-8"))
    layout.setdefault("page_id", path.stem)
    layout.setdefault("book", {})
    b = layout["book"]
    b.setdefault("trim_cm", 21.0)
    b.setdefault("bleed_mm", 3.0)
    b.setdefault("safety_mm", 5.0)
    b.setdefault("dpi", 300)
    layout.setdefault("characters", [])
    variables = dict(layout.get("vars", {}))
    variables.update(cli_vars)  # la CLI a priorité
    layout["_vars"] = variables
    return layout


def inject_vars(text: str, variables: dict) -> str:
    for k, v in variables.items():
        text = text.replace("{" + k + "}", str(v))
    return text


def resolve(base: Path, p: str) -> Path:
    q = Path(p)
    return q if q.is_absolute() else (base / q)


# ---------------------------------------------------------------------------
# Retour à la ligne (partagé aperçu / PDF pour des coupures identiques)
# ---------------------------------------------------------------------------


def wrap_lines(text: str, max_width_px: float, font: ImageFont.FreeTypeFont) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split(" ")
        cur = ""
        for w in words:
            trial = w if not cur else f"{cur} {w}"
            if font.getlength(trial) <= max_width_px or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
    return lines


# ---------------------------------------------------------------------------
# Décor + personnages + ombres
# ---------------------------------------------------------------------------


def prepare_background(path: Path, geo: Geometry) -> Image.Image:
    """Charge le décor et le met plein format (fond perdu compris).

    Si le décor est trop petit pour 300 dpi, on le passe dans l'upscale de la
    brique 2 (Real-ESRGAN) avant le redimensionnement de recouvrement.
    """
    target = geo.doc_px
    # Cache du décor plein format : évite de ré-upscaler à chaque page (14 pages).
    cache = path.parent / ".cache" / f"{path.stem}@{target}.png"
    if cache.exists() and cache.stat().st_mtime >= path.stat().st_mtime:
        log.info("Décor (cache) : %s", cache)
        return Image.open(cache).convert("RGB")

    bg = Image.open(path).convert("RGB")
    if min(bg.size) < target:
        log.info("Décor %dx%d < %d px : upscale ×4 (Real-ESRGAN)…", bg.width, bg.height, target)
        try:
            import numpy as np

            from upscaler import RealESRGANUpscaler

            up = RealESRGANUpscaler(Path("models/RealESRGAN_x4plus.pth"), device="auto")
            bg = Image.fromarray(up.upscale(np.asarray(bg)))
            log.info("Décor upscalé → %dx%d", bg.width, bg.height)
        except Exception as e:  # noqa: BLE001
            log.warning("Upscale du décor indisponible (%s) — redimensionnement simple.", e)
    out = _cover_resize(bg, target, target)
    cache.parent.mkdir(parents=True, exist_ok=True)
    out.save(cache)
    return out


def _cover_resize(img: Image.Image, tw: int, th: int) -> Image.Image:
    """Redimensionne en recouvrant tout le cadre (crop centré, sans déformer)."""
    scale = max(tw / img.width, th / img.height)
    nw, nh = round(img.width * scale), round(img.height * scale)
    img = img.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return img.crop((left, top, left + tw, top + th))


def _load_transformed(path: Path, char: dict) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    if char.get("mirror"):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    if char.get("rotate"):
        img = img.rotate(char["rotate"], expand=True, resample=Image.BICUBIC)
    return img


def place_character(base: Image.Image, char: dict, base_dir: Path, geo: Geometry) -> dict:
    """Colle un personnage (+ son ombre) sur `base`. Retourne sa bbox en px.

    `underlay` (optionnel) : PNG semi-transparent AU MÊME CADRE que l'asset
    (ex. ombre au sol extraite de la génération), dessiné juste sous le personnage
    avec les mêmes transformations — remplace avantageusement l'ombre synthétique.
    """
    asset = _load_transformed(resolve(base_dir, char["asset"]), char)

    target_h = char["scale"] * geo.doc_px
    ratio = target_h / asset.height
    w, h = max(1, round(asset.width * ratio)), max(1, round(target_h))
    asset = asset.resize((w, h), Image.LANCZOS)

    cx = char["x"] / 100.0 * geo.doc_px  # centre horizontal
    by = char["y"] / 100.0 * geo.doc_px  # ligne de sol (bas du personnage)
    left = round(cx - w / 2)
    top = round(by - h)

    if char.get("underlay"):
        under = _load_transformed(resolve(base_dir, char["underlay"]), char)
        under = under.resize((w, h), Image.LANCZOS)
        if base.mode == "RGBA":
            base.alpha_composite(under, (left, top))
        else:
            base.paste(under, (left, top), under)

    scfg = char.get("shadow", {})
    if scfg.get("mode") == "contact":
        _draw_contact_shadow(base, scfg, asset, left, by, w, h)
    else:
        _draw_shadow(base, scfg, cx, by, w, h)
    base.paste(asset, (left, top), asset)
    return {"left": left, "top": top, "right": left + w, "bottom": top + h,
            "label": Path(char["asset"]).stem}


def _draw_contact_shadow(base: Image.Image, cfg: dict, asset: Image.Image,
                         left: int, by: float, w: int, h: int) -> None:
    """Ombre « contact » : projection au sol de la silhouette (bande basse du perso).

    Remplit les creux entre chaussures/jambes, contrairement à l'ellipse. Params :
    opacity, blur (fraction largeur doc), height_ratio (hauteur de l'ombre en fraction
    de la LARGEUR du perso), band (bande basse de la silhouette utilisée, défaut 0.25),
    dx_ratio / dy_ratio (décalages en fraction de la largeur/hauteur du perso).
    """
    import numpy as np

    opacity = cfg.get("opacity", 0.32)
    blur = cfg.get("blur", 0.012) * base.width if cfg.get("blur", 0.012) < 1 else cfg.get("blur")
    band = cfg.get("band", 0.25)
    sh_h = max(4, int(cfg.get("height_ratio", 0.16) * w))
    dx = int(cfg.get("dx_ratio", 0.0) * w)
    dy = int(cfg.get("dy_ratio", 0.0) * h)

    alpha = np.asarray(asset)[:, :, 3]
    H, W = alpha.shape
    # support par colonne : la bande basse de la silhouette (jambes, chaussures)
    y0 = int(H * (1.0 - band))
    support = alpha[y0:, :].max(axis=0).astype(np.float32) / 255.0
    # bas réel PAR COLONNE (l'ombre drape le contour, pas une ligne droite)
    opaque = alpha > 10
    has = opaque.any(axis=0)
    bottom = np.where(has, H - 1 - opaque[::-1, :].argmax(axis=0), np.nan)
    # lissage du profil du bas (médiane grossière par interpolation des colonnes valides)
    xs = np.arange(W, dtype=np.float32)
    valid = ~np.isnan(bottom)
    if valid.sum() >= 2:
        bottom = np.interp(xs, xs[valid], bottom[valid].astype(np.float32))
    else:
        bottom = np.full(W, float(H - 1))
    k = max(3, W // 40)
    kernel = np.ones(k) / k
    bottom = np.convolve(bottom, kernel, mode="same")

    # couche ombre : cloche verticale centrée sur le bas de chaque colonne
    layer_h = H + sh_h * 2
    yy = np.arange(layer_h, dtype=np.float32)[:, None]
    dist = (yy - (bottom[None, :] + sh_h * 0.15)) / max(1.0, sh_h)
    prof = np.clip(1 - dist**2, 0, 1)
    grad = (prof * support[None, :]) * 255 * opacity
    layer = Image.fromarray(grad.astype("uint8"), "L")
    pad = int(blur * 3) + 4
    padded = Image.new("L", (layer.width + 2 * pad, layer.height + 2 * pad), 0)
    padded.paste(layer, (pad, pad))
    padded = padded.filter(ImageFilter.GaussianBlur(blur))

    top = by - h  # haut du perso sur le doc (même repère que la couche)
    px = int(left + dx - pad)
    py = int(top - pad + dy)
    shadow_rgba = Image.new("RGBA", padded.size, (30, 25, 22, 0))
    shadow_rgba.putalpha(padded)
    if base.mode == "RGBA":
        base.alpha_composite(shadow_rgba, (px, py))
    else:
        base.paste(Image.new("RGB", padded.size, (30, 25, 22)), (px, py), padded)


def _draw_shadow(base: Image.Image, cfg: dict, cx: float, by: float, w: int, h: int) -> None:
    """Ellipse douce sous le personnage, ancrage au décor."""
    opacity = cfg.get("opacity", 0.30)
    blur = cfg.get("blur", 0.03) * base.width if cfg.get("blur", 0.03) < 1 else cfg.get("blur")
    ew = cfg.get("width_ratio", 0.82) * w
    eh = cfg.get("height_ratio", 0.16) * w  # ellipse aplatie, proportionnelle à la largeur
    dy = cfg.get("dy_ratio", 0.0) * h
    dx = cfg.get("dx_ratio", 0.0) * w
    ecx, ecy = cx + dx, by + dy

    pad = int(blur * 3) + 4
    layer = Image.new("L", (int(ew + 2 * pad), int(eh + 2 * pad)), 0)
    d = ImageDraw.Draw(layer)
    d.ellipse((pad, pad, pad + ew, pad + eh), fill=int(255 * opacity))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    px = int(ecx - layer.width / 2)
    py = int(ecy - layer.height / 2)
    shadow_rgba = Image.new("RGBA", layer.size, (30, 25, 22, 0))
    shadow_rgba.putalpha(layer)
    base.alpha_composite(shadow_rgba.convert("RGBA"), (px, py)) if base.mode == "RGBA" else \
        base.paste(Image.new("RGB", layer.size, (30, 25, 22)), (px, py), layer)


# ---------------------------------------------------------------------------
# Contrôle zone de sécurité
# ---------------------------------------------------------------------------


def check_safety(box: dict, geo: Geometry, kind: str) -> list[str]:
    warns = []
    lo, hi = geo.safe_min_px, geo.safe_max_px
    if box["left"] < lo or box["top"] < lo or box["right"] > hi or box["bottom"] > hi:
        warns.append(
            f"⚠ {kind} « {box.get('label', '')} » dépasse la zone de sécurité "
            f"(5 mm) : bbox=({box['left']},{box['top']})–({box['right']},{box['bottom']}) "
            f"hors [{lo}, {hi}]."
        )
    return warns


# ---------------------------------------------------------------------------
# Texte
# ---------------------------------------------------------------------------


def text_geometry(text_cfg: dict, geo: Geometry, variables: dict):
    """Retourne (lines, font_px, box) ; box = bbox px du bloc de texte rendu."""
    content = inject_vars(text_cfg["content"], variables)
    font_path = text_cfg.get("font", "fonts/Andika-Regular.ttf")
    size_pt = text_cfg.get("size_pt", 22)
    line_spacing = text_cfg.get("line_spacing", 1.3)

    px_size = geo.px_size(size_pt)
    font = ImageFont.truetype(font_path, round(px_size))

    box_left = text_cfg["x"] / 100.0 * geo.doc_px
    box_top = text_cfg["y"] / 100.0 * geo.doc_px
    box_w = text_cfg["width"] / 100.0 * geo.doc_px
    lines = wrap_lines(content, box_w, font)

    line_h = px_size * line_spacing
    ascent, descent = font.getmetrics()
    block_h = line_h * len(lines)
    # largeur réelle max des lignes
    max_lw = max((font.getlength(ln) for ln in lines), default=0)
    align = text_cfg.get("align", "left")
    if align == "center":
        real_left = box_left + (box_w - max_lw) / 2
    elif align == "right":
        real_left = box_left + (box_w - max_lw)
    else:
        real_left = box_left
    box = {
        "left": round(real_left), "top": round(box_top),
        "right": round(real_left + max_lw), "bottom": round(box_top + block_h),
        "label": "texte",
    }
    meta = {"lines": lines, "font": font, "px_size": px_size, "line_h": line_h,
            "ascent": ascent, "box_left": box_left, "box_top": box_top, "box_w": box_w,
            "align": align, "color": text_cfg.get("color", "#3a3230"),
            "font_path": font_path, "size_pt": size_pt, "content": content}
    return meta, box


def draw_text_preview(img: Image.Image, tm: dict) -> None:
    draw = ImageDraw.Draw(img)
    anchor_x = {"left": tm["box_left"], "center": tm["box_left"] + tm["box_w"] / 2,
                "right": tm["box_left"] + tm["box_w"]}[tm["align"]]
    pil_anchor = {"left": "la", "center": "ma", "right": "ra"}[tm["align"]]
    for i, line in enumerate(tm["lines"]):
        y = tm["box_top"] + i * tm["line_h"]
        draw.text((anchor_x, y), line, font=tm["font"], fill=tm["color"], anchor=pil_anchor)


# ---------------------------------------------------------------------------
# Repères de coupe / sécurité (aperçu)
# ---------------------------------------------------------------------------


def draw_guides(img: Image.Image, geo: Geometry) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    b, s = geo.bleed_px, geo.safe_min_px
    m = geo.doc_px
    # trait de coupe (bord du format fini)
    d.rectangle((b, b, m - b, m - b), outline=(0, 150, 255, 200), width=3)
    # zone de sécurité
    d.rectangle((s, s, m - s, m - s), outline=(255, 60, 60, 160), width=2)


# ---------------------------------------------------------------------------
# Export PDF (texte vectoriel)
# ---------------------------------------------------------------------------


def export_pdf(out_pdf: Path, raster: Image.Image, tm: dict, geo: Geometry) -> None:
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader

    font_name = "PageFont"
    pdfmetrics.registerFont(TTFont(font_name, tm["font_path"]))

    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(out_pdf), pagesize=(geo.doc_pt, geo.doc_pt))
    c.setTitle(out_pdf.stem)
    c.setPageCompression(1)

    # Décor+personnages : image raster plein document.
    c.drawImage(ImageReader(raster), 0, 0, width=geo.doc_pt, height=geo.doc_pt)

    # Texte vectoriel.
    c.setFillColor(HexColor(tm["color"]))
    c.setFont(font_name, geo.pt_size(tm["size_pt"]))
    anchor_x_px = {"left": tm["box_left"], "center": tm["box_left"] + tm["box_w"] / 2,
                   "right": tm["box_left"] + tm["box_w"]}[tm["align"]]
    anchor_x_pt = geo.px_to_pt(anchor_x_px)
    for i, line in enumerate(tm["lines"]):
        baseline_px = tm["box_top"] + i * tm["line_h"] + tm["ascent"]
        y_pt = geo.doc_pt - geo.px_to_pt(baseline_px)  # origine PDF en bas à gauche
        if tm["align"] == "center":
            c.drawCentredString(anchor_x_pt, y_pt, line)
        elif tm["align"] == "right":
            c.drawRightString(anchor_x_pt, y_pt, line)
        else:
            c.drawString(anchor_x_pt, y_pt, line)
    c.showPage()
    c.save()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--layout", required=True, type=Path)
    ap.add_argument("--vars", default="{}", help='JSON, ex. \'{"prenom1": "Léo"}\'')
    ap.add_argument("--guides", action="store_true", help="Repères de coupe/sécurité sur l'aperçu")
    ap.add_argument("--out-dir", type=Path, default=Path("output"))
    ap.add_argument("--jpeg-quality", type=int, default=92)
    args = ap.parse_args()

    if not args.layout.exists():
        log.error("Layout introuvable : %s", args.layout)
        return 2
    try:
        cli_vars = json.loads(args.vars)
    except json.JSONDecodeError as e:
        log.error("--vars n'est pas du JSON valide : %s", e)
        return 2

    layout = load_layout(args.layout, cli_vars)
    base_dir = args.layout.resolve().parent.parent  # racine projet (layouts/ est à la racine)
    b = layout["book"]
    geo = Geometry(b["trim_cm"], b["bleed_mm"], b["safety_mm"], b["dpi"])
    log.info("Gabarit : %.1f×%.1f cm fini, doc %d×%d px @ %d dpi",
             geo.trim_mm / 10, geo.trim_mm / 10, geo.doc_px, geo.doc_px, geo.dpi)

    bg_path = resolve(base_dir, layout["background"])
    if not bg_path.exists():
        log.error("Décor introuvable : %s", bg_path)
        return 2
    base = prepare_background(bg_path, geo)
    if layout.get("background_mirror"):
        base = base.transpose(Image.FLIP_LEFT_RIGHT)  # ex. amener l'arbre du bon côté
    base = base.convert("RGBA")

    warnings: list[str] = []
    for char in layout["characters"]:
        cpath = resolve(base_dir, char["asset"])
        if not cpath.exists():
            log.error("Asset personnage introuvable : %s", cpath)
            return 2
        box = place_character(base, char, base_dir, geo)
        warnings += check_safety(box, geo, "personnage")

    # Texte.
    tm = None
    if layout.get("text"):
        tm, tbox = text_geometry(layout["text"], geo, layout["_vars"])
        warnings += check_safety(tbox, geo, "texte")
        log.info("Texte : « %s »", tm["content"])

    for w in warnings:
        log.warning(w)
    if not warnings:
        log.info("✓ Zone de sécurité respectée (rien à moins de 5 mm du bord de coupe).")

    base_rgb = base.convert("RGB")

    # PDF (texte vectoriel).
    out_pdf = args.out_dir / "pages" / f"{layout['page_id']}.pdf"
    if tm is not None:
        export_pdf(out_pdf, base_rgb, tm, geo)
    else:
        export_pdf_no_text(out_pdf, base_rgb, geo)
    log.info("PDF : %s", out_pdf)

    # Aperçu JPEG (texte rasterisé + repères optionnels).
    preview = base_rgb.copy().convert("RGBA")
    if tm is not None:
        draw_text_preview(preview, tm)
    if args.guides:
        draw_guides(preview, geo)
    out_jpg = args.out_dir / "previews" / f"{layout['page_id']}.jpg"
    out_jpg.parent.mkdir(parents=True, exist_ok=True)
    preview.convert("RGB").save(out_jpg, quality=args.jpeg_quality)
    log.info("Aperçu : %s", out_jpg)
    return 0


def export_pdf_no_text(out_pdf: Path, raster: Image.Image, geo: Geometry) -> None:
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader

    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(out_pdf), pagesize=(geo.doc_pt, geo.doc_pt))
    c.setPageCompression(1)
    c.drawImage(ImageReader(raster), 0, 0, width=geo.doc_pt, height=geo.doc_pt)
    c.showPage()
    c.save()


if __name__ == "__main__":
    sys.exit(main())
