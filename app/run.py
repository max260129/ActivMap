# app/run.py
import os
import sys
import time
import logging
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, get_jwt
from flask_migrate import Migrate
from flask_cors import CORS
from flask_socketio import SocketIO
from flask import jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Chargement des variables d'environnement
load_dotenv()

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Importation de l'application Flask depuis le package app.api
from app import app  # Cette ligne récupère l'instance Flask définie dans app/api/__init__.py

# --- Protection sécurité/csp ---
from flask_talisman import Talisman

# Politique CSP de base (peut être ajustée)
csp = {
    'default-src': ["'self'"],
    'img-src': ["'self'", 'data:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'script-src': ["'self'"]
}

# Activation de Talisman (sécurise aussi HSTS, nosniff, etc.)
Talisman(app, content_security_policy=csp)

# Initialisation globale de CORS (support des credentials)
CORS(app, supports_credentials=True)

# --- Rate Limiting ---
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.environ.get('REDIS_URL', 'redis://redis:6379/0'),
    default_limits=["200 per day", "50 per hour"]
)
limiter.init_app(app)

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'Trop de requêtes, réessayez plus tard.'}), 429

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
from models import db, User, RevokedToken

# Configuration de la base de données
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuration JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
app.config['JWT_COOKIE_SECURE'] = False  # True en production (HTTPS)
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600     # 1 heure

# Configuration globale Flask
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'CHANGE_ME_SECRET')

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
    jti = jwt_payload["jti"]
    if RevokedToken.query.filter_by(jti=jti).first():
        logger.debug(f"Token {jti} révoqué (liste noire)")
        return True
    # Vérifier si l'utilisateur est supprimé
    try:
        user_id = int(jwt_payload["sub"])
        user = User.query.get(user_id)
        if user and user.deleted_at is not None:
            logger.debug(f"Token refusé : utilisateur {user_id} supprimé")
            return True
    except Exception as e:
        logger.error("Erreur vérif utilisateur supprimé", e)
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
    # Forcer HTTPS en production si derrière proxy — ici on part en debug False
    socketio.run(app, host='0.0.0.0', debug=False, ssl_context='adhoc')
