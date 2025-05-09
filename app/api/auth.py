from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt, set_access_cookies, get_csrf_token, unset_jwt_cookies
import sys, os
import re
import traceback
import bcrypt
from datetime import datetime, timedelta
import hashlib
import uuid
from utils.mailer import send_email
from app.run import socketio
from app.run import limiter
from app.api.team import user_to_dict
from models import db, User, Consent, RevokedToken
import time

# Ajout du répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

auth_bp = Blueprint('auth', __name__)

# Validation de l'email simple
def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

# Ajout de la validation du mot de passe fort
def is_strong_password(pwd: str) -> bool:
    '''
    Vérifie qu'un mot de passe contient :
    - au moins 8 caractères
    - au moins un chiffre
    - au moins un caractère spécial
    '''
    if len(pwd) < 8:
        return False
    if not any(c.isdigit() for c in pwd):
        return False
    if not any(not c.isalnum() for c in pwd):
        return False
    return True

# ------------------------------------------------------------
# AuditLog – journalisation des actions sensibles
# ------------------------------------------------------------

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=True)
    action = db.Column(db.String(50), nullable=False)
    ip = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Audit {self.action} user={self.user_id}>'


def log_event(user_id, action):
    """Enregistre une entrée d'audit sans interrompre la requête en cas d'erreur."""
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            ip=request.remote_addr,
            user_agent=request.headers.get('User-Agent')[:250]
        )
        db.session.add(entry)
        db.session.commit()
    except Exception as e:
        # Ne pas bloquer l'application si l'audit échoue
        print('Erreur audit', e)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    """Inscription puis envoi d'un e‑mail de confirmation."""
    data = request.get_json() or {}

    email = data.get('email')
    password = data.get('password')
    consent = data.get('consent')

    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    # Consentement obligatoire
    if consent is not True:
        return jsonify({'error': 'Le consentement à la politique de confidentialité est requis'}), 400

    # Validation basique
    if not is_valid_email(email):
        return jsonify({'error': "Format d'email invalide"}), 400
    if not is_strong_password(password):
        return jsonify({
            'error': 'Le mot de passe doit contenir au moins 8 caractères, inclure au moins un chiffre et un caractère spécial'
        }), 400

    # Existence
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà utilisé'}), 409

    # Création utilisateur
    new_user = User(email=email, password=password)

    # Génération du token de confirmation
    raw_token = uuid.uuid4().hex
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
    new_user.confirm_token = hashed_token
    new_user.confirm_expires = datetime.utcnow() + timedelta(hours=24)

    db.session.add(new_user)
    # Enregistrer le consentement dans la table consents
    consent_record = Consent(user=new_user)
    db.session.add(consent_record)
    db.session.commit()

    # Envoi e‑mail
    confirm_link = f"http://localhost:3000/#confirm?token={raw_token}"
    send_email(
        to=email,
        subject="Confirmation de votre adresse e‑mail ActivMap",
        html_content=f"""
        <p>Bonjour,</p>
        <p>Merci de votre inscription. Cliquez sur le lien ci‑dessous pour confirmer votre adresse e‑mail :</p>
        <p><a href='{confirm_link}'>{confirm_link}</a></p>
        <p>Ce lien expirera dans 24 heures.</p>
        <p>À bientôt sur ActivMap !</p>
        """
    )

    log_event(new_user.id, 'register')

    return jsonify({'message': 'Inscription réussie. Vérifie tes e‑mails pour confirmer votre adresse.'}), 201

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
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
    
    # Compte non confirmé
    if not user.email_confirmed:
        return jsonify({'error': 'Compte non confirmé. Vérifie tes e‑mails.'}), 403
    
    # Générer le token JWT
    access_token = create_access_token(identity=user.id)
    
    response = jsonify({
        'access_token': access_token,
        'csrf_token': get_csrf_token(access_token),
        'user': user.to_dict()
    })
    # Déposer le JWT dans un cookie HttpOnly
    set_access_cookies(response, access_token)
    log_event(user.id, 'login')
    return response, 200

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

    if not is_strong_password(new_pwd):
        return jsonify({
            'error': 'Le mot de passe doit contenir au moins 8 caractères, inclure au moins un chiffre et un caractère spécial'
        }), 400

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
    user.email_confirmed = True

    db.session.commit()

    # --- Évènement temps‑réel : membre rejoint ---
    socketio.emit('team_member_joined', user_to_dict(user))

    return jsonify({'message': 'Mot de passe défini, vous pouvez vous connecter'}), 200

# ------------------------------------------------------------
# Mot de passe oublié : demande de lien
# ------------------------------------------------------------

@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email requis'}), 400

    # Chercher l'utilisateur
    user = User.query.filter_by(email=email).first()

    # Réponse générique pour éviter la divulgation d'existence de compte
    generic_msg = {'message': 'Si un compte existe, un email de réinitialisation a été envoyé.'}

    if not user:
        return jsonify(generic_msg), 200

    # Génération du token unique
    raw_token = uuid.uuid4().hex
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()

    user.reset_token = hashed_token
    user.reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.session.commit()

    # Envoi de l'e‑mail
    reset_link = f"http://localhost:3000/#reset?token={raw_token}"
    send_email(
        to=email,
        subject="Réinitialisation de votre mot de passe ActivMap",
        html_content=f"""
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci‑dessous pour définir un nouveau mot de passe :</p>
        <p><a href='{reset_link}'>{reset_link}</a></p>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>
        """
    )

    return jsonify(generic_msg), 200

# ------------------------------------------------------------
# Mot de passe oublié : définition du nouveau mot de passe
# ------------------------------------------------------------

@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("3 per minute")
def reset_password():
    data = request.get_json() or {}
    raw_token = data.get('token')
    password = data.get('password')

    if not raw_token or not password:
        return jsonify({'error': 'Données manquantes'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Mot de passe trop court'}), 400

    hashed = hashlib.sha256(raw_token.encode()).hexdigest()
    user = User.query.filter_by(reset_token=hashed).first()

    if not user:
        return jsonify({'error': 'Token invalide'}), 400

    if user.reset_expires and datetime.utcnow() > user.reset_expires:
        return jsonify({'error': 'Lien expiré'}), 410

    # Mise à jour du mot de passe
    user.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.reset_token = None
    user.reset_expires = None
    db.session.commit()

    return jsonify({'message': 'Mot de passe mis à jour'}), 200

# ------------------------------------------------------------
# Confirmation d'email après inscription
# ------------------------------------------------------------

@auth_bp.route('/confirm-email', methods=['POST'])
@limiter.limit("5 per hour")
def confirm_email():
    data = request.get_json() or {}
    raw_token = data.get('token')

    if not raw_token:
        return jsonify({'error': 'Token manquant'}), 400

    hashed = hashlib.sha256(raw_token.encode()).hexdigest()
    user = User.query.filter_by(confirm_token=hashed).first()

    if not user:
        return jsonify({'error': 'Token invalide'}), 400

    if user.email_confirmed:
        return jsonify({'message': 'Compte déjà confirmé'}), 200

    if user.confirm_expires and datetime.utcnow() > user.confirm_expires:
        return jsonify({'error': 'Lien expiré'}), 410

    user.email_confirmed = True
    user.confirm_token = None
    user.confirm_expires = None
    user.joined_at = user.joined_at or datetime.utcnow()
    db.session.commit()

    return jsonify({'message': 'Adresse e‑mail confirmée, vous pouvez maintenant vous connecter.'}), 200

# ------------------------------------------------------------
# Renvoyer l'e‑mail de confirmation
# ------------------------------------------------------------

@auth_bp.route('/resend-confirmation', methods=['POST'])
@limiter.limit("3 per minute")
def resend_confirmation():
    data = request.get_json() or {}
    email = data.get('email')

    generic_msg = {'message': 'Si le compte existe et n\'est pas confirmé, un e‑mail a été envoyé.'}

    if not email:
        return jsonify(generic_msg), 200

    user = User.query.filter_by(email=email).first()

    if not user or user.email_confirmed:
        return jsonify(generic_msg), 200

    raw_token = uuid.uuid4().hex
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
    user.confirm_token = hashed_token
    user.confirm_expires = datetime.utcnow() + timedelta(hours=24)
    db.session.commit()

    confirm_link = f"http://localhost:3000/#confirm?token={raw_token}"
    send_email(
        to=email,
        subject="Confirmation de votre adresse e‑mail ActivMap",
        html_content=f"""
        <p>Bonjour,</p>
        <p>Vous avez demandé un nouvel e‑mail de confirmation. Cliquez sur le lien ci‑dessous :</p>
        <p><a href='{confirm_link}'>{confirm_link}</a></p>
        <p>Ce lien expirera dans 24 heures.</p>
        """
    )

    return jsonify(generic_msg), 200

# ------------------------------------------------------------
# Politique de confidentialité (public)
# ------------------------------------------------------------

@auth_bp.route('/legal/privacy', methods=['GET'])
def get_privacy_policy():
    """Renvoie la politique de confidentialité au format texte brut."""
    policy_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'docs', 'privacy_policy.md')
    try:
        with open(policy_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        # Fallback texte statique si le fichier n'existe pas
        content = "Politique de confidentialité non disponible."
    return jsonify({'content': content}), 200 

# ------------------------------------------------------------
# Déconnexion : ajout du token à la blacklist
# ------------------------------------------------------------

@auth_bp.route('/logout', methods=['POST'])
@limiter.limit("10 per minute")
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    revoked = RevokedToken(jti=jti)
    db.session.add(revoked)
    db.session.commit()
    response = jsonify({"message": "Déconnexion réussie"})
    unset_jwt_cookies(response)
    log_event(get_jwt_identity(), 'logout')
    return response, 200

# ------------------------------------------------------------
# Export des données du compte
# ------------------------------------------------------------

@auth_bp.route('/me/export', methods=['GET'])
@jwt_required()
def export_me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(int(user_id))
    if user.deleted_at is not None:
        return jsonify({'error': 'Compte supprimé'}), 410
    data = user.to_dict()
    # Ajout de l'historique des cartes
    data['maps'] = [m.to_dict() for m in user.maps]
    log_event(user.id, 'export')
    return jsonify({'export': data}), 200

# ------------------------------------------------------------
# Mise à jour des infos du compte
# ------------------------------------------------------------

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(int(user_id))
    if user.deleted_at is not None:
        return jsonify({'error': 'Compte supprimé'}), 410

    data = request.get_json() or {}
    email = data.get('email')
    username = data.get('username')

    if email and email != user.email:
        if not is_valid_email(email):
            return jsonify({'error': 'Email invalide'}), 400
        if User.query.filter(User.email == email, User.id != user.id).first():
            return jsonify({'error': 'Email déjà utilisé'}), 409
        user.email = email

    if username is not None:
        user.username = username.strip() or None

    db.session.commit()
    log_event(user.id, 'update')
    return jsonify({'user': user.to_dict()}), 200

# ------------------------------------------------------------
# Suppression (soft-delete) du compte
# ------------------------------------------------------------

@auth_bp.route('/me', methods=['DELETE'])
@jwt_required()
def delete_me():
    jti = get_jwt()["jti"]
    user_id = get_jwt_identity()
    user = User.query.get_or_404(int(user_id))
    if user.deleted_at is not None:
        return jsonify({'error': 'Compte déjà supprimé'}), 410

    # Soft delete
    user.deleted_at = datetime.utcnow()
    # Anonymisation minimale
    user.email = f"deleted_{user.id}_{int(time.time())}@deleted"
    user.username = None

    # Révoquer le token courant
    revoked = RevokedToken(jti=jti)
    db.session.add(revoked)
    db.session.commit()

    log_event(user.id, 'delete')

    return jsonify({'message': 'Compte supprimé'}), 200 