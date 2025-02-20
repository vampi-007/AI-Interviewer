# app/models.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="USER")  # Roles: ADMIN, USER
    created_at = Column(DateTime, default=datetime.utcnow)
    refresh_token = Column(String)  # Keep this for refresh token functionality