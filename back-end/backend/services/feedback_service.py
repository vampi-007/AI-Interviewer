from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from sqlalchemy.future import select
import json
from typing import Dict, Any, List
import uuid
from datetime import datetime

from backend.models import Interview, InterviewFeedback as InterviewFeedbackModel
from backend.schemas import InterviewFeedback, ImprovementSuggestion, FeedbackArea
from backend.config import settings

async def generate_interview_feedback(interview_id: uuid.UUID, db: AsyncSession) -> Dict[str, Any]:
    """Generate comprehensive feedback based solely on interview transcript and success evaluation."""
    
    # Fetch the interview data
    interview_query = await db.execute(select(Interview).where(Interview.interview_id == interview_id))
    interview = interview_query.scalar_one_or_none()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Check if interview has required data
    if not interview.transcript:
        raise HTTPException(status_code=400, detail="Interview transcript not available")
    
    if interview.success_evaluation is None:
        raise HTTPException(status_code=400, detail="Interview evaluation score not available")
    
    # Initialize LLM
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        openai_api_key=settings.OPENAI_API_KEY,
        openai_api_base=settings.OPENAI_API_BASE,
        temperature=0.2
    )
    
    # Create context with only transcript and score
    context = {
        "transcript": interview.transcript,
        "evaluation_score": interview.success_evaluation,
        "duration": interview.duration or 0
    }
    
    feedback_prompt = PromptTemplate(
    input_variables=["transcript", "evaluation_score", "duration"],
    template="""
    As an *experienced interview coach, your role is to provide **constructive, professional, and ethical* feedback on this *voice-based technical interview. Ensure that the feedback is **objective, encouraging, and actionable*.

    *Interview Details:*
    - *Audio Interview Transcript:* {transcript}
    - *Assessment Score:* {evaluation_score}/10
    - *Duration:* {duration} seconds

    This interview focused on *verbal technical explanations* rather than written code. Evaluate the candidate based on:
    - *Clarity and effectiveness* of verbal communication  
    - *Technical knowledge and depth of explanation*  
    - *Logical problem-solving approach*  
    - *Confidence and articulation*  

    *Provide a structured, professional analysis with:*
    
    1. *Overall summary* of the candidate’s verbal performance (objective and encouraging)  
    2. *Key strengths* in communication and technical explanation  
    3. *Constructive improvement areas* (ensure respectful, professional wording)  
    4. *Actionable recommendations* for improving voice-based technical interviews  

    *Response Format (JSON only):*
    {{
      "overall_score": float,  // Final score based on evaluation_score (1-10 scale)
      "overall_feedback": "string",  // A concise and encouraging summary of the candidate’s performance
      "strengths": [  // 3-5 well-defined strengths in communication and technical explanation
        "string"
      ],
      "improvement_areas": [  // 3-5 areas for development with positive guidance
        {{
          "area": "string",  // Category (e.g., verbal_clarity, technical_depth, logical_reasoning)
          "weakness": "string",  // Identified challenge (e.g., "Struggled to structure responses clearly")
          "suggestion": "string"  // Encouraging guidance (e.g., "Practice summarizing key points before answering")
        }}
      ],
      "next_steps": [  // 3 specific, practical recommendations for improvement
        "string"
      ]
    }}

    *Guidelines for Feedback:*
    - *Keep the tone professional, supportive, and encouraging.*  
    - *Avoid harsh criticism or negative language.* Instead, focus on *improvement and growth*.  
    - *Frame weaknesses as opportunities* for development rather than flaws.  
    - *Use clear, specific, and constructive recommendations.*  

    Please provide *only the JSON object* in your response.
    """
)
    # Generate feedback
    chain = feedback_prompt | llm
    response = await chain.ainvoke(context)
    
    try:
        # Extract JSON from response
        response_content = response.content.strip()
        feedback_json = json.loads(response_content)
        
        # Create and store feedback in database
        db_feedback = InterviewFeedbackModel(
            feedback_id=uuid.uuid4(),
            interview_id=interview_id,
            overall_score=feedback_json["overall_score"],
            overall_feedback=feedback_json["overall_feedback"],
            strengths=feedback_json["strengths"],
            improvement_areas=json.dumps(feedback_json["improvement_areas"]),
            next_steps=feedback_json["next_steps"],
            created_at=datetime.utcnow()
        )
        
        db.add(db_feedback)
        await db.commit()
        await db.refresh(db_feedback)
        
        # Return the response
        return {
            "feedback_id": db_feedback.feedback_id,
            "interview_id": interview_id,
            "overall_score": feedback_json["overall_score"],
            "overall_feedback": feedback_json["overall_feedback"],
            "strengths": feedback_json["strengths"],
            "improvement_areas": feedback_json["improvement_areas"],
            "next_steps": feedback_json["next_steps"],
            "created_at": db_feedback.created_at
        }
        
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")