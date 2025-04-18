from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import sys, os
import re
import traceback
import bcrypt
from datetime import datetime
import hashlib

# Ajout du répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, User

auth_bp = Blueprint('auth', __name__)

# Validation de l'email simple
def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    # Validation
    if not is_valid_email(email):
        return jsonify({'error': 'Format d\'email invalide'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères'}), 400
    
    # Vérifier si l'utilisateur existe déjà
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Cet email est déjà utilisé'}), 409
    
    # Créer un nouvel utilisateur
    new_user = User(email=email, password=password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur créé avec succès'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email et mot de passe requis'}), 400
    
    email = data.get('email')
    password = data.get('password')
    
    # Trouver l'utilisateur
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    
    # Générer le token JWT
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        # Récupérer l'identité de l'utilisateur depuis le token
        user_id = get_jwt_identity()
        print(f"Identité JWT récupérée: {user_id}")
        
        # Avec user_lookup_loader, Flask-JWT-Extended devrait avoir déjà vérifié
        # que l'utilisateur existe, mais vérifions par sécurité
        user = User.query.filter_by(id=int(user_id)).first()
        
        if not user:
            print(f"Utilisateur {user_id} non trouvé dans la base de données")
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
        
        # Succès - retourner les données de l'utilisateur
        print(f"Utilisateur {user_id} authentifié avec succès")
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        # Capturer et logger l'erreur détaillée
        error_details = traceback.format_exc()
        print(f"Erreur d'authentification: {str(e)}")
        print(f"Détails de l'erreur: {error_details}")
        
        # Vérification des headers de la requête pour le debug
        auth_header = request.headers.get('Authorization', '')
        print(f"Header Authorization reçu: {auth_header}")
        
        # Réponse d'erreur
        return jsonify({'error': str(e)}), 401 

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json() or {}
    old_pwd = data.get('old_password')
    new_pwd = data.get('new_password')

    if not old_pwd or not new_pwd:
        return jsonify({'error': 'Champs manquants'}), 400

    user_id = get_jwt_identity()
    user = User.query.get_or_404(int(user_id))

    if not user.check_password(old_pwd):
        return jsonify({'error': 'Ancien mot de passe incorrect'}), 403

    if len(new_pwd) < 6:
        return jsonify({'error': 'Le nouveau mot de passe est trop court'}), 400

    # Mise à jour mot de passe
    user.password = bcrypt.hashpw(new_pwd.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    try:
        db.session.commit()
        return jsonify({'message': 'Mot de passe mis à jour'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ------------------------------------------------------------
# Accept invitation (définir le mot de passe via token)
# ------------------------------------------------------------

@auth_bp.route('/accept-invite', methods=['POST'])
def accept_invite():
    data = request.get_json() or {}
    raw_token = data.get('token')
    password = data.get('password')

    if not raw_token or not password:
        return jsonify({'error': 'Données manquantes'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Mot de passe trop court'}), 400

    hashed = hashlib.sha256(raw_token.encode()).hexdigest()
    user = User.query.filter_by(invite_token=hashed).first()

    if not user:
        return jsonify({'error': 'Token invalide'}), 400

    if user.invite_expires and datetime.utcnow() > user.invite_expires:
        return jsonify({'error': 'Invitation expirée'}), 410

    # Définir le mot de passe
    user.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.invite_token = None
    user.invite_expires = None
    user.reset_required = False
    user.joined_at = datetime.utcnow()

    db.session.commit()

    return jsonify({'message': 'Mot de passe défini, vous pouvez vous connecter'}), 200 