# app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional , Dict, Any
from datetime import datetime
from enum import Enum
from backend.models import Difficulty
from uuid import UUID




class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=30)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str




class PromptBase(BaseModel):
    # prompt_id : UUID
    content: str
    tech_stack: str
    difficulty: Difficulty

class PromptCreate(PromptBase):
    pass

class PromptResponse(PromptBase):
    prompt_id: str
    content: str
    tech_stack: str
    difficulty: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
        
class Prompt(PromptBase):
    prompt_id: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class PromptUpdate(BaseModel):
       content: str
       tech_stack: str
       difficulty: Difficulty

class PromptDelete(BaseModel):
    prompt_id: UUID



class InterviewRequest(BaseModel):
    user_id: str
    prompt_id: Optional[str] = None 
    resume_id: Optional[str] = None  # Optional field

    class Config:
        orm_mode = True


class VapiEndOfCallReport(BaseModel):
    message: Optional[Dict[str, Any]] = None
    variableValues: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True
