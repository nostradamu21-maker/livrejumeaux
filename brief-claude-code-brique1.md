# Brief Claude Code — Brique 1 : script de génération d'archétypes

## Contexte
Je crée un livre pour enfants personnalisé sur la gémellité, imprimé à la demande (Gelato). Les parents choisiront un archétype visuel pour chacun de leurs jumeaux. Tous les personnages sont générés par IA à partir d'une image de référence, puis détourés et composés dans les pages du livre (briques suivantes, hors périmètre ici).

Cette brique 1 doit valider le point critique du projet : la cohérence d'un personnage à travers plusieurs poses.

## Objectif
Un script Python en CLI qui, à partir d'une image de référence d'un personnage (character sheet), génère ce même personnage dans une liste de poses définies, en plusieurs variantes par pose, via une API d'édition d'image à référence de personnage.

## Stack et API
- Python 3.11+, clé API dans un fichier `.env` (jamais en dur).
- API d'images : commencer par **Gemini (modèle image, type "Nano Banana")** via l'API Google. Prévoir une couche d'abstraction simple pour pouvoir tester ensuite **Flux Kontext via fal.ai** sans réécrire le script.
- Pas de framework lourd : script + fichier de config, c'est tout.

## Entrées (fichier de config YAML)
- `reference_image` : chemin vers l'image de référence du personnage.
- `style_images` : 2-3 images définissant la direction artistique (jointes à chaque requête si l'API le permet).
- `style_prompt` : description texte du style (ex. "illustration aquarelle douce pour album jeunesse, contours légers, palette pastel").
- `poses` : liste de poses, chacune avec un `id` et un `prompt` (ex. `courir` : "le personnage court joyeusement, vu de profil, fond uni gris clair").
- `variants_per_pose` : nombre de variantes à générer par pose (défaut : 4).
- `negative_constraints` : consignes systématiques (fond neutre uni, personnage entier visible, pas de texte dans l'image, mains bien formées).

## Sorties
- Arborescence : `output/{nom_archetype}/{pose_id}/v1.png … v4.png`
- Un fichier `manifest.json` par exécution : paramètres utilisés, horodatage, coût estimé si l'API le fournit.
- Une planche contact HTML simple (`contact_sheet.html`) affichant toutes les images générées en grille pose par pose, pour que je puisse trier visuellement vite.

## Exigences
- Résolution maximale permise par l'API.
- Retry avec backoff sur les erreurs réseau/quota ; log clair de chaque appel.
- Reprise possible : si je relance, ne pas régénérer les poses déjà complètes (sauf flag `--force`).
- Option `--pose <id>` pour ne régénérer qu'une pose.
- Estimation du coût total affichée avant lancement, avec confirmation.

## Critère de réussite de la brique
Sur un archétype de test : au moins 1 variante exploitable par pose sur les 6 poses, avec un personnage reconnaissable comme identique (visage, coiffure, tenue, proportions) d'une pose à l'autre. Si la dérive est trop forte, on itérera sur les prompts et la référence avant de passer à la brique 2.

## Les 6 poses de départ
1. `face-sourire` — debout, face caméra, sourire
2. `profil-marche` — de profil, en train de marcher
3. `courir` — course joyeuse, dynamique
4. `assis-lecture` — assis en tailleur, un livre ouvert
5. `dormir` — allongé, endormi, paisible
6. `calin` — bras ouverts, prêt pour un câlin
