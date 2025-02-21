from sqlalchemy.orm import Session
from datetime import datetime
from models import Prompt
from schemas import PromptCreate

async def create_prompt(db: Session, prompt_data: PromptCreate):
    db_prompt = Prompt(
        name=prompt_data.name,
        content=prompt_data.content,
        category=prompt_data.category
    )
    db.add(db_prompt)
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

async def get_prompts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Prompt).offset(skip).limit(limit).all()

async def get_prompt_by_id(db: Session, prompt_id: int):
    return db.query(Prompt).filter(Prompt.prompt_id == prompt_id).first()

async def update_prompt(db: Session, prompt_id: int, prompt_data: PromptCreate):
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        return None
    
    for key, value in prompt_data.dict().items():
        setattr(db_prompt, key, value)
    
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

async def delete_prompt(db: Session, prompt_id: int):
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        return False
    
    db.delete(db_prompt)
    db.commit()
    return True