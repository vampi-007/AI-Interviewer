from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.database import get_db
from backend.services.prompt_services import (
    create_prompt,
    get_prompts,
    get_prompt_by_id,
    update_prompt,
    delete_prompt,
    get_tech_stack_prompts_by_difficulty
)
from backend.schemas import Prompt, PromptCreate, PromptUpdate, PromptResponse
from sqlalchemy.future import select
from uuid import UUID
from backend.models import Difficulty, Prompt as SQLAlchemyPrompt
from backend.services.tech_stack_agent import TechStackAgent
from backend.services import prompt_services
from backend.dependencies import role_dependency
from backend.models import User


router = APIRouter()
tech_agent = TechStackAgent()

# ✅ Create Prompt (No Admin Protection)
@router.post("/self-creation", response_model=Prompt, status_code=status.HTTP_201_CREATED)
async def create_prompt_endpoint(
    prompt: PromptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_dependency)
):
    # Access current_user to confirm it's being used
    print(f"Current User: {current_user.username}, Role: {current_user.role}")  # Example usage

    return await create_prompt(db, prompt)

# ✅ Get Tech Stack Prompts by Difficulty (No Admin Protection)
@router.get("/tech-stack", response_model=List[Prompt])
async def get_tech_stack_prompts_endpoint(
    tech_stack: str,
    difficulty: Difficulty,
    db: AsyncSession = Depends(get_db)
):
    prompts = await get_tech_stack_prompts_by_difficulty(db, tech_stack, difficulty)
    
    # Convert UUID and datetime to strings
    return [
        {
            "prompt_id": str(prompt.prompt_id),  # Convert UUID to string
            "content": prompt.content,
            "tech_stack": prompt.tech_stack,
            "difficulty": prompt.difficulty.value,  # ✅ Convert Enum to string
            "created_at": prompt.created_at.isoformat(),  # Convert datetime to string
            "updated_at": prompt.updated_at.isoformat()   # Convert datetime to string
        }
        for prompt in prompts
    ]

# ✅ Get All Prompts (No Admin Protection)
@router.get("/", response_model=List[Prompt])
async def get_prompts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_dependency)
):
    return await get_prompts(db, skip, limit)

# ✅ Get Prompt by ID (No Admin Protection)
@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt_endpoint(
    prompt_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_dependency)
):
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return {
        "prompt_id": str(db_prompt.prompt_id),  # Convert UUID to string
        "content": db_prompt.content,
        "tech_stack": db_prompt.tech_stack,
        "difficulty": db_prompt.difficulty,
        "created_at": db_prompt.created_at.isoformat(),  # Convert datetime to string
        "updated_at": db_prompt.updated_at.isoformat()   # Convert datetime to string
    }

# ✅ Update Prompt (No Admin Protection)
@router.put("/{prompt_id}", response_model=Prompt)
async def update_prompt_endpoint(
    prompt_id: UUID,
    prompt: PromptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_dependency)
):
    updated_prompt = await update_prompt(db, prompt_id, prompt)
    if updated_prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")

    return updated_prompt

# ✅ Delete Prompt (No Admin Protection)
@router.delete("/{prompt_id}", status_code=status.HTTP_200_OK)
async def delete_prompt_endpoint(
    prompt_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_dependency)
):
    db_prompt_result = await db.execute(select(SQLAlchemyPrompt).where(SQLAlchemyPrompt.prompt_id == prompt_id))
    db_prompt = db_prompt_result.scalars().first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    await db.delete(db_prompt)
    await db.commit()

    return {"detail": "Prompt deleted successfully"}

# ✅ Generate and Store AI-generated Prompt (No Admin Protection)
@router.post("/generate-and-store", status_code=status.HTTP_201_CREATED)
async def generate_and_store_prompt(
    tech_stack: str,
    difficulty: str = "MEDIUM",
    db: AsyncSession = Depends(get_db)
):
    generated_content = await tech_agent.generate_prompt(tech_stack, difficulty)
    if not generated_content:
        raise HTTPException(status_code=500, detail="Failed to generate prompt")

    # Save the generated prompt to the database
    db_prompt = await tech_agent.save_generated_prompt_to_db(db, tech_stack, difficulty, generated_content)
    if not db_prompt:
        raise HTTPException(status_code=500, detail="Failed to save generated prompt to database")

    return {
        "message": "Prompt generated and stored successfully",
        "prompt_id": str(db_prompt.prompt_id),
        "content": generated_content
    }
