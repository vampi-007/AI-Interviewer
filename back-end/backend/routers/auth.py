# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from backend import schemas, models
from backend.database import AsyncSessionLocal, get_db
from backend.services.auth_service import register_user, authenticate_user
from backend.utils.token import create_access_token, create_refresh_token, verify_token, verify_refresh_token
from fastapi.security import OAuth2PasswordBearer
from typing import AsyncGenerator, List
from backend.models import User
from sqlalchemy import select
from backend.services.email_service import send_reset_password_email
from datetime import datetime, timedelta
from jose import JWTError
from backend.utils.hashing import Hash
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.services.user_service import get_user, update_user, delete_user, get_all_users, create_user_service

router = APIRouter()
security_scheme = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as db:
        yield db

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme), 
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials  # Extract the token string
    print(f"Received token: {token}")  # Log the received token

    credentials = verify_token(token)
    print(f"Decoded payload: {credentials}")  # Log the decoded payload

    email = credentials.get("sub")  # Assuming 'sub' is the email
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.execute(select(User).where(User.email == email))  # Adjust if necessary
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

@router.post("/register")
async def register(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    # Logic for user registration
    return await register_user(db=db, user=user)

@router.post("/register-admin", response_model=schemas.UserResponse)
async def register_admin(
    user: schemas.UserCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Fetch existing admins
    existing_admins_query = select(User).where(User.role == "ADMIN")
    existing_admins_result = await db.execute(existing_admins_query)
    existing_admins = existing_admins_result.scalars().all()

    # Allow the first admin registration if no existing admins
    if not existing_admins:
        new_admin = await register_user(db=db, user=user, role="ADMIN")  # Set role to "ADMIN"
        return schemas.UserResponse(
            user_id=str(new_admin.user_id),
            username=new_admin.username,
            email=new_admin.email,
            role=new_admin.role
        )

    # If an admin exists, only allow another admin to create new admins
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized to create admin.")

    new_admin = await register_user(db=db, user=user, role="ADMIN")  # Set role to "ADMIN"

    return schemas.UserResponse(
        user_id=str(new_admin.user_id),
        username=new_admin.username,
        email=new_admin.email,
        role=new_admin.role
    )




@router.post("/login")
async def login(user: schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    db_user = await authenticate_user(db, user.email, user.password)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role, "username": db_user.username})
    return {"access_token": access_token,
            "refresh_token": create_refresh_token(data={"sub": db_user.email}),
            "user_id": db_user.user_id
            }

@router.post("/token/refresh")
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    # Verify the refresh token
    payload = verify_refresh_token(refresh_token)  # Ensure this function returns the payload
    if payload is None:
        raise HTTPException(status_code=403, detail="Invalid refresh token")

    username = payload.get("sub")  # Extract username from the payload

    # Use correct async query syntax
    query = select(User).where(User.username == username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user:
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
        query = select(User).where(User.email == payload.get("sub"))
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
        

@router.post("/reset-pass-profile")
async def reset_pass_profile(
    token: str,
    current_password: str,
    new_password: str,
    db: AsyncSession = Depends(get_db)
):
    try:
        
        payload = verify_token(token)  
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        query = select(User).where(User.email == payload.get("sub"))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        
        if not Hash.verify(hashed_password=user.hashed_password, plain_password=current_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid current password"
            )
        hashed_new_password = Hash.bcrypt(new_password)
        user.hashed_password = hashed_new_password
        await db.commit()

        return {"message": "Password updated successfully"}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
  