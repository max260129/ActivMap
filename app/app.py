# app.py
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS  # Importez Flask-CORS
from generate_map import generate_map

app = Flask(__name__)
CORS(app)  # Activez CORS pour toutes les routes

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True) 