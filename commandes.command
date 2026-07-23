#!/bin/bash
# Relève des commandes du site + production à la chaîne — double-clic.
cd "$(dirname "$0")"
source .venv/bin/activate
python commandes.py
echo ""
read -p "Appuie sur Entrée pour fermer cette fenêtre."
