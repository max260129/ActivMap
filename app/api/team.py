from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy.exc import IntegrityError
import uuid, hashlib
from datetime import datetime, timedelta

from models import db, User, MapHistory, Consent
from middleware import admin_required
from utils.mailer import send_email
from app.run import socketio

team_bp = Blueprint('team', __name__, url_prefix='/api/team')

# ------------------------------
# Helpers
# ------------------------------

def user_to_dict(user: User):
    return {
        'id': user.id,
        'email': user.email,
        'username': user.username,
        'role': user.role,
        'created_at': user.created_at.isoformat(),
        'joined_at': user.joined_at.isoformat() if user.joined_at else None,
        'invite_pending': user.invite_token is not None
    }

# ------------------------------
# Routes
# ------------------------------

@team_bp.route('/', methods=['GET'])
@admin_required
def list_users():
    users = User.query.order_by(User.created_at).all()
    return jsonify({'users': [user_to_dict(u) for u in users]}), 200


@team_bp.route('/', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json() or {}
    email = data.get('email')
    role = (data.get('role') or 'EMPLOYE').upper()

    if not email:
        return jsonify({'error': 'Email requis'}), 400
    if role not in ['ADMIN', 'CHEF', 'EMPLOYE']:
        return jsonify({'error': 'Rôle invalide'}), 400

    # Un seul admin autorisé
    if role == 'ADMIN' and User.query.filter_by(role='ADMIN').first():
        return jsonify({'error': 'Il y a déjà un administrateur'}), 400

    try:
        # Création utilisateur sans mot de passe
        new_user = User(email=email, password=None)
        new_user.role = role

        # Générer un token unique et sa version hachée pour stocker
        raw_token = uuid.uuid4().hex
        hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
        new_user.invite_token = hashed_token
        new_user.invite_expires = datetime.utcnow() + timedelta(days=1)

        # Champ password ne peut pas être NULL en base, on met chaîne vide jusqu'à acceptation
        new_user.password = ''

        db.session.add(new_user)
        db.session.commit()

        # --- Évènement temps‑réel : invitation envoyée ---
        socketio.emit('team_member_invited', user_to_dict(new_user))

        # Envoi de l'e‑mail d'invitation
        invite_link = f"http://localhost:3000/#invite?token={raw_token}"
        send_email(
            to=email,
            subject="Invitation à rejoindre ActivMap",
            html_content=f"""
            <p>Bonjour,</p>
            <p>Vous avez été invité·e à rejoindre ActivMap. Cliquez sur le lien ci‑dessous pour définir votre mot de passe :</p>
            <p><a href='{invite_link}'>{invite_link}</a></p>
            <p>Ce lien expirera dans 24 heures.</p>
            <p>À bientôt.</p>
            """
        )

        return jsonify({'user': user_to_dict(new_user)}), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Utilisateur déjà existant'}), 409


@team_bp.route('/<int:user_id>/role', methods=['PUT'])
@admin_required
def update_role(user_id):
    data = request.get_json() or {}
    new_role = (data.get('role') or '').upper()
    if new_role not in ['ADMIN', 'CHEF', 'EMPLOYE']:
        return jsonify({'error': 'Rôle invalide'}), 400

    user = User.query.get_or_404(user_id)
    current_admins = User.query.filter_by(role='ADMIN').all()

    # Interdire de supprimer le dernier admin
    if user.role == 'ADMIN' and new_role != 'ADMIN' and len(current_admins) <= 1:
        return jsonify({'error': 'Il doit rester au moins un administrateur'}), 400

    # Interdire de créer deuxième admin
    if new_role == 'ADMIN' and user.role != 'ADMIN' and len(current_admins) > 0:
        return jsonify({'error': 'Il y a déjà un administrateur'}), 400

    user.role = new_role
    db.session.commit()
    return jsonify({'user': user_to_dict(user)}), 200


@team_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)

    # Interdire de supprimer le dernier admin
    if user.role == 'ADMIN' and User.query.filter_by(role='ADMIN').count() <= 1:
        return jsonify({'error': 'Il doit rester au moins un administrateur'}), 400

    # ------------------------------------------------------------------
    # Nettoyage des données liées pour éviter les contraintes d'intégrité
    # ------------------------------------------------------------------
    # Supprimer l'historique des cartes associé
    MapHistory.query.filter_by(user_id=user.id).delete()
    # Supprimer les consentements liés
    Consent.query.filter_by(user_id=user.id).delete()

    db.session.delete(user)
    db.session.commit()
    # Évènement temps‑réel : membre supprimé
    socketio.emit('team_member_deleted', {'id': user.id})
    return jsonify({'message': 'Utilisateur supprimé'}), 200 