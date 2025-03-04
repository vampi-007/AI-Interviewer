from fastapi import HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from backend.database import get_db
from backend.models import Interview


async def validate_interview_link(request: Request, db: AsyncSession = Depends(get_db)):
    token = request.path_params.get("token")

    # Fetch the interview by token and check if the token is valid and the interview has not been completed
    result = await db.execute(
        select(Interview).where(
            Interview.end.is_(None),
        )
    )
    interview = result.scalar_one_or_none()

    # If no interview is found or the token is invalid or interview is completed
    if not interview:
        raise HTTPException(status_code=400, detail="Link has expired or is invalid.")

    # Get the current time in UTC
    current_time = datetime.utcnow()

    # Check if the token has expired
    if current_time > interview.token_expiry:
        # Mark the token as invalid because it has expired
        interview.is_valid = False
        await db.commit()  # Save the changes in the database

        raise HTTPException(
            status_code=400, detail="Link has expired due to token expiration."
        )

    # Prepare the interview data in the required format
    interview_data = {
        "interview_id": interview.interview_id,
        "start": interview.start,
        "end": interview.end,
        "duration": interview.duration,
        "transcript": interview.transcript,
        "summary": interview.summary,
        "recording_url": interview.recording_url,
        "video_recording_url": interview.video_recording_url,
        "success_evaluation": interview.success_evaluation,
        "resume_id": interview.resume_id,
        "tech_stack": interview.tech_stack,
        "user_id": interview.user_id,
        "created_at": interview.created_at,
    }

    # Return the interview data if the token is still valid and the interview has not been completed
    return interview_data


# Save the User's completed Interview in the Database
async def save_interview_report(db: AsyncSession, report: dict):
    interview = Interview(
        interview_id=report["interview_id"],
        start=report["start"],
        end=report["end"],
        duration=report["duration"],
        transcript=report["transcript"],
        summary=report["summary"],
        recording_url=report["recording_url"],
        video_recording_url=report["video_recording_url"],
        success_evaluation=report["success_evaluation"],
        resume_id=report.get("resume_id"),
        tech_stack=report.get("tech_stack"),
        user_id=report["user_id"],
        created_at=report["created_at"],
    )
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    return interview
