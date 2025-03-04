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


from fastapi import HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.models import User, Resumes, Prompt, Interview
from datetime import datetime, timedelta
import json
import uuid
from backend.schemas import InterviewRequest
from backend.redis_config import redis_client
from backend.database import get_db
from pydantic import BaseModel
from typing import Optional


async def schedule_interview(
    request_body: InterviewRequest, db: AsyncSession = Depends(get_db)
):
    """
    Schedules an interview session, stores session token in Redis.
    """
    user_id = request_body.user_id
    prompt_id = request_body.prompt_id  # For tech-stack-based interviews
    resume_id = request_body.resume_id  # For resume-based interviews

    # ✅ Use async query to fetch user
    result = await db.execute(select(User).filter(User.user_id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404, detail=f"User with ID {user_id} not found."
        )

    if not prompt_id and not resume_id:
        raise HTTPException(
            status_code=400, detail="Either prompt_id or resume_id must be provided."
        )

    # ✅ Generate session details
    interview_id = str(uuid.uuid4())
    session_token = str(uuid.uuid4())  # Unique session token
    expires_at = datetime.utcnow() + timedelta(minutes=30)  # 30-min expiration

    interview_data = {
        "user_id": str(user_id),
        "interview_id": interview_id,
        "prompt_id": str(prompt_id) if prompt_id else None,
        "resume_id": str(resume_id) if resume_id else None,
        "expires_at": expires_at.isoformat(),
    }

    # ✅ Store session in Redis with a 30-min expiration
    redis_client.setex(
        f"interview:{session_token}", timedelta(minutes=30), json.dumps(interview_data)
    )

    return {
        "message": "Interview session created successfully.",
        "interview_id": interview_id,
        "session_token": session_token,
    }


async def validate_interview_session(session_token: str):
    # ✅ Check session in Redis
    interview_data = redis_client.get(f"interview:{session_token}")

    if not interview_data:
        raise HTTPException(status_code=400, detail="Invalid or expired session token.")

    interview_data = json.loads(interview_data)

    return {"message": "Valid session", "interview_data": interview_data}


async def handle_vapi_end_of_call(request: Request, db: AsyncSession):
    try:
        data = await request.json()
        message = data.get("message", {})
        analysis = message.get("analysis", {})
        assistant = message.get("assistant", {})
        artifact = message.get("artifact", {})

        success_evaluation = int(analysis.get("successEvaluation", 0))
        variable_values = assistant.get("variableValues", {})
        session_token = variable_values.get("sessionToken")

        # ✅ Fetch session from Redis
        interview_data = redis_client.get(f"interview:{session_token}")

        if not interview_data:
            raise HTTPException(status_code=400, detail="Invalid session token.")

        interview_dict = json.loads(interview_data)

        # ✅ Store interview result in database
        new_interview = Interview(
            interview_id=interview_dict["interview_id"],
            user_id=interview_dict["user_id"],
            prompt_id=interview_dict["prompt_id"],
            resume_id=interview_dict["resume_id"],
            start_time=datetime.fromisoformat(
                message.get("startedAt", datetime.utcnow().isoformat())
            ),
            end_time=datetime.fromisoformat(
                message.get("endedAt", datetime.utcnow().isoformat())
            ),
            duration=float(message.get("durationSeconds", 0)),
            transcript=message.get("transcript", ""),
            summary=analysis.get("summary", ""),
            recording_url=message.get("recordingUrl", ""),
            video_recording_url=artifact.get("videoRecordingUrl", ""),
            success_evaluation=success_evaluation,
        )

        db.add(new_interview)
        await db.commit()  # ✅ Async commit

        # ✅ Remove session from Redis after completion
        redis_client.delete(f"interview:{session_token}")

        return {
            "status": "success",
            "message": "Interview data stored successfully.",
            "success_evaluation": success_evaluation,
        }

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing request: {str(e)}"
        )


async def end_interview(session_token: str):
    """
    Allows the user to manually end an interview before VAPI does.
    Only deletes the Redis session token.
    """
    # ✅ Check if session exists in Redis
    interview_data = redis_client.get(f"interview:{session_token}")

    if not interview_data:
        raise HTTPException(status_code=400, detail="Invalid or expired session token.")

    # ✅ Remove session from Redis
    redis_client.delete(f"interview:{session_token}")

    return {"message": "Interview session ended by user. Waiting for VAPI report."}
