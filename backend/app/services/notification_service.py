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

TEMPLATE_DIR = Path(__file__).parent.parent.parent.parent / "frontend" / "templates"
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
    _send_mail(to, f"⏹️ Test-Buddy: {container_name} stopped", html)

def notify_container_warning(to: str, container_name: str, minutes_left: int):
    html = env.get_template("container_warning.html").render(
        container_name=container_name,
        minutes_left=minutes_left,
    )
    _send_mail(to, f"⚠️ Test-Buddy: {container_name} stopped in {minutes_left} minutes", html)