#!/bin/bash
# Récupère le catalogue Gelato des livres photo 21x21 (gratuit, lecture seule).
cd "$(dirname "$0")"
source .venv/bin/activate
python gelato.py catalogue
echo ""
read -p "Appuie sur Entrée pour fermer cette fenêtre."
