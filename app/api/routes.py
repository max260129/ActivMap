from flask import request, send_file, jsonify
from api import app
from utils.map_generator import generate_map

@app.route('/generate', methods=['POST'])
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