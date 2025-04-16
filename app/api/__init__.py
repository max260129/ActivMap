# app/api/__init__.py
from flask import Flask, Blueprint
from flask_cors import CORS

# Création de l'application Flask
app = Flask(__name__,
            static_folder='../static',
            template_folder='../templates')

# Configuration de CORS pour autoriser les requêtes du frontend
CORS(app,
     origins=["http://localhost:3000", "http://localhost:8080"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Route de test pour l'API
@app.route('/')
def index():
    return "API ActivMap"

# Import des routes pour enregistrer les endpoints
from . import routes
