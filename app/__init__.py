from flask import Flask

# Créez l'instance Flask
app = Flask(__name__)

# Optionnel : Configurer CORS, etc.
# from flask_cors import CORS
# CORS(app)

# Importez les routes afin qu'elles s'enregistrent sur l'application
from app.api import routes
