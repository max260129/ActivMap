import os
import smtplib
from email.message import EmailMessage
import ssl

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
FROM_EMAIL = os.getenv("FROM_EMAIL", "no-reply@activmap.fr")


def send_email(to: str, subject: str, html_content: str):
    """Envoie un email HTML. Si SMTP n'est pas configuré, affiche le contenu dans les logs."""
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASS:
        print("[MAILER] SMTP non configuré. Email simulé →", to)
        print("Sujet:", subject)
        print("Contenu HTML:\n", html_content)
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = to
    msg.set_content("Veuillez utiliser un client mail compatible HTML.")
    msg.add_alternative(html_content, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
        print(f"[MAILER] Email envoyé à {to}") 