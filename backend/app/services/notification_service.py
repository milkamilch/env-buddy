import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", 587))
SMTP_USER     = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_ADDRESS  = os.getenv("NOTIFICATION_FROM", SMTP_USER)

TEMPLATE_DIR = Path(__file__).parent.parent.parent / "templates"
env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))

def _send_mail(to: str, subject: str, html_body: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = FROM_ADDRESS
    msg["To"] = to
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_ADDRESS, to, msg.as_string())

def notify_container_started(to: str, container_name: str, template: str, port: int, duration_minutes: int):
    html = env.get_template("container_started.html").render(
        container_name=container_name,
        template=template,
        port=port,
        duration_minutes=duration_minutes
    )
    _send_mail(to, f"▶️ Test-Buddy: {container_name} started", html)

def notify_container_warning(to: str, container_name: str, minutes_left: int):
    html = env.get_template("container_warning.html").render(
        container_name=container_name,
        minutes_left=minutes_left,
    )
    _send_mail(to, f"⚠️ Test-Buddy: {container_name} stopped in {minutes_left} minutes", html)

def send_welcome_email(to: str, first_name: str, last_name: str, username: str):
    html = env.get_template("welcome.html").render(
        first_name=first_name,
        last_name=last_name,
        username=username,
        email=to,
    )
    _send_mail(to, "👋 Willkommen bei Test-Buddy!", html)

def send_verification_email(to: str, first_name: str, verify_url: str):
    html = env.get_template("verify_email.html").render(
        first_name=first_name,
        verify_url=verify_url,
    )
    _send_mail(to, "✉️ Test-Buddy: E-Mail-Adresse bestätigen", html)

def send_password_reset_email(to: str, first_name: str, reset_url: str):
    html = env.get_template("password_reset.html").render(
        first_name=first_name,
        reset_url=reset_url,
    )
    _send_mail(to, "🔑 Test-Buddy: Passwort zurücksetzen", html)

def notify_container_stopped(to: str, container_name: str):
    html = f"""
    <html><body style="font-family:sans-serif;background:#1e1e2e;color:#cdd6f4;padding:2rem">
    <h2 style="color:#f38ba8">⏹ Container gestoppt</h2>
    <p>Der Container <strong>{container_name}</strong> wurde automatisch gestoppt.</p>
    <p style="color:#6c7086;font-size:0.85rem">Test-Buddy</p>
    </body></html>
    """
    _send_mail(to, f"⏹ Test-Buddy: {container_name} gestoppt", html)