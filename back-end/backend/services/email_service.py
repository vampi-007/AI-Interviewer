from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from backend.config import settings  # Create this for email settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    USE_CREDENTIALS=True
)

async def send_reset_password_email(email: EmailStr, reset_link: str):
    message = MessageSchema(
        subject="Password Reset Request",
        recipients=[email],
        body=f"""
        You have requested to reset your password.
        Please click the following link to reset your password:
        {reset_link}
        
        If you did not request this, please ignore this email.
        """,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message) 