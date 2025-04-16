# app/api/routes.py
from flask import request, jsonify, send_file, make_response
from middleware import protect_route
# Importer l'instance Flask défini dans ce package (app/api/__init__.py)
from app import app

# Pour éviter la collision avec le nom de la fonction, renomme l'import de generate_map
from generate_map import generate_map as gen_map


@app.route('/generate-map', methods=['POST', 'OPTIONS'])
@protect_route
def generate_map_route():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')  # Ajout de cet en-tête !
        return response, 200


    data = request.get_json()
    latitude = data.get('latitude', 49.444838)
    longitude = data.get('longitude', 1.094214)
    distance = data.get('distance', 150)
    try:
        output_svg = gen_map(latitude, longitude, distance)
        response = make_response(send_file(output_svg, mimetype='image/svg+xml'))
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
