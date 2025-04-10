#!/bin/bash

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
  echo "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker et réessayer."
  exit 1
fi

# Nettoyage et reconstruction
echo "Préparation de l'environnement..."
docker-compose down --remove-orphans
docker system prune -f > /dev/null 2>&1
docker-compose build --no-cache

# Lancement des conteneurs
echo "Lancement des conteneurs..."
docker-compose up -d

# Affichage des informations
echo ""
echo "Application ActivMap lancée !"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo ""
echo "Pour voir les logs: docker-compose logs -f" 