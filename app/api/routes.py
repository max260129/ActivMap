import sys, os
from flask import request, jsonify, send_file, make_response

# Ajout du répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importer generate_map depuis le bon emplacement
from generate_map import generate_map
from middleware import protect_route
from api import app

# Route protégée pour générer une carte
@app.route('/generate', methods=['POST'])
@protect_route
def generate():
    data = request.get_json()
    latitude = data.get('latitude', 49.444838)
    longitude = data.get('longitude', 1.094214)
    distance = data.get('distance', 150)
    try:
        output_svg = generate_map(latitude, longitude, distance)
        response = make_response(send_file(output_svg, mimetype='image/svg+xml'))
        return response
    except Exception as e:
        error_response = jsonify({"error": str(e)})
        return error_response, 500

# Route pour tester si l'API est en ligne
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"}), 200

# Route alternative non-protégée pour générer une carte 
# (pour tester si le problème est lié à l'authentification)
@app.route('/generate-public', methods=['POST', 'OPTIONS'])
def generate_public():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    data = request.get_json()
    latitude = data.get('latitude', 49.444838)
    longitude = data.get('longitude', 1.094214)
    distance = data.get('distance', 150)
    try:
        output_svg = generate_map(latitude, longitude, distance)
        response = make_response(send_file(output_svg, mimetype='image/svg+xml'))
        # Ajout des headers CORS spécifiquement pour cette route
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        error_response = jsonify({"error": str(e)})
        error_response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        return error_response, 500 