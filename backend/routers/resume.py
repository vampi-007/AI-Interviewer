from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, Path, Query
from typing import Dict
import uuid
from fastapi.responses import JSONResponse
from services import resume_services
from sqlalchemy.orm import Session
from db import get_db

router = APIRouter()

@router.post("/upload/")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.pdf'):
        return JSONResponse(content={"error": "Only PDF files are allowed"}, status_code=400)

    return await resume_services.upload_resume(file)
@router.post("/submit/")
async def submit_resume(
    user_id: uuid.UUID = Query(..., description="UUID of the user"),
    form_data: Dict = ...,  # Expect JSON body
    db: Session = Depends(get_db)
):
    return await resume_services.submit_resume(user_id, form_data, db)

@router.get("/get_user_resumes/{user_id}")
async def get_user_resumes(
    user_id: uuid.UUID = Path(..., description="The ID of the user"),
    db: Session = Depends(get_db)
):
    print(f"Received request for user_id: {user_id}")  # Debug print
    try:
        resumes = await resume_services.get_user_resumes(user_id, db)
        return resumes
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"No resumes found for user {user_id}")

@router.get("/users/{user_id}/resumes/{resume_id}")
async def get_resume_by_user_id(
    user_id: uuid.UUID = Path(..., description="The ID of the user"),
    resume_id: uuid.UUID = Path(..., description="The ID of the resume to retrieve"),
    db: Session = Depends(get_db)
):
    try:
        resume = await resume_services.get_resume_by_user_id(user_id, resume_id, db)
        if not resume:
            raise HTTPException(status_code=404, detail=f"Resume {resume_id} not found")
        if resume.user_id != user_id:  # Access the ORM object's attribute
            raise HTTPException(status_code=403, detail="Access denied")
        return resume  # Return the ORM object directly
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resume/{resume_id}")
async def get_resume_by_id(
    resume_id: uuid.UUID = Path(..., description="The ID of the resume to retrieve"),
    db: Session = Depends(get_db)
):
    try:
        resume = await resume_services.get_resume_by_id(resume_id, db)
        if not resume:
            raise HTTPException(status_code=404, detail=f"Resume {resume_id} not found")
        return resume
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))