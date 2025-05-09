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
    # Rôle de l'utilisateur : ADMIN, CHEF, EMPLOYE
    role = db.Column(db.String(10), default='EMPLOYE')
    # Invitation : token hash + expiration
    invite_token = db.Column(db.String(64), nullable=True)
    invite_expires = db.Column(db.DateTime, nullable=True)
    # Réinitialisation mot de passe : token hash + expiration
    reset_token = db.Column(db.String(64), nullable=True)
    reset_expires = db.Column(db.DateTime, nullable=True)
    # Indique si l'utilisateur doit changer son mot de passe au premier login
    reset_required = db.Column(db.Boolean, default=False)
    joined_at = db.Column(db.DateTime, nullable=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    # Champ confirmation email
    email_confirmed = db.Column(db.Boolean, default=False)
    confirm_token = db.Column(db.String(64), nullable=True)
    confirm_expires = db.Column(db.DateTime, nullable=True)
    
    def __init__(self, email, password=None):
        self.email = email
        if password is not None:
            self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            self.reset_required = False
        else:
            self.password = None
            self.reset_required = True
        # Si aucun admin n'existe encore, le premier utilisateur devient ADMIN
        if not User.query.filter_by(role='ADMIN').first():
            self.role = 'ADMIN'
    
    def check_password(self, password):
        if not self.password:
            return False
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
            'role': self.role,
            'reset_required': self.reset_required,
            'email_confirmed': self.email_confirmed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None
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

class Consent(db.Model):
    __tablename__ = 'consents'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    text = db.Column(db.String(255), nullable=False, default='Politique de confidentialité v1')
    given_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relation vers l'utilisateur
    user = db.relationship('User', backref=db.backref('consents', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'text': self.text,
            'given_at': self.given_at,
        }

class RevokedToken(db.Model):
    __tablename__ = 'revoked_tokens'

    jti = db.Column(db.String(36), primary_key=True)
    revoked_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<RevokedToken {self.jti}>'

# Ajout du modèle Report pour les signalements
class Report(db.Model):
    __tablename__ = 'reports'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    description = db.Column(db.Text, nullable=False)
    # Stocke les noms de fichiers joints séparés par des virgules
    attachments = db.Column(db.String(1000), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relation vers l'utilisateur
    user = db.relationship('User', backref=db.backref('reports', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'description': self.description,
            'attachments': self.attachments.split(',') if self.attachments else [],
            'created_at': self.created_at.isoformat()
        }

class ReportThread(db.Model):
    __tablename__ = 'report_threads'
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    report = db.relationship('Report', backref=db.backref('thread', uselist=False))

class ReportMessage(db.Model):
    __tablename__ = 'report_messages'
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, db.ForeignKey('report_threads.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    body = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    sender = db.relationship('User')
    thread = db.relationship('ReportThread', backref=db.backref('messages', cascade='all,delete', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'thread_id': self.thread_id,
            'sender_id': self.sender_id,
            'body': self.body,
            'created_at': self.created_at.isoformat()
        } 