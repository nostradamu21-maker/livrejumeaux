# Brief Claude Code — Brique 2 : détourage + montée en résolution

## Contexte
Suite du projet livre jumeaux (brique 1 validée : script de génération d'archétypes). J'ai maintenant 6 images retenues de mon archétype n°1, une par pose, sur fond uni. Cette brique transforme ces images en assets prêts pour la composition des pages : personnages détourés, transparents, en haute résolution.

## Objectif
Un script Python en CLI qui prend les images sélectionnées et produit, pour chacune : un PNG transparent du personnage détouré, en haute résolution.

## Entrées
- Dossier `selected/{nom_archetype}/` contenant les images retenues (une par pose, nommées par leur id de pose, ex. `courir.png`).

## Traitements
1. **Détourage** : suppression du fond avec le meilleur outil open source disponible (rembg avec un modèle récent type BiRefNet, ou équivalent — à toi de choisir et d'installer). Soigner les bords : pas de halo blanc ni de contour rongé, prévoir un léger alpha matting si nécessaire.
2. **Upscale ×4** : Real-ESRGAN ou équivalent, en préservant la transparence (si l'outil ne gère pas l'alpha, upscaler image et masque séparément puis recombiner).
3. **Recadrage** : rogner la zone transparente inutile en gardant une marge de 2 % autour du personnage.

## Sorties
- `assets/{nom_archetype}/{pose_id}.png` — PNG transparents haute résolution.
- Une planche contact HTML affichant chaque asset sur deux fonds : damier (vérifier la transparence) et couleur unie vive (vérifier les bords/halos).
- `manifest.json` : dimensions finales de chaque asset, outils et versions utilisés.

## Exigences
- Batch sur tout le dossier, reprise possible (ne pas retraiter un asset déjà produit sauf `--force`).
- Tout tourne en local, aucun coût API.
- Option `--pose <id>` pour retraiter une seule image.

## Critère de réussite
Les 6 assets s'affichent proprement sur fond coloré vif : bords nets, pas de halo, pas de morceaux manquants (mèches de cheveux, doigts), résolution ≥ 4000 px de hauteur.
