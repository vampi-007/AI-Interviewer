from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from backend.models import Prompt
from backend.schemas import PromptCreate, PromptResponse, PromptUpdate
from fastapi import HTTPException
from typing import List
from backend.models import Difficulty

# ✅ Create a Prompt (No Admin Protection)
async def create_prompt(db: AsyncSession, prompt_data: PromptCreate) -> PromptResponse:
    db_prompt = Prompt(
        content=prompt_data.content,
        tech_stack=prompt_data.tech_stack,
        difficulty=prompt_data.difficulty
    )
    db.add(db_prompt)
    await db.commit()
    await db.refresh(db_prompt)

    return {
        "prompt_id": str(db_prompt.prompt_id),
        "content": db_prompt.content,
        "tech_stack": db_prompt.tech_stack,
        "difficulty": db_prompt.difficulty.value,  # ✅ Convert Enum to string
        "created_at": db_prompt.created_at.isoformat(),
        "updated_at": db_prompt.updated_at.isoformat()
    }

# ✅ Get All Prompts (No Admin Protection)
async def get_prompts(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[PromptResponse]:
    query = select(Prompt).offset(skip).limit(limit)
    result = await db.execute(query)
    prompts = result.scalars().all()

    return [
        {
            "prompt_id": str(prompt.prompt_id),
            "content": prompt.content,
            "tech_stack": prompt.tech_stack,
            "difficulty": prompt.difficulty.value,
            "created_at": prompt.created_at.isoformat(),
            "updated_at": prompt.updated_at.isoformat()
        }
        for prompt in prompts
    ]

# ✅ Get a Prompt by ID (No Admin Protection)
async def get_prompt_by_id(db: AsyncSession, prompt_id: UUID) -> Prompt:
    result = await db.execute(select(Prompt).where(Prompt.prompt_id == prompt_id))
    prompt = result.scalars().first()
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return prompt

# ✅ Update a Prompt (No Admin Protection)
async def update_prompt(db: AsyncSession, prompt_id: UUID, prompt_data: PromptUpdate) -> dict:
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    for key, value in prompt_data.dict(exclude_unset=True).items():
        setattr(db_prompt, key, value)

    await db.commit()
    await db.refresh(db_prompt)

    return {
        "prompt_id": str(db_prompt.prompt_id),
        "content": db_prompt.content,
        "tech_stack": db_prompt.tech_stack,
        "difficulty": db_prompt.difficulty.value,
        "created_at": db_prompt.created_at.isoformat(),
        "updated_at": db_prompt.updated_at.isoformat()
    }

# ✅ Delete a Prompt (No Admin Protection)
async def delete_prompt(db: AsyncSession, prompt_id: UUID) -> dict:
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    await db.delete(db_prompt)
    await db.commit()

    return {"detail": "Prompt deleted successfully", "prompt_id": str(prompt_id)}

# ✅ Get Tech Stack Prompts by Difficulty (No Admin Protection)
async def get_tech_stack_prompts_by_difficulty(db: AsyncSession, tech_stack: str, difficulty: Difficulty) -> List[Prompt]:
    query = select(Prompt).where(
        (Prompt.tech_stack == tech_stack) & (Prompt.difficulty == difficulty)
    )
    result = await db.execute(query)
    return result.scalars().all()
