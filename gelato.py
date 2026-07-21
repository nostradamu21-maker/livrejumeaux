"""Client API Gelato minimal — catalogue, cotes de couverture, commandes.

Clé lue dans .env : GELATO_API_KEY. Tout s'exécute en local sur le Mac de Simon.
Docs : https://dashboard.gelato.com/docs/
En cas d'erreur, les détails sont écrits dans livres/gelato-journal.txt.
"""

from __future__ import annotations

import json
from pathlib import Path

import subprocess

from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent
PRODUCT = "https://product.gelatoapis.com/v3"
ORDER = "https://order.gelatoapis.com/v4"


def _key() -> str:
    k = dotenv_values(ROOT / ".env").get("GELATO_API_KEY")
    if not k:
        raise SystemExit("GELATO_API_KEY introuvable dans .env")
    return k


def _curl(args: list[str]) -> dict:
    """Appels via curl système (le Python 3.9 macOS a un TLS trop ancien pour Gelato)."""
    cmd = ["curl", "-sS", "--fail-with-body", "-H", f"X-API-KEY: {_key()}",
           "-H", "Content-Type: application/json"] + args
    p = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if p.returncode != 0:
        raise RuntimeError(f"curl a échoué ({p.returncode}) : {p.stderr.strip()} "
                           f"{p.stdout[:500]}")
    return json.loads(p.stdout)


def _get(url: str, **params):
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    return _curl([url])


def _post(url: str, payload: dict):
    return _curl(["-X", "POST", "-d", json.dumps(payload), url])


def catalogues() -> list:
    data = _get(f"{PRODUCT}/catalogs")
    # selon la version de l'API : liste directe ou enveloppe {"data": [...]}
    if isinstance(data, dict):
        data = data.get("data") or data.get("catalogs") or []
    return data


def produits_livres_photo() -> list[dict]:
    """TOUS les produits des catalogues « photobook », bruts (filtrage fait après).
    La première page brute de chaque réponse est journalisée pour diagnostic."""
    log = ROOT / "livres" / "gelato-journal.txt"
    resultats = []
    for cat in catalogues():
        cid = cat.get("catalogUid", "") if isinstance(cat, dict) else str(cat)
        if "photobook" not in cid:
            continue
        offset = 0
        while True:
            page = _post(f"{PRODUCT}/catalogs/{cid}/products:search",
                         {"limit": 100, "offset": offset})
            if offset == 0:
                with log.open("a", encoding="utf-8") as f:
                    f.write(f"\nRAW {cid} (1re page, 3000 c):\n"
                            + json.dumps(page)[:3000] + "\n")
            prods = page.get("products", []) if isinstance(page, dict) else []
            for p in prods:
                resultats.append({"catalog": cid,
                                  "productUid": p.get("productUid", ""),
                                  "attributes": p.get("attributes", {})})
            if len(prods) < 100:
                break
            offset += 100
    return resultats


def cotes_couverture(product_uid: str, page_count: int) -> dict:
    return _get(f"{PRODUCT}/products/{product_uid}/cover-dimensions",
                pageCount=page_count)


def creer_commande(payload: dict) -> dict:
    """Commande (draft ou réelle) — utilisée plus tard par le site."""
    return _post(f"{ORDER}/orders", payload)


if __name__ == "__main__":
    import sys
    import traceback

    log = ROOT / "livres" / "gelato-journal.txt"
    if len(sys.argv) > 1 and sys.argv[1] == "catalogue":
        try:
            cats = catalogues()
            log.write_text("CATALOGUES:\n" + json.dumps(cats, indent=2)[:5000] + "\n\n",
                           encoding="utf-8")
            prods = produits_livres_photo()
            out = ROOT / "livres" / "gelato-catalogue.json"
            out.write_text(json.dumps(prods, indent=2, ensure_ascii=False),
                           encoding="utf-8")
            print(f"{len(prods)} produits photobooks trouvés → {out}")
            with log.open("a", encoding="utf-8") as f:
                f.write(f"OK — {len(prods)} produits photobooks\n")
            for p in prods[:20]:
                print(" -", p["productUid"])
        except Exception as e:  # noqa: BLE001
            with log.open("a", encoding="utf-8") as f:
                f.write(f"ERREUR: {e}\n{traceback.format_exc()}\n")
            print(f"Erreur : {e} — détails dans {log}")
    elif len(sys.argv) > 3 and sys.argv[1] == "cotes":
        print(json.dumps(cotes_couverture(sys.argv[2], int(sys.argv[3])),
                         indent=2, ensure_ascii=False))
    else:
        print("Usage : python gelato.py catalogue | cotes <productUid> <pages>")
