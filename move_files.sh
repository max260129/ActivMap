#!/bin/bash

echo "Copie des fichiers Python à la racine du projet..."

# Copier les fichiers depuis app/ vers la racine
cp app/models.py ./
cp app/init_db.py ./
cp app/middleware.py ./
cp app/generate_map.py ./

echo "Fichiers copiés avec succès!" 