# app.py
import os
import sys
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
import time
import importlib.util
import logging

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Pour résoudre les problèmes d'importation
import importlib.util
import os

# Chargement des variables d'environnement
load_dotenv()

# Importation manuelle du module api
api_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api', '__init__.py')
spec = importlib.util.spec_from_file_location('api', api_path)
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)

# Récupération de l'application Flask
app = api.app

# Import des modèles
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User

# Configuration de la base de données
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuration JWT avec plus de logging et de sécurité
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'
app.config['JWT_COOKIE_SECURE'] = False  # Mettre à True en production avec HTTPS
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Désactivé pour simplifier les tests
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600  # 1 heure

# Initialisation des extensions
db.init_app(app)
jwt = JWTManager(app)

# Identity handling pour JWT
@jwt.user_identity_loader
def user_identity_lookup(user):
    return str(user)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    try:
        # Assurer que l'identité est un entier
        user_id = int(identity)
        return User.query.filter_by(id=user_id).one_or_none()
    except (ValueError, TypeError):
        return None

# Callbacks JWT pour diagnostiquer les problèmes
@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    logger.debug(f"Vérification du token: {jwt_payload}")
    return False  # Pas de liste de blocage pour l'instant

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

# Importation manuelle du blueprint auth
auth_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'api', 'auth.py')
spec = importlib.util.spec_from_file_location('auth', auth_path)
auth = importlib.util.module_from_spec(spec)
spec.loader.exec_module(auth)

# Enregistrement du blueprint
app.register_blueprint(auth.auth_bp, url_prefix='/api/auth')

# Attendre que la base de données soit prête
print("Attente de la base de données...")
time.sleep(3)

# Création des tables (en développement uniquement)
with app.app_context():
    try:
        db.create_all()
        print("✅ Tables de base de données créées avec succès!")
        
        # Import et exécution de seed_default_user
        from init_db import seed_default_user
        seed_default_user(app)
    except Exception as e:
        print(f"❌ Erreur lors de la création des tables: {str(e)}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 