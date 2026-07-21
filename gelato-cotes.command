#!/bin/bash
# Cotes de couverture Gelato (rigide 20x20, 30 pages) — gratuit, lecture seule.
cd "$(dirname "$0")"
source .venv/bin/activate
PUID="photobooks-hardcover_pf_200x200-mm-8x8-inch_pt_170-gsm-65lb-coated-silk_cl_4-4_ccl_4-4_bt_glued-left_ct_matt-lamination_prt_1-0_cpt_130-gsm-65-lb-cover-coated-silk_ver"
python gelato.py cotes "$PUID" 30 > livres/gelato-cotes.json 2> livres/gelato-cotes-erreur.txt
if [ -s livres/gelato-cotes.json ]; then echo "OK → livres/gelato-cotes.json"; else echo "Erreur :"; cat livres/gelato-cotes-erreur.txt; fi
read -p "Appuie sur Entrée pour fermer cette fenêtre."
