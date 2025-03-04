import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")


async def generate_interview_link(user_id, resume_id=None, tech_stack=None):
    """Generate a unique interview link with a token."""
    expiration_time_utc = datetime.utcnow() + timedelta(hours=24)
    payload = {"user_id": str(user_id), "exp": expiration_time_utc}

    if resume_id:
        payload["resume_id"] = str(resume_id)
    if tech_stack:
        payload["tech_stack"] = tech_stack

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token, expiration_time_utc
