from flask import Flask
from flask_cors import CORS

# Création de l'application Flask
app = Flask(__name__, 
            static_folder='../static', 
            template_folder='../templates')

# Configurer CORS pour permettre les requêtes du frontend avec des origines spécifiques
CORS(app, 
     origins=["http://localhost:3000", "http://localhost:8080"], 
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Définition de la route principale
@app.route('/')
def index():
    return "API ActivMap"

# Import des autres modules en bas pour éviter les importations circulaires
from . import routes

# Ce fichier déclare le dossier api comme un package Python 