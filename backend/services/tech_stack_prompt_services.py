from sqlalchemy.orm import Session
from models import TechStackPrompts
from schemas import TechStackPromptCreate
from typing import Optional
import uuid

async def create_tech_stack_prompt(db: Session, prompt_data: TechStackPromptCreate):
    db_prompt = TechStackPrompts(
        tech_stack=prompt_data.tech_stack,
        difficulty=prompt_data.difficulty,
        generated_prompt=prompt_data.generated_prompt
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

async def get_tech_stack_prompts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(TechStackPrompts).offset(skip).limit(limit).all()

async def get_tech_stack_prompt_by_id(db: Session, tech_prompt_id: str):
    return db.query(TechStackPrompts).filter(
        TechStackPrompts.tech_prompt_id == tech_prompt_id
    ).first()

async def update_tech_stack_prompt(
    db: Session, 
    tech_prompt_id: str, 
    prompt_data: TechStackPromptCreate
):
    db_prompt = await get_tech_stack_prompt_by_id(db, tech_prompt_id)
    if not db_prompt:
        return None
    
    for key, value in prompt_data.dict().items():
        setattr(db_prompt, key, value)
    
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

async def delete_tech_stack_prompt(db: Session, tech_prompt_id: str):
    db_prompt = await get_tech_stack_prompt_by_id(db, tech_prompt_id)
    if not db_prompt:
        return False
    
    db.delete(db_prompt)
    db.commit()
    return True