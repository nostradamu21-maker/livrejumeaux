#!/usr/bin/env python3
"""Catalogue d'archétypes — production des fiches de référence.

Un archétype = un personnage FIGÉ (physique + tenue fixe) que les parents
choisissent pour chaque jumeau. On produit UNE fiche de référence par archétype
(déclinaison d'une base validée), triée à la main, puis réutilisée à l'infini
dans les livres-combos.

    python archetypes.py            # étape suivante : copie les fiches déjà
                                    # validées, génère les manquantes (coût
                                    # ANNONCÉ + confirmation), puis tri navigateur
    python archetypes.py --liste    # état du catalogue, sans rien générer

Les fiches validées atterrissent dans archetypes/<id>.png et deviennent les
briques des livres-combos.
"""

from __future__ import annotations

import argparse
import http.server
import shutil
import sys
import webbrowser
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

CATALOGUE = ROOT / "archetypes.yaml"
DOSSIER = ROOT / "archetypes"
VARIANTES = DOSSIER / "_variantes"

N_VARIANTES = 3           # variantes proposées au tri par archétype
PRIX_IMAGE = 0.30         # $ estimatif par image portrait 1024x1536 qualité haute


# ---------------------------------------------------------------------------
# État du catalogue
# ---------------------------------------------------------------------------


def charger() -> dict:
    return yaml.safe_load(CATALOGUE.read_text(encoding="utf-8"))


def ref_path(aid: str) -> Path:
    return DOSSIER / f"{aid}.png"


def var_dir(aid: str) -> Path:
    return VARIANTES / aid


def variante_generee(aid: str) -> bool:
    return (var_dir(aid) / f"v{N_VARIANTES}.png").exists()


def importer_sources_validees(data: dict) -> list[str]:
    """Copie (local, gratuit) les fiches déjà validées ailleurs dans archetypes/.
    Retourne la liste des archétypes ainsi importés."""
    DOSSIER.mkdir(exist_ok=True)
    importes = []
    for aid, cfg in data["archetypes"].items():
        src = cfg.get("source_validee")
        if src and not ref_path(aid).exists():
            shutil.copyfile(ROOT / src, ref_path(aid))
            importes.append(aid)
    return importes


def etat(data: dict):
    """Retourne (valides, a_trier, a_generer)."""
    valides, a_trier, a_generer = [], [], []
    for aid, cfg in data["archetypes"].items():
        if ref_path(aid).exists():
            valides.append(aid)
        elif variante_generee(aid):
            a_trier.append(aid)
        else:
            a_generer.append(aid)
    return valides, a_trier, a_generer


# ---------------------------------------------------------------------------
# Génération (déclinaison d'une base)
# ---------------------------------------------------------------------------


def prompt_archetype(scenes: dict, cfg: dict) -> str:
    style = scenes["style"].strip()
    return (
        f"{style}. Character sheet d'un personnage d'album jeunesse : un SEUL "
        "enfant debout, corps entier bien visible et cadré en entier, face au "
        "lecteur, grand sourire chaleureux, fond uni gris clair. Même style "
        "aquarelle douce et mêmes proportions que l'image de référence. "
        f"L'enfant est : {cfg['description'].strip()}. "
        f"Tenue : {cfg['tenue'].strip()}. "
        "Mains bien formées à cinq doigts, aucun texte ni logo dans l'image."
    )


def generer(data: dict, a_generer: list[str]) -> None:
    from dotenv import dotenv_values
    from providers import build_provider

    scenes = yaml.safe_load((ROOT / "scenes.yaml").read_text(encoding="utf-8"))
    bases = data["bases"]

    cout = len(a_generer) * N_VARIANTES * PRIX_IMAGE
    print(f"À générer : {len(a_generer)} archétype(s) × {N_VARIANTES} variantes "
          f"≈ {cout:.2f} $")
    print("  " + ", ".join(a_generer))
    if input("Continuer ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        sys.exit("Annulé.")

    key = dotenv_values(ROOT / ".env").get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY introuvable dans .env")
    provider = build_provider("openai", api_key=key)

    total = 0.0
    for aid in a_generer:
        cfg = data["archetypes"][aid]
        base = ROOT / bases[cfg["base"]]
        out = var_dir(aid)
        out.mkdir(parents=True, exist_ok=True)
        print(f"  {aid} : déclinaison depuis la base {cfg['base']}…")
        res = provider.generate(
            reference_image=base,
            style_images=[ROOT / "style1.png", ROOT / "style2.png"],
            prompt=prompt_archetype(scenes, cfg),
            n=N_VARIANTES, size="1024x1536", quality="high")
        for j, img in enumerate(res.images, 1):
            (out / f"v{j}.png").write_bytes(img)
        if res.cost_usd:
            total += res.cost_usd
    print(f"Génération terminée (~{total:.2f} $ réels).")


# ---------------------------------------------------------------------------
# Tri cliquable dans le navigateur
# ---------------------------------------------------------------------------


def trier(data: dict, a_trier: list[str]) -> None:
    restantes = list(a_trier)
    print(f"Tri : {len(restantes)} archétype(s) à choisir — le navigateur s'ouvre…")

    class Tri(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def do_GET(self):
            if self.path.startswith("/img/"):
                _, _, aid, v = self.path.split("/")
                data_img = (var_dir(aid) / v).read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.end_headers()
                self.wfile.write(data_img)
                return
            if self.path.startswith("/choisir/"):
                _, _, aid, v = self.path.split("/")
                shutil.copyfile(var_dir(aid) / v, ref_path(aid))
                restantes.remove(aid)
                self.send_response(302)
                self.send_header("Location", "/fin" if not restantes else "/")
                self.end_headers()
                return
            if self.path == "/fin":
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write("<h1 style='font-family:sans-serif'>Tri terminé ✔ — "
                                 "relance archetypes.py au besoin.</h1>".encode())
                setattr(self.server, "fini", True)
                return
            html = ["<!doctype html><meta charset=utf-8><title>Tri archétypes</title>",
                    "<body style='background:#1e1e1e;color:#eee;font-family:sans-serif'>",
                    f"<h1>Tri — {len(restantes)} archétype(s)</h1>",
                    "<p>Clique la variante à garder. Fermeture automatique à la fin.</p>"]
            for aid in restantes:
                cfg = data["archetypes"][aid]
                html.append(f"<h2>{aid} — {cfg['description']}</h2><div>")
                for i in range(1, N_VARIANTES + 1):
                    html.append(
                        f"<a href='/choisir/{aid}/v{i}.png'>"
                        f"<img src='/img/{aid}/v{i}.png' style='width:30%;margin:0.5%'></a>")
                html.append("</div>")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("".join(html).encode())

    srv = http.server.HTTPServer(("127.0.0.1", 8766), Tri)
    webbrowser.open("http://127.0.0.1:8766/")
    while restantes:
        srv.handle_request()
    srv.handle_request()  # dernière requête /fin
    print("Tri enregistré.")


# ---------------------------------------------------------------------------


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--liste", action="store_true", help="état du catalogue, sans générer")
    args = ap.parse_args()

    data = charger()
    importes = importer_sources_validees(data)
    if importes:
        print(f"Fiches validées importées : {', '.join(importes)}")

    valides, a_trier, a_generer = etat(data)

    if args.liste:
        print(f"\nCatalogue ({len(data['archetypes'])} archétypes) :")
        for aid, cfg in data["archetypes"].items():
            mark = "✅ validé" if aid in valides else \
                   ("🟡 à trier" if aid in a_trier else "⚪ à générer")
            print(f"  {mark:12} {aid:18} {cfg['genre']:7} {cfg['description']}")
        return

    if a_generer:
        generer(data, a_generer)
        _, a_trier, _ = etat(data)

    if a_trier:
        trier(data, a_trier)

    valides, a_trier, a_generer = etat(data)
    print(f"\nÉtat : {len(valides)} validé(s), {len(a_trier)} à trier, "
          f"{len(a_generer)} à générer.")
    if not a_trier and not a_generer:
        print("Catalogue complet ✔ — prêt pour la génération des livres-combos.")


if __name__ == "__main__":
    main()
