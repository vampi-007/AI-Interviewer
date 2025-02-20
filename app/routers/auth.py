# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas, models
from app.database import AsyncSessionLocal, get_db
from app.services.auth_service import register_user, authenticate_user
from app.utils.token import create_access_token, create_refresh_token, verify_token, verify_refresh_token
from fastapi.security import OAuth2PasswordBearer
from typing import AsyncGenerator, List
from app.models import User
from sqlalchemy import select
from app.services.email_service import send_reset_password_email
from datetime import datetime, timedelta
from jose import JWTError
from app.utils.hashing import Hash
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.user_service import get_user, update_user, delete_user, get_all_users, create_user_service

router = APIRouter()
security_scheme = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        yield db

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme), db: AsyncSession = Depends(get_db)):
    token = credentials.credentials  # Extract the token string
    credentials = verify_token(token)
    user = await db.execute(select(User).where(User.username == credentials.get("sub")))
    user = user.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Dependency to check if the user is an admin
async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user

@router.post("/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(db=db, user=user)

@router.post("/register-admin", response_model=schemas.UserResponse)
async def register_admin(user: schemas.UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if any admins exist
    existing_admins_query = select(User).where(User.role == "ADMIN")
    existing_admins_result = await db.execute(existing_admins_query)
    existing_admins = existing_admins_result.scalars().all()

    if not existing_admins:
        # If no admins exist, allow registration
        return await register_user(db=db, user=user, role="ADMIN")
    else:
        # If an admin exists, only allow the current admin to register new admins
        if current_user.role != "ADMIN":
            raise HTTPException(status_code=403, detail="Not authorized to create admin.")
        
        return await register_user(db=db, user=user, role="ADMIN")

@router.post("/login")
async def login(user: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    db_user = await authenticate_user(db, user.username, user.password)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user.username, "role": db_user.role})
    refresh_token = create_refresh_token(data={"sub": db_user.username})

    # Store refresh token in database
    db_user.refresh_token = refresh_token
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/token/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    # Verify the refresh token
    username = verify_refresh_token(refresh_token)
    if not username:
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    # Use correct async query syntax
    query = select(User).where(User.username == username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or user.refresh_token != refresh_token:
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    # Create a new access token
    access_token = create_access_token(data={"sub": username})
    return {"access_token": access_token}

@router.post("/forgot-password")
async def forgot_password(email: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    # Find user by email
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if user:
        # Generate password reset token with short expiry
        reset_token = create_access_token(
            data={"sub": user.username, "type": "reset_password"},
            expires_delta=timedelta(minutes=15)
        )
        
        # Send email with reset link
        reset_link = f"http://your-frontend-url/reset-password?token={reset_token}"
        background_tasks.add_task(
            send_reset_password_email,
            email=user.email,
            reset_link=reset_link
        )
    
    return {"message": "Password reset link sent"}

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Verify reset token
        payload = verify_token(token)
        if payload.get("type") != "reset_password":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        
        # Find user
        query = select(User).where(User.username == payload.get("sub"))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        # Update password
        user.hashed_password = Hash.bcrypt(new_password)
        await db.commit()
        
        return {"message": "Password updated successfully"}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

@router.post("/users", response_model=schemas.UserResponse)
async def create_user_route(user: schemas.UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    return await create_user_service(db=db, user=user)

@router.get("/users/{user_id}", response_model=schemas.UserResponse)
async def read_user(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
async def update_existing_user(user_id: int, user_data: schemas.UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    return await update_user(db=db, user_id=user_id, user_data=user_data)

@router.delete("/users/{user_id}", response_model=dict)
async def delete_existing_user(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    await delete_user(db=db, user_id=user_id)
    return {"detail": "User deleted successfully"}

@router.get("/users", response_model=List[schemas.UserResponse])
async def read_all_users(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    users = await get_all_users(db)
    return users

# @router.get("/users/me", response_model=schemas.UserResponse)
# async def read_users_me(current_user: models.User = Depends(get_current_user)):
#     return current_user