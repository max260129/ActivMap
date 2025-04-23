import os, smtplib, ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def boolenv(key, default="false"):
    return os.getenv(key, default).lower() in ("1", "true", "yes")

def send_email(to: str, subject: str, html: str) -> bool:
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", "25"))
    use_ssl = boolenv("SMTP_USE_SSL")
    use_tls = boolenv("SMTP_USE_TLS")
    user = os.getenv("SMTP_USER")
    pwd  = os.getenv("SMTP_PASS")
    sender = os.getenv("FROM_EMAIL", "no-reply@activmap.fr")

    msg = MIMEMultipart()
    msg["From"], msg["To"], msg["Subject"] = sender, to, subject
    msg.attach(MIMEText(html, "html"))

    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port, context=ssl.create_default_context())
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls()
        if user and pwd:
            server.login(user, pwd)

        server.send_message(msg)
        server.quit()
        print("[MAILER] envoyé →", to)
        return True
    except Exception as e:
        print("[MAILER] Erreur SMTP :", e)
        return False
