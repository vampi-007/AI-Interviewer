from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any, Optional
from sqlalchemy import desc, select, func
from sqlalchemy.orm import selectinload
import json
from datetime import datetime, timedelta

from backend.database import get_db
from backend.models import User, Interview, Resumes
from backend.routers.auth import get_current_user


router = APIRouter(tags=["User Dashboard"])

@router.get("/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for the current user's dashboard."""
    user_id = current_user.user_id
    print(f"User ID: {user_id} , {current_user}")
    
    # Get all interviews for the user with feedback
    interviews_query = (
        select(Interview)
        .options(selectinload(Interview.feedback))
        .where(Interview.user_id == user_id)
    )
    result = await db.execute(interviews_query)
    interviews = result.scalars().all()
    
    # Calculate statistics
    total_interviews = len(interviews)
    
    # Calculate total interview time
    total_seconds = sum(interview.duration or 0 for interview in interviews)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    total_time = f"{hours}h {minutes}m"
    
    # Calculate average score and trend
    interviews_with_feedback = [
        interview for interview in interviews 
        if interview.feedback and len(interview.feedback) > 0
    ]
    
    average_score = 0
    score_trend = 0
    
    if interviews_with_feedback:
        # Sort by creation date
        sorted_interviews = sorted(
            interviews_with_feedback, 
            key=lambda x: x.created_at, 
            reverse=True
        )
        
        # Calculate average score
        total_score = sum(
            feedback.overall_score 
            for interview in interviews_with_feedback 
            for feedback in interview.feedback
        )
        feedback_count = sum(
            len(interview.feedback) 
            for interview in interviews_with_feedback
        )
        average_score = round(total_score / feedback_count if feedback_count > 0 else 0, 1)
        
        # Calculate score trend (difference between last two interviews)
        if len(sorted_interviews) >= 2 and sorted_interviews[0].feedback and sorted_interviews[1].feedback:
            latest_score = sorted_interviews[0].feedback[0].overall_score
            previous_score = sorted_interviews[1].feedback[0].overall_score
            score_trend = round(latest_score - previous_score, 1)
    
    # Get best skill (strength mentioned most often)
    strengths_count = {}
    for interview in interviews_with_feedback:
        for feedback in interview.feedback:
            if feedback.strengths:
                for strength in feedback.strengths:
                    strengths_count[strength] = strengths_count.get(strength, 0) + 1
    
    # Get top 3 skills for extended reporting
    top_skills = []
    if strengths_count:
        for strength, count in sorted(strengths_count.items(), key=lambda x: x[1], reverse=True)[:3]:
            total_interviews_with_strength = sum(
                1 for interview in interviews_with_feedback 
                for feedback in interview.feedback 
                if feedback.strengths and strength in feedback.strengths
            )
            percentage = round((total_interviews_with_strength / len(interviews_with_feedback)) * 100)
            top_skills.append({
                "name": strength,
                "count": count,
                "percentage": percentage
            })
    
    best_skill = max(strengths_count.items(), key=lambda x: x[1])[0] if strengths_count else "None"
    best_skill_score = round(strengths_count.get(best_skill, 0) / len(interviews_with_feedback) * 100 if interviews_with_feedback else 0)
    
    # Get most recent resume
    resume_query = (
        select(Resumes)
        .where(Resumes.user_id == user_id)
        .order_by(desc(Resumes.uploaded_at))
        .limit(1)
    )
    result = await db.execute(resume_query)
    resume = result.scalar_one_or_none()
    
    resume_status = {
        "has_resume": resume is not None,
        "last_updated": resume.uploaded_at.isoformat() if resume else None,
        "resume_id": str(resume.resume_id) if resume else None
    }
    
    # Calculate interview frequency (interviews per week over the last month)
    one_month_ago = datetime.utcnow() - timedelta(days=30)
    recent_interviews = [i for i in interviews if i.created_at >= one_month_ago]
    interviews_per_week = round(len(recent_interviews) * 7 / 30, 1) if recent_interviews else 0
    
    # Calculate consistency score
    # Higher if interviews are spaced regularly rather than clustered
    consistency_score = 0
    if len(recent_interviews) >= 2:
        dates = sorted([i.created_at for i in recent_interviews])
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
        # Lower standard deviation means more consistent
        import statistics
        try:
            std_dev = statistics.stdev(gaps)
            # Convert to a 0-100 score (lower std_dev = higher score)
            consistency_score = min(100, max(0, 100 - (std_dev * 10)))
        except:
            consistency_score = 50  # Default if calculation fails
    
    return {
        "total_interviews": total_interviews,
        "total_time": total_time,
        "average_score": average_score,
        "score_trend": score_trend,
        "best_skill": best_skill,
        "best_skill_score": best_skill_score,
        "top_skills": top_skills,
        "resume_status": resume_status,
        "interview_frequency": interviews_per_week,
        "consistency_score": round(consistency_score),
        "last_interview_date": interviews[0].created_at.isoformat() if interviews else None
    }

@router.get("/interviews")
async def get_user_interviews(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a user's recent interviews and areas to improve."""
    user_id = current_user.user_id
    
    # Get user's interviews with feedback
    interviews_query = (
        select(Interview)
        .options(selectinload(Interview.feedback))
        .where(Interview.user_id == user_id)
        .order_by(desc(Interview.created_at))
        .limit(5)
    )
    result = await db.execute(interviews_query)
    interviews = result.scalars().all()
    
    # Format recent interviews
    recent_interviews = []
    for interview in interviews:
        # Get feedback if available
        feedback = interview.feedback[0] if interview.feedback else None
        score = feedback.overall_score if feedback else 0
        
        # Format duration
        minutes = (interview.duration or 0) // 60
        duration = f"{minutes} minutes"
        
        recent_interviews.append({
            "id": str(interview.interview_id),
            "title": f"{interview.prompt.tech_stack} Interview" if interview.prompt else "Interview",
            "date": interview.created_at.strftime("%B %d, %Y"),
            "duration": duration,
            "score": score,
            "recording_url": interview.recording_url,
            "video_recording_url": interview.video_recording_url
        })
    
    # Process improvement areas
    improvement_areas = []
    weakness_count = {}
    
    # Count weaknesses across all interviews
    for interview in interviews:
        if interview.feedback:
            for feedback in interview.feedback:
                if feedback.improvement_areas:
                    # Parse improvement_areas from JSON string
                    try:
                        areas = json.loads(feedback.improvement_areas)
                        for area in areas:
                            weakness_count[area] = weakness_count.get(area, 0) + 1
                    except:
                        continue
    
    # Format and sort improvement areas
    for weakness, count in sorted(weakness_count.items(), key=lambda x: x[1], reverse=True)[:3]:
        # Calculate a score (higher count = lower score)
        max_count = max(weakness_count.values()) if weakness_count else 1
        score = 100 - (count / max_count * 35)  # Scale to give between 65-100%
        
        improvement_areas.append({
            "name": weakness,
            "score": round(score)
        })
    
    return {
        "recentInterviews": recent_interviews,
        "improvementAreas": improvement_areas
    }

@router.get("/progress")
async def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the user's progress over time."""
    user_id = current_user.user_id
    
    # Get all interviews with feedback for the user
    interviews_query = (
        select(Interview)
        .options(selectinload(Interview.feedback))
        .where(Interview.user_id == user_id)
        .order_by(Interview.created_at)
    )
    result = await db.execute(interviews_query)
    interviews = result.scalars().all()
    
    # Extract interviews with feedback
    interviews_with_feedback = [
        interview for interview in interviews 
        if interview.feedback and len(interview.feedback) > 0
    ]
    
    # Create progress timeline
    progress_timeline = []
    
    for interview in interviews_with_feedback:
        feedback = interview.feedback[0]  # Use first feedback
        
        # Get strengths and weaknesses
        strengths = feedback.strengths or []
        weaknesses = []
        if feedback.improvement_areas:
            try:
                weaknesses = json.loads(feedback.improvement_areas)
            except:
                weaknesses = []
        
        progress_timeline.append({
            "date": interview.created_at.strftime("%Y-%m-%d"),
            "score": feedback.overall_score,
            "tech_stack": interview.prompt.tech_stack if interview.prompt else "General",
            "strengths": strengths[:3],  # Limit to top 3
            "weaknesses": weaknesses[:3]  # Limit to top 3
        })
    
    # Calculate growth metrics
    first_score = progress_timeline[0]["score"] if progress_timeline else 0
    last_score = progress_timeline[-1]["score"] if progress_timeline else 0
    overall_growth = round(last_score - first_score, 1)
    
    return {
        "progressTimeline": progress_timeline,
        "overallGrowth": overall_growth,
        "interviewsCount": len(interviews_with_feedback)
    }
