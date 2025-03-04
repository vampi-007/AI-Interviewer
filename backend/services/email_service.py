from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from backend.config import settings  # Create this for email settings
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.user_service import get_user
from backend.utils.interview_utils import generate_interview_link
from zoneinfo import ZoneInfo
import uuid

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    USE_CREDENTIALS=True,
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
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)


async def send_interview_email(
    db: AsyncSession, user_id: uuid.UUID, resume_id=None, tech_stack=None
):
    """Send an AI Mock Interview invitation email to the user."""

    # Retrieve user details
    user = await get_user(db, user_id)
    if not user:
        return {
            "status": "error",
            "message": f"User with ID {user_id} not found.",
        }

    user_email = user.email
    user_name = user.name

    # Generate interview token and expiration time
    token, expiration_time_utc = await generate_interview_link(
        user_id, resume_id, tech_stack
    )
    interview_link = (
        f"http://localhost:5173/vapi/{token}"  # Replace with actual frontend URL
    )

    # Convert expiration time to Pakistan Standard Time (PST)
    expiration_time_pst = expiration_time_utc.astimezone(ZoneInfo("Asia/Karachi"))
    expiration_time_str = expiration_time_pst.strftime("%Y-%m-%d %I:%M %p %Z")

    # Email subject
    subject = "Your AI-Powered Mock Interview is Ready!"

    # Email body
    body = f"""
    Dear {user_name},

    We are excited to invite you to your **AI-driven Mock Interview**, designed to assess your skills based on your resume and selected tech stack.  
    This interview will help you prepare for real-world technical assessments with AI-generated feedback.

    **Interview Details:**
    - **Interview Format:** AI-powered technical assessment
    - **Start Your Interview:** [Click Here]({interview_link})
    - **Expiration:** {expiration_time_str} (Pakistan Standard Time)

    **Instructions:**
    1. Ensure you have a stable internet connection.
    2. Be in a quiet place for the best experience.
    3. Answer all questions honestly to get meaningful feedback.

    After completing the interview, our AI system will evaluate your responses and provide you with a performance report.

    Best of luck with your interview!

    Regards,  
    **AI Interviewer Team**
    """

    # Create email message
    message = MessageSchema(
        subject=subject, recipients=[user_email], body=body, subtype="html"
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        return {"status": "sent", "email": user_email}
    except Exception as e:
        return {"status": "error", "message": str(e)}
