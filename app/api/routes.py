import sys, os
from flask import request, jsonify, send_file

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
        return send_file(output_svg, mimetype='image/svg+xml')
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route pour tester si l'API est en ligne
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "online"}), 200 