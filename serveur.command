#!/bin/bash
# Configurateur de commande « Deux comme nous » — double-clic pour démarrer.
cd "$(dirname "$0")"
source .venv/bin/activate
echo "Le configurateur va s'ouvrir dans le navigateur…"
( sleep 1 ; open http://127.0.0.1:5001/ ) &
python serveur.py
