from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import JSONResponse
from datetime import datetime
import json
import uuid
from backend.models import Resumes, User
from backend.utils import pdf_util
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from backend.config import settings
from sqlalchemy.future import select


import json
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from typing import Dict, Any

# Import necessary settings and dependencies
from backend.config import settings  # Assuming you have a settings module for configurations
from backend.database import get_db  # Database session dependency
from backend.utils import pdf_util  # Utility module for extracting text from PDFs


async def upload_resume(file: UploadFile, db: AsyncSession):
    """Process resume: Extract text, send to LLM, return structured response."""
    
    # Extract text from the uploaded PDF
    pdf_text = pdf_util.extract_text_from_pdf(file.file)
    if "error" in pdf_text:
        return JSONResponse(content=pdf_text, status_code=400)

    # Initialize LLM with the new import
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        openai_api_key=settings.OPENAI_API_KEY,
        openai_api_base=settings.OPENAI_API_BASE
    )

    # Define the prompt template
    resume_prompt_template = PromptTemplate(
        input_variables=["text"],
        template="Extract the following information from the resume:\n"
                 "- Name (write null if not found)\n"
                 "- Email (write null if not found)\n"
                 "- Phone Number (write null if not found)\n"
                 "- All Skills (comma-separated, write null if not found)\n"
                 "- Education (most recent degree and institution, start_date, end_date; write null if not found)\n"
                 "- All Projects (project names and descriptions in the format 'name: description', write null if not found)\n"
                 "- All Experiences (job titles, company names, start dates, and end dates in the format 'job_title: company_name (start_date - end_date)', write null if not found)\n"
                 "Resume Text:\n{text}\n\n"
                 "Provide the extracted information as a JSON object and do not write any heading in response:\n"
                 "{{'name': 'John Doe', 'email': null, 'phone_number': null, "
                 "'skills': 'Python, JavaScript, SQL', 'education': {{'degree': 'BSc Computer Science', 'institution': 'University A', 'start_date': '2015', 'end_date': '2019'}}, "
                 "'projects': [{{'name': 'Project A', 'description': 'Description A'}}, {{'name': 'Project B', 'description': 'Description B'}}], "
                 "'experiences': [{{'job_title': 'Software Engineer', 'company_name': 'Tech Corp', 'start_date': '2020-01-01', 'end_date': 'present'}}, "
                 "{{'job_title': 'Intern', 'company_name': 'Company B', 'start_date': '2019-01-01', 'end_date': '2019-12-31'}}]}}"
    )

    # Format the final prompt
    final_prompt = resume_prompt_template.format(text=pdf_text)

    # Ensure the input is structured correctly
    messages = [{"role": "user", "content": final_prompt}]
    
    try:
        # Use invoke() instead of calling llm directly
        response = llm.invoke(messages)
    except Exception as e:
        print("Error calling LLM:", e)
        return JSONResponse(content={"error": f"Failed to call LLM: {str(e)}"}, status_code=500)

    # Debugging: Print the raw response content
    print("Raw response content:", response.content)

    try:
        # Remove extra formatting
        cleaned_response = response.content.strip().strip("```json").strip("```").replace('"null"', 'null')

        # Parse JSON
        parsed_data = json.loads(cleaned_response)
    except json.JSONDecodeError as e:
        print("JSON decoding error:", e)
        print("Original response content:", response.content)
        return JSONResponse(content={"error": "Failed to parse response"}, status_code=500)

    # Return the parsed data as a JSON response
    return JSONResponse(content=parsed_data, status_code=200)



async def submit_resume(user_id: str, form_data: dict, db: AsyncSession):
    """Store the resume form data as a JSON object in the database."""
    
    try:
        # Ensure user_id is provided
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        # Create a new resume entry
        new_resume = Resumes(
            resume_id=str(uuid.uuid4()),  # Unique Resume ID
            resume_data=form_data,  # Storing the form data as JSON
            uploaded_at=datetime.utcnow(),
            user_id=user_id  # Linking the resume to the user
        )

        # Save to database
        db.add(new_resume)
        await db.commit()  # Await the commit
        await db.refresh(new_resume)  # Await the refresh

        return JSONResponse(
            content={"message": "Resume submitted successfully", "resume_id": str(new_resume.resume_id)},
            status_code=201
        )

    except Exception as e:
        await db.rollback()  # Rollback in case of failure
        return JSONResponse(content={"error": str(e)}, status_code=500)
    

async def get_user_resumes(user_id: str, db: AsyncSession):
    """Retrieve all resumes for a specific user."""
    result = await db.execute(select(User).filter(User.user_id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        return JSONResponse(content={"error": "User not found"}, status_code=404)

    result = await db.execute(select(Resumes).filter(Resumes.user_id == user_id))
    resumes = result.scalars().all()

    resume_data = [
        {
            "resume_id": str(resume.resume_id),
            "uploaded_at": resume.uploaded_at.isoformat(),  # Convert datetime to ISO format string
            "resume_data": resume.resume_data
        }
        for resume in resumes
    ]

    return JSONResponse(content={"user_id": str(user_id), "resumes": resume_data}, status_code=200)

async def get_resume_by_user_id(user_id: str, resume_id: str, db: AsyncSession):
    """Retrieve a specific resume by ID for a given user."""
    # Query user using async execute
    result = await db.execute(select(User).filter(User.user_id == user_id))
    user = result.scalar_one_or_none()  # Fetch one or None

    if not user:
        return JSONResponse(content={"error": "User not found"}, status_code=404)

    # Query resume using async execute
    result = await db.execute(select(Resumes).filter(Resumes.user_id == user_id, Resumes.resume_id == resume_id))
    resume = result.scalar_one_or_none()  # Fetch one or None

    if not resume:
        return JSONResponse(content={"error": f"Resume {resume_id} not found"}, status_code=404)

    return {
        "resume_id": str(resume.resume_id),
        "uploaded_at": resume.uploaded_at.isoformat(),  # Convert datetime to JSON-serializable format
        "resume_data": resume.resume_data,
        "user_id": str(resume.user_id)
    }

async def get_resume_by_id(resume_id: str, db: AsyncSession):
    """Retrieve a resume by its ID and return as JSONResponse."""
    try:
        result = await db.execute(select(Resumes).filter(Resumes.resume_id == resume_id))
        resume = result.scalar_one_or_none()

        if not resume:
            return JSONResponse(content={"error": f"Resume {resume_id} not found"}, status_code=404)

        return JSONResponse(
            content={
                "resume_id": str(resume.resume_id),
                "user_id": str(resume.user_id),
                "resume_data": str(resume.resume_data),
                "uploaded_at": resume.uploaded_at.isoformat()  # Convert datetime to ISO format string
            },
            status_code=200
        )

    except Exception as e:
        return JSONResponse(content={"error": f"Error retrieving resume: {str(e)}"}, status_code=500)