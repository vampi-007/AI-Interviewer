from fastapi import APIRouter
from fastapi import APIRouter, File, UploadFile, Depends
from services import resume_services


router = APIRouter()

@router.post("/upload/")
async def upload_resume(file: UploadFile = File(...)):
    return await resume_services.upload_resume(file)

@router.post("/test_db")
async def test_db():
    return await resume_services.test_db()