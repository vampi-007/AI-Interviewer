from datetime import datetime
import uuid
from enum import Enum  
from sqlalchemy import (
    Column, String, Integer, ForeignKey, DateTime, Boolean, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Role(Enum):  # Correctly inherit from `Enum`
    ADMIN = "ADMIN"
    USER = "USER"

class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, unique=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role = Column(SQLEnum(Role), default=Role.USER, nullable=False)  # Fixed Enum usage
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    interviews = relationship("Interview", back_populates="user")
    resumes = relationship("Resumes", back_populates="user")

class Interview(Base):
    __tablename__ = "interviews"

    interview_id = Column(Integer, primary_key=True, autoincrement=True)
    start = Column(DateTime, nullable=False)
    end_time= Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)
    transcript = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    recording_url = Column(String, nullable=True)
    video_recording_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    success_evaluation = Column(Integer, nullable=True)

    resume_id = Column(String, ForeignKey("resumes.resume_id"))
    user_id = Column(String, ForeignKey("users.user_id"))

    resume = relationship("Resumes", back_populates="interviews")
    user = relationship("User", back_populates="interviews")

class Resumes(Base):
    __tablename__ = "resumes"

    resume_id = Column(String, primary_key=True, unique=True, default=lambda: str(uuid.uuid4()))
    resume_data = Column(JSON, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, ForeignKey("users.user_id"))
    
    user = relationship("User", back_populates="resumes")
    interviews = relationship("Interview", back_populates="resume")

class Prompt(Base):
    __tablename__ = "prompts"

    prompt_id = Column(Integer, primary_key=True, autoincrement=True, unique=True)
    name = Column(String, nullable=True)
    content = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    category = Column(String, nullable=True)

class TechStackPrompts(Base):
    __tablename__ = "tech_stack_prompts"

    tech_prompt_id = Column(String, primary_key=True, unique=True, default=lambda: str(uuid.uuid4()))
    tech_stack = Column(String, nullable=True)
    difficulty = Column(SQLEnum(Difficulty), default=Difficulty.EASY, nullable=False)  # Fixed Enum usage
    generated_prompt = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)