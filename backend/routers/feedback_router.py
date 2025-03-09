from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Dict, Any
import json
import uuid

from backend.database import get_db
from backend.schemas import InterviewFeedback, FeedbackRequest, ImprovementSuggestion
from backend.services.feedback_service import generate_interview_feedback
from backend.models import InterviewFeedback as InterviewFeedbackModel

router = APIRouter(prefix="/feedback")  

@router.post("/generate", response_model=Dict[str, Any])
async def create_feedback(request: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    """Generate feedback for a completed interview."""
    return await generate_interview_feedback(request.interview_id, db)

@router.get("/{interview_id}", response_model=InterviewFeedback)
async def get_interview_feedback(interview_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieve existing feedback for an interview."""
    query = await db.execute(
        select(InterviewFeedbackModel).where(InterviewFeedbackModel.interview_id == interview_id)
    )
    feedback = query.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found for this interview")
    
    # Parse the JSON string for improvement_areas
    improvement_areas = json.loads(feedback.improvement_areas)
    
    return InterviewFeedback(
        feedback_id=feedback.feedback_id,
        interview_id=feedback.interview_id,
        overall_score=feedback.overall_score,
        overall_feedback=feedback.overall_feedback,
        strengths=feedback.strengths,
        improvement_areas=[
            ImprovementSuggestion(
                area=area["area"],
                weakness=area["weakness"],
                suggestion=area["suggestion"]
            ) for area in improvement_areas
        ],
        next_steps=feedback.next_steps,
        created_at=feedback.created_at
    )