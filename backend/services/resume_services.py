
from fastapi import UploadFile
from sqlalchemy.orm import Session
# from utils import pdf_utils, db_utils
from config import settings
import os
import json
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from db import get_db  # Import your DB session dependency
from models import User, Role  # Import User model and Role Enum


async def upload_resume(file: UploadFile):
    file_location = os.path.join(settings.UPLOAD_FOLDER, file.filename)
    try:
        os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())
    except Exception as e:
        return {"error": f"There was an error uploading the file: {str(e)}"}
    
    return {"info": f"File '{file.filename}' uploaded successfully."}



async def test_db():
    db: Session = next(get_db())  # Get a database session
    try:
        # Create a test user
        test_user = User(
            user_id=str(uuid.uuid4()),  # Generate unique UUID
            name="Test User",
            username="testuser",
            password="hashed_password",  # Normally, hash the password
            email="testuser@example.com",
            role=Role.USER,  # Default role
            created_at=datetime.utcnow()
        )
        
        # Add and commit the test user
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        return {"message": "Test user inserted successfully", "user_id": test_user.user_id}

    except Exception as e:
        db.rollback()  # Rollback transaction on error
        return {"error": str(e)}

    finally:
        db.close()  # Close the session
