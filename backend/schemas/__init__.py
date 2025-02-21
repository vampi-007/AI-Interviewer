from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from enum import Enum

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
