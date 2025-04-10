import sys, os

# Ajout du répertoire parent au chemin Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, User

def seed_default_user(app):
    """
    Crée un utilisateur par défaut si aucun utilisateur n'existe encore
    """
    with app.app_context():
        users_count = User.query.count()
        
        if users_count == 0:
            # Créer un utilisateur par défaut
            default_user = User(
                email="admin@activmap.fr",
                password="adminPassword123"
            )
            db.session.add(default_user)
            db.session.commit()
            print("Utilisateur par défaut créé : admin@activmap.fr / adminPassword123")
        else:
            print("Base de données déjà initialisée avec des utilisateurs") 