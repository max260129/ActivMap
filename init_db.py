from models import db, User

# Je supprime l'appel redondant à db.init_app et j'importe l'app configurée
def seed_default_user(app=None):
    """
    Crée un utilisateur par défaut si aucun utilisateur n'existe encore.
    Le paramètre 'app' doit être l'instance Flask configurée.
    """
    if not app:
        return
    # Utiliser le contexte de l'application passée en argument
    with app.app_context():
        users_count = User.query.count()
        
        if users_count == 0:
            # Créer un utilisateur par défaut
            default_user = User(
                email="admin@activmap.fr",
                password="adminPassword123"
            )
            default_user.email_confirmed = True
            db.session.add(default_user)
            db.session.commit()
            print("Utilisateur par défaut créé : admin@activmap.fr / adminPassword123")
        else:
            print("Base de données déjà initialisée avec des utilisateurs")

if __name__ == "__main__":
    seed_default_user() 