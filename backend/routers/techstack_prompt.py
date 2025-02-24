from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from backend.database import get_db
from backend.services.techstack_services import (
    create_tech_stack_prompt,
    get_tech_stack_prompts,
    get_tech_stack_prompt_by_id,
    update_tech_stack_prompt as update_tech_stack_prompt_service,
    delete_tech_stack_prompt as delete_tech_stack_prompt_service
)
from backend.schemas import TechStackPrompt, TechStackPromptCreate, TechStackPromptResponse
from backend.services.tech_stack_agent import TechStackAgent

router = APIRouter()
tech_agent = TechStackAgent()

# ✅ Generate and Store AI-generated Prompt (Async)
@router.post("/generate-and-store", status_code=status.HTTP_201_CREATED)
async def generate_and_store_prompt(
    tech_stack: str,
    difficulty: str = "MEDIUM",
    db: AsyncSession = Depends(get_db)
):
    try:
        # Generate AI prompt
        generated_content = await tech_agent.generate_prompt(tech_stack, difficulty)
        if not generated_content:
            raise HTTPException(status_code=500, detail="Failed to generate prompt")

        print("Generated Prompt:")
        print(generated_content)

        # Store in database
        prompt_data = TechStackPromptCreate(
            tech_stack=tech_stack,
            difficulty=difficulty,
            generated_prompt=generated_content
        )
        db_prompt = await create_tech_stack_prompt(db, prompt_data)

        return {
            "message": "Prompt generated and stored successfully",
            "prompt_id": db_prompt.tech_prompt_id,
            "content": generated_content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ✅ Create Tech Stack Prompt (Async)
@router.post("/", response_model=TechStackPrompt, status_code=status.HTTP_201_CREATED)
async def create_tech_stack_prompt_endpoint(
    prompt: TechStackPromptCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_tech_stack_prompt(db, prompt)

# ✅ Get All Tech Stack Prompts (Async)
@router.get("/", response_model=List[TechStackPrompt])
async def get_tech_stack_prompts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: AsyncSession = Depends(get_db)
):
    return await get_tech_stack_prompts(db, skip, limit)

# ✅ Get Tech Stack Prompt by ID (Async)
@router.get("/{tech_prompt_id}", response_model=TechStackPromptResponse)
async def get_tech_stack_prompt(
    tech_prompt_id: str = Path(..., description="The ID of the tech stack prompt"),
    db: AsyncSession = Depends(get_db)
):
    db_prompt_result = await db.execute(
        select(TechStackPrompt).where(TechStackPrompt.tech_prompt_id == tech_prompt_id)
    )
    db_prompt = db_prompt_result.scalars().first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Tech stack prompt not found")

    return db_prompt

# ✅ Update Tech Stack Prompt (Async)
@router.put("/{tech_prompt_id}", response_model=TechStackPromptResponse)
async def update_tech_stack_prompt(
    tech_prompt_id: str,
    prompt: TechStackPromptCreate,
    db: AsyncSession = Depends(get_db)
):
    db_prompt_result = await db.execute(
        select(TechStackPrompt).where(TechStackPrompt.tech_prompt_id == tech_prompt_id)
    )
    db_prompt = db_prompt_result.scalars().first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Tech stack prompt not found")

    for key, value in prompt.dict().items():
        setattr(db_prompt, key, value)

    await db.commit()
    await db.refresh(db_prompt)
    return db_prompt

# ✅ Delete Tech Stack Prompt (Async)
@router.delete("/{tech_prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tech_stack_prompt(
    tech_prompt_id: str,
    db: AsyncSession = Depends(get_db)
):
    db_prompt_result = await db.execute(
        select(TechStackPrompt).where(TechStackPrompt.tech_prompt_id == tech_prompt_id)
    )
    db_prompt = db_prompt_result.scalars().first()

    if not db_prompt:
        raise HTTPException(status_code=404, detail="Tech stack prompt not found")

    await db.delete(db_prompt)
    await db.commit()
