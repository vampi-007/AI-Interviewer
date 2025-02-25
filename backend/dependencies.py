from fastapi import Depends, HTTPException
from backend.routers.auth import get_current_user
from backend.models import User


async def role_dependency(current_user: User = Depends(get_current_user)):
    print(f"Current User Role: {current_user.role}")  # Debugging line
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user 