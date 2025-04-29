# app/api/report.py
import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt_identity, jwt_required
from middleware import role_required
from models import db, Report, ReportThread, User

report_bp = Blueprint('report_bp', __name__, url_prefix='/api/report')

ALLOWED_EXT = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXT

@report_bp.route('', methods=['POST'])
@jwt_required(locations=['headers'])
def create_report():
    user_id = int(get_jwt_identity())
    description = request.form.get('description', '').strip()
    if not description:
        return jsonify({'error': 'Description requise'}), 400

    files = request.files.getlist('attachments')
    saved = []
    upload_folder = current_app.config['UPLOAD_FOLDER_REPORTS']
    os.makedirs(upload_folder, exist_ok=True)

    for f in files:
        if f and allowed_file(f.filename):
            filename = secure_filename(f"{uuid.uuid4().hex}_{f.filename}")
            dest = os.path.join(upload_folder, filename)
            f.save(dest)
            saved.append(filename)

    rpt = Report(
        user_id=user_id,
        description=description,
        attachments=','.join(saved) if saved else None
    )
    db.session.add(rpt)
    db.session.commit()

    # Création automatique du thread associé
    thread = ReportThread(report_id=rpt.id)
    db.session.add(thread)
    db.session.commit()

    # Notification en temps réel aux admins
    from app.run import socketio
    socketio.emit('new_report', rpt.to_dict(), room='admin')

    return jsonify(rpt.to_dict()), 201

@report_bp.route('', methods=['GET'])
@jwt_required()
def list_reports():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    if user.role == 'ADMIN':
        q = Report.query
    else:
        q = Report.query.filter_by(user_id=user.id)

    reports = q.order_by(Report.created_at.desc()).all()
    resp = []
    for r in reports:
        d = r.to_dict()
        d['thread_id'] = r.thread.id if r.thread else None
        resp.append(d)
    return jsonify(resp), 200

@report_bp.route('/<int:report_id>', methods=['GET'])
@role_required('ADMIN')
def get_report(report_id):
    rpt = Report.query.get_or_404(report_id)
    return jsonify(rpt.to_dict()), 200

@report_bp.route('/attachments/<filename>', methods=['GET'])
@role_required('ADMIN')
def get_attachment(filename):
    return send_from_directory(
        current_app.config['UPLOAD_FOLDER_REPORTS'], filename, as_attachment=True
    ) 