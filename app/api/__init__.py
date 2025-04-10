from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__, 
            static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'static'), 
            template_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates'))
CORS(app)

from api import routes 