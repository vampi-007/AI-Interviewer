from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models import User
from backend.routers.auth import get_current_admin_user
from backend.database import AsyncSessionLocal
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
    users = await db.execute(select(User))  
    return {"users": users.scalars().all()}  
