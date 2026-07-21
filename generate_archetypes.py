#!/usr/bin/env python3
"""Brique 1 — génération d'archétypes cohérents à travers plusieurs poses.

À partir d'une image de référence de personnage, génère ce même personnage
dans une liste de poses, en plusieurs variantes, via une API d'édition d'image
à référence (OpenAI gpt-image par défaut).

Usage :
    python generate_archetypes.py config.yaml
    python generate_archetypes.py config.yaml --pose courir
    python generate_archetypes.py config.yaml --force --yes
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml
from dotenv import load_dotenv

from providers import GenerationResult, ImageProvider, build_provider

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("archetypes")


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------


def load_config(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)
    if not isinstance(cfg, dict):
        raise ValueError("Le fichier de config doit être un mapping YAML.")

    cfg.setdefault("variants_per_pose", 4)
    cfg.setdefault("style_images", [])
    cfg.setdefault("style_prompt", "")
    cfg.setdefault("negative_constraints", [])
    cfg.setdefault("provider", "openai")
    cfg.setdefault("model", "gpt-image-1")
    cfg.setdefault("size", "1024x1536")  # portrait = résolution max pour gpt-image-1
    cfg.setdefault("quality", "high")  # résolution/qualité max
    cfg.setdefault("output_dir", "output")

    if "reference_image" not in cfg:
        raise ValueError("`reference_image` manquant dans la config.")
    if "poses" not in cfg or not cfg["poses"]:
        raise ValueError("`poses` manquant ou vide dans la config.")

    if "archetype_name" not in cfg:
        cfg["archetype_name"] = Path(cfg["reference_image"]).stem

    # Chemins relatifs au fichier de config.
    base = path.resolve().parent
    cfg["_base_dir"] = base
    cfg["reference_image"] = _resolve(base, cfg["reference_image"])
    cfg["style_images"] = [_resolve(base, p) for p in cfg["style_images"]]
    cfg["output_dir"] = _resolve(base, cfg["output_dir"])
    return cfg


def _resolve(base: Path, p: str) -> Path:
    q = Path(p)
    return q if q.is_absolute() else (base / q)


def build_prompt(cfg: dict, pose: dict) -> str:
    """Assemble le prompt : style + pose + contraintes négatives."""
    parts: list[str] = []
    if cfg["style_prompt"]:
        parts.append(f"Style : {cfg['style_prompt'].strip()}")
    parts.append(
        "Conserve EXACTEMENT le même personnage que l'image de référence "
        "(visage, coiffure, couleur des cheveux et des yeux, tenue, proportions, "
        "carnation). Ne change ni l'identité ni les vêtements."
    )
    parts.append(f"Pose : {pose['prompt'].strip()}")
    if cfg["negative_constraints"]:
        neg = "; ".join(c.strip() for c in cfg["negative_constraints"])
        parts.append(f"Contraintes impératives : {neg}.")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Reprise / arborescence de sortie
# ---------------------------------------------------------------------------


def pose_dir(cfg: dict, pose_id: str) -> Path:
    return cfg["output_dir"] / cfg["archetype_name"] / pose_id


def existing_variants(cfg: dict, pose_id: str) -> list[Path]:
    d = pose_dir(cfg, pose_id)
    if not d.exists():
        return []
    return sorted(d.glob("v*.png"))


def pose_is_complete(cfg: dict, pose_id: str) -> bool:
    return len(existing_variants(cfg, pose_id)) >= cfg["variants_per_pose"]


# ---------------------------------------------------------------------------
# Appel avec retry + backoff
# ---------------------------------------------------------------------------


def generate_with_retry(
    provider: ImageProvider,
    *,
    reference_image: Path,
    style_images: list[Path],
    prompt: str,
    n: int,
    size: str,
    quality: str,
    max_retries: int = 5,
) -> GenerationResult:
    delay = 4.0
    last_err: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            return provider.generate(
                reference_image=reference_image,
                style_images=style_images,
                prompt=prompt,
                n=n,
                size=size,
                quality=quality,
            )
        except Exception as e:  # noqa: BLE001 — on relance sur tout ce qui est transitoire
            last_err = e
            if not _is_retryable(e) or attempt == max_retries:
                raise
            log.warning(
                "Appel échoué (tentative %d/%d) : %s — nouvelle tentative dans %.0fs",
                attempt,
                max_retries,
                e,
                delay,
            )
            time.sleep(delay)
            delay = min(delay * 2, 60.0)
    assert last_err is not None
    raise last_err


def _is_retryable(e: Exception) -> bool:
    try:
        import openai

        if isinstance(
            e,
            (
                openai.APIConnectionError,
                openai.APITimeoutError,
                openai.RateLimitError,
                openai.InternalServerError,
            ),
        ):
            return True
        if isinstance(e, openai.APIStatusError):
            return e.status_code in (429, 500, 502, 503, 504)
    except Exception:  # noqa: BLE001
        pass
    return isinstance(e, (ConnectionError, TimeoutError))


# ---------------------------------------------------------------------------
# Planche contact HTML
# ---------------------------------------------------------------------------


def write_contact_sheet(cfg: dict, poses: list[dict]) -> Path:
    root = cfg["output_dir"] / cfg["archetype_name"]
    sheet = root / "contact_sheet.html"
    rows = []
    for pose in poses:
        pid = pose["id"]
        imgs = existing_variants(cfg, pid)
        cells = "".join(
            f'<figure><img src="{p.relative_to(root).as_posix()}" loading="lazy">'
            f"<figcaption>{p.name}</figcaption></figure>"
            for p in imgs
        )
        rows.append(
            f'<section><h2>{pid}</h2>'
            f'<p class="prompt">{_esc(pose["prompt"])}</p>'
            f'<div class="grid">{cells or "<em>aucune image</em>"}</div></section>'
        )

    html = f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<title>Planche contact — {_esc(cfg['archetype_name'])}</title>
<style>
 body {{ font-family: system-ui, sans-serif; margin: 2rem; background:#fafafa; color:#222; }}
 h1 {{ margin-bottom: .2rem; }}
 .meta {{ color:#666; margin-bottom:2rem; }}
 section {{ margin-bottom: 2.5rem; }}
 h2 {{ border-bottom:2px solid #ddd; padding-bottom:.3rem; }}
 .prompt {{ color:#555; font-size:.9rem; max-width:60ch; }}
 .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1rem; }}
 figure {{ margin:0; background:#fff; border:1px solid #e2e2e2; border-radius:8px; overflow:hidden; }}
 img {{ width:100%; display:block; aspect-ratio:2/3; object-fit:cover; }}
 figcaption {{ font-size:.8rem; text-align:center; padding:.4rem; color:#666; }}
</style></head><body>
<h1>{_esc(cfg['archetype_name'])}</h1>
<p class="meta">{len(poses)} poses · {cfg['variants_per_pose']} variantes/pose ·
 modèle {_esc(cfg['model'])} · généré le {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
{''.join(rows)}
</body></html>
"""
    sheet.write_text(html, encoding="utf-8")
    return sheet


def _esc(s: str) -> str:
    return (
        s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", type=Path, help="Fichier de config YAML")
    parser.add_argument("--pose", help="Ne (re)générer que cette pose (par id)")
    parser.add_argument(
        "--force", action="store_true", help="Régénérer même les poses déjà complètes"
    )
    parser.add_argument(
        "--yes", "-y", action="store_true", help="Ne pas demander de confirmation du coût"
    )
    args = parser.parse_args()

    load_dotenv()

    try:
        cfg = load_config(args.config)
    except (OSError, ValueError, yaml.YAMLError) as e:
        log.error("Config invalide : %s", e)
        return 2

    # Vérification des fichiers d'entrée.
    if not cfg["reference_image"].exists():
        log.error("Image de référence introuvable : %s", cfg["reference_image"])
        return 2
    for p in cfg["style_images"]:
        if not p.exists():
            log.error("Image de style introuvable : %s", p)
            return 2

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        log.error(
            "OPENAI_API_KEY absente. Ajoute-la dans le fichier .env "
            "(voir le message de fin d'installation)."
        )
        return 2

    provider = build_provider(cfg["provider"], api_key=api_key, model=cfg["model"])

    # Sélection des poses à traiter.
    poses = cfg["poses"]
    if args.pose:
        poses_to_run = [p for p in poses if p["id"] == args.pose]
        if not poses_to_run:
            log.error("Pose %r absente de la config.", args.pose)
            return 2
    else:
        poses_to_run = list(poses)

    variants = cfg["variants_per_pose"]
    pending = []
    for pose in poses_to_run:
        if not args.force and pose_is_complete(cfg, pose["id"]):
            log.info("Pose %-14s déjà complète — ignorée (utilise --force pour refaire).", pose["id"])
            continue
        pending.append(pose)

    if not pending:
        log.info("Rien à générer. Génération de la planche contact uniquement.")
        sheet = write_contact_sheet(cfg, poses)
        log.info("Planche contact : %s", sheet)
        return 0

    # Estimation du coût + confirmation.
    est_per_image = provider.estimate_cost(n=1, size=cfg["size"], quality=cfg["quality"])
    total_images = len(pending) * variants
    est_total = est_per_image * total_images
    print()
    print(f"  Archétype       : {cfg['archetype_name']}")
    print(f"  Fournisseur     : {provider.name}  (modèle {cfg['model']})")
    print(f"  Taille/qualité  : {cfg['size']} / {cfg['quality']}")
    print(f"  Poses à générer : {len(pending)}  ({', '.join(p['id'] for p in pending)})")
    print(f"  Variantes/pose  : {variants}")
    print(f"  Images totales  : {total_images}")
    print(f"  Coût estimé     : ~${est_total:.2f} USD  (~${est_per_image:.3f}/image)")
    print()
    if not args.yes:
        rep = input("Lancer la génération ? [o/N] ").strip().lower()
        if rep not in ("o", "oui", "y", "yes"):
            log.info("Annulé.")
            return 0

    # Génération pose par pose.
    started = datetime.now(timezone.utc)
    manifest_poses = []
    total_cost = 0.0
    for pose in pending:
        pid = pose["id"]
        d = pose_dir(cfg, pid)
        d.mkdir(parents=True, exist_ok=True)
        prompt = build_prompt(cfg, pose)
        log.info("Pose %-14s → génération de %d variantes…", pid, variants)

        try:
            result = generate_with_retry(
                provider,
                reference_image=cfg["reference_image"],
                style_images=cfg["style_images"],
                prompt=prompt,
                n=variants,
                size=cfg["size"],
                quality=cfg["quality"],
            )
        except Exception as e:  # noqa: BLE001
            log.error("Pose %s : échec définitif — %s", pid, e)
            manifest_poses.append({"id": pid, "status": "error", "error": str(e)})
            continue

        saved = []
        for i, img in enumerate(result.images, start=1):
            out = d / f"v{i}.png"
            out.write_bytes(img)
            saved.append(out.name)
        if result.cost_usd:
            total_cost += result.cost_usd
        log.info(
            "Pose %-14s ✓ %d images (%s)%s",
            pid,
            len(saved),
            ", ".join(saved),
            f" — ${result.cost_usd:.3f}" if result.cost_usd else "",
        )
        manifest_poses.append(
            {
                "id": pid,
                "status": "ok",
                "prompt": prompt,
                "variants": saved,
                "usage": result.usage,
                "cost_usd": result.cost_usd,
            }
        )

    finished = datetime.now(timezone.utc)

    # Manifest.
    manifest = {
        "archetype_name": cfg["archetype_name"],
        "provider": provider.name,
        "model": cfg["model"],
        "size": cfg["size"],
        "quality": cfg["quality"],
        "variants_per_pose": variants,
        "reference_image": str(cfg["reference_image"]),
        "style_images": [str(p) for p in cfg["style_images"]],
        "style_prompt": cfg["style_prompt"],
        "negative_constraints": cfg["negative_constraints"],
        "started_at": started.isoformat(),
        "finished_at": finished.isoformat(),
        "estimated_cost_usd": round(est_total, 4),
        "actual_cost_usd": round(total_cost, 4) if total_cost else None,
        "poses": manifest_poses,
    }
    manifest_path = cfg["output_dir"] / cfg["archetype_name"] / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("Manifest écrit : %s", manifest_path)

    sheet = write_contact_sheet(cfg, poses)
    log.info("Planche contact : %s", sheet)
    if total_cost:
        log.info("Coût réel total : $%.3f USD", total_cost)
    return 0


if __name__ == "__main__":
    sys.exit(main())
