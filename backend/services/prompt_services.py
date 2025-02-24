from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.models import Prompt
from backend.schemas import PromptCreate

# ✅ Create a Prompt (Async)
async def create_prompt(db: AsyncSession, prompt_data: PromptCreate):
    db_prompt = Prompt(
        name=prompt_data.name,
        content=prompt_data.content,
        category=prompt_data.category
    )
    db.add(db_prompt)
    await db.commit()
    await db.refresh(db_prompt)
    return db_prompt

# ✅ Get All Prompts (Async)
async def get_prompts(db: AsyncSession, skip: int = 0, limit: int = 100):
    query = select(Prompt).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

# ✅ Get a Prompt by ID (Async)
async def get_prompt_by_id(db: AsyncSession, prompt_id: int):
    query = select(Prompt).where(Prompt.prompt_id == prompt_id)
    result = await db.execute(query)
    return result.scalars().first()

# ✅ Update a Prompt (Async)
async def update_prompt(db: AsyncSession, prompt_id: int, prompt_data: PromptCreate):
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        return None
    
    for key, value in prompt_data.dict().items():
        setattr(db_prompt, key, value)

    await db.commit()
    await db.refresh(db_prompt)
    return db_prompt

# ✅ Delete a Prompt (Async)
async def delete_prompt(db: AsyncSession, prompt_id: int):
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        return False

    await db.delete(db_prompt)
    await db.commit()
    return True
