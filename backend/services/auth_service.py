# app/services/auth_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import User
from backend.schemas import UserCreate
from backend.utils.hashing import Hash, verify_password
from backend.utils.token import create_access_token, create_refresh_token
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.future import select
from datetime import timedelta
import uuid



async def register_user(db: AsyncSession, user: UserCreate, role: str = "USER"):
    """Registers a new user and returns the user object."""

    # Check if the username already exists
    username_query = select(User).where(User.username == user.username)
    username_result = await db.execute(username_query)
    existing_user = username_result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if the email already exists
    email_query = select(User).where(User.email == user.email)
    email_result = await db.execute(email_query)
    existing_email = email_result.scalar_one_or_none()
    
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = Hash.bcrypt(user.password)

    # Create new user instance
    new_user = User(
        user_id=uuid.uuid4(),
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user  # Return the User object instead of a dictionary


async def authenticate_user(db: AsyncSession, email: str, password: str):
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    if not Hash.verify(hashed_password=user.hashed_password, plain_password=password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    return user

async def login_user(db: AsyncSession, email: str, password: str):
    user = await db.query(User).filter(User.email == email).first()
    if user and Hash.verify(user.hashed_password, password):
        access_token = create_access_token(data={"sub": user.email, "role": user.role})
        refresh_token = create_refresh_token(data={"sub": user.email})
        
        # Optionally store the refresh token in the database
        user.refresh_token = refresh_token
        await db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")