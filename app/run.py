# app/run.py
import os
import sys
import time
import logging
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_socketio import SocketIO

# Chargement des variables d'environnement
load_dotenv()

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Importation de l'application Flask depuis le package app.api
from app import app  # Cette ligne récupère l'instance Flask définie dans app/api/__init__.py

# Initialisation globale de CORS (support des credentials)
CORS(app, supports_credentials=True)

# --- Ajout SocketIO ---
# Crée une instance SocketIO réutilisable dans le reste de l'application
socketio = SocketIO(
    app,
    cors_allowed_origins="*",  # En développement ; restreindre en prod
    ping_interval=25,
    ping_timeout=60
)

# Import des routes (elles s'enregistrent déjà via l'import dans app/api/__init__.py, 
# mais ici on peut forcer leur chargement si besoin)
from app.api import routes

# Ajout du chemin parent pour importer les modèles (si "models" se trouve à la racine)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User

# Configuration de la base de données
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuration JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_COOKIE_SECURE'] = False         # À mettre à True en production (HTTPS)
app.config['JWT_COOKIE_CSRF_PROTECT'] = False     # Désactivé pour simplifier les tests
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600     # 1 heure

# Initialisation des extensions
db.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

@jwt.user_identity_loader
def user_identity_lookup(user):
    return str(user)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    try:
        user_id = int(identity)
        return User.query.filter_by(id=user_id).one_or_none()
    except (ValueError, TypeError):
        return None

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    logger.debug(f"Vérification du token: {jwt_payload}")
    return False

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    logger.debug("Token expiré")
    return {"error": "Le token a expiré"}, 401

@jwt.invalid_token_loader
def invalid_token_callback(error_string):
    logger.debug(f"Token invalide: {error_string}")
    return {"error": f"Token invalide: {error_string}"}, 401

@jwt.unauthorized_loader
def missing_token_callback(error_string):
    logger.debug(f"Token manquant: {error_string}")
    return {"error": "Authentification requise"}, 401

# Import et enregistrement du blueprint d'authentification depuis app/api/auth.py
from app.api import auth
app.register_blueprint(auth.auth_bp, url_prefix='/api/auth')

# Blueprint équipe
from app.api.team import team_bp
app.register_blueprint(team_bp)

# Pour le développement, attendre que la base de données soit prête
print("Attente de la base de données...")
time.sleep(3)

# Création des tables (en développement uniquement)
with app.app_context():
    try:
        db.create_all()
        print("✅ Tables de base de données créées avec succès!")
        from init_db import seed_default_user
        seed_default_user(app)
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {str(e)}")

if __name__ == '__main__':
    # Lancement via SocketIO pour supporter les WebSockets
    socketio.run(app, host='0.0.0.0', debug=True)
