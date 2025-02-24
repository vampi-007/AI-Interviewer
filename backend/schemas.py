# app/schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum



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
    name: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None

class PromptCreate(PromptBase):
    pass

class PromptResponse(PromptBase):
    prompt_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        
class Prompt(PromptBase):
    prompt_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class Difficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

class TechStackPromptBase(BaseModel):
    tech_stack: Optional[str] = None
    difficulty: Difficulty = Difficulty.EASY
    generated_prompt: str

class TechStackPromptCreate(TechStackPromptBase):
    pass

class TechStackPrompt(TechStackPromptBase):
    tech_prompt_id: str
    created_at: datetime

    class Config:
        orm_mode = True
class TechStackPromptResponse(TechStackPromptBase):
    tech_prompt_id: str
    created_at: datetime

    class Config:
        orm_mode = True