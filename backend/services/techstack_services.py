from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.models import TechStackPrompts
from backend.schemas import TechStackPromptCreate
from typing import Optional
import uuid

# ✅ Create Tech Stack Prompt (Async)
async def create_tech_stack_prompt(db: AsyncSession, prompt_data: TechStackPromptCreate):
    db_prompt = TechStackPrompts(
        tech_stack=prompt_data.tech_stack,
        difficulty=prompt_data.difficulty,
        generated_prompt=prompt_data.generated_prompt
    )
    db.add(db_prompt)
    await db.commit()
    await db.refresh(db_prompt)
    return db_prompt

# ✅ Get All Tech Stack Prompts (Async)
async def get_tech_stack_prompts(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(TechStackPrompts).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

# ✅ Get Tech Stack Prompt by ID (Async)
async def get_tech_stack_prompt_by_id(db: AsyncSession, tech_prompt_id: str):
    query = select(TechStackPrompts).where(TechStackPrompts.tech_prompt_id == tech_prompt_id)
    result = await db.execute(query)
    return result.scalars().first()

# ✅ Update Tech Stack Prompt (Async)
async def update_tech_stack_prompt(
    db: AsyncSession, 
    tech_prompt_id: str, 
    prompt_data: TechStackPromptCreate
):
    db_prompt = await get_tech_stack_prompt_by_id(db, tech_prompt_id)
    if not db_prompt:
        return None
    
    for key, value in prompt_data.dict().items():
        setattr(db_prompt, key, value)
    
    await db.commit()
    await db.refresh(db_prompt)
    return db_prompt

# ✅ Delete Tech Stack Prompt (Async)
async def delete_tech_stack_prompt(db: AsyncSession, tech_prompt_id: str):
    db_prompt = await get_tech_stack_prompt_by_id(db, tech_prompt_id)
    if not db_prompt:
        return False
    
    await db.delete(db_prompt)
    await db.commit()
    return True
