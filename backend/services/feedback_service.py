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
    
    # Create a simplified prompt that focuses only on available data
    feedback_prompt = PromptTemplate(
        input_variables=["transcript", "evaluation_score", "duration"],
        template="""
        You are an expert interview coach. Based solely on this interview transcript and the provided evaluation score, 
        provide constructive feedback to help the candidate improve their interviewing skills.
        
        Interview Transcript:
        {transcript}
        
        Interview Score: {evaluation_score}/10
        Interview Duration: {duration} seconds
        
        Please analyze the transcript carefully to:
        1. Identify key strengths in the interview responses
        2. Identify areas where improvement would be beneficial
        3. Provide specific, actionable recommendations for future interviews
        
        Format your response as a JSON object with the following structure:
        {{
          "overall_score": float,  // Use the provided evaluation score as a base but adjust based on your analysis
          "overall_feedback": "string",  // 2-3 sentence summary of performance
          "strengths": [  // List 3-5 key strengths observed
            "string"
          ],
          "improvement_areas": [  // List 3-5 areas for improvement
            {{
              "area": "one of [communication, technical, problem_solving, experience, confidence, clarity]",
              "weakness": "string",  // What specifically needs improvement
              "suggestion": "string"  // Actionable advice to improve
            }}
          ],
          "next_steps": [  // 3 specific actions the candidate should take
            "string"
          ]
        }}
        
        Don't include any commentary outside the JSON structure.
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