# Guide d'utilisation Docker pour ActivMap

Ce guide vous explique comment lancer l'application ActivMap à l'aide de Docker et Docker Compose.

## Prérequis

- Docker installé sur votre machine
- Docker Compose installé sur votre machine

## Instructions de lancement

1. Clonez le dépôt et accédez au répertoire du projet :
   ```
   git clone <URL_DU_REPO>
   cd ActivMap
   ```

2. Lancez les conteneurs avec Docker Compose :
   ```
   docker-compose up -d
   ```

3. Accédez à l'application :
   - Frontend : http://localhost:3000
   - Backend API : http://localhost:5000

## Commandes utiles

- Pour voir les logs des conteneurs :
  ```
  docker-compose logs -f
  ```

- Pour arrêter les conteneurs :
  ```
  docker-compose down
  ```

- Pour reconstruire les images (après modifications) :
  ```
  docker-compose build
  ```

- Pour reconstruire et redémarrer les conteneurs :
  ```
  docker-compose up -d --build
  ```

## Structure des conteneurs

L'application est divisée en deux services :

1. **Backend** : Service Flask qui expose l'API pour générer les cartes avec OSMnx.
   - Port exposé : 5000

2. **Frontend** : Application Svelte qui fournit l'interface utilisateur.
   - Port exposé : 3000 (redirection vers le port 5000 du conteneur)

Les volumes sont configurés pour permettre le développement sans avoir à reconstruire les images à chaque modification. 