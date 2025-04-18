# app/api/routes.py
from flask import request, jsonify, send_file, make_response, url_for
from middleware import protect_route
# Importer l'instance Flask défini dans ce package (app/api/_init_.py)
from app import app
from flask_jwt_extended import get_jwt_identity
from models import db, MapHistory, User
import os
import uuid
import shutil

# Pour éviter la collision avec le nom de la fonction, renomme l'import de generate_map
from app.generate_map import generate_map


@app.route('/generate-map', methods=['POST', 'OPTIONS'])
@protect_route
def generate_map_route():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200


    data = request.get_json()
    latitude = data.get('latitude', 49.444838)
    longitude = data.get('longitude', 1.094214)
    distance = data.get('distance', 150)
    try:
        # Génération de la carte temporaire
        temp_svg = generate_map(latitude, longitude, distance)

        # Récupération de l'utilisateur courant
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id)) if user_id else None

        # Par défaut, on prépare le chemin de sortie final vers la carte temporaire
        final_svg_path = temp_svg

        if user:
            # Dossier dédié à l'utilisateur
            user_dir = os.path.join(os.path.dirname(temp_svg), str(user.id))
            os.makedirs(user_dir, exist_ok=True)

            # Nom de fichier unique
            unique_filename = f"{uuid.uuid4().hex}.svg"
            final_svg_path = os.path.join(user_dir, unique_filename)

            # Copie vers le dossier utilisateur
            shutil.copy(temp_svg, final_svg_path)

            # Création d'une entrée d'historique
            history_entry = MapHistory(
                user_id=user.id,
                latitude=latitude,
                longitude=longitude,
                distance=distance,
                file_path=final_svg_path
            )
            db.session.add(history_entry)
            db.session.commit()

        response = make_response(send_file(final_svg_path, mimetype='image/svg+xml'))
        return response
    except Exception as e:
        error_response = jsonify({"error": str(e)})
        return error_response, 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"}), 200

@app.route('/generate-public', methods=['POST', 'OPTIONS'])
def generate_public():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
        
    data = request.get_json()
    latitude = data.get('latitude', 49.444838)
    longitude = data.get('longitude', 1.094214)
    distance = data.get('distance', 150)
    try:
        output_svg = gen_map(latitude, longitude, distance)
        response = make_response(send_file(output_svg, mimetype='image/svg+xml'))
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        error_response = jsonify({"error": str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        return error_response, 500

@app.route('/api/history', methods=['GET'])
@protect_route
def list_history():
    user_id = int(get_jwt_identity())
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    query = MapHistory.query.filter_by(user_id=user_id).order_by(MapHistory.created_at.desc())
    total = query.count()
    items = (
        query.offset((page-1)*limit).limit(limit).all()
    )

    items_resp = []
    for i in items:
        d = i.to_dict()
        d['svg_url'] = url_for('get_history_file', history_id=i.id, _external=True)
        items_resp.append(d)

    return jsonify({
        'total': total,
        'page': page,
        'limit': limit,
        'items': items_resp
    }), 200

@app.route('/api/history/<int:history_id>/file', methods=['GET'])
@protect_route
def get_history_file(history_id):
    user_id = int(get_jwt_identity())
    item = MapHistory.query.get_or_404(history_id)
    if item.user_id != user_id:
        return jsonify({'error': 'Accès interdit'}), 403
    return send_file(item.file_path, mimetype='image/svg+xml')

@app.route('/api/history/<int:history_id>', methods=['DELETE'])
@protect_route
def delete_history(history_id):
    user_id = int(get_jwt_identity())
    item = MapHistory.query.get_or_404(history_id)
    if item.user_id != user_id:
        return jsonify({'error': 'Accès interdit'}), 403
    try:
        # Suppression du fichier sur disque
        if os.path.exists(item.file_path):
            os.remove(item.file_path)
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Supprimé'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ------------------------------------------------------------
# Régénération d'une carte à partir d'un enregistrement existant
# ------------------------------------------------------------

@app.route('/api/history/<int:history_id>/regenerate', methods=['POST'])
@protect_route
def regenerate_history(history_id):
    user_id = int(get_jwt_identity())
    item = MapHistory.query.get_or_404(history_id)
    if item.user_id != user_id:
        return jsonify({'error': 'Accès interdit'}), 403

    try:
        # Générer une nouvelle carte avec les mêmes paramètres
        temp_svg = generate_map(item.latitude, item.longitude, item.distance)

        # Dossier utilisateur
        user_dir = os.path.join(os.path.dirname(temp_svg), str(user_id))
        os.makedirs(user_dir, exist_ok=True)

        unique_filename = f"{uuid.uuid4().hex}.svg"
        final_svg_path = os.path.join(user_dir, unique_filename)
        shutil.copy(temp_svg, final_svg_path)

        # Nouvel enregistrement
        new_entry = MapHistory(
            user_id=user_id,
            latitude=item.latitude,
            longitude=item.longitude,
            distance=item.distance,
            file_path=final_svg_path
        )
        db.session.add(new_entry)
        db.session.commit()

        return jsonify({'message': 'Regénéré', 'id': new_entry.id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ------------------------------------------------------------
# Paramètres utilisateur
# ------------------------------------------------------------


@app.route('/api/settings', methods=['GET'])
@protect_route
def get_settings():
    """Renvoie les préférences de l'utilisateur authentifié."""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    prefs = {
        'email': user.email,
        'username': user.username,
        'map_style': user.map_style,
        'default_distance': user.default_distance,
        'max_points': user.max_points,
        'language': user.language,
        'notifications_enabled': user.notifications_enabled,
    }
    return jsonify(prefs), 200


@app.route('/api/settings', methods=['PUT'])
@protect_route
def update_settings():
    """Met à jour les préférences utilisateur."""
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    data = request.get_json() or {}

    # Mapping champ -> (type, min, max) pour validation simple
    validators = {
        'map_style': (str, None, None),
        'default_distance': (int, 50, 1000),
        'max_points': (int, 1000, 10000),
        'language': (str, None, None),
        'notifications_enabled': (bool, None, None),
        'username': (str, None, None),
        'email': (str, None, None),
    }

    for field, value in data.items():
        if field not in validators:
            continue  # Ignore champs inconnus

        expected_type, vmin, vmax = validators[field]

        # Convert JSON bool/int correctly
        if expected_type == bool:
            value = bool(value)
        elif expected_type == int:
            try:
                value = int(value)
            except (ValueError, TypeError):
                return jsonify({'error': f'{field} doit être un entier'}), 400

        # Bornes numériques
        if isinstance(value, int) and vmin is not None and (value < vmin or value > vmax):
            return jsonify({'error': f'{field} hors limites'}), 400

        setattr(user, field, value)

    try:
        db.session.commit()
        return jsonify({'message': 'Préférences mises à jour'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500