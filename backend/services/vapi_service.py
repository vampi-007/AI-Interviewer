import os
import json
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from dotenv import load_dotenv
from backend.models import Interview, User
from backend.config import settings
from backend.services.user_service import get_user
from backend.services.interview_service import save_interview_report
from fastapi import HTTPException, Request
from sqlalchemy.future import select
from datetime import datetime, timedelta
import jwt

load_dotenv()

VAPI_BASE_URL = os.getenv("VAPI_BASE_URL")
VAPI_ASSISSTANT_ID = os.getenv("VAPI_ASSISSTANT_ID")
VAPI_ORG_ID = os.getenv("VAPI_ORG_ID")
VAPI_PRIVATE_KEY = os.getenv("VAPI_PRIVATE_KEY")


async def generate_vapi_token():
    payload = {"orgId": VAPI_ORG_ID, "exp": datetime.utcnow() + timedelta(hours=1)}
    token = jwt.encode(payload, VAPI_PRIVATE_KEY, algorithm="HS256")
    return token


async def start_interview(
    db: AsyncSession,
    token: str,
    user_id: str,
    system_prompt: str = None,
    tech_stack_prompt: str = None,
):
    user = await get_user(db, user_id)
    if user:
        username = user.username
    else:
        username = "John Doe"
        raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
    payload = {
        "assistant": {
            "firstMessage": f"Hey {username}, how are you?",
            "model": {
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            system_prompt if system_prompt else tech_stack_prompt
                        ),
                    }
                ],
            },
        },
        "assistant_id": VAPI_ASSISSTANT_ID,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VAPI_BASE_URL}/interview/start",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
            json=payload,
        )
        response.raise_for_status()
        return response.json()


async def get_interview_report_from_vapi(
    token: str, interview_id: str, db: AsyncSession
):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{VAPI_BASE_URL}/interview/report/{interview_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        response.raise_for_status()
        data = response.json()

    try:
        # Parse and validate incoming JSON data
        if not isinstance(data, dict):
            raise ValueError(f"Expected a JSON object, but received {type(data)}")

        # Extract and validate message, analysis, and assistant data
        message = data.get("message")
        analysis = message.get("analysis")
        assistant = message.get("assistant")
        artifact = message.get("artifact", {})

        # Extract and process success evaluation
        success_evaluation = analysis.get("successEvaluation")
        try:
            success_evaluation = (
                int(success_evaluation) if success_evaluation is not None else 0
            )
        except ValueError:
            success_evaluation = 0

        # Extract user ID and verify user exists
        variable_values = assistant.get("variableValues")
        user_id = variable_values.get("userId")
        result = await db.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=404, detail=f"User with ID {user_id} not found"
            )

        # Prepare the interview report data
        report = {
            "interview_id": interview_id,
            "start": datetime.fromisoformat(
                message.get("startedAt", datetime.utcnow().isoformat())
            ),
            "end": datetime.fromisoformat(
                message.get("endedAt", datetime.utcnow().isoformat())
            ),
            "duration": float(message.get("durationSeconds", 0)),
            "transcript": message.get("transcript", ""),
            "summary": analysis.get("summary", ""),
            "recording_url": message.get("recordingUrl", ""),
            "video_recording_url": artifact.get("videoRecordingUrl", ""),
            "success_evaluation": success_evaluation,
            "resume_id": user.resume_id,  # Assuming user has a resume_id field
            "tech_stack": user.tech_stack,  # Assuming user has a tech_stack field
            "user_id": user_id,
            "created_at": datetime.utcnow(),
        }

        # Save the interview report using the save_interview_report function
        new_interview = await save_interview_report(db, report)

        # Return success response with interview details
        return {
            "status": "success",
            "message": "Interview data stored successfully and interview marked as completed",
            "interview_id": new_interview.interview_id,
            "success_evaluation": success_evaluation,
            "video_recording_url": new_interview.video_recording_url,
        }

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the request: {str(e)}",
        )
