# app/extensions.py

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_socketio import SocketIO

# Limiter, basé sur l'adresse IP du client
limiter = Limiter(key_func=get_remote_address)

# SocketIO pour les événements temps-réel
socketio = SocketIO()
