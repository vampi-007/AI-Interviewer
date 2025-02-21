from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from services.prompt_services import (
    create_prompt,
    get_prompts,
    get_prompt_by_id,
    update_prompt,
    delete_prompt
)
from schemas import Prompt, PromptCreate, PromptResponse

router = APIRouter()

@router.post("/", response_model=Prompt, status_code=status.HTTP_201_CREATED)
async def create_prompt_endpoint(
    prompt: PromptCreate,
    db: Session = Depends(get_db)
):
    return await create_prompt(db, prompt)

@router.get("/", response_model=List[Prompt])
async def get_prompts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    return await get_prompts(db, skip, limit)

@router.get("/{prompt_id}", response_model=Prompt)
async def get_prompt_endpoint(
    prompt_id: int = Path(..., gt=0),
    db: Session = Depends(get_db)
):
    db_prompt = await get_prompt_by_id(db, prompt_id)
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return db_prompt

# Similar pattern for update and delete endpoints

@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: int,
    prompt: PromptCreate,
    db: Session = Depends(get_db)
):
    db_prompt = db.query(Prompt).filter(Prompt.prompt_id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    for key, value in prompt.dict().items():
        setattr(db_prompt, key, value)
    
    db.commit()
    db.refresh(db_prompt)
    return db_prompt

@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: int,
    db: Session = Depends(get_db)
):
    db_prompt = db.query(Prompt).filter(Prompt.prompt_id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    db.delete(db_prompt)
    db.commit()
    return