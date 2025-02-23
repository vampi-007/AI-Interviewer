
from fastapi import UploadFile
from sqlalchemy.orm import Session
# from utils import pdf_utils, db_utils
from config import settings
import os
import json
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from models import Resumes
from db import get_db  # Import your DB session dependency
from models import User, Role  # Import User model and Role Enum
from utils import pdf_util
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from fastapi.responses import JSONResponse
from fastapi import HTTPException

async def upload_resume(file: UploadFile):
    """Process resume: Extract text, send to LLM, return structured response."""
    pdf_text = pdf_util.extract_text_from_pdf(file.file)
    if "error" in pdf_text:
        return JSONResponse(content=pdf_text, status_code=400)

    llm = ChatOpenAI(model="gpt-4o-mini", openai_api_key=settings.OPENAI_API_KEY, openai_api_base="https://models.inference.ai.azure.com")

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

    final_prompt = resume_prompt_template.format(text=pdf_text)
    response = llm(final_prompt)

    try:
        cleaned_response = response.content.replace('"null"', 'null')
        parsed_data = json.loads(cleaned_response)
    except json.JSONDecodeError as e:
        print("JSON decoding error:", e)
        print("Original response content:", response.content)
        parsed_data = {}

    return parsed_data



async def submit_resume(user_id: str, form_data: dict, db: Session):
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
        db.commit()
        db.refresh(new_resume)

        return JSONResponse(
            content={"message": "Resume submitted successfully", "resume_id": str(new_resume.resume_id)},
            status_code=201
        )

    except Exception as e:
        db.rollback()  # Rollback in case of failure
        return JSONResponse(content={"error": str(e)}, status_code=500)
    
async def get_user_resumes(user_id: str, db: Session):
    """Retrieve all resumes for a specific user."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None  # Return None if user is not found

    resumes = db.query(Resumes).filter(Resumes.user_id == user_id).all()
    resume_data = [{"resume_id": str(resume.resume_id), "uploaded_at": resume.uploaded_at, "resume_data": resume.resume_data} for resume in resumes]

    return {"user_id": str(user_id), "resumes": resume_data}  # Return raw data


async def get_resume_by_user_id(user_id:str , resume_id: str, db: Session):
    """Retrieve a specific resume by ID for a given user."""
    try:
        # Query the database for the specific resume
        resume = db.query(Resumes).filter(
            Resumes.resume_id == resume_id,
            Resumes.user_id == user_id
        ).first()
        print(resume)  # Debug print
        if not resume:
            return None
            
        # Return the ORM object directly
        return resume
        
    except Exception as e:
        raise Exception(f"Error retrieving resume: {str(e)}")
    
from fastapi.responses import JSONResponse

async def get_resume_by_id(resume_id: str, db: Session):
    """Retrieve a resume by its ID and return as JSONResponse."""
    try:
        # Query the database for the specific resume
        resume = db.query(Resumes).filter(
            Resumes.resume_id == resume_id
        ).first()
        
        if not resume:
            return JSONResponse(
                content={"error": f"Resume {resume_id} not found"},
                status_code=404
            )
        print(resume.resume_id)  # Debug print
        # Return the resume data as JSONResponse
        return JSONResponse(
            content={
                "resume_id": str(resume.resume_id),
                "user_id": str(resume.user_id),
                "resume_data":str( resume.resume_data),
                "uploaded_at": str(resume.uploaded_at)  # Convert datetime to string
            },
            status_code=200
        )
        
    except Exception as e:
        return JSONResponse(
            content={"error": f"Error retrieving resume: {str(e)}"},
            status_code=500
        )