from sqlalchemy.ext.asyncio import AsyncSession
from backend.models import User
from backend.schemas import UserResponse, UserCreate, UserUpdate
from fastapi import HTTPException, status
from sqlalchemy import select
from typing import List
from uuid import UUID
from passlib.context import CryptContext  # Make sure to import this for password hashing

# Initialize password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_user_service(db: AsyncSession, user: UserCreate) -> UserResponse:
    # Check if the username already exists
    existing_user = await db.execute(select(User).where(User.username == user.username))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already registered")

    # Check if the email already exists
    existing_email = await db.execute(select(User).where(User.email == user.email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password before saving
    hashed_password = pwd_context.hash(user.password)

    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password  # Use the hashed password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)

    return UserResponse(  # Ensure you return the UserResponse model
        user_id=str(db_user.user_id),  # Convert UUID to string
        username=db_user.username,
        email=db_user.email,
        role=db_user.role
    )

async def get_user(db: AsyncSession, user_id: UUID) -> UserResponse:
    user = await db.execute(select(User).where(User.user_id == user_id))
    return user.scalar_one_or_none()

async def update_user(db: AsyncSession, user_id: UUID, user_data: UserUpdate) -> UserResponse:
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_data.dict(exclude_unset=True).items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user

async def delete_user(db: AsyncSession, user_id: UUID) -> None:
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()

async def get_all_users(db: AsyncSession) -> List[UserResponse]:
    result = await db.execute(select(User))
    return result.scalars().all()
