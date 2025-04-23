from functools import wraps
from flask import request, jsonify, make_response
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import sys, os

# Ajout du répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import User

def role_required(*allowed_roles):
    """Décorateur pour restreindre l'accès aux utilisateurs dont le rôle figure dans allowed_roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                user_id = get_jwt_identity()
                user = User.query.get(int(user_id))

                if not user:
                    return jsonify({"error": "Utilisateur non trouvé"}), 401

                if user.role not in allowed_roles:
                    return jsonify({"error": "Accès interdit"}), 403

                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({"error": "Non autorisé - " + str(e)}), 401
        return wrapper
    return decorator

def admin_required(fn):
    """Compatibilité rétro, admin seul"""
    return role_required('ADMIN')(fn)

def protect_route(fn):
    """Middleware pour protéger les routes avec JWT"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Laisser flask_cors gérer les requêtes OPTIONS normalement.
        # Si on arrive ici pour une requête OPTIONS, renvoyer OK pour débloquer le preflight.
        if request.method == 'OPTIONS':
            response = make_response()
            # flask_cors ajoutera les bons en-têtes CORS
            return response # Renvoie 200 OK
            
        try:
            verify_jwt_in_request()
            # Exécuter la fonction originale pour les autres méthodes
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Authentification requise"}), 401
    return wrapper 