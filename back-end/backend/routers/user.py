from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend import schemas
from backend.database import AsyncSessionLocal
from backend.services.user_service import create_user_service, get_user, update_user, delete_user, get_all_users
from backend.models import User
from backend.routers.auth import get_current_admin_user, get_current_user
from typing import AsyncGenerator, List
from fastapi.security import HTTPBearer
from uuid import UUID


router = APIRouter()
security_scheme = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        yield db



@router.post("/users", response_model=schemas.UserResponse)
async def create_user_route(user: schemas.UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    new_user = await create_user_service(db=db, user=user)
    return schemas.UserResponse(
        user_id=str(new_user.user_id),
        username=new_user.username,
        email=new_user.email,
        role=new_user.role
    )

@router.get("/users/{user_id}", response_model=schemas.UserResponse)
async def read_user(user_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserResponse(
        user_id=str(user.user_id),
        username=user.username,
        email=user.email,
        role=user.role
    )

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_existing_user(user_id: UUID, user_data: schemas.UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    updated_user = await update_user(db=db, user_id=user_id, user_data=user_data)
    return schemas.UserResponse(
        user_id=str(updated_user.user_id),
        username=updated_user.username,
        email=updated_user.email,
        role=updated_user.role
    )

@router.delete("/users/{user_id}", response_model=dict)
async def delete_existing_user(user_id: UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    await delete_user(db=db, user_id=user_id)
    return {"detail": "User deleted successfully"}

@router.get("/users", response_model=List[schemas.UserResponse])
async def read_all_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    users = await get_all_users(db)
    return [schemas.UserResponse(
        user_id=str(user.user_id),
        username=user.username,
        email=user.email,
        role=user.role
    ) for user in users]

