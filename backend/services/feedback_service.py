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
    
    # Modified prompt for voice-based interviews
    feedback_prompt = PromptTemplate(
        input_variables=["transcript", "evaluation_score", "duration"],
        template="""
        As an interview coach, please review this voice-based technical interview transcript and provide professional feedback.

        Interview Details:
        - Audio Interview Transcript: {transcript}
        - Assessment Score: {evaluation_score}/10
        - Duration: {duration} seconds

        This was a voice-based interview where the candidate answered questions verbally without writing code. 
        Please evaluate based on verbal communication, technical knowledge expression, problem-solving approach,
        and how well they articulated their thoughts.

        Please provide a structured analysis with:
        1. A summary of the candidate's verbal performance
        2. Key strengths demonstrated in their verbal responses
        3. Areas where verbal communication and technical explanation could be improved
        4. Specific recommendations for future voice interviews

        Format the response as a JSON object with this structure:
        {{
          "overall_score": float,  // Based on the assessment score provided
          "overall_feedback": "string",  // Brief professional summary of verbal performance
          "strengths": [  // 3-5 notable strengths in verbal communication
            "string"
          ],
          "improvement_areas": [  // 3-5 professional development opportunities
            {{
              "area": "string",  // Category (verbal_communication, technical_explanation, problem_solving_approach, etc.)
              "weakness": "string",  // Area for development
              "suggestion": "string"  // Professional guidance for voice interviews
            }}
          ],
          "next_steps": [  // 3 recommended action items for improving interview communication
            "string"
          ]
        }}

        Please provide only the JSON object in your response.
        """
    )
    
    # Generate feedback
    chain = feedback_prompt | llm
    response = await chain.ainvoke(context)
    
    try:
        # Extract JSON from response
        response_content = response.content if hasattr(response, 'content') else str(response)
        
        # Debug the response
        print(f"Raw response: {response_content[:500]}...")
        
        # Clean the response to ensure it's valid JSON
        # Sometimes the LLM might return markdown or extra text
        response_content = response_content.strip()
        
        # Find JSON content if response is wrapped in markdown or other text
        json_start = response_content.find('{')
        json_end = response_content.rfind('}')
        
        if json_start >= 0 and json_end >= 0:
            response_content = response_content[json_start:json_end+1]
        
        if not response_content:
            raise ValueError("Empty response from LLM")
            
        feedback_json = json.loads(response_content)
        
        # Validate required fields are present
        required_fields = ["overall_score", "overall_feedback", "strengths", 
                          "improvement_areas", "next_steps"]
        for field in required_fields:
            if field not in feedback_json:
                raise KeyError(f"Missing required field: {field}")
        
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
        
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        print(f"Error processing feedback: {str(e)}")
        print(f"Response content: {response_content[:1000]}...")
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")