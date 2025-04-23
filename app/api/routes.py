# app/api/routes.py
from flask import request, jsonify, send_file, make_response, url_for, current_app
from middleware import protect_route
# Importer l'instance Flask défini dans ce package (app/api/_init_.py)
from app import app
from flask_jwt_extended import get_jwt_identity
from models import db, MapHistory, User
import os
import uuid
import shutil
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, extract
from app.utils.mailer import send_email

# Pour éviter la collision avec le nom de la fonction, renomme l'import de generate_map
from app.generate_map import generate_map
from app.run import socketio


@app.route('/generate-map', methods=['POST', 'OPTIONS'])
@protect_route
def generate_map_route():
    # --- pré-vol CORS inchangé -----------------------------------------
    if request.method == 'OPTIONS':
        resp = make_response()
        resp.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        resp.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        resp.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        resp.headers.add('Access-Control-Allow-Credentials', 'true')
        return resp, 200
    # -------------------------------------------------------------------

    data = request.get_json()
    latitude  = float(data.get('latitude', 49.444838))
    longitude = float(data.get('longitude', 1.094214))
    distance  = float(data.get('distance', 150))

    try:
        # 1) Génère UNE fois la carte, récupère le chemin du SVG
        temp_svg = generate_map(latitude, longitude, distance)   # ← retourne un chemin

        # 2) Prépare le chemin final (sera le même si l’utilisateur n’est pas connecté)
        final_svg_path = temp_svg

        # 3) Si l’utilisateur est connecté, copie dans son dossier + historise
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id)) if user_id else None

        if user:
            user_dir = os.path.join(os.path.dirname(temp_svg), str(user.id))
            os.makedirs(user_dir, exist_ok=True)

            unique_filename = f"{uuid.uuid4().hex}.svg"
            final_svg_path = os.path.join(user_dir, unique_filename)
            shutil.copy(temp_svg, final_svg_path)

            history_entry = MapHistory(
                user_id=user.id,
                latitude=latitude,
                longitude=longitude,
                distance=distance,
                file_path=final_svg_path
            )
            db.session.add(history_entry)
            db.session.commit()

            svg_url = url_for('get_history_file',
                              history_id=history_entry.id, _external=True)
            socketio.emit(
                'map_generated',
                {
                    'id': history_entry.id,
                    'created_at': history_entry.created_at.isoformat(),
                    'latitude': latitude,
                    'longitude': longitude,
                    'distance': distance,
                    'svg_url': svg_url
                },
                room=f"user:{user.id}"
            )

        # 4) Retourne le fichier (UN seul send_file, pas de make_response inutile)
        return send_file(final_svg_path, mimetype='image/svg+xml')

    except Exception as e:
        current_app.logger.exception("Erreur generate-map")      # trace complète
        return jsonify({"error": str(e)}), 500

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

        # --- Évènement temps‑réel ---
        socketio.emit('map_deleted', {'id': item.id}, room=f"user:{user_id}")
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

        # --- Évènement temps‑réel ---
        svg_url_new = url_for('get_history_file', history_id=new_entry.id, _external=True)
        socketio.emit(
            'map_generated',
            {
                'id': new_entry.id,
                'created_at': new_entry.created_at.isoformat(),
                'latitude': new_entry.latitude,
                'longitude': new_entry.longitude,
                'distance': new_entry.distance,
                'svg_url': svg_url_new
            },
            room=f"user:{user_id}"
        )

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

        # --- Évènement temps‑réel préférences ---
        socketio.emit('settings_changed', user.to_dict(), room=f"user:{user_id}")
        return jsonify({'message': 'Préférences mises à jour'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ------------------------------------------------------------
# Statistiques utilisateur
# ------------------------------------------------------------

@app.route('/api/stats', methods=['GET'])
@protect_route
def user_stats():
    """Retourne des statistiques d'utilisation pour l'utilisateur courant."""
    user_id = int(get_jwt_identity())

    # Nombre total de cartes
    total_maps = db.session.query(func.count(MapHistory.id)) \
                         .filter_by(user_id=user_id).scalar() or 0

    # Distance totale cumulée
    total_distance = db.session.query(func.coalesce(func.sum(MapHistory.distance), 0)) \
                             .filter_by(user_id=user_id).scalar() or 0

    # Activité hebdomadaire
    today = datetime.utcnow()
    start_week = today - timedelta(days=today.weekday())  # lundi 00:00 UTC
    week_count = db.session.query(func.count(MapHistory.id)) \
                         .filter(MapHistory.user_id == user_id,
                                 MapHistory.created_at >= start_week).scalar() or 0

    prev_start = start_week - timedelta(days=7)
    prev_end = start_week
    prev_week_count = db.session.query(func.count(MapHistory.id)) \
                                  .filter(MapHistory.user_id == user_id,
                                          MapHistory.created_at >= prev_start,
                                          MapHistory.created_at < prev_end).scalar() or 0

    weekly_growth = None
    if prev_week_count:
        weekly_growth = ((week_count - prev_week_count) / prev_week_count) * 100.0

    # Activité mensuelle (12 mois glissants)
    twelve_months_ago = today - relativedelta(months=11)
    monthly_raw = db.session.query(
        extract('year', MapHistory.created_at).label('year'),
        extract('month', MapHistory.created_at).label('month'),
        func.count(MapHistory.id).label('count')
    ).filter(MapHistory.user_id == user_id,
             MapHistory.created_at >= datetime(twelve_months_ago.year, twelve_months_ago.month, 1)) \
     .group_by('year', 'month') \
     .order_by('year', 'month').all()

    # Convertir en dict {(year,month): count}
    monthly_dict = { (int(r.year), int(r.month)): r.count for r in monthly_raw }

    # Générer la série complète sur 12 mois, même si 0
    series = []
    current = datetime(today.year, today.month, 1)
    for i in range(12):
        y, m = current.year, current.month
        series.append({
            'year': y,
            'month': m,
            'count': monthly_dict.get((y, m), 0)
        })
        current = current - relativedelta(months=1)
    series.reverse()  # ordre chronologique

    return jsonify({
        'total_maps': total_maps,
        'total_distance': total_distance,
        'week_count': week_count,
        'weekly_growth': weekly_growth,  # peut être None
        'monthly_activity': series
    }), 200

@app.route('/test-email')
def test_email():
    try:
        send_email("votre_email@example.com", "Test email", "<p>Ceci est un test</p>")
        return "Email envoyé", 200
    except Exception as e:
        return f"Erreur: {str(e)}", 500