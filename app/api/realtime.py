from flask_socketio import emit, join_room
from flask_jwt_extended import decode_token, exceptions as jwt_exceptions
from models import User

# L'instance SocketIO est crée dans app.run
from app.run import socketio

@socketio.on('connect')
def ws_connect(auth):
    """Callback exécuté à chaque tentative de connexion WebSocket.

    Le client doit passer le JWT dans le champ `auth` envoyé par socket.io :
    ```js
    const socket = io('http://localhost:5000', { auth: { token: localStorage.getItem('auth_token') } })
    ```
    Si le token est invalide ou absent, la connexion est refusée.
    """
    token = (auth or {}).get('token') if isinstance(auth, dict) else None
    if not token:
        # Refuse la connexion (socket.io côté client reçoit 'connect_error')
        return False

    try:
        claims = decode_token(token)
        user_id = claims.get('sub')
        if not user_id:
            return False

        # On place l'utilisateur dans sa room dédiée
        join_room(f"user:{user_id}")
        # Si l'utilisateur est admin, l'ajouter à la room 'admin'
        user = User.query.get(int(user_id))
        if user and user.role == 'ADMIN':
            join_room('admin')

        emit('connected', {'msg': 'ok'})
    except (jwt_exceptions.JWTDecodeError, Exception):
        # Token invalide
        return False


@socketio.on('disconnect')
def ws_disconnect():
    # Pas besoin de logique spéciale pour l'instant
    pass

@socketio.on('join_thread')
def join_thread(data):
    thread_id = data.get('thread_id')
    if thread_id:
        join_room(f"thread:{thread_id}") 