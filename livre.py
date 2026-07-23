#!/usr/bin/env python3
"""Pipeline unifié « Deux comme nous » — un livre = une combinaison d'archétypes.

Machine à états : chaque exécution regarde où en est le livre et fait
l'ÉTAPE SUIVANTE. On relance la même commande jusqu'au PDF final.

    python livre.py <id-du-livre>                 # étape suivante (production)
    python livre.py <id> --prenoms "Léo,Jules"    # commande client : PDF final
                                                  # (combo déjà validée, instantané)

États successifs d'un livre (livres/<id>/livre.yaml) :
  1. generation  — les pages sans variantes sont générées (coût annoncé + confirmation) ;
                   les pages ancrées sur une page sœur attendent que celle-ci soit triée.
  2. tri         — un mini-serveur local ouvre le navigateur : cliquer une variante
                   par page, les choix s'enregistrent tout seuls.
  3. (retour en 1 s'il reste des pages ancrées à générer, puis 2 pour les trier)
  4. valide      — toutes les pages triées : composition du texte vectoriel et
                   assemblage du PDF complet (livres/<id>/livret.pdf) + aperçus.

Le tri humain reste volontairement dans la boucle (décision structurante du
projet) mais UNIQUEMENT en production de combinaison — jamais à la commande.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
import webbrowser
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

N_VARIANTES = 2  # 2 variantes par page (choix de Simon : coûts au minimum)
PRIX_IMAGE = 0.175  # $ par image 1024×1024 qualité haute (estimation)


# ---------------------------------------------------------------------------
# État du livre
# ---------------------------------------------------------------------------


def charger(livre_id: str) -> tuple[dict, dict, Path]:
    scenes = yaml.safe_load((ROOT / "scenes.yaml").read_text(encoding="utf-8"))
    dossier = ROOT / "livres" / livre_id
    fy = dossier / "livre.yaml"
    if not fy.exists():
        sys.exit(f"Livre inconnu : {fy}\nCrée-le (voir livres/test-garcon-garcon/livre.yaml).")
    livre = yaml.safe_load(fy.read_text(encoding="utf-8"))
    livre.setdefault("selections", {})
    return livre, scenes, dossier


def sauver(livre: dict, dossier: Path) -> None:
    (dossier / "livre.yaml").write_text(
        yaml.safe_dump(livre, allow_unicode=True, sort_keys=False), encoding="utf-8")


def variantes_dir(dossier: Path, num: str) -> Path:
    return dossier / "variantes" / f"page-{num}"


def page_generee(dossier: Path, num: str) -> bool:
    return (variantes_dir(dossier, num) / f"v{N_VARIANTES}.png").exists()


def unites_references(livre: dict) -> list[str]:
    """Unités « personnage de référence » à produire avant les pages (si le livre
    est construit depuis des photos : personnages[] dans livre.yaml)."""
    return [f"ref-{i}" for i in range(1, len(livre.get("personnages", [])) + 1)]


def references_pretes(livre: dict) -> bool:
    return all(r in livre["selections"] for r in unites_references(livre))


def chemins_references(livre: dict, dossier: Path) -> list[Path]:
    """Chemins des images de référence personnages (photos → refs triées, ou
    fichiers listés dans livre['references'] pour les livres historiques)."""
    refs = unites_references(livre)
    if refs:
        return [variantes_dir(dossier, r) / f"{livre['selections'][r]}.png" for r in refs]
    return [ROOT / r for r in livre["references"]]


def ancre_de(scenes: dict, livre: dict, dossier: Path, num: str):
    """Chemin de l'image d'ancrage décor, ou None, ou 'attente' si la page sœur
    n'est pas encore triée."""
    a = scenes["pages"][num].get("ancre")
    if not a:
        return None
    if a.startswith("page:"):
        soeur = a.split(":")[1]
        sel = livre["selections"].get(soeur)
        if not sel:
            return "attente"
        return variantes_dir(dossier, soeur) / f"{sel}.png"
    return ROOT / a


def champ_page(p: dict, livre: dict, cle: str) -> str:
    """Retourne la variante `<cle>_dizygote` d'un champ de page si les jumeaux ne
    sont PAS monozygotes et que la variante existe, sinon le champ standard.
    (Livres existants sans flag → monozygotes par défaut, texte inchangé.)"""
    if not livre.get("monozygote", True):
        alt = p.get(f"{cle}_dizygote")
        if alt:
            return alt
    return p[cle]


LANGUES = {"fr", "en", "es", "de"}


def appliquer_langue(scenes: dict, langue: str) -> None:
    """Superpose les textes traduits (traductions/<langue>.yaml) sur scenes.
    Ne touche QUE le texte imprimé (texte/texte_dizygote/titre) : les images
    ne contiennent aucun texte, donc une combo en cache sert toutes les langues.
    Français (ou traduction absente) → aucun changement."""
    langue = (langue or "fr").lower()
    if langue == "fr":
        return
    if langue not in LANGUES:
        sys.exit(f"Langue inconnue : {langue} (attendu : {', '.join(sorted(LANGUES))})")
    f = ROOT / "traductions" / f"{langue}.yaml"
    if not f.exists():
        sys.exit(f"Traduction manquante : {f}")
    trad = yaml.safe_load(f.read_text(encoding="utf-8")).get("pages", {})
    for num, champs in trad.items():
        cible = scenes["pages"].get(str(num))
        if not cible:
            continue
        for cle in ("titre", "texte", "texte_dizygote"):
            if cle in champs:
                cible[cle] = champs[cle]



# ---------------------------------------------------------------------------
# Étape 1 — génération
# ---------------------------------------------------------------------------


def etape_generation(livre: dict, scenes: dict, dossier: Path) -> bool:
    """Génère les pages prêtes à l'être. Retourne True si quelque chose a été fait."""
    a_generer, en_attente = [], []
    for r in unites_references(livre):
        if not page_generee(dossier, r):
            a_generer.append(r)
    if not page_generee(dossier, "couv"):
        if unites_references(livre) and not references_pretes(livre):
            en_attente.append("couv")
        else:
            a_generer.append("couv")
    for num in scenes["pages"]:
        if scenes["pages"][num].get("texte_seul"):
            continue  # pages texte seul : aucune image à générer
        if page_generee(dossier, num):
            continue
        if (unites_references(livre) and not references_pretes(livre)) or \
           ancre_de(scenes, livre, dossier, num) == "attente":
            en_attente.append(num)
        else:
            a_generer.append(num)
    if not a_generer:
        if en_attente:
            print(f"Pages en attente d'un tri de page sœur : {', '.join(en_attente)}")
        return False

    cout = len(a_generer) * N_VARIANTES * PRIX_IMAGE
    print(f"À générer : {len(a_generer)} page(s) × {N_VARIANTES} variantes ≈ {cout:.2f} $")
    if input("Continuer ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
        sys.exit("Annulé.")

    from dotenv import dotenv_values
    from providers import build_provider
    key = dotenv_values(ROOT / ".env").get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY introuvable dans .env")
    provider = build_provider("openai", api_key=key)

    style, contraintes = scenes["style"].strip(), scenes["contraintes"].strip()
    total = 0.0
    for num in a_generer:
        if num.startswith("ref-"):
            i = int(num.split("-")[1])
            perso = livre["personnages"][i - 1]
            out = variantes_dir(dossier, num)
            out.mkdir(parents=True, exist_ok=True)
            if perso.get("base"):
                print(f"  {num} : déclinaison du personnage depuis la base validée…")
                prompt_ref = (style + ". Reprends EXACTEMENT le personnage de l'image de "
                              "référence — même visage, mêmes traits, mêmes couleurs, même "
                              "style aquarelle, même pose de character sheet, fond uni gris "
                              "clair — et modifie UNIQUEMENT ceci : "
                              f"{perso['modifications']}. Tout le reste doit rester "
                              "strictement identique. Pas de texte dans l'image.")
                src_img = dossier / perso["base"]
            else:
                print(f"  {num} : création du personnage depuis la photo…")
                prompt_ref = (style + ". Transforme l'enfant de la photo de référence en "
                              "personnage d'album jeunesse : character sheet, debout, corps "
                              "entier, face au lecteur, grand sourire, fond uni gris clair. "
                              "Fidèle à l'enfant réel (visage, coiffure, couleur des cheveux "
                              "et des yeux) mais entièrement stylisé aquarelle douce. "
                              f"Tenue : {perso['tenue']}. Pas de texte dans l'image.")
                src_img = dossier / perso["photo"]
            res = provider.generate(
                reference_image=src_img,
                style_images=[ROOT / "style1.png", ROOT / "style2.png"],
                prompt=prompt_ref,
                n=N_VARIANTES, size="1024x1536", quality="high")
            for j, img in enumerate(res.images, 1):
                (out / f"v{j}.png").write_bytes(img)
            if res.cost_usd:
                total += res.cost_usd
            continue
        if num == "couv":
            refs = chemins_references(livre, dossier)
            out = variantes_dir(dossier, "couv")
            out.mkdir(parents=True, exist_ok=True)
            print("  couv : illustration panoramique de couverture…")
            paire = livre.get("description_paire", scenes["jumeaux"]).strip()
            res = provider.generate(
                reference_image=refs[0],
                style_images=list(refs[1:]) + [ROOT / "style1.png", ROOT / "style2.png"],
                prompt=(scenes["style"].strip() + ". " + paire + " Illustration "
                        "PANORAMIQUE pour une couverture intégrale de livre (dos + avant + "
                        "arrière) : un paysage doux de parc en fin de journée s'étend sur "
                        "toute la largeur ; sur la MOITIÉ DROITE, les deux enfants marchent "
                        "main dans la main vers le lecteur en souriant ; la MOITIÉ GAUCHE "
                        "reste un paysage calme (collines, grand arbre, ciel) SANS "
                        "personnage. Tiers supérieur droit dégagé et calme pour accueillir "
                        "le titre. Pas de texte dans l'image."),
                n=N_VARIANTES, size="1536x1024", quality="high")
            for j, img in enumerate(res.images, 1):
                (out / f"v{j}.png").write_bytes(img)
            if res.cost_usd:
                total += res.cost_usd
            continue
        p = scenes["pages"][num]
        refs = chemins_references(livre, dossier)
        styles = list(refs[1:]) + [ROOT / "style1.png", ROOT / "style2.png"]
        prompt_parts = [style + "."]
        ancre = ancre_de(scenes, livre, dossier, num)
        if ancre is not None:
            styles.append(Path(ancre))
            prompt_parts.append("Le décor est EXACTEMENT le même lieu que la dernière "
                                "image de référence (mêmes éléments, même palette).")
        if not p.get("solo"):
            prompt_parts.append(livre.get("description_paire", scenes["jumeaux"]).strip())
            if p.get("tenue"):
                prompt_parts.append(f"Pour cette scène uniquement, les enfants portent : "
                                    f"{p['tenue']}.")
            # Cast FERMÉ : uniquement les deux jumeaux, jamais un 3ᵉ personnage.
            prompt_parts.append(
                "IMPÉRATIF DE CASTING : l'image ne montre QUE ces deux enfants (les "
                "jumeaux) et absolument personne d'autre — aucun troisième enfant, aucun "
                "bébé, aucun adulte, aucun visage ni aucune silhouette supplémentaire, y "
                "compris au fond, dans un autre lit, à une fenêtre, dans un miroir ou un "
                "cadre. Exactement DEUX enfants au total. Tout lit, chaise, siège ou "
                "espace non occupé par l'un des deux jumeaux reste vide.")
        prompt_parts += [champ_page(p, livre, "scene").strip(), contraintes]
        out = variantes_dir(dossier, num)
        out.mkdir(parents=True, exist_ok=True)
        print(f"  page {num} : génération…")
        res = provider.generate(reference_image=refs[0], style_images=styles,
                                prompt=" ".join(prompt_parts),
                                n=N_VARIANTES, size="1024x1024", quality="high")
        for i, img in enumerate(res.images, 1):
            (out / f"v{i}.png").write_bytes(img)
        if res.cost_usd:
            total += res.cost_usd
    print(f"Génération terminée (~{total:.2f} $ réels).")
    return True


# ---------------------------------------------------------------------------
# Étape 2 — tri cliquable dans le navigateur
# ---------------------------------------------------------------------------


def etape_tri(livre: dict, scenes: dict, dossier: Path) -> bool:
    restantes = [n for n in unites_references(livre) + ["couv"] + list(scenes["pages"])
                 if page_generee(dossier, n) and n not in livre["selections"]]
    if not restantes:
        return False
    print(f"Tri : {len(restantes)} page(s) à choisir — le navigateur s'ouvre…")

    import http.server

    class Tri(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a):  # silence
            pass

        def do_GET(self):
            if self.path.startswith("/img/"):
                _, _, num, v = self.path.split("/")
                data = (variantes_dir(dossier, num) / v).read_bytes()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.end_headers()
                self.wfile.write(data)
                return
            html = ["<!doctype html><meta charset=utf-8><title>Tri</title>",
                    "<body style='background:#1e1e1e;color:#eee;font-family:sans-serif'>",
                    f"<h1>Tri — {len(restantes)} page(s) restante(s)</h1>",
                    "<p>Clique sur ta variante préférée. Fermeture automatique à la fin.</p>"]
            for num in restantes:
                html.append(f"<h2>page {num}</h2><div>")
                for i in range(1, N_VARIANTES + 1):
                    html.append(
                        f"<a href='/choisir/{num}/v{i}'>"
                        f"<img src='/img/{num}/v{i}.png' style='width:23%;margin:0.5%'></a>")
                html.append("</div>")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("".join(html).encode())

        def do_choisir(self):
            pass

    class TriRouter(Tri):
        def do_GET(self):
            if self.path.startswith("/choisir/"):
                _, _, num, v = self.path.split("/")
                livre["selections"][num] = v
                sauver(livre, dossier)
                restantes.remove(num)
                self.send_response(302)
                self.send_header("Location", "/fin" if not restantes else "/")
                self.end_headers()
                return
            if self.path == "/fin":
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write("<h1 style='font-family:sans-serif'>Tri terminé ✔ — tu peux "
                                 "fermer cet onglet et relancer livre.command.</h1>".encode())
                setattr(self.server, "fini", True)
                return
            super().do_GET()

    srv = http.server.HTTPServer(("127.0.0.1", 8765), TriRouter)
    webbrowser.open("http://127.0.0.1:8765/")
    while restantes:
        srv.handle_request()
    # dernière requête /fin
    srv.handle_request()
    print("Tri enregistré.")
    return True


# ---------------------------------------------------------------------------
# Étape 3 — composition + assemblage du PDF
# ---------------------------------------------------------------------------


def etape_pdf(livre: dict, scenes: dict, dossier: Path, prenoms=None,
              suffixe_pdf: str = "") -> None:
    from PIL import Image
    from reportlab.lib.colors import HexColor
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
    from compose import Geometry, text_geometry, draw_text_preview
    from upscaler import RealESRGANUpscaler
    import numpy as np

    geo = Geometry(20.0, 3.0, 5.0, 300)  # produit Gelato 200x200 mm
    p1, p2 = prenoms or (livre.get("prenoms_defaut") or ["Léo", "Jules"])
    variables = {"prenom1": p1, "prenom2": p2}

    upscaler = None
    pdf_path = dossier / (f"impression-{p1}-{p2}{suffixe_pdf}.pdf".replace(" ", "_"))
    pdfmetrics.registerFont(TTFont("PageFont", str(ROOT / "fonts/Andika-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("TitreFont", str(ROOT / "fonts/Andika-Bold.ttf")))
    c = canvas.Canvas(str(pdf_path), pagesize=(geo.doc_pt, geo.doc_pt))
    c.setPageCompression(1)
    (dossier / "apercus").mkdir(exist_ok=True)

    MM = 72.0 / 25.4

    def _upscale(img):
        nonlocal upscaler
        if upscaler is None:
            print("Chargement Real-ESRGAN…")
            upscaler = RealESRGANUpscaler(ROOT / "models/RealESRGAN_x4plus.pth",
                                          device="auto")
        return Image.fromarray(upscaler.upscale(np.asarray(img)))

    # ---- Page 1 : couverture intégrale (gabarit API Gelato) --------------------
    cotes = json.loads((ROOT / "livres" / "gelato-cotes.json").read_text(encoding="utf-8"))
    W = cotes["wraparoundInsideSize"]["width"]
    H = cotes["wraparoundInsideSize"]["height"]
    front = cotes["contentFrontSize"]
    back = cotes["contentBackSize"]
    sel_c = livre["selections"].get("couv")
    if not sel_c:
        sys.exit("Couverture non triée — relance la production.")
    art = Image.open(variantes_dir(dossier, "couv") / f"{sel_c}.png").convert("RGB")
    cible_ratio = W / H
    aw, ah = art.size
    if aw / ah > cible_ratio:
        nw = int(ah * cible_ratio)
        art = art.crop(((aw - nw) // 2, 0, (aw + nw) // 2, ah))
    else:
        nh = int(aw / cible_ratio)
        art = art.crop((0, (ah - nh) // 2, aw, (ah + nh) // 2))
    if art.width < int(W * 300 / 25.4):
        art = _upscale(art)
    art = art.resize((int(W * 300 / 25.4), int(H * 300 / 25.4)), Image.LANCZOS)
    c.setPageSize((W * MM, H * MM))
    c.drawImage(ImageReader(art), 0, 0, width=W * MM, height=H * MM)
    # titre directement sur l'illustration (halo clair, sans encadré)
    def _texte_halo(x, y, txt, fonte, taille):
        c.setFont(fonte, taille)
        c.saveState(); c.setFillColor(HexColor("#ffffff")); c.setFillAlpha(0.75)
        for dx, dy in ((-.6, 0), (.6, 0), (0, -.6), (0, .6),
                       (-.4, -.4), (.4, .4), (-.4, .4), (.4, -.4)):
            c.drawCentredString(x + dx * MM, y + dy * MM, txt)
        c.restoreState()
        c.setFillColor(HexColor("#3a3230"))
        c.drawCentredString(x, y, txt)

    fx = (front["left"] + front["width"] / 2) * MM
    _texte_halo(fx, (H - front["top"] - 26) * MM, "Deux comme nous", "TitreFont", 36)
    _texte_halo(fx, (H - front["top"] - 40) * MM, f"{p1} & {p2}", "PageFont", 22)
    # 4e de couverture : petit texte, halo léger
    bx = (back["left"] + back["width"] / 2) * MM
    _texte_halo(bx, 52 * MM, f"L'histoire de {p1} et {p2},", "PageFont", 13)
    _texte_halo(bx, 44 * MM, "deux comme personne.", "PageFont", 13)
    _texte_halo(bx, 36 * MM, "Un livre à lire et relire… à deux.", "PageFont", 13)
    c.showPage()
    apercu_couv = art.copy(); apercu_couv.thumbnail((1600, 900))
    apercu_couv.save(dossier / "apercus" / "couverture.jpg", quality=90)

    # ---- Page 2 : garde vierge -------------------------------------------------
    c.setPageSize((geo.doc_pt, geo.doc_pt)); c.showPage()

    def _bloc_texte(tm, fontname):
        c.setFillColor(HexColor(tm["color"]))
        c.setFont(fontname, tm["size_pt"])
        ax = {"left": tm["box_left"], "center": tm["box_left"] + tm["box_w"] / 2,
              "right": tm["box_left"] + tm["box_w"]}[tm["align"]]
        for i, line in enumerate(tm["lines"]):
            y_pt = geo.doc_pt - geo.px_to_pt(tm["box_top"] + i * tm["line_h"] + tm["ascent"])
            c.drawCentredString(geo.px_to_pt(ax), y_pt, line)

    def _page_texte(pcfg, num):
        """Page « mot aux parents » : fond crème + cadre doux + texte vectoriel, sans IA."""
        from PIL import Image as _Img, ImageDraw as _ID
        BG, ACCENT = "#faf3e8", "#c98f6d"
        titre_cfg = {"content": pcfg.get("titre", ""), "x": 12, "y": 15, "width": 76,
                     "align": "center", "font": str(ROOT / "fonts/Andika-Bold.ttf"),
                     "size_pt": 27, "color": "#3a3230", "line_spacing": 1.2}
        corps_cfg = {"content": pcfg["texte"], "x": 13, "y": 27, "width": 74,
                     "align": "center", "font": str(ROOT / "fonts/Andika-Regular.ttf"),
                     "size_pt": 16, "color": "#3a3230", "line_spacing": 1.5}
        tmt, _ = text_geometry(titre_cfg, geo, variables)
        tmc, _ = text_geometry(corps_cfg, geo, variables)
        marge = geo.doc_px * 0.075
        rayon = geo.doc_px * 0.03
        # --- canvas (fond + cadre vectoriels, texte vectoriel) ---
        c.setPageSize((geo.doc_pt, geo.doc_pt))
        c.setFillColor(HexColor(BG))
        c.rect(0, 0, geo.doc_pt, geo.doc_pt, stroke=0, fill=1)
        c.setStrokeColor(HexColor(ACCENT))
        c.setLineWidth(1.6)
        c.roundRect(geo.px_to_pt(marge), geo.px_to_pt(marge),
                    geo.px_to_pt(geo.doc_px - 2 * marge),
                    geo.px_to_pt(geo.doc_px - 2 * marge),
                    geo.px_to_pt(rayon), stroke=1, fill=0)
        _bloc_texte(tmt, "TitreFont")
        _bloc_texte(tmc, "PageFont")
        c.showPage()
        # --- aperçu (texte rasterisé) ---
        prev = _Img.new("RGB", (int(geo.doc_px), int(geo.doc_px)), BG)
        _ID.Draw(prev).rounded_rectangle(
            (marge, marge, geo.doc_px - marge, geo.doc_px - marge),
            radius=rayon, outline=ACCENT, width=4)
        draw_text_preview(prev, tmt)
        draw_text_preview(prev, tmc)
        prev.save(dossier / "apercus" / f"page-{num}.jpg", quality=90)
        print(f"  page {num} ✓ (texte)")

    for num in scenes["pages"]:
        if scenes["pages"][num].get("texte_seul"):
            _page_texte(scenes["pages"][num], num)
            continue
        sel = livre["selections"].get(num)
        if not sel:
            sys.exit(f"Page {num} non triée — relance sans --prenoms pour finir la production.")
        src = variantes_dir(dossier, num) / f"{sel}.png"
        cache = src.parent / f"{sel}@{geo.doc_px}.png"
        if cache.exists():
            raster = Image.open(cache).convert("RGB")
        else:
            # réutiliser un éventuel cache plus grand (ancien format 21x21)
            anciens = sorted(src.parent.glob(f"{sel}@*.png"), reverse=True)
            grand = next((a for a in anciens
                          if int(a.stem.split("@")[1]) >= geo.doc_px), None)
            raster = Image.open(grand or src).convert("RGB")
            if min(raster.size) < geo.doc_px:
                raster = _upscale(raster)
            raster = raster.resize((geo.doc_px, geo.doc_px), Image.LANCZOS)
            raster.save(cache)

        pcfg = scenes["pages"][num]
        # Cartouche blanc arrondi en bas (lisibilité garantie sur toute illustration).
        tcfg = {"content": champ_page(pcfg, livre, "texte"), "x": 10, "y": 50, "width": 80,
                "align": "center", "font": str(ROOT / "fonts/Andika-Regular.ttf"),
                "size_pt": 23, "color": pcfg.get("couleur_texte", "#3a3230"),
                "line_spacing": 1.3}
        tm, _ = text_geometry(tcfg, geo, variables)
        pad = int(geo.doc_px * 0.026)
        block_h = tm["line_h"] * len(tm["lines"])
        y1 = geo.doc_px * 0.955
        y0 = y1 - block_h - 2 * pad
        tcfg["y"] = (y0 + pad) / geo.doc_px * 100.0
        tm, _ = text_geometry(tcfg, geo, variables)
        px0, px1 = geo.doc_px * 0.06, geo.doc_px * 0.94
        c.drawImage(ImageReader(raster), 0, 0, width=geo.doc_pt, height=geo.doc_pt)
        c.saveState()
        c.setFillColor(HexColor("#ffffff"))
        c.setFillAlpha(0.88)
        c.roundRect(geo.px_to_pt(px0), geo.doc_pt - geo.px_to_pt(y1),
                    geo.px_to_pt(px1 - px0), geo.px_to_pt(y1 - y0),
                    geo.px_to_pt(pad), stroke=0, fill=1)
        c.restoreState()
        c.setFillColor(HexColor(tm["color"]))
        c.setFont("PageFont", tm["size_pt"])
        ax = {"left": tm["box_left"], "center": tm["box_left"] + tm["box_w"] / 2,
              "right": tm["box_left"] + tm["box_w"]}[tm["align"]]
        for i, line in enumerate(tm["lines"]):
            y_pt = geo.doc_pt - geo.px_to_pt(tm["box_top"] + i * tm["line_h"] + tm["ascent"])
            c.drawCentredString(geo.px_to_pt(ax), y_pt, line)
        # Emplacement photo au centre (page dédicace) : cadre pointillé + consigne.
        if pcfg.get("texte_centre"):
            cw, ch = geo.doc_px * 0.46, geo.doc_px * 0.36
            cx0, cy0 = (geo.doc_px - cw) / 2, geo.doc_px * 0.30
            c.saveState()
            c.setStrokeColor(HexColor("#8a7f72"))
            c.setLineWidth(1.4)
            c.setDash(7, 5)
            c.roundRect(geo.px_to_pt(cx0), geo.doc_pt - geo.px_to_pt(cy0 + ch),
                        geo.px_to_pt(cw), geo.px_to_pt(ch), geo.px_to_pt(24),
                        stroke=1, fill=0)
            c.restoreState()
            c.setFillColor(HexColor("#8a7f72"))
            c.setFont("PageFont", 15)
            centre = pcfg["texte_centre"]
            for k, v in variables.items():
                centre = centre.replace("{" + k + "}", v)
            lignes_c = centre.split("\n")
            base_y = cy0 + ch / 2 - len(lignes_c) * 34 / 2
            for j, lc in enumerate(lignes_c):
                c.drawCentredString(geo.px_to_pt(geo.doc_px / 2),
                                    geo.doc_pt - geo.px_to_pt(base_y + j * 34 + 24), lc)
        c.showPage()

        prev = raster.copy().convert("RGBA")
        from PIL import ImageDraw as _ID
        dprev = _ID.Draw(prev, "RGBA")
        dprev.rounded_rectangle((px0, y0, px1, y1), radius=pad, fill=(255, 255, 255, 224))
        if pcfg.get("texte_centre"):
            from PIL import ImageFont as _IF
            cw, ch = geo.doc_px * 0.46, geo.doc_px * 0.36
            cx0, cy0 = (geo.doc_px - cw) / 2, geo.doc_px * 0.30
            # cadre pointillé approximé par petits arcs de segments
            step = 34
            for x in range(int(cx0), int(cx0 + cw), step):
                dprev.line((x, cy0, min(x + 18, cx0 + cw), cy0), fill=(138, 127, 114, 255), width=3)
                dprev.line((x, cy0 + ch, min(x + 18, cx0 + cw), cy0 + ch), fill=(138, 127, 114, 255), width=3)
            for y in range(int(cy0), int(cy0 + ch), step):
                dprev.line((cx0, y, cx0, min(y + 18, cy0 + ch)), fill=(138, 127, 114, 255), width=3)
                dprev.line((cx0 + cw, y, cx0 + cw, min(y + 18, cy0 + ch)), fill=(138, 127, 114, 255), width=3)
            fnt = _IF.truetype(str(ROOT / "fonts/Andika-Regular.ttf"), 62)
            centre = pcfg["texte_centre"]
            for k, v in variables.items():
                centre = centre.replace("{" + k + "}", v)
            lignes_c = centre.split("\n")
            base_y = cy0 + ch / 2 - len(lignes_c) * 140 / 2
            for j, lc in enumerate(lignes_c):
                wl = fnt.getlength(lc)
                dprev.text(((geo.doc_px - wl) / 2, base_y + j * 140), lc,
                           font=fnt, fill=(138, 127, 114))
        draw_text_preview(prev, tm)
        prev.convert("RGB").save(dossier / "apercus" / f"page-{num}.jpg", quality=90)
        print(f"  page {num} ✓")

    # ---- dernière page : garde vierge -----------------------------------------
    c.setPageSize((geo.doc_pt, geo.doc_pt)); c.showPage()
    c.save()
    print(f"\nPDF d'impression : {pdf_path}")
    print(f"Aperçus : {dossier / 'apercus'}/")


# ---------------------------------------------------------------------------


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("livre", help="id du livre (dossier dans livres/)")
    ap.add_argument("--prenoms", help='"Prenom1,Prenom2" — commande client (combo validée)')
    ap.add_argument("--langue", default="fr",
                    help="langue du TEXTE du livre : fr (défaut), en, es, de")
    args = ap.parse_args()

    livre, scenes, dossier = charger(args.livre)
    # Langue du texte : priorité au flag, sinon champ du livre.yaml, sinon fr.
    langue = (args.langue or livre.get("langue") or "fr").lower()
    appliquer_langue(scenes, langue)

    if args.prenoms:
        p1, p2 = [s.strip() for s in args.prenoms.split(",")]
        # Le PDF client porte la langue dans son nom (une combo → N langues).
        suffixe = "" if langue == "fr" else f"-{langue}"
        etape_pdf(livre, scenes, dossier, prenoms=(p1, p2), suffixe_pdf=suffixe)
        return

    if etape_generation(livre, scenes, dossier):
        print("\n→ Relance livre.command pour passer au tri.")
        return
    if etape_tri(livre, scenes, dossier):
        # des pages ancrées sont peut-être devenues générables
        if etape_generation(livre, scenes, dossier):
            print("\n→ Relance livre.command pour trier les pages ancrées.")
            return
    restantes = [n for n in scenes["pages"]
                 if n not in livre["selections"]
                 and not scenes["pages"][n].get("texte_seul")]
    if restantes:
        print(f"Pages restantes : {', '.join(restantes)} — relance livre.command.")
        return
    etape_pdf(livre, scenes, dossier)


if __name__ == "__main__":
    main()
