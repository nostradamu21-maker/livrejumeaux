"""Couche d'abstraction pour les fournisseurs d'édition d'image à référence.

L'objectif est de pouvoir changer de fournisseur (OpenAI gpt-image aujourd'hui,
Flux Kontext via fal.ai demain) sans toucher au script principal.
"""

from __future__ import annotations

import base64
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class GenerationResult:
    """Résultat d'un appel de génération : les images (bytes PNG) + métadonnées."""

    images: list[bytes]
    usage: dict = field(default_factory=dict)
    cost_usd: float | None = None


class ImageProvider(ABC):
    """Interface commune à tous les fournisseurs d'édition d'image à référence."""

    #: identifiant court, écrit dans le manifest
    name: str = "base"

    @abstractmethod
    def generate(
        self,
        *,
        reference_image: Path,
        style_images: list[Path],
        prompt: str,
        n: int,
        size: str,
        quality: str,
    ) -> GenerationResult:
        """Génère `n` images du personnage de référence selon `prompt`.

        `style_images` sont jointes à la requête si le fournisseur le permet.
        Retourne des PNG en bytes.
        """

    @abstractmethod
    def estimate_cost(self, *, n: int, size: str, quality: str) -> float:
        """Coût estimé en USD pour `n` images (avant appel)."""


# ---------------------------------------------------------------------------
# OpenAI gpt-image (endpoint d'édition d'image /v1/images/edits)
# ---------------------------------------------------------------------------


class OpenAIProvider(ImageProvider):
    """Fournisseur OpenAI utilisant le modèle gpt-image-1 en mode édition.

    L'endpoint `images.edit` accepte plusieurs images en entrée : on passe
    l'image de référence en premier, puis les images de style. gpt-image-1
    renvoie les résultats en base64.
    """

    name = "openai-gpt-image"

    # Tokens de sortie facturés par image, selon (qualité, taille).
    # Source : grille de facturation gpt-image-1 (tokens image en sortie).
    _OUTPUT_TOKENS = {
        ("low", "1024x1024"): 272,
        ("low", "1024x1536"): 408,
        ("low", "1536x1024"): 400,
        ("medium", "1024x1024"): 1056,
        ("medium", "1024x1536"): 1584,
        ("medium", "1536x1024"): 1568,
        ("high", "1024x1024"): 4160,
        ("high", "1024x1536"): 6240,
        ("high", "1536x1024"): 6208,
    }

    # Prix par million de tokens (USD).
    _PRICE_TEXT_INPUT = 5.0 / 1_000_000
    _PRICE_IMAGE_INPUT = 10.0 / 1_000_000
    _PRICE_IMAGE_OUTPUT = 40.0 / 1_000_000

    VALID_SIZES = {"1024x1024", "1024x1536", "1536x1024", "auto"}
    VALID_QUALITIES = {"low", "medium", "high", "auto"}

    def __init__(self, api_key: str, model: str = "gpt-image-1") -> None:
        # Import tardif pour que `--help` fonctionne sans le paquet installé.
        from openai import OpenAI

        self.model = model
        self._client = OpenAI(api_key=api_key)

    def generate(
        self,
        *,
        reference_image: Path,
        style_images: list[Path],
        prompt: str,
        n: int,
        size: str,
        quality: str,
    ) -> GenerationResult:
        image_paths = [reference_image, *style_images]
        # gpt-image-1 accepte jusqu'à 16 images d'entrée.
        image_paths = image_paths[:16]

        files = [open(p, "rb") for p in image_paths]
        try:
            resp = self._client.images.edit(
                model=self.model,
                image=files,
                prompt=prompt,
                n=n,
                size=size,
                quality=quality,
            )
        finally:
            for f in files:
                f.close()

        images = [base64.b64decode(item.b64_json) for item in resp.data]

        usage: dict = {}
        cost: float | None = None
        raw_usage = getattr(resp, "usage", None)
        if raw_usage is not None:
            input_tokens = getattr(raw_usage, "input_tokens", 0) or 0
            output_tokens = getattr(raw_usage, "output_tokens", 0) or 0
            details = getattr(raw_usage, "input_tokens_details", None)
            text_tokens = getattr(details, "text_tokens", 0) or 0 if details else 0
            image_tokens = getattr(details, "image_tokens", 0) or 0 if details else 0
            usage = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "input_text_tokens": text_tokens,
                "input_image_tokens": image_tokens,
            }
            cost = (
                text_tokens * self._PRICE_TEXT_INPUT
                + image_tokens * self._PRICE_IMAGE_INPUT
                + output_tokens * self._PRICE_IMAGE_OUTPUT
            )

        return GenerationResult(images=images, usage=usage, cost_usd=cost)

    def estimate_cost(self, *, n: int, size: str, quality: str) -> float:
        if quality == "auto":
            quality = "high"  # hypothèse haute pour ne pas sous-estimer
        if size == "auto":
            size = "1024x1536"
        out_tokens = self._OUTPUT_TOKENS.get((quality, size), 6240)
        # On ajoute une marge forfaitaire pour les tokens d'entrée (texte + images
        # de référence), typiquement quelques centaines de tokens image par appel.
        est_input = 700 * self._PRICE_IMAGE_INPUT
        return n * (out_tokens * self._PRICE_IMAGE_OUTPUT + est_input)


# ---------------------------------------------------------------------------
# Registre des fournisseurs
# ---------------------------------------------------------------------------


def build_provider(name: str, api_key: str, model: str | None = None) -> ImageProvider:
    """Instancie un fournisseur par son nom (point d'extension unique)."""
    if name in ("openai", "openai-gpt-image", "gpt-image"):
        return OpenAIProvider(api_key=api_key, model=model or "gpt-image-1")
    # Emplacement prévu pour un futur fournisseur, ex. :
    #   if name in ("fal", "flux-kontext"):
    #       return FalFluxKontextProvider(api_key=api_key, model=model)
    raise ValueError(f"Fournisseur inconnu : {name!r}")
