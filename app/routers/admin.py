from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import User
from app.routers.auth import get_current_admin_user
from app.database import AsyncSessionLocal
from typing import AsyncGenerator

router = APIRouter()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        yield db

@router.get("/admin/dashboard")
async def read_admin_dashboard(current_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    return {"message": "Welcome to the admin dashboard!"}

@router.get("/admin/users")
async def list_users(current_user: User = Depends(get_current_admin_user), db: AsyncSession = Depends(get_db)):
    # Logic to list users
    users = await db.execute(select(User))  # Example of fetching users
    return {"users": users.scalars().all()}  # Replace with actual user data
