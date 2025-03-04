import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str
    DBUSER: str
    DBPASS: str
    DBHOST: str
    DBPORT: int
    DBNAME: str

    UPLOAD_FOLDER: str = "./uploads"
    database_url: str
    UPLOAD_FOLDER: str = "./uploads"

    # Redis settings (Fixed ✅)
    REDIS_URL: str

    # JWT settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Email settings
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_SSL_TLS: bool
    MAIL_STARTTLS: bool
    MAIL_FROM_NAME: str = "AI Interviewer"

    # OpenAI settings
    OPENAI_API_KEY: str
    OPENAI_API_BASE: str = "https://models.inference.ai.azure.com"

    # VAPI settings
    VAPI_BASE_URL: str
    VAPI_PRIVATE_KEY: str
    VAPI_ASSISTANT_ID: str
    VAPI_ORG_ID: str

    class Config:
        env_file = ".env"  # Pydantic automatically reads from this file
        case_sensitive = False
        extra = "allow"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
