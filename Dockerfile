FROM python:3.9-slim

WORKDIR /app

# Installation des dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    libgdal-dev \
    libproj-dev \
    libgeos-dev \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier tous les fichiers nécessaires
COPY app/ .
COPY models.py middleware.py init_db.py ./

# Exposer le port
EXPOSE 5000

# Configurer les variables d'environnement
ENV PYTHONPATH="${PYTHONPATH}:/app"

# Commande de lancement
CMD ["python", "app.py"] 