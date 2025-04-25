# app/run.py
import os
import sys
import time
import logging

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager, get_jwt_identity
from flask_migrate import Migrate

# extensions centralisées
from app.extensions import limiter, socketio
from models import db, User, RevokedToken

# Chargement des variables d'environnement
load_dotenv()

# Création de l'app
app = Flask(__name__, instance_relative_config=False)

# Configuration des logs
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)
app.config["PROPAGATE_EXCEPTIONS"] = True

# Chargement de la config depuis .env
app.config.from_mapping(
    SQLALCHEMY_DATABASE_URI=os.getenv("DATABASE_URL"),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    JWT_SECRET_KEY=os.getenv("JWT_SECRET_KEY"),
    JWT_TOKEN_LOCATION=["headers"],
    JWT_HEADER_NAME="Authorization",
    JWT_HEADER_TYPE="Bearer",
    JWT_COOKIE_SECURE=False,            # en dev HTTP
    JWT_COOKIE_CSRF_PROTECT=False,
    JWT_ACCESS_TOKEN_EXPIRES=3600       # 1h
)

# Initialisation des extensions
db.init_app(app)
migrate = Migrate(app, db)

jwt = JWTManager(app)

# Limiter & SocketIO
limiter.init_app(app)
socketio.init_app(app, cors_allowed_origins="*")

# Activer CORS sur tout /api/*
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_URL", "*")}}, supports_credentials=True)

# Import et enregistrement des blueprints
from app.api.auth import auth_bp
# from app.api.routes import api_bp
from app.api.team import team_bp

app.register_blueprint(auth_bp, url_prefix="/api/auth")
# app.register_blueprint(api_bp,  url_prefix="/api")
app.register_blueprint(team_bp)

# JWT callbacks
@jwt.user_identity_loader
def user_identity_lookup(user):
    return str(user.id)

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    try:
        return User.query.get(int(jwt_data["sub"]))
    except Exception:
        return None

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    if RevokedToken.query.filter_by(jti=jti).first():
        app.logger.debug(f"Token {jti} révoqué")
        return True
    return False

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return {"error": "Le token a expiré"}, 401

@jwt.invalid_token_loader
def invalid_token_callback(err):
    return {"error": f"Token invalide: {err}"}, 401

@jwt.unauthorized_loader
def missing_token_callback(err):
    return {"error": "Authentification requise"}, 401

# Pour dev : attendre la DB et créer les tables
if __name__ == "__main__":
    print("Attente de la base de données…")
    time.sleep(3)
    with app.app_context():
        db.create_all()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
