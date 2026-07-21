# Brief Claude Code — Brique 3 : composition d'une page et export PDF imprimable

## Contexte
Suite du projet livre jumeaux. Briques validées : génération des poses d'un archétype (brique 1), détourage + upscale en PNG transparents haute résolution (brique 2, dossier `assets/archetype-01/`). Cette brique assemble une première vraie page du livre et l'exporte en PDF prêt pour l'impression à la demande (Gelato).

## Objectif
Un moteur de composition en Python : à partir d'un décor, d'un ou deux personnages détourés, et d'un texte avec prénom(s) injecté(s), produire une page en PDF au gabarit d'impression, plus une prévisualisation JPEG.

## Format cible
- Livre carré 21 × 21 cm (format courant en album jeunesse chez Gelato).
- Fond perdu de 3 mm sur les 4 côtés (page utile 21×21, document 21,6 × 21,6 cm).
- 300 dpi.
- PDF/X si possible, sinon PDF standard haute qualité ; ne pas gérer la conversion CMJN nous-mêmes pour l'instant (Gelato convertit), mais éviter les couleurs hors gamut très saturées.

## Entrées
1. `backgrounds/chambre.png` — le décor (je le fournis ; s'il est en basse résolution, le passer d'abord dans l'upscale de la brique 2).
2. `assets/archetype-01/{pose}.png` — les personnages détourés.
3. Un fichier de mise en page `layouts/page-test.json` décrivant la page :
   - décor utilisé ;
   - pour chaque personnage : quel asset, position (x, y en % de la page), échelle, miroir horizontal oui/non ;
   - zone de texte : position, largeur, alignement ;
   - texte avec variables : ex. `"{prenom1} ouvre les yeux le premier, comme tous les matins."` ;
   - valeurs des variables : `{"prenom1": "Léo"}`.

## Traitements
1. Composer : décor redimensionné plein format (fond perdu compris) + personnages positionnés selon le layout.
2. **Ombre portée** : sous chaque personnage, une ellipse douce semi-transparente (flou gaussien), taille proportionnelle au personnage — c'est ce qui l'ancre dans le décor.
3. **Texte vectoriel** (jamais rasterisé dans l'image) : police jeunesse libre de droits et très lisible (ex. Quicksand ou Andika, à télécharger dans `fonts/`), corps ~20-24 pt, couleur foncée douce, avec injection des variables prénoms.
4. Export : `output/pages/page-test.pdf` (gabarit complet avec fond perdu) + `output/previews/page-test.jpg` (prévisualisation écran avec repères de coupe optionnels via `--guides`).

## Exigences
- Le layout JSON doit être facilement duplicable : une page = un fichier JSON. C'est ce format qui servira pour les 14 pages du livre.
- CLI : `compose --layout layouts/page-test.json --vars '{"prenom1": "Léo"}'`.
- Vérification automatique : avertir si un personnage ou le texte déborde de la zone de sécurité (5 mm à l'intérieur du format fini).

## Critère de réussite
Une page qui, à l'écran en zoom 100 %, semble sortie d'un vrai album : personnage bien intégré au décor (ombre, échelle cohérente), texte net avec le prénom injecté, aucun élément important à moins de 5 mm du bord de coupe.
