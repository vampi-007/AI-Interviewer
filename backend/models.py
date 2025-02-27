# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON , Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from sqlalchemy.orm import relationship
from enum import Enum  
import uuid
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from backend.database import Base

Base = declarative_base()

# Define the Difficulty Enum
class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

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
    interviews = relationship("Interview", back_populates="user")




class Resumes(Base):
    __tablename__ = "resumes"

    resume_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    resume_data = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.user_id"))
    
    user = relationship("User", back_populates="resumes")
    interviews = relationship("Interview", back_populates="resume")
      

class Prompt(Base):
    __tablename__ = "prompts"

    prompt_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tech_stack = Column(String, nullable=False)  # Tech stack for tech stack prompts
    difficulty = Column(SQLEnum(Difficulty), nullable=False)  # Use SQLEnum for SQLAlchemy
    content = Column(String, nullable=False)  # The actual prompt content
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interviews = relationship("Interview", back_populates="prompt")


class Interview(Base):
    __tablename__ = "interviews"

    interview_id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    prompt_id = Column(PGUUID(as_uuid=True), ForeignKey("prompts.prompt_id"), nullable=True)  # Tech-stack-based interview
    resume_id = Column(PGUUID(as_uuid=True), ForeignKey("resumes.resume_id"), nullable=True)  # Resume-based interview

    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # Duration in seconds
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    recording_url = Column(Text, nullable=True)
    video_recording_url = Column(Text, nullable=True)
    success_evaluation = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="interviews")
    prompt = relationship("Prompt", back_populates="interviews")
    resume = relationship("Resumes", back_populates="interviews")