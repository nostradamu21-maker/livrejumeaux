"""Upscale ×4 Real-ESRGAN via spandrel, avec tuilage pour tenir en mémoire.

L'upscale d'une transparence se fait en amont : on donne à ce module le RGB déjà
« défrangé » (couleurs de premier plan étendues sous l'alpha), et l'alpha est
agrandi séparément en LANCZOS par l'appelant, puis recombiné.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import torch


class RealESRGANUpscaler:
    def __init__(self, weights: Path, device: str = "auto", scale: int = 4) -> None:
        from spandrel import ImageModelDescriptor, ModelLoader

        self.device = _pick_device(device)
        model = ModelLoader().load_from_file(str(weights))
        if not isinstance(model, ImageModelDescriptor):
            raise TypeError("Le fichier de poids n'est pas un modèle image spandrel.")
        self.model = model.to(self.device).eval()
        self.scale = model.scale or scale
        self.name = f"Real-ESRGAN (spandrel, scale ×{self.scale})"

    def upscale(self, rgb: np.ndarray, tile: int = 512, overlap: int = 32) -> np.ndarray:
        """rgb : HxWx3 uint8 → HxWx3 uint8 agrandi ×scale.

        Repli automatique sur CPU si l'accélérateur (MPS/CUDA) échoue en cours de route.
        """
        try:
            return self._upscale(rgb, tile, overlap)
        except RuntimeError as e:
            if self.device == "cpu":
                raise
            import logging

            logging.getLogger("assets").warning(
                "Upscale %s a échoué (%s) — bascule sur CPU.", self.device, e
            )
            self.model = self.model.to("cpu")
            self.device = "cpu"
            return self._upscale(rgb, tile, overlap)

    def _upscale(self, rgb: np.ndarray, tile: int, overlap: int) -> np.ndarray:
        s = self.scale
        rgb = np.array(rgb, copy=True)  # tableau inscriptible pour torch.from_numpy
        t = (torch.from_numpy(rgb).permute(2, 0, 1).unsqueeze(0).float() / 255.0)
        _, _, h, w = t.shape
        out = torch.zeros(1, 3, h * s, w * s)

        step = tile - overlap
        ys = _starts(h, tile, step)
        xs = _starts(w, tile, step)
        for y1 in ys:
            y2 = min(y1 + tile, h)
            for x1 in xs:
                x2 = min(x1 + tile, w)
                patch = t[:, :, y1:y2, x1:x2].to(self.device)
                with torch.inference_mode():
                    sr = self.model(patch)
                # spandrel renvoie un « inference tensor » : clone + ops hors-place.
                sr = sr.clamp(0, 1).float().cpu().clone()
                # Zone « de confiance » : on jette la moitié du recouvrement sauf aux bords.
                iy1 = 0 if y1 == 0 else overlap // 2
                ix1 = 0 if x1 == 0 else overlap // 2
                iy2 = (y2 - y1) if y2 == h else (y2 - y1) - overlap // 2
                ix2 = (x2 - x1) if x2 == w else (x2 - x1) - overlap // 2
                out[:, :, (y1 + iy1) * s:(y1 + iy2) * s, (x1 + ix1) * s:(x1 + ix2) * s] = \
                    sr[:, :, iy1 * s:iy2 * s, ix1 * s:ix2 * s]

        arr = (out * 255.0).round().clamp(0, 255).squeeze(0).permute(1, 2, 0).byte().numpy()
        return arr


def _starts(size: int, tile: int, step: int) -> list[int]:
    if size <= tile:
        return [0]
    starts = list(range(0, size - tile + 1, step))
    if starts[-1] != size - tile:
        starts.append(size - tile)
    return starts


def _pick_device(device: str) -> str:
    if device != "auto":
        return device
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"
