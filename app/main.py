# app/main.py
from fastapi import FastAPI
from app.routers import auth
from app.database import init_db

app = FastAPI()

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(auth.router)
# app.include_router(admin.router)