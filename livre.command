#!/bin/bash
# Pipeline « Deux comme nous » — toujours le même double-clic.
cd "$(dirname "$0")"
source .venv/bin/activate
echo "Livres disponibles :"
select ID in $(ls livres); do break; done
python livre.py "$ID"
echo ""
read -p "Appuie sur Entrée pour fermer cette fenêtre."
