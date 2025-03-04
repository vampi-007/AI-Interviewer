from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.vapi_service import (
    generate_vapi_token,
    start_interview,
    get_interview_report_from_vapi,
)
from backend.services.interview_service import save_interview_report
from backend.schemas import InterviewStart, InterviewResponse
from backend.database import get_db
import httpx

router = APIRouter()


@router.post("/interview/start", response_model=InterviewResponse)
async def start_interview_endpoint(
    interview: InterviewStart, db: AsyncSession = Depends(get_db)
):
    try:
        token = await generate_vapi_token()
        interview_data = await start_interview(
            db,
            token,
            interview.user_id,
            interview.system_prompt,
            interview.tech_stack_prompt,
        )
        return interview_data
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)


@router.get("/interview/report/{interview_id}", response_model=InterviewResponse)
async def get_report_endpoint(interview_id: str, db: AsyncSession = Depends(get_db)):
    try:
        token = await generate_vapi_token()
        report = await get_interview_report_from_vapi(token, interview_id)
        # Save report to the database if needed
        await save_interview_report(db, report)
        return report
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)


from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.schemas import InterviewRequest
from backend.services import interview_service

router = APIRouter()


@router.post("/schedule")
async def schedule_interview(
    request_body: InterviewRequest, db: AsyncSession = Depends(get_db)
):
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
