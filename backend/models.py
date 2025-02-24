# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy.orm import relationship
import uuid
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import UUID as PGUUID

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    user_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="USER")  # Roles: ADMIN, USER
    created_at = Column(DateTime, default=datetime.utcnow)
    refresh_token = Column(String)  # Keep this for refresh token functionality

    resumes = relationship("Resumes", back_populates="user")




class Resumes(Base):
    __tablename__ = "resumes"

    resume_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_data = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.user_id"))
    
    user = relationship("User", back_populates="resumes")
    # interviews = relationship("Interview", back_populates="resume")
      