# Brique 1 — Génération d'archétypes

Génère un personnage cohérent à travers plusieurs poses à partir d'une image de
référence, via l'endpoint d'édition d'image OpenAI (`gpt-image-1`).

## Installation

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Puis colle ta clé dans `.env` :

```
OPENAI_API_KEY=sk-...
```

## Usage

```bash
python generate_archetypes.py config.yaml          # les 6 poses
python generate_archetypes.py config.yaml --pose courir   # une seule pose
python generate_archetypes.py config.yaml --force  # régénère tout
python generate_archetypes.py config.yaml --yes    # sans confirmation du coût
```

## Sorties

```
output/{archetype}/{pose_id}/v1.png … v4.png
output/{archetype}/manifest.json
output/{archetype}/contact_sheet.html   # planche contact pour trier vite
```

## Changer de fournisseur

La couche d'abstraction est dans `providers.py`. Pour brancher Flux Kontext via
fal.ai plus tard, ajouter une classe `ImageProvider` et l'enregistrer dans
`build_provider()`, sans toucher au script principal.

---

# Brique 2 — Détourage + montée en résolution

Transforme les images retenues (une par pose, sur fond uni) en assets prêts pour
la composition : PNG transparents haute résolution. **Tout tourne en local, aucun
coût API.**

Pipeline par image :
1. **Détourage** — rembg / BiRefNet (`birefnet-general`). onnxruntime est forcé sur
   `CPUExecutionProvider` : le CoreML provider de macOS compile puis plante sur ce
   modèle.
2. **Bords propres** — défrangeage (les couleurs de premier plan sont étendues sous
   l'alpha), bouchage des trous de masque, légère érosion (2 px). Pas d'alpha
   matting rembg : il délave le contour en clair (halo).
3. **Upscale ×4** — Real-ESRGAN via `spandrel` (poids `models/RealESRGAN_x4plus.pth`),
   accéléré sur MPS avec repli CPU. L'alpha est agrandi en LANCZOS puis recombiné.
4. **Recadrage** — sur le personnage, marge 2 %.

## Poids Real-ESRGAN (à télécharger une fois)

```bash
mkdir -p models
curl -L -o models/RealESRGAN_x4plus.pth \
  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
```

## Usage

```bash
python process_assets.py selected/archetype1              # toutes les poses
python process_assets.py selected/archetype1 --pose courir
python process_assets.py selected/archetype1 --force      # retraite tout
python process_assets.py selected/archetype1 --device cpu # forcer le CPU
```

## Sorties

```
assets/{archetype}/{pose_id}.png       # PNG transparents ≥ 4000 px de haut
assets/{archetype}/manifest.json       # dimensions, outils et versions
assets/{archetype}/contact_sheet.html  # chaque asset sur damier + fond vif
```

---

# Brique 3 — Composition d'une page + PDF imprimable

Assemble un décor, un ou deux personnages détourés et un texte à variables en une
page au gabarit Gelato. **Local, aucun coût API.**

- Format : livre carré **21×21 cm** + **3 mm de fond perdu** (doc 21,6×21,6 cm), **300 dpi**.
- Décor + personnages + ombres portées composés en raster ; **texte vectoriel**
  (police Andika embarquée) ajouté par-dessus dans le PDF — jamais rasterisé.
- Ombre portée : ellipse douce (flou gaussien) sous chaque personnage, pour l'ancrer.
- Contrôle automatique : avertit si un personnage ou le texte entre dans les 5 mm
  de la zone de sécurité.
- Si le décor est en basse résolution, il est upscalé ×4 (brique 2) puis mis en cache.

## Police (à télécharger une fois)

```bash
mkdir -p fonts
curl -sL -o fonts/Andika-Regular.ttf https://github.com/google/fonts/raw/main/ofl/andika/Andika-Regular.ttf
curl -sL -o fonts/Andika-Bold.ttf    https://github.com/google/fonts/raw/main/ofl/andika/Andika-Bold.ttf
```

## Usage

```bash
python compose.py --layout layouts/page-test.json --vars '{"prenom1": "Léo"}'
python compose.py --layout layouts/page-test.json --guides   # repères coupe + sécurité sur l'aperçu
```

## Layout (un fichier JSON = une page, duplicable pour les 14 pages)

- `background` : chemin du décor. `background_mirror` (bool) : miroir horizontal du décor.
- `characters[]` : **l'ordre = la profondeur** (le 1er est dessiné en premier = arrière-plan,
  le dernier par-dessus = avant-plan). Chaque perso : `asset`, `x`/`y` (**centre horizontal**
  et **ligne de sol**, en % du doc), `scale` (hauteur du perso en fraction de la hauteur du
  doc — un `scale` plus petit = plus loin/perspective), `mirror`, `rotate` (degrés), `shadow`
  (`opacity`, `blur`, `width_ratio`, `height_ratio`, `dy_ratio`, `dx_ratio` — les deux derniers
  décalent l'ellipse en fraction de la hauteur/largeur du perso, utile quand un accessoire
  comme un livre décentre l'image par rapport au corps). `shadow.mode: "contact"` remplace
  l'ellipse par la projection au sol de la silhouette (bande basse du perso, param `band`,
  défaut 0.25) : l'ombre drape le bas réel du personnage colonne par colonne — indispensable
  pour les poses assises/complexes où une ellipse laisse des jours sous les jambes.
- `underlay` (par personnage, optionnel) : PNG semi-transparent AU MÊME CADRE que l'asset,
  dessiné juste sous le personnage avec les mêmes transformations (mirror/rotate/scale).
  Usage principal : l'ombre au sol PEINTE de la génération d'origine, extraite en calque
  séparé (ex. `assets/archetype1/assis-lecture-ombre.png`) — pour un personnage assis,
  l'ombre doit entourer la base (les fesses et les pieds touchent le sol), jamais passer
  sous la silhouette, sinon il « lévite ». Mettre alors `shadow.opacity: 0`.
  Deux jumeaux = deux entrées, poses/échelles/rotations indépendantes.
- `text` : `content` (avec variables `{prenom1}`…), `x`/`y`/`width` (coin haut-gauche +
  largeur de la zone, en %), `align`, `font`, `size_pt`, `color`, `line_spacing`.
- `vars` : valeurs par défaut des variables (la CLI `--vars` a priorité).

## Sorties

```
output/pages/{page_id}.pdf        # gabarit imprimable, fond perdu, texte vectoriel
output/previews/{page_id}.jpg     # aperçu écran (texte rasterisé, repères si --guides)
```

Le PDF est un PDF standard haute qualité en sRGB (pas de conversion CMJN : Gelato
s'en charge). Il n'est pas balisé PDF/X.
