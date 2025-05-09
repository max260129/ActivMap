"""Tâches de maintenance RGPD.

Usage :
    python utils/maintenance.py purge

Cette commande :
1. Supprime les entrées d'audit plus anciennes que la durée définie (AUDIT_RETENTION_DAYS).
2. Purge définitivement les comptes marqués deleted_at qui dépassent ACCOUNT_PURGE_DAYS.

Planifiez‑la via cron (Ex : toutes les nuits à 2h) :
    0 2 * * * /usr/bin/python /app/utils/maintenance.py purge >> /var/log/activmap_cron.log 2>&1
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Ajouter la racine au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app  # noqa: E402
from models import db, AuditLog, User, MapHistory

# Paramètres de conservation
AUDIT_RETENTION_DAYS = int(os.getenv('AUDIT_RETENTION_DAYS', 365))  # 1 an par défaut
ACCOUNT_PURGE_DAYS = int(os.getenv('ACCOUNT_PURGE_DAYS', 90))       # 3 mois
HISTORY_RETENTION_DAYS = int(os.getenv('HISTORY_RETENTION_DAYS', 365))  # 12 mois par défaut


def purge():
    """Exécute les purges RGPD"""
    now = datetime.utcnow()
    with app.app_context():
        # Purge audit logs
        audit_limit = now - timedelta(days=AUDIT_RETENTION_DAYS)
        deleted_audit = AuditLog.query.filter(AuditLog.created_at < audit_limit).delete()

        # Purge historique de cartes
        history_limit = now - timedelta(days=HISTORY_RETENTION_DAYS)
        deleted_history = 0
        for item in MapHistory.query.filter(MapHistory.created_at < history_limit).all():
            # Suppression du fichier sur le disque si présent
            try:
                if item.file_path and os.path.exists(item.file_path):
                    os.remove(item.file_path)
            except Exception:
                pass  # on ignore les erreurs de suppression de fichier
            db.session.delete(item)
            deleted_history += 1

        # Purge comptes définitivement (hard delete)
        acc_limit = now - timedelta(days=ACCOUNT_PURGE_DAYS)
        hard_deleted = 0
        for user in User.query.filter(User.deleted_at != None, User.deleted_at < acc_limit).all():  # noqa: E711
            db.session.delete(user)
            hard_deleted += 1

        db.session.commit()
        print(f"Purge terminée : {deleted_audit} audit_logs supprimés, {deleted_history} cartes supprimées, {hard_deleted} comptes supprimés.")


if __name__ == '__main__':
    if len(sys.argv) < 2 or sys.argv[1] != 'purge':
        print("Usage : python utils/maintenance.py purge")
        sys.exit(1)
    purge() 