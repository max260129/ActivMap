FROM node:16-slim

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Utiliser un cache npm temporaire pour éviter les problèmes d'accès
ENV npm_config_cache=/tmp/.npm-cache

# Installer les dépendances
RUN npm install --no-optional

# Copier le reste du code
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 8080

# Commande de lancement
CMD ["npx", "sirv", "public", "--host", "0.0.0.0", "--port", "8080", "--no-clear"] 