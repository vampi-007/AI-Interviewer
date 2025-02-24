from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.database import get_db
from backend.services.prompt_services import (
    create_prompt,
    get_prompts,
    get_prompt_by_id,
    update_prompt as update_prompt_service,
    delete_prompt as delete_prompt_service
)
from backend.schemas import Prompt, PromptCreate, PromptResponse
from sqlalchemy.future import select
from uuid import UUID

router = APIRouter()

# ✅ Create Prompt (Async)
@router.post("/", response_model=Prompt, status_code=status.HTTP_201_CREATED)
async def create_prompt_endpoint(
    prompt: PromptCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_prompt(db, prompt)

# ✅ Get All Prompts (Async)
@router.get("/", response_model=List[Prompt])
async def get_prompts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: AsyncSession = Depends(get_db)
):
    return await get_prompts(db, skip, limit)

# ✅ Get Prompt by ID (Async)
@router.get("/{prompt_id}", response_model=Prompt)
async def get_prompt_endpoint(
    prompt_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db)
):
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return db_prompt

# ✅ Update Prompt (Async)
@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt_endpoint(
    prompt_id: UUID,
    prompt: PromptCreate,
    db: AsyncSession = Depends(get_db)
):
    # Fetch existing prompt
    db_prompt_result = await db.execute(select(Prompt).where(Prompt.prompt_id == prompt_id))
    db_prompt = db_prompt_result.scalars().first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Update prompt attributes
    for key, value in prompt.dict().items():
        setattr(db_prompt, key, value)

    await db.commit()
    await db.refresh(db_prompt)

    return db_prompt

# ✅ Delete Prompt (Async)
@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt_endpoint(
    prompt_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    db_prompt_result = await db.execute(select(Prompt).where(Prompt.prompt_id == prompt_id))
    db_prompt = db_prompt_result.scalars().first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    await db.delete(db_prompt)
    await db.commit()
