#!/bin/bash

# Vérifier que Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
  echo "Docker n'est pas en cours d'exécution. Veuillez démarrer Docker et réessayer."
  exit 1
fi

# Vérifier et copier les fichiers nécessaires
echo "📂 Vérification et préparation des fichiers..."
bash check_files.sh

# Nettoyage et reconstruction
echo "🧹 Nettoyage des conteneurs existants..."
docker-compose down --remove-orphans
docker system prune -f > /dev/null 2>&1

echo "🏗️ Reconstruction des images..."
docker-compose build --no-cache

echo "🔨 Build du frontend pour que les modifications soient visibles..."
docker-compose run --rm frontend npm run build

# Lancement des conteneurs
echo "🚀 Démarrage des conteneurs avec Docker Compose..."
docker-compose up -d

# Attendre que la base de données soit prête
echo "⏳ Attente du démarrage de la base de données PostgreSQL..."
sleep 20

# Vérifier si les conteneurs sont en cours d'exécution
if ! docker-compose ps | grep -q "backend.*Up"; then
  echo "❌ ERREUR: Le service backend n'est pas en cours d'exécution!"
  echo "Vérifiez les logs avec 'docker-compose logs backend'"
  exit 1
fi

# Initialiser la base de données (migrations)
echo "🔧 Initialisation de la base de données..."
docker-compose exec backend env FLASK_APP=run.py flask db init || true
docker-compose exec backend env FLASK_APP=run.py flask db migrate -m "Initial migration" || true
docker-compose exec backend env FLASK_APP=run.py flask db upgrade || true

# Création de l'utilisateur par défaut
echo "👤 Configuration de l'utilisateur par défaut..."
docker-compose exec backend python -c "from init_db import seed_default_user; seed_default_user()" || true

# Affichage des informations
echo ""
echo "✅ Application démarrée avec succès !"
echo "🌐 Frontend disponible sur : http://localhost:3000"
echo "🔐 Utilisateur par défaut : admin@activmap.fr / adminPassword123"
echo ""
echo "Pour arrêter l'application, utilisez la commande :"
echo "docker-compose down"
echo "Pour voir les logs: docker-compose logs -f" 