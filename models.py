from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Préférences utilisateur
    username = db.Column(db.String(64), nullable=True)
    map_style = db.Column(db.String(20), default='dark')  # dark, light, satellite
    default_distance = db.Column(db.Integer, default=150)
    max_points = db.Column(db.Integer, default=5000)
    language = db.Column(db.String(10), default='fr')
    notifications_enabled = db.Column(db.Boolean, default=True)
    
    def __init__(self, email, password):
        self.email = email
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'map_style': self.map_style,
            'default_distance': self.default_distance,
            'max_points': self.max_points,
            'language': self.language,
            'notifications_enabled': self.notifications_enabled,
            'created_at': self.created_at
        }

# Ajout du modèle pour l'historique des cartes
class MapHistory(db.Model):
    __tablename__ = 'map_history'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    distance = db.Column(db.Integer, nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relation vers l'utilisateur
    user = db.relationship('User', backref=db.backref('maps', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'distance': self.distance,
            'file_path': self.file_path,
            'created_at': self.created_at
        } 