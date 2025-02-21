from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from services.tech_stack_prompt_services import (
    create_tech_stack_prompt,
    get_tech_stack_prompts,
    get_tech_stack_prompt_by_id,
    update_tech_stack_prompt,
    delete_tech_stack_prompt
)
from schemas import TechStackPrompt, TechStackPromptCreate, TechStackPromptResponse

router = APIRouter()

@router.post("/", response_model=TechStackPrompt, status_code=status.HTTP_201_CREATED)
async def create_tech_stack_prompt_endpoint(
    prompt: TechStackPromptCreate,
    db: Session = Depends(get_db)
):
    return await create_tech_stack_prompt(db, prompt)

@router.get("/", response_model=List[TechStackPrompt])
async def get_tech_stack_prompts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    return await get_tech_stack_prompts(db, skip, limit)

# Similar pattern for other endpoints
@router.get("/{tech_prompt_id}", response_model=TechStackPromptResponse)
async def get_tech_stack_prompt(
    tech_prompt_id: str = Path(..., description="The ID of the tech stack prompt"),
    db: Session = Depends(get_db)
):
    db_prompt = db.query(TechStackPrompt).filter(
        TechStackPrompt.tech_prompt_id == tech_prompt_id
    ).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Tech stack prompt not found")
    return db_prompt

@router.put("/{tech_prompt_id}", response_model=TechStackPromptResponse)
async def update_tech_stack_prompt(
    tech_prompt_id: str,
    prompt: TechStackPromptCreate,
    db: Session = Depends(get_db)
):
    db_prompt = db.query(TechStackPrompt).filter(
        TechStackPrompt.tech_prompt_id == tech_prompt_id
    ).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Tech stack prompt not found")
    
    for key, value in prompt.dict().items():
        setattr(db_prompt, key, value)
    
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.delete("/{tech_prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tech_stack_prompt(
    tech_prompt_id: str,
    db: Session = Depends(get_db)
):
    db_prompt = db.query(TechStackPrompt).filter(
        TechStackPrompt.tech_prompt_id == tech_prompt_id
    ).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Tech stack prompt not found")
    
    db.delete(db_prompt)
    db.commit()
    return