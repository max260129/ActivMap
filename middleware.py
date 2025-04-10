from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
import sys, os

# Ajout du répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import User

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({"error": "Utilisateur non trouvé"}), 401
                
            # Ici, vous pourriez ajouter une vérification de rôle administrateur
            # Par exemple : if not user.is_admin:
            #                  return jsonify({"error": "Accès refusé"}), 403
                
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Non autorisé - " + str(e)}), 401
    return wrapper

def protect_route(fn):
    """Middleware pour protéger les routes avec JWT"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Authentification requise"}), 401
    return wrapper 