from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.schemas import InterviewRequest
from backend.services import interview_service

router = APIRouter()

@router.post("/schedule")
async def schedule_interview(request_body: InterviewRequest, db: AsyncSession = Depends(get_db)):
    return await interview_service.schedule_interview(request_body, db)

@router.get("/validate/{session_token}")
async def validate_interview_session(session_token: str):
    return await interview_service.validate_interview_session(session_token)

@router.post("/vapi-end-of-call")
async def handle_vapi_end_of_call(request: Request, db: AsyncSession = Depends(get_db)):
    return await interview_service.handle_vapi_end_of_call(request, db)

@router.post("/end-interview/{session_token}")
async def end_interview(session_token: str):
    return await interview_service.end_interview(session_token)
