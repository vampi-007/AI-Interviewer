from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta, date
from sqlalchemy import func, desc, select, and_, extract
from sqlalchemy.orm import selectinload
import json
import calendar

from backend.database import get_db
from backend.models import User, Interview, InterviewFeedback, Prompt
from backend.dependencies import role_dependency

router = APIRouter(tags=["Admin Dashboard"])

@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(role_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for the admin dashboard."""
    # Get total users
    total_users_query = select(func.count()).select_from(User)
    result = await db.execute(total_users_query)
    total_users = result.scalar()
    
    # Get active users (had an interview in the last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users_query = (
        select(func.count(func.distinct(Interview.user_id)))
        .where(Interview.created_at > thirty_days_ago)
    )
    result = await db.execute(active_users_query)
    active_users = result.scalar()
    
    # Get total interviews
    total_interviews_query = select(func.count()).select_from(Interview)
    result = await db.execute(total_interviews_query)
    total_interviews = result.scalar()
    
    # Get average score
    avg_score_query = select(func.avg(InterviewFeedback.overall_score)).select_from(InterviewFeedback)
    result = await db.execute(avg_score_query)
    avg_score = result.scalar() or 0
    
    # Calculate user growth (new users in the last 30 days)
    new_users_query = (
        select(func.count())
        .select_from(User)
        .where(User.created_at > thirty_days_ago)
    )
    result = await db.execute(new_users_query)
    new_users = result.scalar()
    
    # Calculate user growth percentage
    user_growth = round((new_users / total_users * 100) if total_users > 0 else 0, 1)
    
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "totalInterviews": total_interviews,
        "averageScore": round(avg_score, 1),
        "userGrowth": user_growth
    }

@router.get("/top-users")
async def get_top_users(
    current_user: User = Depends(role_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get top performing users based on interview scores."""
    # Get all users with interviews and feedback
    users_query = select(User).options(
        selectinload(User.interviews).selectinload(Interview.feedback)
    )
    result = await db.execute(users_query)
    users = result.scalars().all()
    
    # Process users to get their stats
    user_stats = []
    for user in users:
        if not user.interviews:
            continue
            
        # Count interviews with feedback
        interviews_with_feedback = [
            interview for interview in user.interviews 
            if interview.feedback and len(interview.feedback) > 0
        ]
        
        if not interviews_with_feedback:
            continue
            
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
        avg_score = total_score / feedback_count if feedback_count > 0 else 0
        
        user_stats.append({
            "id": str(user.user_id),
            "username": user.username,
            "interviewCount": len(user.interviews),
            "averageScore": round(avg_score, 1)
        })
    
    # Sort by average score (descending)
    user_stats.sort(key=lambda x: x["averageScore"], reverse=True)
    
    # Return top 5 users
    return user_stats[:5]

@router.get("/interview-distribution")
async def get_interview_distribution(
    current_user: User = Depends(role_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get distribution of interviews by prompt tech stack."""
    # Get interviews with prompts
    interviews_query = (
        select(Interview)
        .options(selectinload(Interview.prompt))
        .where(Interview.prompt_id.isnot(None))
    )
    result = await db.execute(interviews_query)
    interviews = result.scalars().all()
    
    # Count interviews by tech stack
    tech_stack_count = {}
    for interview in interviews:
        if interview.prompt:
            tech_stack = interview.prompt.tech_stack
            tech_stack_count[tech_stack] = tech_stack_count.get(tech_stack, 0) + 1
    
    # Calculate percentages
    total = len(interviews)
    distribution = []
    
    for tech_stack, count in tech_stack_count.items():
        percentage = (count / total * 100) if total > 0 else 0
        distribution.append({
            "name": tech_stack,
            "count": count,
            "percentage": round(percentage, 1)
        })
    
    # Sort by count (descending)
    distribution.sort(key=lambda x: x["count"], reverse=True)
    
    return distribution

@router.get("/user-retention")
async def get_user_retention(
    current_user: User = Depends(role_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get user retention statistics over time."""
    # Get all users with their creation date
    users_query = select(User.created_at).order_by(User.created_at)
    result = await db.execute(users_query)
    user_dates = result.scalars().all()
    
    # Get all interviews with their dates
    interviews_query = select(Interview.user_id, Interview.created_at).order_by(Interview.created_at)
    result = await db.execute(interviews_query)
    interview_data = result.all()
    
    # Process user acquisition by month
    acquisition_by_month = {}
    for created_at in user_dates:
        month_key = created_at.strftime("%Y-%m")
        acquisition_by_month[month_key] = acquisition_by_month.get(month_key, 0) + 1
    
    # Calculate retention rates
    retention_data = []
    user_interview_map = {}
    
    # Group interviews by user
    for user_id, interview_date in interview_data:
        if user_id not in user_interview_map:
            user_interview_map[user_id] = []
        user_interview_map[user_id].append(interview_date)
    
    # Calculate retention for different time periods
    total_users = len(user_dates)
    week_retained = 0
    month_retained = 0
    three_month_retained = 0
    
    now = datetime.utcnow()
    for user_id, interview_dates in user_interview_map.items():
        # Get the most recent interview date
        if not interview_dates:
            continue
        latest_interview = max(interview_dates)
        
        # Check if user was active in different time periods
        if (now - latest_interview).days <= 7:
            week_retained += 1
        if (now - latest_interview).days <= 30:
            month_retained += 1
        if (now - latest_interview).days <= 90:
            three_month_retained += 1
    
    # Calculate percentages
    week_retention = round((week_retained / total_users * 100) if total_users > 0 else 0, 1)
    month_retention = round((month_retained / total_users * 100) if total_users > 0 else 0, 1)
    three_month_retention = round((three_month_retained / total_users * 100) if total_users > 0 else 0, 1)
    
    # Format data for monthly acquisition chart
    months_data = []
    for month, count in sorted(acquisition_by_month.items()):
        months_data.append({
            "month": month,
            "users": count
        })
    
    return {
        "userRetention": {
            "weeklyRetention": week_retention,
            "monthlyRetention": month_retention,
            "quarterlyRetention": three_month_retention
        },
        "userAcquisition": months_data
    }

@router.get("/interview-metrics")
async def get_interview_metrics(
    current_user: User = Depends(role_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed interview metrics and analytics."""
    # Get all interviews with feedback
    interviews_query = (
        select(Interview)
        .options(selectinload(Interview.feedback), selectinload(Interview.prompt))
        .order_by(Interview.created_at)
    )
    result = await db.execute(interviews_query)
    interviews = result.scalars().all()
    
    # Calculate metrics
    total_interviews = len(interviews)
    interviews_with_feedback = [i for i in interviews if i.feedback and len(i.feedback) > 0]
    feedback_percentage = round((len(interviews_with_feedback) / total_interviews * 100) if total_interviews > 0 else 0, 1)
    
    # Interview duration stats
    durations = [i.duration for i in interviews if i.duration is not None]
    avg_duration = round(sum(durations) / len(durations) / 60) if durations else 0  # in minutes
    
    # Track usage by day of week
    days_of_week = [0] * 7  # Sunday to Saturday
    for interview in interviews:
        day_idx = interview.created_at.weekday()
        days_of_week[day_idx] += 1
    
    # Get day names
    day_names = list(calendar.day_name)
    
    # Usage by time of day
    hours = [0] * 24
    for interview in interviews:
        hour = interview.created_at.hour
        hours[hour] += 1
    
    # Group scores by tech stack
    tech_stack_scores = {}
    for interview in interviews_with_feedback:
        if interview.prompt and interview.prompt.tech_stack:
            tech_stack = interview.prompt.tech_stack
            if tech_stack not in tech_stack_scores:
                tech_stack_scores[tech_stack] = []
            
            for feedback in interview.feedback:
                tech_stack_scores[tech_stack].append(feedback.overall_score)
    
    # Calculate average scores by tech stack
    avg_scores_by_stack = []
    for tech_stack, scores in tech_stack_scores.items():
        avg_score = sum(scores) / len(scores) if scores else 0
        avg_scores_by_stack.append({
            "techStack": tech_stack,
            "averageScore": round(avg_score, 1),
            "interviewCount": len(scores)
        })
    
    # Sort by interview count (descending)
    avg_scores_by_stack.sort(key=lambda x: x["interviewCount"], reverse=True)
    
    return {
        "totalInterviews": total_interviews,
        "feedbackPercentage": feedback_percentage,
        "averageDuration": avg_duration,
        "usageByDayOfWeek": [
            {"day": day, "count": count} 
            for day, count in zip(day_names, days_of_week)
        ],
        "usageByHour": [
            {"hour": hour, "count": count} 
            for hour, count in enumerate(hours)
        ],
        "scoresByTechStack": avg_scores_by_stack
    }

@router.get("/common-feedback")
async def get_common_feedback(
    current_user: User = Depends(role_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get the most common strengths and weaknesses across all interviews."""
    # Get all interview feedback
    feedback_query = select(InterviewFeedback)
    result = await db.execute(feedback_query)
    all_feedback = result.scalars().all()
    
    # Collect all strengths and improvement areas
    all_strengths = {}
    all_weaknesses = {}
    
    for feedback in all_feedback:
        # Process strengths
        if feedback.strengths:
            for strength in feedback.strengths:
                all_strengths[strength] = all_strengths.get(strength, 0) + 1
        
        # Process improvement areas
        if feedback.improvement_areas:
            try:
                weaknesses = json.loads(feedback.improvement_areas)
                for weakness in weaknesses:
                    all_weaknesses[weakness] = all_weaknesses.get(weakness, 0) + 1
            except:
                continue
    
    # Get top 10 strengths and weaknesses
    top_strengths = [
        {"skill": k, "count": v} 
        for k, v in sorted(all_strengths.items(), key=lambda item: item[1], reverse=True)
    ][:10]
    
    top_weaknesses = [
        {"skill": k, "count": v} 
        for k, v in sorted(all_weaknesses.items(), key=lambda item: item[1], reverse=True)
    ][:10]
    
    # Calculate percentage of interviews mentioning each
    total_feedback = len(all_feedback)
    for item in top_strengths:
        item["percentage"] = round((item["count"] / total_feedback * 100) if total_feedback > 0 else 0, 1)
    
    for item in top_weaknesses:
        item["percentage"] = round((item["count"] / total_feedback * 100) if total_feedback > 0 else 0, 1)
    
    return {
        "topStrengths": top_strengths,
        "topWeaknesses": top_weaknesses,
        "totalFeedback": total_feedback
    }

@router.get("/system-performance")
async def get_system_performance(
    current_user: User = Depends(role_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get system performance statistics."""
    try:
        # Get all interviews with feedback eagerly loaded in a single query
        interviews_query = (
            select(Interview)
            .options(selectinload(Interview.feedback))
        )
        result = await db.execute(interviews_query)
        interviews = result.scalars().all()
        
        # Track interviews over time
        interviews_by_month = {}
        
        for interview in interviews:
            if interview.created_at:
                month_key = interview.created_at.strftime("%Y-%m")
                interviews_by_month[month_key] = interviews_by_month.get(month_key, 0) + 1
        
        # Format for chart
        growth_data = []
        for month, count in sorted(interviews_by_month.items()):
            growth_data.append({
                "month": month,
                "interviews": count
            })
        
        # Count interviews with feedback - no lazy loading
        interviews_with_feedback_count = 0
        total_feedback_count = 0
        processing_times = []
        
        for interview in interviews:
            feedback_list = getattr(interview, 'feedback', []) or []
            if feedback_list:
                interviews_with_feedback_count += 1
                total_feedback_count += len(feedback_list)
                
                # Calculate processing times
                for feedback in feedback_list:
                    if feedback.created_at and interview.created_at:
                        processing_time = (feedback.created_at - interview.created_at).total_seconds()
                        processing_times.append(processing_time)
        
        # Calculate completion rate
        total_interviews = len(interviews)
        completion_rate = round((interviews_with_feedback_count / total_interviews * 100) if total_interviews > 0 else 0, 1)
        
        # Calculate average processing time
        avg_processing_time = round(sum(processing_times) / len(processing_times)) if processing_times else 0
        
        # Format processing time
        minutes = avg_processing_time // 60
        seconds = avg_processing_time % 60
        formatted_time = f"{int(minutes)}m {int(seconds)}s"
        
        return {
            "interviewGrowth": growth_data,
            "completionRate": completion_rate,
            "averageProcessingTime": formatted_time,
            "totalInterviewsProcessed": total_interviews,
            "totalFeedbackGenerated": total_feedback_count
        }
    except Exception as e:
        # Log the error for debugging
        print(f"Error in system_performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
