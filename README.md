# ActivMap

Application de génération de cartes stylisées pour la marche à pied en ville.

## Structure du projet

```
ActivMap/
├── app/                   # Application backend (Flask)
│   ├── api/               # API REST
│   │   ├── __init__.py    # Initialisation de l'application Flask
│   │   └── routes.py      # Définition des routes de l'API
│   ├── static/            # Fichiers statiques (images de cartes générées)
│   ├── templates/         # Templates HTML (si nécessaire)
│   ├── utils/             # Utilitaires
│   │   ├── __init__.py
│   │   └── map_generator.py  # Générateur de cartes
│   └── run.py             # Point d'entrée de l'application
├── frontend/              # Application frontend
│   └── svelte-app/        # Application Svelte
├── Dockerfile             # Configuration Docker pour le déploiement
└── requirements.txt       # Dépendances Python
```

## Installation et exécution

### Backend (Python/Flask)

1. Créer un environnement virtuel Python:
   ```
   python -m venv venv
   source venv/bin/activate   # Sur Windows: venv\Scripts\activate
   ```

2. Installer les dépendances:
   ```
   pip install -r requirements.txt
   ```

3. Lancer l'application:
   ```
   python app/run.py
   ```

### Frontend (Svelte)

1. Aller dans le dossier frontend:
   ```
   cd frontend/svelte-app
   ```

2. Installer les dépendances:
   ```
   npm install
   ```

3. Lancer le serveur de développement:
   ```
   npm run dev
   ```

## Utilisation avec Docker

1. Construire l'image Docker:
   ```
   docker build -t activmap .
   ```

2. Lancer le conteneur:
   ```
   docker run -p 5000:5000 activmap
   ```

3. Accéder à l'application à l'adresse: http://localhost:5000

## API

- `POST /generate`: Génère une carte stylisée
  - Payload:
    ```json
    {
      "latitude": 49.444838,
      "longitude": 1.094214,
      "distance": 150
    }
    ```
  - Retourne: Une image SVG de la carte générée 