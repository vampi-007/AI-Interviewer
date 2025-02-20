# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas, models
from app.database import AsyncSessionLocal
from app.services.auth_service import register_user, authenticate_user
from app.utils.token import create_access_token, create_refresh_token, verify_token, verify_refresh_token
from fastapi.security import OAuth2PasswordBearer
from typing import AsyncGenerator
from app.models import User
from sqlalchemy import select
from app.services.email_service import send_reset_password_email
from datetime import datetime, timedelta
from jose import JWTError
from app.utils.hashing import Hash

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        yield db

@router.post("/register", response_model=schemas.UserResponse)
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(db=db, user=user)

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

# async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
#     credentials = verify_token(token)
#     user = await db.query(User).filter(User.username == credentials.get("sub")).first()
#     if user is None:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid authentication credentials",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     return user

# async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
#     if not current_user.is_active:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user

# async def get_current_admin_user(current_user: models.User = Depends(get_current_active_user)):
#     if current_user.role != "ADMIN":
#         raise HTTPException(status_code=403, detail="Not enough permissions")
#     return current_user

# @router.get("/users/me", response_model=schemas.UserResponse)
# async def read_users_me(current_user: models.User = Depends(get_current_user)):
#     return current_user