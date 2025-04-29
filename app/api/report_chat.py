# app/api/report_chat.py
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload
from models import db, ReportThread, ReportMessage, Report, User
from middleware import role_required
from app.run import socketio

chat_bp = Blueprint('report_chat', __name__, url_prefix='/api/report')

# --------------------------------------------------
# Helpers
# --------------------------------------------------

def thread_to_dict(thread: ReportThread):
    return {
        'id': thread.id,
        'report_id': thread.report_id,
        'created_at': thread.created_at.isoformat(),
        'messages': [m.to_dict() for m in thread.messages.order_by(ReportMessage.created_at)]
    }

def is_author_or_admin(user: User, thread: ReportThread):
    return user.role == 'ADMIN' or (thread.report and thread.report.user_id == user.id)

# --------------------------------------------------
# Routes
# --------------------------------------------------

@chat_bp.route('/thread/<int:thread_id>', methods=['GET'])
@jwt_required()
def get_thread(thread_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    thread = ReportThread.query.options(joinedload(ReportThread.report)).get_or_404(thread_id)

    if not is_author_or_admin(user, thread):
        return jsonify({'error': 'Accès interdit'}), 403

    return jsonify(thread_to_dict(thread)), 200

@chat_bp.route('/thread/<int:thread_id>/messages', methods=['POST'])
@jwt_required()
def post_message(thread_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    thread = ReportThread.query.options(joinedload(ReportThread.report)).get_or_404(thread_id)

    if not is_author_or_admin(user, thread):
        return jsonify({'error': 'Accès interdit'}), 403

    data = request.get_json() or {}
    body = (data.get('body') or '').strip()
    if not body:
        return jsonify({'error': 'Message vide'}), 400

    msg = ReportMessage(thread_id=thread.id, sender_id=user.id, body=body)
    db.session.add(msg)
    db.session.commit()

    # Diffusion temps-réel
    socketio.emit('report_message', msg.to_dict(), room=f"thread:{thread.id}")
    return jsonify(msg.to_dict()), 201

@chat_bp.route('/thread/<int:thread_id>', methods=['DELETE'])
@role_required('ADMIN')
def delete_thread(thread_id):
    thread = ReportThread.query.get_or_404(thread_id)

    db.session.delete(thread)
    db.session.commit()

    socketio.emit('thread_deleted', {'thread_id': thread_id}, room=f"thread:{thread_id}")
    return jsonify({'message': 'Thread supprimé'}), 200 